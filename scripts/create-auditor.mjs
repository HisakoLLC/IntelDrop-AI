import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAuditor() {
  const email = 'auditor@inteldrop.ai';
  const password = 'TemporaryAuditor2026!';

  console.log(`[QA] Creating system auditor: ${email}`);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('✅ Auditor account already exists.');
    } else {
      console.error('❌ Failed to create auditor:', error.message);
    }
  } else {
    console.log('✅ Auditor account created successfully.');
  }
}

createAuditor();
