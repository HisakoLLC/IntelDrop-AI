import { getDecryptedTips } from '@/actions/tips'
import TriageTable from '@/components/dashboard/TriageTable'

export default async function DashboardPage() {
  const tips = await getDecryptedTips()

  return (
    <div className="space-y-10 selection:bg-notion-blue selection:text-white">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-whisper pb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-2 h-2 rounded-full bg-notion-blue animate-pulse" />
            <span className="text-[11px] font-bold text-notion-blue uppercase tracking-widest">Active Channel</span>
          </div>
          <h1 className="text-[40px] font-bold tracking-[-1.5px] text-notion-black leading-tight">
            Analyst Inbox
          </h1>
          <p className="text-[16px] font-medium text-warm-gray-300 mt-2">
            Managing incoming intelligence leads and whistleblower transmissions.
          </p>
        </div>
      </header>
      
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-[18px] font-bold tracking-tight text-notion-black">
            Total Leads <span className="ml-2 text-[14px] font-semibold text-warm-gray-300 bg-warm-white px-2 py-0.5 rounded-full">{tips.length}</span>
          </h2>
        </div>
        
        <TriageTable initialTips={tips} />
        
      </section>
    </div>
  )
}
