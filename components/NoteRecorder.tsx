'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AudioPlayer } from './AudioPlayer'
import { NoteTrack } from './NoteTrack'
import { RecordedNotes } from './RecordedNotes'
import { keyMap } from '../utils/keyMap'

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
  const audioRef = useRef<HTMLAudioElement>(null)
  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number>()
  const pressedKeys = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (keyMap.hasOwnProperty(e.key) && isPlaying && !pressedKeys.current.has(e.key)) {
        pressedKeys.current.add(e.key)
        setRecordedNotes(prev => [...prev, { time: currentTime, key: e.key, type: 'keydown' }])
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (keyMap.hasOwnProperty(e.key) && isPlaying) {
        pressedKeys.current.delete(e.key)
        setRecordedNotes(prev => [...prev, { time: currentTime, key: e.key, type: 'keyup' }])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPlaying, currentTime])

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = performance.now() - (currentTime * 1000)
      
      const updateTimer = () => {
        const elapsed = (performance.now() - startTimeRef.current) / 1000
        setCurrentTime(elapsed)
        animationFrameRef.current = requestAnimationFrame(updateTimer)
      }
      
      animationFrameRef.current = requestAnimationFrame(updateTimer)
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }
  }, [currentTime, isPlaying])

  const handlePlay = async () => {
    if (audioRef.current && selectedFile) {
      try {
        audioRef.current.currentTime = 0
        await audioRef.current.play()
        setCurrentTime(0) // Reset timer
        startTimeRef.current = performance.now() // Reset start time
        setIsPlaying(true)
        console.log('Audio playing, initial time:', audioRef.current.currentTime)
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
    setCurrentTime(0)
    startTimeRef.current = performance.now()
    
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

  const exportNotes = () => {
    const noteString = recordedNotes
      .map(note => `${note.time.toFixed(6)}:${note.type === 'keydown' ? '0' : '1'}:${note.key}`)
      .join('\n')
    navigator.clipboard.writeText(noteString)
    alert('Note chart copied to clipboard!')
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

  return (
    <div className="p-4 pr-[400px]">
      <h1 className="text-2xl font-bold mb-4">RHY26 Music Note Recorder</h1>
      <div className="mb-4">
        <Input type="file" accept="audio/*" onChange={handleFileChange} className="mb-2" />
        {selectedFile && <p className="text-sm text-gray-600">Selected file: {selectedFile.name}</p>}
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
      </div>
      <div className="mb-4">
        Time: {currentTime.toFixed(2)} / {duration.toFixed(2)}
      </div>
      <NoteTrack currentTime={currentTime} duration={duration} recordedNotes={recordedNotes} isPlaying={isPlaying} />
      <RecordedNotes notes={recordedNotes} />
    </div>
  )
}

