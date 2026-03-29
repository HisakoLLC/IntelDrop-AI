import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Uses the anon key for secure client-side operations allowing RLS to enforce boundaries.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseAnonKey) {
    console.warn("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.");
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
