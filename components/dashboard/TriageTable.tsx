'use client'
import { useState } from 'react'
import type { Tip } from '@/actions/tips'
import ReplyModal from './ReplyModal'

export default function TriageTable({ initialTips }: { initialTips: Tip[] }) {
  const [tips] = useState<Tip[]>(initialTips)
  const [activeReplyAlias, setActiveReplyAlias] = useState<string | null>(null)

  // Mapping strict font weights matching structural payload logic natively inside Tailwind.
  const getPriorityClass = (priority: string | null) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': 
        return 'font-black'
      case 'MEDIUM': 
        return 'font-normal'
      case 'LOW': 
        return 'font-light opacity-70'
      default: 
        return 'font-normal'
    }
  }

  // Simplified formatting matching monochrome terminal arrays visually 
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
            <tr className="border-b-[3px] border-white bg-white text-black uppercase tracking-widest font-black">
              <th className="p-4 border-r-[3px] border-black">Alias</th>
              <th className="p-4 border-r-[3px] border-black">Priority</th>
              <th className="p-4 border-r-[3px] border-black whitespace-nowrap">Category</th>
              <th className="p-4 border-r-[3px] border-black max-w-[400px]">Intelligence Summary</th>
              <th className="p-4 border-r-[3px] border-black">Timestamp</th>
              <th className="p-4 bg-white text-black">Action</th>
            </tr>
          </thead>
          <tbody>
            {tips.map((tip) => (
              <tr key={tip.id} className="border-b border-white/30 hover:bg-white/5 transition-colors">
                <td className="p-4 border-r border-white/30 font-bold whitespace-nowrap">{tip.alias}</td>
                <td className={`p-4 border-r border-white/30 uppercase tracking-wider ${getPriorityClass(tip.priority)}`}>
                  {tip.priority || 'UNRATED'}
                </td>
                <td className="p-4 border-r border-white/30 uppercase opacity-90 text-[11px] leading-tight">
                  {tip.category || 'UNCLASSIFIED'}
                </td>
                <td className="p-4 border-r border-white/30 max-w-[400px] leading-relaxed">
                  <div className="line-clamp-4" title={tip.decrypted_summary}>
                    {tip.decrypted_summary}
                  </div>
                  {tip.media_url && (
                    <a href={tip.media_url} target="_blank" rel="noreferrer" className="block mt-3 text-[11px] font-bold underline uppercase tracking-widest hover:text-white/70">
                      [View Attached Evidence]
                    </a>
                  )}
                </td>
                <td className="p-4 border-r border-white/30 whitespace-nowrap opacity-70 text-xs text-right">
                  {formatDate(tip.created_at)}
                </td>
                <td className="p-4 whitespace-nowrap text-center">
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
    </>
  )
}
