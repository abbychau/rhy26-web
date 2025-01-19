import { useEffect, useRef } from 'react'

interface RecordedNotesProps {
  notes: { time: number; key: string; type: 'keydown' | 'keyup' }[]
}

export function RecordedNotes({ notes }: RecordedNotesProps) {
  const preRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight
    }
  }, [notes])

  return (
    <div className="fixed right-0 top-0 h-screen w-[400px] bg-gray-900 p-4 overflow-hidden flex flex-col">
      <h2 className="text-xl font-bold mb-2 text-white">Recorded Notes</h2>
      <pre 
        ref={preRef}
        className="flex-1 bg-gray-800 p-4 rounded-lg overflow-auto font-mono text-sm text-white"
      >
        <code>
          {notes.map((note) => (
            `${note.time.toFixed(6)}:${note.type === 'keydown' ? '0' : '1'}:${note.key}\n`
          )).join('')}
        </code>
      </pre>
    </div>
  )
}

