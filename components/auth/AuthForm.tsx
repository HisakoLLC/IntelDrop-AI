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
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="space-y-1.5">
        <label className="block text-[14px] font-semibold text-warm-gray-500 ml-0.5">Email Address</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white text-notion-black border border-whisper px-3 py-2 rounded-[4px] text-[15px] focus:outline-none focus:ring-2 focus:ring-notion-blue/20 focus:border-notion-blue transition-all placeholder-warm-gray-300 shadow-sm"
          placeholder="Enter your email"
          required
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-[14px] font-semibold text-warm-gray-500 ml-0.5">Password</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white text-notion-black border border-whisper px-3 py-2 rounded-[4px] text-[15px] focus:outline-none focus:ring-2 focus:ring-notion-blue/20 focus:border-notion-blue transition-all shadow-sm"
          placeholder="••••••••"
          required 
        />
      </div>
      
      {error && (
        <div className="p-3 rounded-[4px] bg-red-50 border border-red-100 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-notion-blue text-white py-2.5 rounded-[4px] text-[15px] font-bold hover:bg-[#005bab] transition-all transform active:scale-[0.98] shadow-md shadow-notion-blue/10 disabled:opacity-50 mt-2"
      >
        {loading ? 'Verifying...' : 'Sign in to Workspace'}
      </button>
    </form>
  )
}
