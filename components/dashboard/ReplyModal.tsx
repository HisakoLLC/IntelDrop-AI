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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/10 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className="relative bg-white border border-whisper w-full max-w-lg p-10 rounded-[16px] shadow-notion-deep animate-in zoom-in-95 duration-200">
        <h2 className="text-[28px] font-bold tracking-[-1px] text-notion-black mb-1">Reply to Source</h2>
        <p className="text-[13px] font-semibold text-warm-gray-300 uppercase tracking-widest mb-8 flex items-center gap-2">
          Source Alias: <span className="text-notion-black font-bold">{alias}</span>
        </p>
        
        <div className="space-y-4 mb-8">
          <textarea
            autoFocus
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message to the secure source..."
            className="w-full bg-white text-notion-black border border-whisper p-5 h-48 rounded-[8px] text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-notion-blue/20 transition-all placeholder-warm-gray-300 shadow-sm"
            disabled={status === 'sending' || status === 'success'}
          />
          
          {status === 'error' && (
            <div className="p-3 rounded-[4px] bg-red-50 border border-red-100 text-sm font-semibold text-red-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              Error: {errorText}
            </div>
          )}
          {status === 'success' && (
            <div className="p-4 rounded-[4px] bg-emerald-50 border border-emerald-100 text-sm font-bold text-emerald-600 text-center tracking-tight">
              Message submitted successfully
            </div>
          )}
        </div>
        
        <div className="flex justify-end items-center gap-6">
          <button 
            onClick={onClose} 
            className="text-[15px] font-semibold text-warm-gray-500 hover:text-notion-black transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSend}
            disabled={status !== 'idle' || !message.trim()}
            className="bg-notion-blue text-white px-8 py-2.5 rounded-[4px] text-[15px] font-bold hover:bg-[#005bab] transition-all transform active:scale-[0.98] shadow-md shadow-notion-blue/10 disabled:opacity-30"
          >
            {status === 'sending' ? 'Transmitting...' : 'Submit Reply'}
          </button>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}
