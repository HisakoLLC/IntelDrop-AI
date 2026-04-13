'use server'

import { createClient } from '@/lib/supabase-server'
import { decryptData, encryptData } from '@/lib/encryption'
import { revalidatePath } from 'next/cache'

export type Tip = {
  id: string
  alias: string
  category: string | null
  priority: string | null
  media_url: string | null
  created_at: string
  status: string
  notes?: string
  decrypted_summary?: string
  decrypted_original?: string
  original_language?: string
}

export async function getDecryptedTips(): Promise<Tip[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    throw new Error('Unauthorized Access Invocation')
  }

  const { data: tips, error } = await supabase
    .from('tips')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !tips) {
    console.error('Database resolution failed:', error)
    return []
  }

  const decryptedTips: Tip[] = tips.map(row => {
    let summaryText = 'DECRYPTION ERROR / PAYLOAD COMPROMISED'
    let originalText = ''
    let detectedLang = 'N/A'
    
    try {
      if (row.encrypted_content) {
        const jsonStr = decryptData(row.encrypted_content)
        const parsed = JSON.parse(jsonStr)
        summaryText = parsed.summary || 'Summary parameter missing generated from intelligence extraction.'
        originalText = parsed.raw_source_text || parsed.original_language || ''
        detectedLang = parsed.original_language || 'N/A'
      }
    } catch (err) {
      console.error(`Cipher breaking failed explicitly mapping row ${row.id}`, err)
    }

    // Decrypt internal analyst notes if they exist
    let decryptedNotes = ''
    if (row.notes) {
      const dec = decryptData(row.notes)
      if (!dec.startsWith('DECRYPTION_ERROR')) {
        decryptedNotes = dec
      }
    }
    
    return {
      id: row.id,
      alias: row.alias,
      category: row.category,
      priority: row.priority,
      media_url: row.media_url,
      created_at: row.created_at,
      status: row.status || 'New',
      notes: decryptedNotes,
      decrypted_summary: summaryText,
      decrypted_original: originalText,
      original_language: detectedLang
    }
  })

  return decryptedTips
}

export async function updateTipMetadata(id: string, status: string, notes: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized Operation')

  const encryptedNotes = notes ? encryptData(notes) : null

  const { error } = await supabase
    .from('tips')
    .update({ 
      status, 
      notes: encryptedNotes 
    })
    .eq('id', id)

  if (error) {
    console.error('Failed to update tip metadata:', error)
    throw new Error('Update Failure')
  }

  revalidatePath('/dashboard')
  return { success: true }
}
