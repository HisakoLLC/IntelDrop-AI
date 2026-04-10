import { getDecryptedTips } from '@/actions/tips'
import TriageTable from '@/components/dashboard/TriageTable'

export default async function DashboardPage() {
  const tips = await getDecryptedTips()

  return (
    <div className="space-y-8">
      <header className="border-b-[3px] border-white pb-8 mb-8">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase relative inline-block">
          Triage Inbox
          <span className="absolute -top-3 -right-6 text-[10px] bg-white text-black px-2 py-1 font-black tracking-widest">LIVE</span>
        </h1>
        <p className="text-sm mt-4 font-bold uppercase tracking-widest text-white/70">
          AWAITING INCOMING TRANSMISSIONS...
        </p>
      </header>
      
      <section className="border-[3px] border-white p-6 md:p-10 relative bg-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        <div className="absolute top-0 right-0 border-b-[3px] border-l-[3px] border-white bg-black py-2 px-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          <span className="text-[10px] font-black tracking-widest">SYSTEM ONLINE</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black uppercase mb-8 underline decoration-[3px] underline-offset-4">Intercepts ({tips.length})</h2>
        
        <TriageTable initialTips={tips} />
        
      </section>
    </div>
  )
}
