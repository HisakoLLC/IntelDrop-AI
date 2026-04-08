const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://ivuysfkjumbqcreawmmc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dXlzZmtqdW1icWNyZWF3bW1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDcxODI2NSwiZXhwIjoyMDkwMjk0MjY1fQ.GcM2HV_ZVcOzOI2F0O5Buwvt8pqAiltuKMrfRplBRj0"
);

async function check() {
  const { data, error } = await supabase.from('sessions').select('*').limit(1);
  console.log("Data sample:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}

check();
