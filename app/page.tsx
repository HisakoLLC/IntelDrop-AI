export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black font-mono selection:bg-black selection:text-white">
      {/* Navbar */}
      <nav className="border-b-[3px] border-black p-6 flex justify-between items-center bg-white sticky top-0 z-50">
        <h1 className="text-3xl font-black tracking-tighter uppercase underline decoration-[3px]">IntelDrop AI</h1>
        <div className="space-x-8 text-sm font-bold uppercase hidden md:flex">
          <a href="/dashboard" className="hover:line-through">Dashboard</a>
          <a href="#" className="hover:line-through">Services</a>
          <a href="#" className="hover:line-through">Mission</a>
          <a href="#" className="bg-black text-white px-4 py-1 hover:bg-white hover:text-black hover:border border-black transition-all">Command</a>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="p-12 md:p-24 border-b-[3px] border-black text-center md:text-left">
          <div className="max-w-5xl mx-auto flex flex-col items-center md:items-start">
            <h2 className="text-7xl md:text-[10rem] font-black leading-none uppercase tracking-tighter mb-8 bg-black text-white inline-block px-4">
              INTEL
            </h2>
            <h2 className="text-7xl md:text-[10rem] font-black leading-none uppercase tracking-tighter mb-12 border-[10px] border-black px-4 italic">
              DROP
            </h2>
            <p className="text-2xl font-bold max-w-2xl uppercase border-l-[10px] border-black pl-8 mb-12 leading-relaxed">
              Uncompromising intelligence for the high-contrast age. 
              No grays. No distractions. Total dominance of the source.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a href="/dashboard" className="bg-black text-white text-2xl font-black uppercase px-12 py-6 border-[3px] border-black hover:bg-white hover:text-black transition-all text-center">
                Launch System
              </a>
              <button className="bg-white text-black text-2xl font-black uppercase px-12 py-6 border-[3px] border-black hover:bg-black hover:text-white transition-all text-center">
                Access Archive
              </button>
            </div>
          </div>
        </section>

        {/* Info Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 border-b-[3px] border-black">
          <div className="border-r-[3px] border-black p-12 hover:bg-black hover:text-white transition-colors group">
            <h3 className="text-4xl font-black uppercase mb-4 decoration-white group-hover:underline">Telegram</h3>
            <p className="text-lg font-bold">Direct integration with source streams. Immediate processing. Strict high-contrast data handling.</p>
          </div>
          <div className="border-r-[3px] border-black p-12 bg-black text-white hover:bg-white hover:text-black transition-colors group">
            <h3 className="text-4xl font-black uppercase mb-4 decoration-black group-hover:underline">Dashboard</h3>
            <p className="text-lg font-bold italic">Visual command center. Zero-gray monitoring. High-contrast alerts only.</p>
          </div>
          <div className="p-12 hover:bg-black hover:text-white transition-colors group">
            <h3 className="text-4xl font-black uppercase mb-4 decoration-white group-hover:underline">Intelligence</h3>
            <p className="text-lg font-bold">AI-driven insights extracted from the noise. Pure black and white results.</p>
          </div>
        </section>
      </main>

      <footer className="p-12 text-center bg-black text-white">
        <p className="text-4xl font-black italic uppercase tracking-tighter mb-4">IntelDrop AI / 2026</p>
        <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Protocol: Established / Colors: Restricted</p>
      </footer>
    </div>
  );
}
