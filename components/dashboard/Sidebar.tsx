'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const links = [
    { name: 'Triage Inbox', href: '/dashboard' },
    { name: 'Insights', href: '/dashboard/insights' },
    { name: 'Settings', href: '/dashboard/settings' },
  ]

  return (
    <aside className="w-64 border-r-[3px] border-white h-[100dvh] bg-black text-white p-6 flex flex-col font-mono shrink-0">
      <div className="mb-12 border-b-[3px] border-white pb-4">
        <h2 className="text-2xl font-black uppercase tracking-tighter">IntelDrop</h2>
        <p className="text-xs font-bold tracking-widest mt-1">OPERATOR PANEL</p>
      </div>

      <nav className="flex-1 space-y-4">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`block w-full border-[3px] border-white p-3 font-black uppercase tracking-wider transition-colors 
                ${isActive ? 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)]' : 'bg-black text-white hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]'}`}
            >
              {link.name}
            </Link>
          )
        })}
      </nav>

      <div className="mt-8 pt-4 border-t-[3px] border-white text-xs font-bold uppercase tracking-widest text-center">
        SYSTEM: SECURE
      </div>
    </aside>
  )
}
