'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { Tip } from '@/actions/tips'
import { updateTipMetadata, revokeSourceAccess } from '@/actions/tips'

interface TipDetailModalProps {
  tip: Tip | null
  onClose: () => void
  onReply?: (alias: string) => void
}

export default function TipDetailModal({ tip, onClose, onReply }: TipDetailModalProps) {
  const [status, setStatus] = useState<string>('New')
  const [notes, setNotes] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (tip) {
      setStatus(tip.status || 'New')
      setNotes(tip.notes || '')
    }
  }, [tip])

  if (!tip) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateTipMetadata(tip.id, status, notes)
      onClose()
    } catch (err) {
      console.error(err)
      alert('System Error: Could not save investigative updates.')
    } finally {
      setIsSaving(false)
    }
  }

  const [isRevoking, setIsRevoking] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)

  const handleRevoke = async () => {
    if (!showRevokeConfirm) {
      setShowRevokeConfirm(true)
      return
    }
    
    setIsRevoking(true)
    try {
      await revokeSourceAccess(tip.alias)
      onClose()
    } catch (err) {
      console.error(err)
      alert('Failed to revoke access.')
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 animate-in fade-in duration-300">
        <div className="fixed inset-0" onClick={onClose} />
        
        <div className="relative w-full max-w-[1000px] h-[85vh] bg-white rounded-[16px] shadow-notion-deep border border-whisper flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* 🏙️ HEADER */}
          <header className="px-8 py-6 border-b border-whisper flex justify-between items-start bg-white shrink-0">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  status === 'New' ? 'bg-blue-50 text-notion-blue border-blue-100' :
                  status === 'Under Review' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                  'bg-warm-white text-warm-gray-300 border-whisper'
                }`}>
                  {status}
                </span>
                <span className="text-[11px] font-bold text-warm-gray-300 tracking-widest uppercase">{tip.alias}</span>
              </div>
              <h2 className="text-[32px] font-bold tracking-[-1.25px] text-notion-black leading-tight">Investigative Report</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-warm-white rounded-full transition-colors text-warm-gray-300 hover:text-notion-black">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </header>

          {/* 📄 CONTENT AREA */}
          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-x divide-whisper">
            
            {/* Left: Intelligence Data */}
            <div className="flex-1 p-8 space-y-10">
              <section>
                <h3 className="text-[12px] font-bold text-warm-gray-300 uppercase tracking-widest mb-4">Case Summary</h3>
                <div className="bg-warm-white/50 p-6 rounded-[8px] border border-whisper text-[16px] font-medium leading-relaxed text-notion-black">
                  {tip.decrypted_summary}
                </div>
              </section>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[11px] font-bold text-warm-gray-300 uppercase tracking-widest mb-2">Category</h4>
                  <p className="font-semibold text-notion-black">{tip.category || 'Unclassified'}</p>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-warm-gray-300 uppercase tracking-widest mb-2">Received</h4>
                  <p className="font-semibold text-notion-black">{new Date(tip.created_at).toLocaleString()}</p>
                </div>
              </div>

              {tip.media_url && (
                <section>
                  <h4 className="text-[11px] font-bold text-warm-gray-300 uppercase tracking-widest mb-4">Secured Evidence</h4>
                  <div className="relative aspect-video rounded-[12px] overflow-hidden border border-whisper shadow-sm group">
                    <Image src={tip.media_url} alt="Evidence" fill className="object-cover" />
                    <a href={tip.media_url} target="_blank" className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-white text-sm backdrop-blur-[2px]">
                      View Full Resolution
                    </a>
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-[12px] font-bold text-warm-gray-300 uppercase tracking-widest mb-4">Source Translation</h3>
                <div className="text-[14px] leading-relaxed text-warm-gray-500 font-medium bg-warm-white/20 p-6 rounded-[8px] border border-whisper italic">
                  {tip.decrypted_original || 'No additional source text available.'}
                </div>
              </section>
            </div>

            {/* Right: Analyst Workstation */}
            <aside className="w-full md:w-[380px] p-8 bg-warm-white/30 space-y-8 flex flex-col">
              <section className="flex-1 space-y-8">
                <h3 className="text-[12px] font-bold text-notion-black uppercase tracking-widest mb-6 border-b border-whisper pb-2">Analyst Controls</h3>
                
                <div>
                  <label className="text-[11px] font-bold text-warm-gray-300 uppercase tracking-widest block mb-3">Report Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-white border border-whisper p-2.5 rounded-[4px] text-[14px] font-semibold text-notion-black focus:ring-2 focus:ring-notion-blue/20 transition-all outline-none shadow-sm"
                  >
                    <option value="New">New Lead</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Closed">Archive & Close</option>
                  </select>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <label className="text-[11px] font-bold text-warm-gray-300 uppercase tracking-widest block mb-3">Secure Annotations</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter private analyst notes..."
                    className="flex-1 w-full bg-white border border-whisper p-4 rounded-[4px] text-[14px] font-medium text-notion-black focus:ring-2 focus:ring-notion-blue/20 transition-all outline-none resize-none shadow-sm placeholder:text-warm-gray-300"
                  />
                  <p className="mt-3 text-[10px] text-warm-gray-300 leading-tight italic">
                    All annotations are hardware-encrypted before storage.
                  </p>
                </div>
              </section>

              <div className="space-y-3 pt-6 border-t border-whisper">
                <button 
                  onClick={() => onReply ? onReply(tip.alias) : null}
                  className="w-full py-2.5 rounded-[4px] text-[15px] font-bold text-notion-blue bg-notion-blue/5 border border-notion-blue/20 hover:bg-notion-blue/10 transition-all"
                >
                  Contact Source
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-notion-blue text-white py-2.5 rounded-[4px] text-[15px] font-bold hover:bg-[#005bab] transition-all transform active:scale-[0.98] shadow-md shadow-notion-blue/10 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Update Report'}
                </button>

                <div className="pt-4 mt-4 border-t border-whisper">
                  <button 
                    onClick={handleRevoke}
                    disabled={isRevoking}
                    className={`w-full py-2 text-[12px] font-bold transition-all rounded-[4px] ${
                      showRevokeConfirm 
                        ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' 
                        : 'text-warm-gray-300 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {isRevoking ? 'Revoking...' : showRevokeConfirm ? 'Click to Confirm Revoke' : 'Revoke Source Access'}
                  </button>
                  {showRevokeConfirm && (
                    <p className="text-[10px] text-red-600/60 mt-2 text-center leading-tight">
                      CAUTION: This permanently severs all identifying links for this alias.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
