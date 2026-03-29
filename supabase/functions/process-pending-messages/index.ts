import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Receiver } from "npm:@upstash/qstash@2.5.0";
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

const FOLLOW_UP_PROMPT = `You are a calm, professional intake officer for a secure investigative tip-line.
Read the conversation history carefully. Identify the MOST critical missing piece of evidence (e.g., specific location, time, names, transaction amounts, badge numbers, or organizations). 
Ask EXACTLY ONE specific, non-leading question to gather this missing detail. 
Stay completely objective. 
Keep your response strictly under 2 sentences. 
Respond in the SAME language the user is predominantly using (English, Swahili, or Sheng).`;

// AES Decryption matches Next.js / Node.js
function decryptData(hash: string): string {
  if (!hash) return '';
  const AES_KEY = Deno.env.get('AES_ENCRYPTION_KEY');
  if (!AES_KEY) throw new Error('Missing AES key');
  const secretKey = Buffer.from(AES_KEY, 'base64');
  
  const textParts = hash.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.shift()!, 'hex');
  const authTag = Buffer.from(textParts.shift()!, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString();
}

serve(async (req) => {
  // 1. QStash Validation
  const qstashToken = Deno.env.get("QSTASH_CURRENT_SIGNING_KEY");
  const nextToken = Deno.env.get("QSTASH_NEXT_SIGNING_KEY");
  
  if (qstashToken && nextToken) {
    const receiver = new Receiver({
      currentSigningKey: qstashToken,
      nextSigningKey: nextToken,
    });
    const body = await req.text();
    const signature = req.headers.get("upstash-signature");
    if (!signature) {
      return new Response("Missing Upstash Signature", { status: 401 });
    }
    const isValid = await receiver.verify({ signature, body });
    if (!isValid) return new Response("Invalid Signature", { status: 401 });
  }

  // 2. Init Supabase
  const SUPABASE_URL = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")!;
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

  console.log(`[DEBOUNCE WORKER] Executing batch processing. Found ${sessionsToProcess.length} pending queues.`);

  // 4. Batch Processing Loop
  for (const session of sessionsToProcess) {
    // A. Resolve encryption map retrieving structural Chat ID
    const { data: aliasMap } = await supabase
      .from('alias_map')
      .select('encrypted_telegram_id')
      .eq('alias', session.alias)
      .single();

    if (!aliasMap) continue;
    const chatId = decryptData(aliasMap.encrypted_telegram_id);
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

    // D. Extract Gemini Content
    const formattedHistory = combinedCurrentState.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const geminiPayload = {
      contents: formattedHistory,
      systemInstruction: { parts: [{ text: FOLLOW_UP_PROMPT }] },
      generationConfig: {
        temperature: 0.2
      }
    };

    const genAiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });
    
    const genAiData = await genAiRes.json();
    const followUpResponse = genAiData?.candidates?.[0]?.content?.parts?.[0]?.text || "Please continue providing details.";

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
  const FUNCTION_URL = `https://${Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")?.split('//')[1]}/functions/v1/process-pending-messages`;

  if (QSTASH_TOKEN) {
    try {
      await fetch(`https://qstash.upstash.io/v2/publish/${FUNCTION_URL}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${QSTASH_TOKEN}`,
          "Upstash-Delay": "5s",
          "Content-Type": "application/json"
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
