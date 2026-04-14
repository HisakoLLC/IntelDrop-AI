'use client'

import { useState } from 'react'
import { updateClientSettings } from '@/actions/settings'

type SettingsFormProps = {
  initialName: string
  initialLogoUrl: string | null
}

export default function SettingsForm({ initialName, initialLogoUrl }: SettingsFormProps) {
  const [name, setName] = useState(initialName)
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const result = await updateClientSettings(name, logoUrl || null)
    
    setLoading(false)
    if (result.success) {
      setMessage({ type: 'success', text: 'Workspace branding updated successfully.' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update settings.' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <label className="block text-[14px] font-semibold text-warm-gray-500 ml-0.5">Workspace Name</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white text-notion-black border border-whisper p-3 rounded-[4px] text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-notion-blue/20 transition-all shadow-sm"
          placeholder="e.g. IntelDrop Newsroom"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[14px] font-semibold text-warm-gray-500 ml-0.5">Logo URL (Optional)</label>
        <input 
          type="url" 
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="w-full bg-white text-notion-black border border-whisper p-3 rounded-[4px] text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-notion-blue/20 transition-all shadow-sm"
          placeholder="https://example.com/logo.png"
        />
        <p className="text-[11px] font-medium text-warm-gray-300 ml-0.5 mt-2">
          Recommended: Transparent PNG, 128x128px.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-[4px] text-sm font-bold tracking-tight border ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading}
        className="bg-notion-blue text-white px-8 py-3 rounded-[4px] text-[15px] font-bold hover:bg-[#005bab] transition-all transform active:scale-95 shadow-md shadow-notion-blue/10 disabled:opacity-50"
      >
        {loading ? 'Updating Branding...' : 'Save Workspace Changes'}
      </button>
    </form>
  )
}
