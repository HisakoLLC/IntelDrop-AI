'use server'

import { createClient } from '@/lib/supabase-server'
import { decryptData } from '@/lib/encryption'

export type Tip = {
  id: string
  alias: string
  category: string | null
  priority: string | null
  media_url: string | null
  created_at: string
  decrypted_summary?: string
  decrypted_original?: string
}

export async function getDecryptedTips(): Promise<Tip[]> {
  const supabase = await createClient()

  // Ensure caller is firmly established via SSR HTTP sessions preventing edge leaks
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    throw new Error('Unauthorized Access Invocation')
  }

  // Fetch all intercepts tracking descent
  const { data: tips, error } = await supabase
    .from('tips')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !tips) {
    console.error('Database resolution failed:', error)
    return []
  }

  // Execute isolated server-side decryption looping exclusively mapping English constants 
  // directly backward. Encrypted hashes are aggressively terminated outside the map parameters.
  const decryptedTips: Tip[] = tips.map(row => {
    let summaryText = 'DECRYPTION ERROR / PAYLOAD COMPROMISED'
    let originalText = ''
    
    try {
      if (row.encrypted_content) {
        const jsonStr = decryptData(row.encrypted_content)
        const parsed = JSON.parse(jsonStr)
        summaryText = parsed.summary || 'Summary parameter missing generated from intelligence extraction.'
        originalText = parsed.raw_source_text || parsed.original_language || ''
      }
    } catch (err) {
      console.error(`Cipher breaking failed explicitly mapping row ${row.id}`, err)
    }
    
    return {
      id: row.id,
      alias: row.alias,
      category: row.category,
      priority: row.priority,
      media_url: row.media_url,
      created_at: row.created_at,
      decrypted_summary: summaryText,
      decrypted_original: originalText,
    }
  })

  return decryptedTips
}
