'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

type ReplyModalProps = {
  alias: string | null
  isOpen: boolean
  onClose: () => void
}

export default function ReplyModal({ alias, isOpen, onClose }: ReplyModalProps) {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorText, setErrorText] = useState('')

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isOpen) console.log(`[Transmitter] System active for alias: ${alias}`)
  }, [isOpen, alias])

  if (!isOpen || !alias || !mounted) return null;

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

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 font-mono">
      <div className="bg-black border-[4px] border-white w-full max-w-lg p-8 relative shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
        <h2 className="text-3xl font-black uppercase mb-4 underline decoration-white decoration-4 underline-offset-8">Reply to Source</h2>
        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-8">TARGET ROUTING ALIAS: <span className="text-white opacity-100">{alias}</span></p>
        
        <textarea
          autoFocus
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="ENTER SECURE MESSAGE FOR SOURCE..."
          className="w-full bg-black text-white border-[3px] border-white p-5 h-40 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all mb-8 placeholder-white/30"
          disabled={status === 'sending' || status === 'success'}
        />
        
        {status === 'error' && <p className="mb-6 text-white font-bold p-3 border-2 border-white animate-pulse">ERROR: {errorText}</p>}
        {status === 'success' && <p className="mb-6 text-white font-black uppercase text-center border-4 border-white p-4 tracking-widest bg-white/10">MESSAGE TRANSMITTED SECURELY</p>}
        
        <div className="flex justify-end gap-8">
          <button 
            onClick={onClose} 
            className="text-sm font-black uppercase tracking-[0.3em] hover:underline px-2"
          >
            Discard
          </button>
          <button 
            onClick={handleSend}
            disabled={status !== 'idle'}
            className="bg-white text-black px-10 py-4 font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white border-[4px] border-white transition-all disabled:opacity-30 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.5)]"
          >
            {status === 'sending' ? 'Transmitting...' : 'Execute Dispatch'}
          </button>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}
