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

async function auditTable(tableName) {
  console.log(`\n--- Auditing Table: ${tableName} ---`);
  const { data, error } = await supabase.from(tableName).select('*').limit(1);

  if (error) {
    console.error(`❌ Table ${tableName} Error:`, error.message);
  } else {
    console.log(`✅ Table ${tableName} is accessible.`);
    if (data.length > 0) {
      console.log(`Available Columns (from data sample):`, Object.keys(data[0]).join(', '));
    } else {
      console.log(`Table is empty. Cannot determine columns via sample.`);
      // Try to force an error to see column hints or just perform a broader probe
      const { error: probeError } = await supabase.from(tableName).select('non_existent_column_XYZ_probe');
      if (probeError && probeError.hint) {
        console.log(`Hint from error (may contain schema info):`, probeError.hint);
      }
    }
  }
}

async function startAudit() {
  console.log('--- INTELDROP MASTER SCHEMA AUDIT ---');
  await auditTable('tips');
  await auditTable('alias_map');
  await auditTable('sessions');
  await auditTable('client_settings');
  console.log('\nAudit Complete.');
}

startAudit();
