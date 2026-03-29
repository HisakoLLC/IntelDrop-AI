import { getInsightMetrics } from '@/actions/insights'
import InboxVolumeChart from '@/components/dashboard/InboxVolumeChart'
import CategoryDonutChart from '@/components/dashboard/CategoryDonutChart'

export default async function InsightsPage() {
  const { volumeData, categoryData } = await getInsightMetrics()

  return (
    <div className="space-y-8">
      <header className="border-b-[3px] border-white pb-6">
        <h1 className="text-5xl font-black tracking-tighter uppercase">Insights</h1>
        <p className="text-sm mt-3 font-bold uppercase tracking-widest text-white/70">
          ANALYTICS & THREAT ASSESSMENT
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* White backgrounds invert the components safely executing intense monochrome parameters locally! */}
        <section className="border-[3px] border-white p-6 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] bg-white text-black relative">
          <div className="absolute top-0 right-0 border-b-[3px] border-l-[3px] border-black bg-black py-1 px-3">
             <span className="text-xs font-black tracking-widest text-white uppercase">30-Day Rolling</span>
          </div>
          <h2 className="text-xl font-black uppercase mb-6 border-b-[3px] border-black pb-2 tracking-wider">Volume Intercepts</h2>
          
          <InboxVolumeChart data={volumeData} />
        </section>
        
        <section className="border-[3px] border-white p-6 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] bg-white text-black relative">
          <div className="absolute top-0 right-0 border-b-[3px] border-l-[3px] border-black bg-black py-1 px-3">
             <span className="text-xs font-black tracking-widest text-white uppercase">Aggregated Scope</span>
          </div>
          <h2 className="text-xl font-black uppercase mb-6 border-b-[3px] border-black pb-2 tracking-wider">Categorical Spread</h2>
          
          <CategoryDonutChart data={categoryData} />
        </section>
      </div>
    </div>
  )
}
