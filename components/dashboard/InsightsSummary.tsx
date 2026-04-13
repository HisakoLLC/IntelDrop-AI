interface InsightsSummaryProps {
  summary: {
    totalMonth: number
    highPriority: number
    topCategory: string
  }
}

export default function InsightsSummary({ summary }: InsightsSummaryProps) {
  const items = [
    {
      label: 'Volume: Monthly',
      value: summary.totalMonth,
      sublabel: 'Transmissions accepted'
    },
    {
      label: 'Alerts: High Priority',
      value: summary.highPriority,
      sublabel: 'Awaiting analyst review',
      isWarning: summary.highPriority > 0
    },
    {
      label: 'Lead Category',
      value: summary.topCategory,
      sublabel: 'Primary threat vector'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      {items.map((item, index) => (
        <div 
          key={index} 
          className="border-[3px] border-white p-6 bg-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] relative overflow-hidden group hover:-translate-x-1 hover:-translate-y-1 transition-transform"
        >
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-4 flex justify-between items-center">
            {item.label}
            {item.isWarning && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            )}
          </div>
          
          <div className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
            {item.value}
          </div>
          
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            {item.sublabel}
          </div>

          <div className="absolute bottom-0 right-0 p-2 opacity-5 translate-y-2 translate-x-2 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform">
             <div className="w-12 h-12 border-t-[3px] border-l-[3px] border-white"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
