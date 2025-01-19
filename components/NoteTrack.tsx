import { useRef, useEffect } from 'react'
import { keyMap } from '../utils/keyMap'

interface NoteTrackProps {
  currentTime: number
  duration: number
  recordedNotes: { time: number; key: string; type: 'keydown' | 'keyup' }[]
  isPlaying: boolean
}

export function NoteTrack({ currentTime, duration, recordedNotes, isPlaying }: NoteTrackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawTrack = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw track lines
      ctx.strokeStyle = 'white'
      for (let i = 0; i < Object.keys(keyMap).length; i++) {
        const x = (i + 1) * (canvas.width / (Object.keys(keyMap).length + 1))
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Create a map of keydown events waiting for keyup
      const heldNotes: { [key: string]: number } = {}
      
      // Draw held notes
      recordedNotes.forEach(note => {
        const x = (keyMap[note.key as keyof typeof keyMap] + 1) * (canvas.width / (Object.keys(keyMap).length + 1))
        const y = canvas.height - ((-note.time + currentTime) / duration) * canvas.height * 20

        if (note.type === 'keydown') {
          heldNotes[note.key] = y
        } else if (note.type === 'keyup' && heldNotes[note.key] !== undefined) {
          const startY = heldNotes[note.key]
          const height = y - startY

          // Only draw if at least part of the note is visible
          if (y >= -50 && startY <= canvas.height + 50) {
            const gradient = ctx.createLinearGradient(0, startY, 0, y)
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)')
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0.4)')

            ctx.fillStyle = gradient
            ctx.fillRect(x - 5, startY, 10, height)
            
            // Draw end caps
            ctx.fillStyle = 'rgba(255, 0, 0, 1)'
            ctx.fillRect(x - 5, startY - 5, 10, 10) // Start cap
            ctx.fillRect(x - 5, y - 5, 10, 10)      // End cap
          }
          
          delete heldNotes[note.key]
        }
      })

      // Draw currently held notes (those without keyup yet)
      Object.entries(heldNotes).forEach(([key, startY]) => {
        const x = (keyMap[key as keyof typeof keyMap] + 1) * (canvas.width / (Object.keys(keyMap).length + 1))
        const currentY = canvas.height - ((-currentTime + currentTime) / duration) * canvas.height * 10

        if (startY <= canvas.height + 50) {
          const gradient = ctx.createLinearGradient(0, startY, 0, currentY)
          gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)')
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0.4)')

          ctx.fillStyle = gradient
          ctx.fillRect(x - 5, startY, 10, currentY - startY)
          
          // Draw start cap
          ctx.fillStyle = 'rgba(255, 0, 0, 1)'
          ctx.fillRect(x - 5, startY - 5, 10, 10)
        }
      })

      // Draw playhead
      ctx.strokeStyle = 'green'
      ctx.lineWidth = 2
      const playheadY = canvas.height - 10
      ctx.beginPath()
      ctx.moveTo(0, playheadY)
      ctx.lineTo(canvas.width, playheadY)
      ctx.stroke()
    }

    let animationId: number

    const animate = () => {
      drawTrack()
      if (isPlaying) {
        animationId = requestAnimationFrame(animate)
      }
    }

    if (isPlaying) {
      animate()
    } else {
      drawTrack()
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [currentTime, duration, recordedNotes, isPlaying])

  return <canvas ref={canvasRef} width={800} height={400} className="border border-gray-300" />
}

