'use client'
import { useState } from 'react'

type ReplyModalProps = {
  alias: string | null
  isOpen: boolean
  onClose: () => void
}

export default function ReplyModal({ alias, isOpen, onClose }: ReplyModalProps) {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorText, setErrorText] = useState('')

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
      }, 2000)
    } catch(err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'System Dispatch Error'
      setErrorText(message)
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 font-mono">
      <div className="bg-black border-[3px] border-white w-full max-w-lg p-6 relative shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        <div className="absolute top-0 right-0 border-b-[3px] border-l-[3px] border-white bg-white text-black px-3 py-1 text-xs font-black uppercase tracking-widest">
          Transmitter
        </div>
        
        <h2 className="text-2xl font-black uppercase mb-2">Reply to Source</h2>
        <p className="text-sm font-bold opacity-70 mb-6 uppercase tracking-widest">Routing Alias: <span className="text-white opacity-100">{alias}</span></p>
        
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="ENTER MESSAGE PAYLOAD..."
          className="w-full bg-black text-white border-[3px] border-white p-4 h-32 focus:outline-none focus:ring-2 focus:ring-white mb-4 placeholder-white/50"
          disabled={status === 'sending' || status === 'success'}
        />
        
        {status === 'error' && (
          <div className="border-[3px] border-white bg-black p-3 mb-4 text-sm font-bold uppercase">
            ERROR: {errorText}
          </div>
        )}
        
        {status === 'success' && (
          <div className="border-[3px] border-white bg-white text-black p-3 mb-4 text-sm font-black uppercase tracking-widest text-center">
            MESSAGE DISPATCHED SECURELY
          </div>
        )}
        
        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 border-[3px] border-white font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSend}
            disabled={status === 'sending' || status === 'success'}
            className="px-6 py-2 border-[3px] border-white bg-white text-black font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
          >
            {status === 'sending' ? 'Transmitting...' : 'Execute Dispatch'}
          </button>
        </div>
      </div>
    </div>
  )
}
