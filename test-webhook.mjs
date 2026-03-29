import { POST } from './app/api/webhook/telegram/route.ts';

// We must manually populate process.env from .env.local for tests because 
// direct script invocation doesn't load next's built-in env parser.
import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/"/g, '');
});

async function runMockWebhook() {
  // Mock Telegram Payload
  const rawPayload = {
    update_id: 12345678,
    message: {
      message_id: 45,
      from: {
        id: 987654321,
        is_bot: false,
        first_name: "John",
        last_name: "Doe",
        username: "jdoekiller",
        language_code: "en"
      },
      chat: {
        id: 987654321,
        first_name: "John",
        last_name: "Doe",
        username: "jdoekiller",
        type: "private"
      },
      date: 1695420000,
      text: "I witnessed massive fraud at the city council planning committee. File follows."
    }
  };

  try {
    // Generate a Request object wrapper to simulate Next.js incoming request
    const request = new Request('http://localhost:3000/api/webhook/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rawPayload)
    });

    console.log('Sending mocked webhook payload...');
    const response = await POST(request);
    const json = await response.json();
    
    console.log('--- RESPONSE ---');
    console.log(JSON.stringify(json, null, 2));
    
  } catch (err) {
    console.error('Test Execution Failed:', err);
  }
}

runMockWebhook();
