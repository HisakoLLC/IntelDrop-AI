import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://ivuysfkjumbqcreawmmc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dXlzZmtqdW1icWNyZWF3bW1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDcxODI2NSwiZXhwIjoyMDkwMjk0MjY1fQ.GcM2HV_ZVcOzOI2F0O5Buwvt8pqAiltuKMrfRplBRj0"
);

async function check() {
  console.log("Checking sessions table...");
  const { data, error } = await supabase.from('sessions').select('*').limit(3);
  if (error) {
    console.error("DB Error:", error);
  } else {
    console.log("Recent Sessions Sample:", JSON.stringify(data, null, 2));
  }
}

check();
