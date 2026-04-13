'use client'
import { useState } from 'react'
import type { Tip } from '@/actions/tips'
import ReplyModal from './ReplyModal'
import TipDetailModal from './TipDetailModal'

export default function TriageTable({ initialTips }: { initialTips: Tip[] }) {
  const [tips] = useState<Tip[]>(initialTips)
  const [activeReplyAlias, setActiveReplyAlias] = useState<string | null>(null)
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null)

  const getPriorityClass = (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'high': 
        return 'font-black text-white'
      case 'medium': 
        return 'font-bold opacity-80 text-white/90'
      case 'low': 
        return 'font-light opacity-60'
      default: 
        return 'font-normal'
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'New': return 'bg-white text-black font-black'
      case 'Under Review': return 'border border-white text-white font-bold'
      case 'Closed': return 'opacity-30 line-through'
      default: return ''
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (tips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 border-[3px] border-dashed border-white/50">
        <div className="text-4xl mb-4 font-black tracking-tighter opacity-50">NO DATA</div>
        <p className="text-sm uppercase tracking-widest font-bold opacity-50">The intelligence queue is currently empty.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto border-[3px] border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
        <table className="w-full text-left font-mono text-sm border-collapse bg-black">
          <thead>
            <tr className="border-b-[3px] border-white bg-white text-black uppercase tracking-[0.2em] font-black text-[10px]">
              <th className="p-4 border-r-[3px] border-black">Status</th>
              <th className="p-4 border-r-[3px] border-black">Alias</th>
              <th className="p-4 border-r-[3px] border-black">Priority</th>
              <th className="p-4 border-r-[3px] border-black">Category</th>
              <th className="p-4 border-r-[3px] border-black max-w-[400px]">Intelligence Summary</th>
              <th className="p-4 border-r-[3px] border-black">Timestamp</th>
              <th className="p-4 bg-white text-black">Action</th>
            </tr>
          </thead>
          <tbody>
            {tips.map((tip) => (
              <tr 
                key={tip.id} 
                onClick={() => setSelectedTip(tip)}
                className="border-b border-white/30 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <td className="p-4 border-r border-white/30">
                  <span className={`px-2 py-0.5 text-[9px] uppercase tracking-widest ${getStatusClass(tip.status)}`}>
                    {tip.status}
                  </span>
                </td>
                <td className="p-4 border-r border-white/30 font-bold whitespace-nowrap group-hover:underline">
                  {tip.alias}
                </td>
                <td className={`p-4 border-r border-white/30 uppercase tracking-wider ${getPriorityClass(tip.priority)}`}>
                  {tip.priority || 'UNRATED'}
                </td>
                <td className="p-4 border-r border-white/30 uppercase opacity-90 text-[11px] leading-tight">
                  {tip.category || 'UNCLASSIFIED'}
                </td>
                <td className="p-4 border-r border-white/30 max-w-[400px] leading-relaxed">
                  <div className="line-clamp-2 text-xs opacity-80" title={tip.decrypted_summary}>
                    {tip.decrypted_summary}
                  </div>
                </td>
                <td className="p-4 border-r border-white/30 whitespace-nowrap opacity-70 text-xs text-right">
                  {formatDate(tip.created_at)}
                </td>
                <td className="p-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setActiveReplyAlias(tip.alias)}
                    className="border-[2px] border-white px-3 py-1 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors text-xs"
                  >
                    Reply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReplyModal 
        isOpen={!!activeReplyAlias} 
        alias={activeReplyAlias} 
        onClose={() => setActiveReplyAlias(null)} 
      />

      <TipDetailModal 
        tip={selectedTip}
        onClose={() => setSelectedTip(null)}
      />
    </>
  )
}
