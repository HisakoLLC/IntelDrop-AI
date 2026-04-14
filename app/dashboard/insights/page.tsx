import { getInsightMetrics } from '@/actions/insights'
import InboxVolumeChart from '@/components/dashboard/InboxVolumeChart'
import CategoryDonutChart from '@/components/dashboard/CategoryDonutChart'
import InsightsSummary from '@/components/dashboard/InsightsSummary'

export default async function InsightsPage() {
  const { volumeData, categoryData, summary } = await getInsightMetrics()

  return (
    <div className="space-y-10 selection:bg-notion-blue selection:text-white">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-whisper pb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-2 h-2 rounded-full bg-notion-blue animate-pulse" />
            <span className="text-[11px] font-bold text-notion-blue uppercase tracking-widest">Analytics Online</span>
          </div>
          <h1 className="text-[40px] font-bold tracking-[-1.5px] text-notion-black leading-tight">
            Intelligence Insights
          </h1>
          <p className="text-[16px] font-medium text-warm-gray-300 mt-2">
            Advanced data analysis and trend monitoring for investigative leads.
          </p>
        </div>
      </header>
      
      <InsightsSummary summary={summary} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white border border-whisper p-8 rounded-[12px] shadow-notion-card transition-all hover:shadow-notion-deep">
          <div className="flex items-center justify-between mb-8 border-b border-whisper pb-4">
            <h2 className="text-[18px] font-bold tracking-tight text-notion-black">Inbox Activity</h2>
            <span className="text-[11px] font-bold text-warm-gray-300 uppercase tracking-widest bg-warm-white px-2 py-1 rounded-full">30-Day Rolling</span>
          </div>
          
          <InboxVolumeChart data={volumeData} />
        </section>
        
        <section className="bg-white border border-whisper p-8 rounded-[12px] shadow-notion-card transition-all hover:shadow-notion-deep">
           <div className="flex items-center justify-between mb-8 border-b border-whisper pb-4">
            <h2 className="text-[18px] font-bold tracking-tight text-notion-black">Categorical Spread</h2>
            <span className="text-[11px] font-bold text-warm-gray-300 uppercase tracking-widest bg-warm-white px-2 py-1 rounded-full">Total Distribution</span>
          </div>
          
          <CategoryDonutChart data={categoryData} />
        </section>
      </div>
    </div>
  )
}
