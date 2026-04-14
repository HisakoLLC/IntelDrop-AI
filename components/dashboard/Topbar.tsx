import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function Topbar({ clientName, clientLogoUrl }: { clientName?: string, clientLogoUrl?: string }) {
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-16 border-b border-whisper bg-white px-8 flex justify-between items-center shrink-0">
      <div className="flex items-center gap-4">
        {clientLogoUrl && (
          <div className="relative w-8 h-8 rounded-[4px] overflow-hidden border border-whisper">
            <Image src={clientLogoUrl} alt="Logo" fill className="object-cover" />
          </div>
        )}
        <h1 className="text-lg font-bold tracking-tight text-notion-black uppercase">
          {clientName || 'IntelDrop Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={handleSignOut}
          className="text-[14px] font-semibold text-warm-gray-500 hover:text-black transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
