import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTips() {
  console.log('--- INTELDROP: Fixing TIPS Schema ---');
  
  // Attempting direct execution via RPC if it exists
  const { error } = await supabase.rpc('execute_sql', {
    query: `
      ALTER TABLE tips ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'New';
      ALTER TABLE tips ADD COLUMN IF NOT EXISTS notes TEXT;
    `
  });

  if (error) {
    console.error('❌ Automated Schema Update Failed:', error.message);
    console.log('\n--- MANUAL ACTION REQUIRED ---');
    console.log('Please execute the following SQL in your Supabase Dashboard SQL Editor:');
    console.log(`
ALTER TABLE tips ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'New';
ALTER TABLE tips ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
  } else {
    console.log('✅ TIPS schema updated successfully.');
  }
}

fixTips();
