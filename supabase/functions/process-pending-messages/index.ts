import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Receiver } from "npm:@upstash/qstash@2.5.0";
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

const CONVERSATION_PROMPT = `You are a calm, professional intake officer for a secure whistleblowing 
tip-line in Kenya operated by an investigative media organization. 
Your job is to gather clear, factual details from a citizen reporting 
corruption or misconduct.

STRICT RULES — never break these:

SCOPE: Only engage with reports related to: corruption, bribery, police 
misconduct, misuse of public funds, electoral fraud, or corporate fraud. 
If the report is about a personal dispute, family matter, or anything 
outside this scope, respond: "This tip-line handles reports of corruption 
and governance failures only. We're unable to assist with this matter."

LANGUAGE: Detect the language the user is writing in (English, Kiswahili, 
or Sheng). Always respond in the same language. Never switch languages 
unless the user does first.

QUESTIONING STYLE: Ask only ONE question per response. Never ask two 
questions in one message. Never suggest possible answers in your question 
— ask open questions only (what, where, when, who, how much). Never ask 
"did he..." or "was it..." as these are leading questions.

QUESTION LIMIT: You may ask a maximum of 4 follow-up questions. After 
the 4th question, say: "Thank you, I have enough detail. Type 'done' when 
you're ready to submit your report securely."

PRIORITY QUESTIONS — ask in this order based on what's missing:
1. Location (where exactly did this happen?)
2. Time (when did this happen — date and approximate time?)
3. Identity (can you describe the person involved — name, uniform, 
   vehicle plate, badge number?)
4. Evidence (do you have any photos, videos, or documents?)

NO PROMISES: Never say "we will investigate", "action will be taken", 
"you will be contacted", or anything implying a guaranteed outcome. 
Only say "your report will be securely reviewed by our team."

SAFETY: If the user says anything suggesting they are in immediate 
physical danger, immediately stop tip collection and respond: 
"Your safety comes first. Please call 999 or go to the nearest 
safe location. You can submit your report later when you are safe."

TONE: Calm, professional, and brief. Maximum 2 sentences per response. 
Never use exclamation marks. Never use emojis. Never say "Great!" or 
"Thank you so much!" — keep it neutral and clinical.`;

