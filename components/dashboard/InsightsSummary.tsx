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
      label: 'Monthly Volume',
      value: summary.totalMonth,
      sublabel: 'Verified transmissions'
    },
    {
      label: 'High Priority',
      value: summary.highPriority,
      sublabel: 'Awaiting review',
      isWarning: summary.highPriority > 0
    },
    {
      label: 'Primary Vector',
      value: summary.topCategory,
      sublabel: 'Lead intel category'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {items.map((item, index) => (
        <div 
          key={index} 
          className="bg-white border border-whisper p-6 rounded-[12px] shadow-notion-card transition-all hover:shadow-notion-deep group"
        >
          <div className="text-[12px] font-bold text-warm-gray-300 uppercase tracking-widest mb-4 flex justify-between items-center transition-colors group-hover:text-warm-gray-500">
            {item.label}
            {item.isWarning && (
              <span className="flex h-2 w-2 rounded-full bg-notion-blue ring-4 ring-notion-blue/10 animate-pulse"></span>
            )}
          </div>
          
          <div className="text-[42px] font-bold text-notion-black tracking-[-2px] leading-tight mb-2">
            {item.value}
          </div>
          
          <div className="text-[13px] font-semibold text-warm-gray-300 tracking-tight">
            {item.sublabel}
          </div>
        </div>
      ))}
    </div>
  )
}
