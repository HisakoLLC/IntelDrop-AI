export default function SettingsPage() {
  return (
    <div className="space-y-10 selection:bg-notion-blue selection:text-white">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-whisper pb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-2 h-2 rounded-full bg-notion-blue" />
            <span className="text-[11px] font-bold text-notion-blue uppercase tracking-widest">Configuration Active</span>
          </div>
          <h1 className="text-[40px] font-bold tracking-[-1.5px] text-notion-black leading-tight">
            System Settings
          </h1>
          <p className="text-[16px] font-medium text-warm-gray-300 mt-2">
            Manage your investigative identity, branding, and system protocols.
          </p>
        </div>
      </header>
      
      <section className="max-w-2xl bg-white border border-whisper p-10 rounded-[12px] shadow-notion-card animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-[20px] font-bold tracking-tight text-notion-black mb-8 border-b border-whisper pb-4">Identity & Branding</h2>
        
        <form className="space-y-8">
          <div className="space-y-2">
            <label className="block text-[14px] font-semibold text-warm-gray-500 ml-0.5">Workspace Name</label>
            <input 
              type="text" 
              className="w-full bg-warm-white text-warm-gray-300 border border-whisper p-3 rounded-[4px] text-[15px] font-medium cursor-not-allowed"
              defaultValue="IntelDrop Investigative Team"
              disabled
            />
            <p className="text-[12px] font-medium text-warm-gray-300 ml-0.5 mt-3 italic">
              * Workspace name is managed via the system orchestration layer.
            </p>
          </div>
        </form>
      </section>
    </div>
  )
}
