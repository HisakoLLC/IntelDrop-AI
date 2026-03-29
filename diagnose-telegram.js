const token = '8737229258:AAHzKFPCHMcShgdHHCaTn20Pzof3JIG-lns';

async function check() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();
    console.log('--- TELEGRAM WEBHOOK INFO ---');
    console.log(JSON.stringify(data, null, 2));
    
    if (!data.result.url) {
      console.log('\n[!] WARNING: No webhook URL is set! The bot will not receive messages.');
    } else {
      console.log(`\n[+] Webhook is pointing to: ${data.result.url}`);
    }
    
    if (data.result.pending_update_count > 0) {
      console.log(`[!] ALERT: There are ${data.result.pending_update_count} pending messages. This means your server is not responding to Telegram successfully.`);
    }
  } catch (err) {
    console.error('Error fetching webhook info:', err);
  }
}

check();
