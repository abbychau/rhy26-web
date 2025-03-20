'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AudioPlayer } from './AudioPlayer'
import { NoteTrack } from './NoteTrack'
import { RecordedNotes } from './RecordedNotes'
import { keyMap } from '../utils/keyMap'
import { KeyManagementModal } from './KeyManagementModal'
import { PencilIcon } from '@heroicons/react/24/solid'
import { SongUploadModal } from './SongUploadModal'

interface Note {
  time: number
  key: string
  type: 'keydown' | 'keyup'
}

export function NoteRecorder() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [recordedNotes, setRecordedNotes] = useState<Note[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [userKeyHash, setUserKeyHash] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [songs, setSongs] = useState<any[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)
  const animationFrameRef = useRef<number>()
  const pressedKeys = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (keyMap.hasOwnProperty(e.key) && isPlaying && !pressedKeys.current.has(e.key)) {
        pressedKeys.current.add(e.key)
        setRecordedNotes(prev => [...prev, { 
          time: audioRef.current?.currentTime || 0,
          key: e.key, 
          type: 'keydown' 
        }])
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (keyMap.hasOwnProperty(e.key) && isPlaying) {
        pressedKeys.current.delete(e.key)
        setRecordedNotes(prev => [...prev, { 
          time: audioRef.current?.currentTime || 0,
          key: e.key, 
          type: 'keyup' 
        }])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPlaying])

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      const updateTimer = () => {
        setCurrentTime(audioRef.current?.currentTime || 0)
        animationFrameRef.current = requestAnimationFrame(updateTimer)
      }
      
      animationFrameRef.current = requestAnimationFrame(updateTimer)
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }
  }, [isPlaying])

  useEffect(() => {
    const storedKey = localStorage.getItem('userKey')
    if (storedKey) {
      verifyKey(storedKey)
    } else {
      setShowKeyModal(true)
    }
  }, [])

  useEffect(() => {
    fetchSongs()
  }, [])

  const handlePlay = async () => {
    if (audioRef.current && selectedFile) {
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Error playing audio:', error)
        setIsPlaying(false)
      }
    }
  }

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }

  const handleReRecord = async () => {
    if (recordedNotes.length > 0) {
      const confirmed = window.confirm('Are you sure you want to clear all recorded notes and start over?')
      if (!confirmed) return
    }
    
    pressedKeys.current.clear()
    setRecordedNotes([])
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Error playing audio:', error)
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const duration = audioRef.current.duration
      console.log('Audio duration loaded:', duration)
      setDuration(duration)
    }
  }

  const exportNotes = async () => {
    const key = localStorage.getItem('userKey')
    if (!key) {
      alert('Please generate a key first!')
      return
    }

    const noteString = recordedNotes
      .map(note => `${note.time.toFixed(6)}:${note.type === 'keydown' ? '0' : '1'}:${note.key}`)
      .join('\n')

    const formData = new FormData()
    formData.append('key', key)
    formData.append('title', selectedFile?.name || 'Untitled')
    formData.append('music', selectedFile as File)
    formData.append('notes', noteString)

    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        alert('Record saved successfully!')
      } else {
        throw new Error('Failed to save record')
      }
    } catch (error) {
      alert('Error saving record: ' + error)
    }
  }

  const generateKey = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST'
      })
      const { key, keyHash } = await response.json()
      localStorage.setItem('userKey', key)
      setUserKeyHash(keyHash)
      setIsLoggedIn(true)
      return key
    } catch (error) {
      alert('Error generating key: ' + error)
      return ''
    }
  }

  const updateUsername = async () => {
    const key = localStorage.getItem('userKey')
    if (!key) {
      alert('Please generate a key first!')
      return
    }

    const username = prompt('Enter your desired username:')
    if (!username) return

    try {
      const response = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, username })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUsername(username)
        alert('Username set successfully!')
      } else if (data.code === 'USERNAME_TAKEN') {
        alert('This username is already taken. Please choose a different one.')
      } else {
        throw new Error(data.error || 'Failed to set username')
      }
    } catch (error) {
      alert('Error setting username: ' + error)
    }
  }

  const verifyKey = async (key: string) => {
    try {
      const response = await fetch(`/api/auth?key=${key}`)
      const data = await response.json()
      
      if (data.success) {
        setIsLoggedIn(true)
        setUsername(data.username)
        setShowKeyModal(false)
        localStorage.setItem('userKey', key)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error verifying key:', error)
      alert('Invalid key')
      localStorage.removeItem('userKey')
      setShowKeyModal(true)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userKey')
    setIsLoggedIn(false)
    setUsername(null)
    setShowKeyModal(true)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Reset everything first
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeAttribute('src') // Remove old source
        audioRef.current.load() // Reset the audio element
      }
      
      setTimeout(() => {
        setSelectedFile(file)
        setIsPlaying(false)
        setCurrentTime(0)
        setDuration(0)
        setRecordedNotes([])
      }, 0)
    }
  }

  const submitChart = async () => {
    const key = localStorage.getItem('userKey')
    if (!key) {
      alert('Please generate a key first!')
      return
    }

    try {
      const response = await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          musicPath: selectedFile?.name,
          noteData: recordedNotes.map(note => 
            `${note.time.toFixed(6)}:${note.type === 'keydown' ? '0' : '1'}:${note.key}`
          ).join('\n')
        })
      })

      if (response.ok) {
        alert('Note chart submitted successfully!')
      } else {
        throw new Error('Failed to submit note chart')
      }
    } catch (error) {
      alert('Error submitting note chart: ' + error)
    }
  }

  const fetchSongs = async () => {
    try {
      const response = await fetch('/api/songs')
      const data = await response.json()
      console.log('Fetched songs:', data)
      setSongs(data)
    } catch (error) {
      console.error('Failed to fetch songs:', error)
    }
  }

  return (
    <div className="p-4 pr-[400px]">
      {showKeyModal && (
        <KeyManagementModal
          onLogin={verifyKey}
          onGenerateKey={generateKey}
        />
      )}
      {showUploadModal && (
        <SongUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={() => {
            fetchSongs()
            setShowUploadModal(false)
          }}
        />
      )}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">RHY26 Music Note Recorder</h1>
        {isLoggedIn && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>{username || 'Anonymous'}</span>
              <button 
                onClick={updateUsername}
                className="p-1 hover:bg-gray-100 rounded-full"
                title="Set Username"
              >
                <PencilIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        )}
      </div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Select Song</h2>
        <div className="flex gap-2">
          <select 
            className="flex-1 border rounded p-2"
            onChange={(e) => {
              const song = songs.find(s => s.id === parseInt(e.target.value))
              if (song) {
                // Handle song selection
              }
            }}
          >
            <option value="">Select a song from library</option>
            {songs.map(song => (
              <option key={song.id} value={song.id}>
                {song.title} by {song.author} (uploaded by {song.uploader || 'Anonymous'})
              </option>
            ))}
          </select>
          <Button onClick={() => setShowUploadModal(true)}>Upload New Song</Button>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Or use a local file:</p>
          <Input type="file" accept="audio/*" onChange={handleFileChange} />
        </div>
      </div>
      <AudioPlayer
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        file={selectedFile}
      />
      <div className="mb-4 space-x-2">
        <Button onClick={handlePlay} disabled={!selectedFile || isPlaying}>Play</Button>
        <Button onClick={handlePause} disabled={!isPlaying}>Pause</Button>
        <Button onClick={handleReRecord} disabled={!selectedFile}>Re-Record</Button>
        <Button onClick={exportNotes} disabled={recordedNotes.length === 0}>Export Notes</Button>
        <Button 
          onClick={submitChart} 
          disabled={!isLoggedIn || recordedNotes.length === 0}
        >
          Submit Chart
        </Button>
      </div>
      <div className="mb-4">
        Time: {currentTime.toFixed(2)} / {duration.toFixed(2)}
      </div>
      <NoteTrack currentTime={currentTime} duration={duration} recordedNotes={recordedNotes} isPlaying={isPlaying} />
      <RecordedNotes notes={recordedNotes} />
    </div>
  )
}

