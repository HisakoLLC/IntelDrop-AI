require('dotenv').config({ path: '.env.local' });

async function pingHeartbeat() {
  const secret = process.env.AES_ENCRYPTION_KEY.substring(0, 16);
  console.log("Starting secure ping...");

  const res = await fetch('https://ivuysfkjumbqcreawmmc.supabase.co/functions/v1/process-pending-messages', {
    method: 'POST',
    headers: {
      'x-internal-pulse': secret
    }
  });

  const text = await res.text();
  console.log("Response:", res.status, text);
}

pingHeartbeat();
