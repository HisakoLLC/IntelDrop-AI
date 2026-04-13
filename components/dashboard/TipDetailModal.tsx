'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import type { Tip } from '@/actions/tips'
import { updateTipMetadata } from '@/actions/tips'

interface TipDetailModalProps {
  tip: Tip | null
  onClose: () => void
}

export default function TipDetailModal({ tip, onClose }: TipDetailModalProps) {
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<string>('New')
  const [notes, setNotes] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (tip) {
      setStatus(tip.status || 'New')
      setNotes(tip.notes || '')
    }
  }, [tip])

  if (!mounted || !tip) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateTipMetadata(tip.id, status, notes)
      alert('AMENDMENTS SECURED')
      onClose()
    } catch (err) {
      console.error(err)
      alert('UPDATE FAILURE: CRYPTOGRAPHIC HANDSHAKE REJECTED')
    } finally {
      setIsSaving(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-black border-[3px] border-white shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] flex flex-col overflow-hidden font-mono text-white">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-[3px] border-white bg-white text-black">
          <div className="uppercase font-black tracking-widest text-xl flex items-center gap-3">
             <span className="bg-black text-white px-2 py-0.5 text-sm">INTEL_INTERCEPT</span>
             <span>ALIAS_{tip.alias}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-black hover:opacity-50 transition-opacity"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left: Intelligence Telemetry */}
            <div className="space-y-8">
              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-4 border-b border-white/20 pb-2">Primary Telemetry</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/30 block mb-1">Intercept Date</label>
                    <div className="text-sm font-bold uppercase">{new Date(tip.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/30 block mb-1">Original Language</label>
                    <div className="text-sm font-bold uppercase">{tip.original_language || 'Detecting...'}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/30 block mb-1">Category</label>
                    <div className="text-sm font-bold uppercase">{tip.category || 'UNCLASSIFIED'}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/30 block mb-1">Priority</label>
                    <div className="text-sm font-bold uppercase">{tip.priority || 'UNRATED'}</div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-4 border-b border-white/20 pb-2">Intelligence Summary</h3>
                <p className="text-sm leading-relaxed border-l-2 border-white pl-4 italic text-white/80">
                  &quot;{tip.decrypted_summary}&quot;
                </p>
              </section>

              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-4 border-b border-white/20 pb-2">Original Translated Source</h3>
                <div className="bg-white/5 p-4 text-sm leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap border border-white/10 italic text-white/70">
                  {tip.decrypted_original}
                </div>
              </section>

              {tip.media_url && (
                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-4 border-b border-white/20 pb-2">Attached Evidence</h3>
                  <div className="relative group border-[2px] border-white/20 aspect-video overflow-hidden">
                    <Image 
                      src={tip.media_url} 
                      alt="Telemetry Evidence" 
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white">
                      <a 
                        href={tip.media_url} 
                        download={`evidence_${tip.alias}.jpg`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white text-black font-black uppercase tracking-widest px-4 py-2 text-xs hover:bg-white/80"
                      >
                        Download Original
                      </a>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Right: Analyst Controls */}
            <div className="space-y-8 bg-white/5 p-6 border-l-[3px] border-white/10 lg:sticky lg:top-0 h-fit">
               <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-6">Analyst Control Station</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-white/40 block mb-3 tracking-widest">Intercept Status</label>
                      <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-black border-[2px] border-white p-3 text-sm font-bold uppercase tracking-widest focus:bg-white focus:text-black transition-colors"
                      >
                        <option value="New">NEW INTERCEPT</option>
                        <option value="Under Review">UNDER REVIEW</option>
                        <option value="Closed">ARCHIVED / CLOSED</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-white/40 block mb-3 tracking-widest">Internal Secure Annotations</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="ENTER PRIVATE ANALYST NOTES (STRICTLY ENCRYPTED)..."
                        className="w-full bg-black border-[2px] border-white p-3 text-sm font-bold h-48 focus:bg-white focus:text-black transition-colors resize-none uppercase tracking-tight placeholder:opacity-20"
                      />
                    </div>

                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full bg-white text-black p-4 font-black uppercase tracking-[0.2em] text-sm hover:translate-x-1 hover:translate-y-1 transition-transform disabled:opacity-50"
                    >
                      {isSaving ? 'ENCRYPTING & SYNCING...' : 'SAVE AMENDMENTS'}
                    </button>
                    
                    <div className="pt-4 text-[9px] text-white/30 uppercase leading-tight italic">
                      * WARNING: All annotations are AES-256 encrypted before persistence. 
                      Raw text is never stored in plain database tables.
                    </div>
                  </div>
               </section>
            </div>

          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
