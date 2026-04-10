'use client'
import { useState, useEffect } from 'react'

type ReplyModalProps = {
  alias: string | null
  isOpen: boolean
  onClose: () => void
}

export default function ReplyModal({ alias, isOpen, onClose }: ReplyModalProps) {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorText, setErrorText] = useState('')

  useEffect(() => {
    if (isOpen) console.log(`[Transmitter] Active for: ${alias}`);
  }, [isOpen, alias])

  if (!isOpen || !alias) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    setStatus('sending')
    
    try {
      const res = await fetch('/api/reply-to-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias, message: message.trim() })
      })
      
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger dispatch mechanism.')
      }
      
      setStatus('success')
      setMessage('')
      setTimeout(() => {
        setStatus('idle')
        onClose()
      }, 1500)
    } catch(err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'System Dispatch Error'
      setErrorText(message)
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90">
      <div className="bg-black border-[4px] border-white w-full max-w-lg p-8 relative">
        <h2 className="text-3xl font-black uppercase mb-4 underline">Reply to Source</h2>
        <p className="text-sm font-bold opacity-70 mb-6">TARGET: {alias}</p>
        
        <textarea
          autoFocus
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="ENTER SECURE MESSAGE..."
          className="w-full bg-black text-white border-[3px] border-white p-4 h-40 focus:outline-none mb-6"
        />
        
        {status === 'error' && <p className="mb-4 text-white font-bold">ERROR: {errorText}</p>}
        {status === 'success' && <p className="mb-4 text-white font-black uppercase text-center border-2 border-white p-2">SENT SECURELY</p>}
        
        <div className="flex justify-end gap-6 text-sm">
          <button onClick={onClose} className="font-bold uppercase tracking-widest hover:underline">Discard</button>
          <button 
            onClick={handleSend}
            disabled={status !== 'idle'}
            className="bg-white text-black px-8 py-3 font-black uppercase tracking-widest hover:bg-black hover:text-white border-[3px] border-white transition-all disabled:opacity-30"
          >
            {status === 'sending' ? 'Sending...' : 'Transmit'}
          </button>
        </div>
      </div>
    </div>
  )
}
