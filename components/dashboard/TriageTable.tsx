'use client'
import { useState, useEffect } from 'react'
import type { Tip } from '@/actions/tips'
import ReplyModal from './ReplyModal'
import TipDetailModal from './TipDetailModal'

export default function TriageTable({ initialTips }: { initialTips: Tip[] }) {
  const [mounted, setMounted] = useState(false)
  const [tips] = useState<Tip[]>(initialTips)
  const [activeReplyAlias, setActiveReplyAlias] = useState<string | null>(null)
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getPriorityBadge = (priority: string | null) => {
    const p = priority?.toLowerCase()
    switch (p) {
      case 'high': return 'bg-red-50 text-red-600 border-red-100'
      case 'medium': return 'bg-orange-50 text-orange-600 border-orange-100'
      case 'low': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
      default: return 'bg-warm-white text-warm-gray-500 border-whisper'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-50 text-notion-blue border-blue-100'
      case 'Under Review': return 'bg-purple-50 text-purple-600 border-purple-100'
      case 'Closed': return 'bg-warm-white text-warm-gray-300 border-whisper grayscale opacity-60'
      default: return 'bg-warm-white text-warm-gray-500 border-whisper'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (tips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white border border-whisper rounded-[12px] shadow-notion-card">
        <div className="text-4xl mb-4 font-bold tracking-tighter opacity-10">NO DATA</div>
        <p className="text-[15px] font-medium text-warm-gray-300">The intelligence queue is currently empty.</p>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="animate-pulse bg-white border border-whisper rounded-[12px] p-24 text-center font-semibold text-warm-gray-300">
        Loading intelligence feed...
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border border-whisper rounded-[12px] shadow-notion-card overflow-hidden">
        <table className="w-full text-left text-[14px] border-collapse">
          <thead>
            <tr className="bg-warm-white border-b border-whisper text-warm-gray-500 font-semibold">
              <th className="p-4 w-[120px]">Status</th>
              <th className="p-4 w-[140px]">Alias</th>
              <th className="p-4 w-[110px]">Priority</th>
              <th className="p-4 w-[160px]">Category</th>
              <th className="p-4">Summary</th>
              <th className="p-4 w-[160px] text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-whisper">
            {tips.map((tip) => (
              <tr 
                key={tip.id} 
                onClick={() => setSelectedTip(tip)}
                className="hover:bg-warm-white/50 transition-colors cursor-pointer group"
              >
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(tip.status)}`}>
                    {tip.status}
                  </span>
                </td>
                <td className="p-4 font-bold text-notion-black group-hover:text-notion-blue transition-colors">
                  {tip.alias}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-[0.05em] ${getPriorityBadge(tip.priority)}`}>
                    {tip.priority || 'UNRATED'}
                  </span>
                </td>
                <td className="p-4 font-medium text-warm-gray-500 text-[13px]">
                  {tip.category || 'Unclassified'}
                </td>
                <td className="p-4">
                  <div className="line-clamp-1 font-medium text-notion-black opacity-80" title={tip.decrypted_summary}>
                    {tip.decrypted_summary}
                  </div>
                </td>
                <td className="p-4 text-right font-medium text-warm-gray-300 text-[13px] whitespace-nowrap">
                  {formatDate(tip.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTip && (
        <TipDetailModal 
          tip={selectedTip} 
          onClose={() => setSelectedTip(null)}
          onReply={(alias) => {
            setSelectedTip(null);
            setActiveReplyAlias(alias);
          }}
        />
      )}

      {activeReplyAlias && (
        <ReplyModal 
          isOpen={!!activeReplyAlias}
          alias={activeReplyAlias} 
          onClose={() => setActiveReplyAlias(null)} 
        />
      )}
    </>
  )
}
