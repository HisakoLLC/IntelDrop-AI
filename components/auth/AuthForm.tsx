'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  // Natively instances client allowing HTTP SSR cookie injection dynamically across route protection
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Perform robust server validation against credentials
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Force refresh on navigation to guarantee layout.tsx captures identical session cookie
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6 w-full max-w-sm mx-auto">
      <div className="space-y-2">
        <label className="block text-sm font-black uppercase tracking-wider">Operator Key</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-black text-white border-[3px] border-white p-3 font-mono focus:outline-none focus:ring-2 focus:ring-white placeholder-white/50"
          placeholder="AGENT_ID"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-black uppercase tracking-wider">Clearance Code</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-black text-white border-[3px] border-white p-3 font-mono focus:outline-none focus:ring-2 focus:ring-white"
          required 
        />
      </div>
      {error && <p className="text-white bg-black border-[3px] border-white p-2 text-sm font-bold uppercase">{error}</p>}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-white text-black border-[3px] border-white py-3 font-black uppercase hover:bg-black hover:text-white transition-colors tracking-widest disabled:opacity-50"
      >
        {loading ? 'Authenticating...' : 'Access Terminal'}
      </button>
    </form>
  )
}
