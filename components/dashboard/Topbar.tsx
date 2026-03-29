import SignOutButton from '@/components/auth/SignOutButton'

type TopbarProps = {
  clientName?: string | null
  clientLogoUrl?: string | null
}

export default function Topbar({ clientName = 'UNREGISTERED ENTITY', clientLogoUrl }: TopbarProps) {
  return (
    <header className="h-20 w-full border-b-[3px] border-white bg-black text-white flex items-center justify-between px-8 font-mono shrink-0">
      <div className="flex items-center space-x-6">
        <span className="bg-white text-black px-4 py-2 font-black tracking-widest text-sm shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
          ON-DUTY
        </span>
        
        {clientLogoUrl ? (
          <img 
            src={clientLogoUrl} 
            alt={clientName || 'Client Entity Logo'} 
            className="h-10 w-auto object-contain max-w-[250px]"
          />
        ) : (
          <h1 className="text-xl font-bold tracking-widest uppercase">{clientName}</h1>
        )}
      </div>
      <div>
        <SignOutButton />
      </div>
    </header>
  )
}
