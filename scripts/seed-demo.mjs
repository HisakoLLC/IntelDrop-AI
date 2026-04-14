import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionKey = process.env.AES_ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseServiceKey || !encryptionKey) {
  console.error('CRITICAL: Environment variables missing for seeding.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- ENCRYPTION UTILITY REPLICA ---
function getEncryptionKeyBuffer() {
  const rawKey = encryptionKey.trim();
  if (rawKey.length === 44) return Buffer.from(rawKey, 'base64');
  if (rawKey.length === 64) return Buffer.from(rawKey, 'hex');
  return Buffer.from(rawKey, 'utf8').slice(0, 32);
}

function encryptData(text) {
  const key = getEncryptionKeyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

const DEMO_TIPS = [
  {
    alias: 'whisper-echo-99',
    category: 'Corruption',
    priority: 'High',
    content: {
      summary: 'Systemic kickbacks in the Ministry of Transport regarding the Bridge bypass construction contracts.',
      raw_source_text: 'The Director of Procurement has been receiving payments into a Dubai account (account ending in 4492) from the construction consortium. I have the bank transfer memos.',
      risk_assessment: 'High - Direct involvement of senior government officials.',
      original_language: 'English'
    }
  },
  {
    alias: 'brave-shadow-12',
    category: 'Corporate',
    priority: 'Medium',
    content: {
      summary: 'Unsafe working conditions and illegal chemical dumping at the AlphaChem facility in the Delta industrial zone.',
      raw_source_text: 'They are venting toxic gases at night to avoid environmental sensors. Three staff members have fallen ill this month.',
      risk_assessment: 'Medium - Immediate health risk to residents.',
      original_language: 'English'
    }
  },
  {
    alias: 'silent-source-44',
    category: 'Human Rights',
    priority: 'High',
    content: {
      summary: 'Illegal detainment and child labor in the copper smelting mines of the Northern Province.',
      raw_source_text: 'Children as young as 11 are being forced to work in the lower tunnels. They are physically prevented from leaving the site.',
      risk_assessment: 'Critical - Immediate danger to minors.',
      original_language: 'English'
    }
  },
  {
    alias: 'delta-gate-01',
    category: 'Crime',
    priority: 'Low',
    content: {
      summary: 'Small-scale smuggling of protected timber across the river border.',
      raw_source_text: 'Every Tuesday night, two boats carry illegal mahogany across the crossing. Local police are turning a blind eye for small bribes.',
      risk_assessment: 'Low - Localized petty corruption.',
      original_language: 'English'
    }
  }
];

async function seed() {
  console.log('--- INTELDROP: DEMO ENVIRONMENT SEEDING ---');
  
  // 1. Optional: Clear existing data (Toggle off if you want to keep data)
  const { error: clearError } = await supabase.from('tips').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (clearError) console.warn('Warning: Failed to clear existing tips table.');

  // 2. Insert Demo Data
  for (const tip of DEMO_TIPS) {
    console.log(`Seeding case: ${tip.alias}...`);
    
    // 1. Create Alias Mapping (Required for Reply/Revocation testing)
    const { error: aliasError } = await supabase.from('alias_map').insert({
      alias: tip.alias,
      encrypted_telegram_id: encryptData('DUMMY_TELEGRAM_ID_FOR_QA_TESTING'),
      hmac_id: `QA_HASH_${tip.alias}`,
      last_contact_at: new Date().toISOString()
    });

    if (aliasError && !aliasError.message.includes('already exists')) {
      console.warn(`[Warning] Alias mapping for ${tip.alias} failed:`, aliasError.message);
    }

    const encrypted = encryptData(JSON.stringify(tip.content));

    const { error } = await supabase.from('tips').insert({
      alias: tip.alias,
      category: tip.category,
      priority: tip.priority,
      encrypted_content: encrypted,
      status: 'New',
      created_at: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()
    });

    if (error) {
      console.error(`Failed to seed ${tip.alias}:`, error.message);
    }
  }

  console.log('✅ DEMO SEEDING COMPLETE. Your IntelDrop Dashboard is now fully populated.');
}

seed();