// AES Decryption matches Next.js / Node.js
function decryptData(encryptedPackage: string): string {
  if (!encryptedPackage) return '';
  const AES_KEY = Deno.env.get('AES_ENCRYPTION_KEY');
  if (!AES_KEY || AES_KEY.length !== 32) {
    throw new Error('CRITICAL: Missing or invalid AES_ENCRYPTION_KEY in Edge Function.');
  }

  const parts = encryptedPackage.split(':');
  if (parts.length !== 3) throw new Error('Corrupted encrypted package.');

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encryptedText = Buffer.from(parts[2], 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(AES_KEY, 'utf8'), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

serve(async (req) => {
  // 1. QStash Validation (Granular Debug)
  const qstashToken = Deno.env.get("QSTASH_CURRENT_SIGNING_KEY")?.trim();
  const nextToken = Deno.env.get("QSTASH_NEXT_SIGNING_KEY")?.trim();
  const AES_KEY = Deno.env.get('AES_ENCRYPTION_KEY');

  // TEMPORARY DEBUG BYPASS & INTERNAL SECURE PULSE
  const debugBypass = req.headers.get("x-debug-bypass");
  const internalPulse = req.headers.get("x-internal-pulse");
  const INTERNAL_SECRET = AES_KEY ? AES_KEY.slice(0, 16) : "backup-secret-123";

  const isBypassed = 
    (debugBypass && AES_KEY && debugBypass === AES_KEY.slice(0, 8)) ||
    (internalPulse === INTERNAL_SECRET);

  if (!isBypassed && qstashToken && nextToken) {
    const receiver = new Receiver({
      currentSigningKey: qstashToken,
      nextSigningKey: nextToken,
    });
    const body = await req.text();
    const signature = req.headers.get("upstash-signature");
    
    if (!signature) {
      console.warn(`[SECURITY] 401: Missing Upstash Signature. Request from: ${req.headers.get('user-agent')}`);
      return new Response("Missing Upstash Signature", { status: 401 });
    }

    const isValid = await receiver.verify({ signature, body });
    if (!isValid) {
      console.error(`[SECURITY] 401: Invalid Signature. Keys starting with ${qstashToken.slice(0, 5)}...`);
      return new Response("Invalid Upstash Signature: Security Mismatch", { status: 401 });
    }
  } else if (isBypassed) {
    console.log("[SECURITY] Debug Bypass active. Skipping QStash signature check.");
  } else if (!isBypassed && (!qstashToken || !nextToken)) {
    console.warn("[SECURITY] Warning: QStash keys missing in Supabase! Function is unsecured.");
  }

  // 2. Init Supabase (Using built-in system variables)
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 3. Poll pending queues
  // Get timestamps older than 4 seconds
  const cutoffTime = new Date(Date.now() - 4000).toISOString();

  const { data: activeSessions, error } = await supabase
    .from('sessions')
    .select('id, alias, messages, pending_messages')
    .eq('status', 'active')
    .lte('last_message_at', cutoffTime);

  if (error) {
    console.error("Database Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Filter for those with populated pending arrays natively
  const sessionsToProcess = activeSessions?.filter(s => Array.isArray(s.pending_messages) && s.pending_messages.length > 0) || [];

  if (sessionsToProcess.length > 0) {
    console.log(`[DEBOUNCE WORKER] Executing batch processing. Found ${sessionsToProcess.length} pending queues.`);
  }

  // 4. Batch Processing Loop
  for (const session of sessionsToProcess) {
    // A. Resolve encryption map retrieving structural Chat ID
    const { data: aliasMap } = await supabase
      .from('alias_map')
      .select('encrypted_telegram_id')
      .eq('alias', session.alias)
      .single();

    if (!aliasMap) {
      console.warn(`[BATCH] Alias map missing for session ${session.alias}. Skipping.`);
      continue;
    }
    const chatId = decryptData(aliasMap.encrypted_telegram_id);
    console.log(`[BATCH] Processing turn for alias: ${session.alias} -> Chat ID decrypted.`);
    const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

    // B. Send Typing Action
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' })
    });

    // C. Reconstruct full sequence 
    const historicalMessages = Array.isArray(session.messages) ? session.messages : [];
    const pendingMessages = Array.isArray(session.pending_messages) ? session.pending_messages : [];
    const combinedCurrentState = [...historicalMessages, ...pendingMessages];

    // D. Extract Gemini Content (with strict alternation)
    const initialHistory = combinedCurrentState.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      text: msg.content
    }));

    // Group adjacent identical roles together to prevent Google's 400 Bad Request
    const consolidatedHistory = initialHistory.reduce((acc: any[], curr: any) => {
      if (acc.length > 0 && acc[acc.length - 1].role === curr.role) {
        acc[acc.length - 1].text += `\n[Follow Up]: ${curr.text}`;
      } else {
        acc.push({ role: curr.role, text: curr.text });
      }
      return acc;
    }, []);

    // GEMINI FIX: The very first message MUST be from the user. 
    // If the history starts with our model's welcome message, remove it.
    if (consolidatedHistory.length > 0 && consolidatedHistory[0].role === 'model') {
      consolidatedHistory.shift();
    }

    const formattedHistory = consolidatedHistory.map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const geminiPayload = {
      contents: formattedHistory,
      systemInstruction: { parts: [{ text: CONVERSATION_PROMPT }] },
      generationConfig: {
        temperature: 0.1
      }
    };

    console.log(`[AI] Calling Gemini with history of ${formattedHistory.length} turns.`);
    const genAiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });
    
    const genAiData = await genAiRes.json();
    
    if (!genAiRes.ok) {
      console.error(`[AI ERROR] Google API failed with status ${genAiRes.status}:`, JSON.stringify(genAiData));
    }

    const followUpResponse = genAiData?.candidates?.[0]?.content?.parts?.[0]?.text || "Thank you. Is there anything else you wish to add to your report?";

    // E. Send Follow-Up
    const sendRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: followUpResponse })
    });
    const sendData = await sendRes.json();
    let botMessageId = null;
    if (sendData.ok) botMessageId = sendData.result.message_id;

    // F. Finalize Database State Structure
    if (botMessageId) {
      combinedCurrentState.push({
        role: 'assistant',
        content: followUpResponse,
        message_id: botMessageId,
        media_url: null
      });
    }

    await supabase.from('sessions')
      .update({
        messages: combinedCurrentState,
        pending_messages: []
      })
      .eq('id', session.id);
  }

  // 5. RECURSIVE HEARTBEAT (The 5-Second Loop)
  // This sends a message back to itself via QStash with a 5s delay.
  const QSTASH_TOKEN = Deno.env.get("QSTASH_TOKEN");
  const FUNCTION_URL = `https://${Deno.env.get("SUPABASE_URL")?.split('//')[1]}/functions/v1/process-pending-messages`;

  if (QSTASH_TOKEN) {
    try {
      await fetch(`https://qstash.upstash.io/v2/publish/${FUNCTION_URL}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${QSTASH_TOKEN}`,
          "Upstash-Delay": "5s",
          "Content-Type": "application/json",
          "x-internal-pulse": Deno.env.get('AES_ENCRYPTION_KEY')?.slice(0, 16) || "backup-secret-123"
        },
        body: JSON.stringify({ pulse: Date.now() })
      });
      console.log(`[HEARTBEAT] Scheduled next 5s pulse via QStash.`);
    } catch (err) {
      console.error("[HEARTBEAT] Failed to schedule next pulse:", err);
    }
  }

  return new Response(JSON.stringify({ status: "processed", processedCount: sessionsToProcess.length }), { headers: { "Content-Type": "application/json" } });
});
