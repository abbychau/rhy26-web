import { forwardRef, useEffect, useState } from 'react'

interface AudioPlayerProps {
  onLoadedMetadata: () => void
  file: File | null
}

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(
  ({ onLoadedMetadata, file }, ref) => {
    const [objectUrl, setObjectUrl] = useState<string>('')

    useEffect(() => {
      if (file) {
        const url = URL.createObjectURL(file)
        setObjectUrl(url)
        return () => {
          URL.revokeObjectURL(url)
          setObjectUrl('')
        }
      }
    }, [file])

    return (
      <audio
        ref={ref}
        src={objectUrl}
        onLoadedMetadata={(e) => {
          console.log('Audio loaded, duration:', (e.target as HTMLAudioElement).duration)
          onLoadedMetadata()
        }}
        onError={(e) => {
          const target = e.target as HTMLAudioElement
          console.error('Audio error:', target.error?.message)
        }}
        style={{ display: 'none' }} // Hide the audio element
      />
    )
  }
)

AudioPlayer.displayName = 'AudioPlayer'

