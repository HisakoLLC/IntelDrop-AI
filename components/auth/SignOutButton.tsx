'use client'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button 
      onClick={handleSignOut}
      className="border-[3px] border-white px-4 py-2 font-black uppercase tracking-wider hover:bg-white hover:text-black transition-all text-sm hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
    >
      Terminate Session
    </button>
  )
}
