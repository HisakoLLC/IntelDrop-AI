'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getClientSettings() {
  const supabase = await createClient()
  
  // Verify analyst session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('client_settings')
    .select('*')
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Settings fetch error:', error)
    return null
  }

  // Fallback to defaults if no settings exist yet
  return data || {
    client_name: 'IntelDrop Prototype',
    client_logo_url: null
  }
}

export async function updateClientSettings(name: string, logoUrl?: string | null) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Attempt to update the singleton settings row
  const { data: existing } = await supabase.from('client_settings').select('id').single()

  let error;
  if (existing) {
    const { error: updateError } = await supabase
      .from('client_settings')
      .update({ client_name: name, client_logo_url: logoUrl })
      .eq('id', existing.id)
    error = updateError
  } else {
    const { error: insertError } = await supabase
      .from('client_settings')
      .insert({ client_name: name, client_logo_url: logoUrl })
    error = insertError
  }

  if (error) {
    console.error('Settings update error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}
