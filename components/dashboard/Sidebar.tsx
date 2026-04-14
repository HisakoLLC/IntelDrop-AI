'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const links = [
    { name: 'Analyst Inbox', href: '/dashboard' },
    { name: 'Intelligence Insights', href: '/dashboard/insights' },
    { name: 'System Settings', href: '/dashboard/settings' },
  ]

  return (
    <aside className="w-64 border-r border-whisper h-screen bg-warm-white p-6 flex flex-col shrink-0">
      <div className="mb-10 pl-2">
        <h2 className="text-[22px] font-bold tracking-[-0.25px] text-notion-black flex items-center gap-2">
          <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center text-white text-xs font-bold">I</div>
          IntelDrop
        </h2>
        <p className="text-[12px] font-bold text-warm-gray-300 uppercase tracking-widest mt-1">Investigative Workspace</p>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`block w-full px-3 py-2 rounded-[4px] text-[15px] font-semibold transition-colors 
                ${isActive 
                  ? 'bg-black/5 text-notion-black' 
                  : 'text-warm-gray-500 hover:bg-black/5 hover:text-notion-black'}`}
            >
              {link.name}
            </Link>
          )
        })}
      </nav>

      <div className="mt-8 pt-4 border-t border-whisper flex justify-center">
        <div className="bg-[#f2f9ff] text-[#097fe8] px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.125px] border border-[#d9ebff]">
          SYSTEM SECURE
        </div>
      </div>
    </aside>
  )
}
