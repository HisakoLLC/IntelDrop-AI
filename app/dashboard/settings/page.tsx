export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <header className="border-b-[3px] border-white pb-6">
        <h1 className="text-5xl font-black tracking-tighter uppercase relative inline-block">Settings</h1>
        <p className="text-sm mt-3 font-bold uppercase tracking-widest text-white/70">
          CONFIGURATION & IDENTITY
        </p>
      </header>
      
      <section className="max-w-2xl border-[3px] border-white p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] relative bg-black">
        <div className="absolute top-0 right-0 border-b-[3px] border-l-[3px] border-white px-3 py-1 font-black tracking-widest text-xs uppercase bg-white text-black">
          RESTRICTED
        </div>
        <h2 className="text-2xl font-black uppercase mb-6 underline decoration-[3px] underline-offset-4">Identity Protocol</h2>
        
        <form className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-black uppercase tracking-wider">Client Name Designation</label>
            <input 
              type="text" 
              className="w-full bg-black text-white border-[3px] border-white p-3 font-mono focus:outline-none focus:ring-2 focus:ring-white opacity-50 cursor-not-allowed"
              defaultValue="UNDEFINED CLASSIFIED ENTITY"
              disabled
            />
            <p className="text-xs font-bold text-white/50 uppercase">Contact systems administrator to execute alterations.</p>
          </div>
        </form>
      </section>
    </div>
  )
}
