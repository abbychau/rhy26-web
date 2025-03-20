import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface Props {
  onLogin: (key: string) => Promise<void>
  onGenerateKey: () => Promise<string>
}

export function KeyManagementModal({ onLogin, onGenerateKey }: Props) {
  const [key, setKey] = useState("")
  const [generatedKey, setGeneratedKey] = useState("")

  const handleGenerateKey = async () => {
    const confirmed = window.confirm(
      'WARNING: Your key will be generated now. Make sure to copy and save it somewhere safe.\n\n' +
      'This key CANNOT be regenerated or recovered if lost!\n\n' +
      'Do you want to continue?'
    )
    
    if (!confirmed) return
    
    const newKey = await onGenerateKey()
    setGeneratedKey(newKey)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey)
    alert('Key copied to clipboard!')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Key Management</h2>
        
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Login with Existing Key</h3>
          <div className="flex gap-2">
            <Input 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter your key"
            />
            <Button onClick={() => onLogin(key)}>Login</Button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Generate New Key</h3>
          <div className="space-y-2">
            <Button onClick={handleGenerateKey}>Generate Key</Button>
            {generatedKey && (
              <div className="flex gap-2 items-center">
                <Input value={generatedKey} readOnly />
                <Button onClick={copyToClipboard}>Copy</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
