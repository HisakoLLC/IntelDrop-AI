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

async function applyMigration() {
  console.log('--- INTELDROP SECURE MIGRATION: Gap 2 ---');
  console.log('Adding last_contact_at to alias_map...');

  const { error } = await supabase.rpc('execute_sql', {
    query: "ALTER TABLE alias_map ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMP WITH TIME ZONE DEFAULT now();"
  });

  if (error) {
    if (error.message.includes('permission denied')) {
       console.warn('RPC execute_sql disabled. Attempting direct schema probe...');
       // Fallback if RPC is not enabled: Try a direct query if the key allows it
       const { error: directError } = await supabase.from('alias_map').select('last_contact_at').limit(1);
       if (directError && directError.code === '42703') {
          console.error('CRITICAL: Column missing and RPC disabled. Please apply the following SQL in Supabase Dashboard:');
          console.log("ALTER TABLE alias_map ADD COLUMN last_contact_at TIMESTAMP WITH TIME ZONE DEFAULT now();");
       } else {
          console.log('Column already exists or confirmed.');
       }
    } else {
       console.error('Migration failed:', error);
    }
  } else {
    console.log('✅ Migration applied successfully.');
  }
}

applyMigration();
