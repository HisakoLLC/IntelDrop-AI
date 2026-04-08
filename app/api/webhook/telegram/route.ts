/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { encryptData, hashData } from '@/lib/encryption';
import { generateAlias } from '@/lib/alias';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeTip, transcribeAudio, analyzeImageTip } from '@/lib/gemini';

interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    username?: string;
    first_name?: string;
  };
  text?: string;
  photo?: Array<{ file_id: string }>;
  document?: { file_id: string };
  audio?: { file_id: string };
  voice?: { file_id: string };
  video?: { file_id: string };
  caption?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface SessionMessage {
  role: string;
  content: string;
  message_id: number;
  media_url?: string | null;
}

const DONE_TRIGGERS = ["done", "i'm done", "that's all", "finished", "summarize", "ok. i'm done", "nimemaliza"];
const FOLLOW_UP_PROMPT = "Thank you. Do you have more info or want to add something? If done, please reply **'done'** to securely submit and wipe this entire chat.";

// Helper: Extract text from Voice
async function extractVoiceText(fileId: string): Promise<string | null> {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramToken) return null;
  const configRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getFile?file_id=${fileId}`);
  const configData = await configRes.json();
  if (!configData.ok) return null;
  
  const filePath = configData.result?.file_path;
  if (!filePath) return null;
  const downloadRes = await fetch(`https://api.telegram.org/file/bot${telegramToken}/${filePath}`);
  const arrayBuffer = await downloadRes.arrayBuffer();
  
  let buffer: Buffer | null = Buffer.from(arrayBuffer);
  const base64Audio = buffer.toString('base64');
  const transcript = await transcribeAudio(base64Audio, 'audio/ogg');
  buffer = null; 
  return transcript || null;
}

// Helper: Extract text and URL from Images
async function extractMediaTextAndUrl(alias: string, fileId: string): Promise<{ text: string, url: string } | null> {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramToken) return null;
  const configRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getFile?file_id=${fileId}`);
  const configData = await configRes.json();
  if (!configData.ok) return null;
  
  const filePath = configData.result.file_path;
  const downloadRes = await fetch(`https://api.telegram.org/file/bot${telegramToken}/${filePath}`);
  const arrayBuffer = await downloadRes.arrayBuffer();
  
  let buffer: Buffer | null = Buffer.from(arrayBuffer);
  const { default: sharp } = await import('sharp');
  const cleanBuffer = await sharp(buffer).rotate().jpeg().toBuffer();
  buffer = null; 

  const fileName = `${alias}/${Date.now()}.jpg`;
  await supabaseAdmin.storage.from('evidence').upload(fileName, cleanBuffer, { contentType: 'image/jpeg' });
  const { data: publicUrlData } = supabaseAdmin.storage.from('evidence').getPublicUrl(fileName);
  
  const base64Image = cleanBuffer.toString('base64');
  const visualSummary = await analyzeImageTip(base64Image, 'image/jpeg');
  
  return { text: visualSummary || '[Visual Content]', url: publicUrlData.publicUrl };
}

// Helper: Send Msg
async function sendTelegramMessage(chatId: string, text: string): Promise<number | null> {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramToken) return null;
  const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
  const data = await res.json();
  if (data.ok) return data.result.message_id;
  return null;
}

// Helper: Delete Msg
async function deleteTelegramMessage(chatId: string, messageId: number) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramToken) return;
  await fetch(`https://api.telegram.org/bot${telegramToken}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId })
  });
}

export async function POST(req: Request) {
  let body: TelegramUpdate | null = null;
  try {
    body = await req.json();
    if (!body || !body.message) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 }); 
    }
    
    const message = body.message;
    if (!message.chat || !message.chat.id || !message.message_id) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 }); 
    }
    
    const chatId = message.chat.id.toString();
    const incomingMessageId = message.message_id;
    let text = message.text || null;
    let fileId = null;
    let extractedMediaUrl = null;
    
    // Media detection
    if (message.photo && message.photo.length > 0) {
      fileId = message.photo[message.photo.length - 1].file_id; 
    } else if (message.document) {
      fileId = message.document.file_id;
    } else if (message.audio) {
      fileId = message.audio.file_id;
    } else if (message.voice) {
      fileId = message.voice.file_id;
    } else if (message.video) {
      fileId = message.video.file_id;
    }
    
    // ALIAS & SESSION PREP
    const hashedId = hashData(chatId);
    let alias = null;
    
    const { data: existingMap } = await supabaseAdmin
      .from('alias_map')
      .select('alias')
      .eq('hmac_id', hashedId)
      .single();
      
    if (existingMap) {
      alias = existingMap.alias;
    } else {
      alias = generateAlias();
      await supabaseAdmin.from('alias_map').insert({
        alias: alias,
        encrypted_telegram_id: encryptData(chatId),
        hmac_id: hashedId
      });
    }

    // 1. HANDLE /START (Welcome + Track ID)
    if (text && text.trim() === '/start') {
      const welcome = `Secure Tip-Line\n\nYour identity is our priority. Here is how we protect you:\n\n- Your username and phone number are shredded the moment you message us\n- Voice notes are transcribed by AI and the audio is permanently deleted\n- This entire chat will be automatically wiped once your tip is submitted\n\nType your report below. You are safe here.`;
      const welcomeId = await sendTelegramMessage(chatId, welcome);
      
      // Physically remove the command text from user view
      await deleteTelegramMessage(chatId, incomingMessageId);
      
      // Initialize fresh session for this interaction (Clear slate protocol)
      const newMessages: SessionMessage[] = [];
      if (welcomeId) newMessages.push({ role: 'assistant', content: 'WELCOME', message_id: welcomeId });
      
      // Delete any pre-existing active sessions for this alias to ensure we start tracking from a clean state
      await supabaseAdmin.from('sessions').delete().eq('alias', alias);
      
      await supabaseAdmin.from('sessions').insert({
        alias: alias,
        messages: newMessages,
        pending_messages: [],
        status: 'active',
        last_message_at: new Date().toISOString()
      });
      
      return NextResponse.json({ status: 'welcome_sent' }, { status: 200 });
    }

    // 2. EXTRACT CONTENT (Media/Voice)
    if (message.voice && fileId) {
      text = await extractVoiceText(fileId);
    } else if (fileId && alias) {
      const mediaResult = await extractMediaTextAndUrl(alias, fileId);
      if (mediaResult) {
        text = mediaResult.text;
        extractedMediaUrl = mediaResult.url;
      }
    }
    
    if (!text) text = "[Unreadable content detected]";
    const lowerText = text.toLowerCase().trim();
    const isDoneTrigger = DONE_TRIGGERS.some(trigger => lowerText.includes(trigger.toLowerCase()));

    // 3. RETRIEVE SESSION
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('alias', alias)
      .eq('status', 'active')
      .single();

    // 4. PROCESS MESSAGE
    if (!session) {
      // Emergency session fallback if user didn't hit /start
      if (isDoneTrigger) {
        await sendTelegramMessage(chatId, "⚠️ No active report found to submit. Please use /start to begin.");
        await deleteTelegramMessage(chatId, incomingMessageId);
        return NextResponse.json({ status: 'no_session' }, { status: 200 });
      }
      
      // Create session on-the-fly
      const botMsgId = await sendTelegramMessage(chatId, FOLLOW_UP_PROMPT);
      const messages: SessionMessage[] = [];
      if (botMsgId) messages.push({ role: 'assistant', content: 'PROMPT', message_id: botMsgId });
      
      const pending: SessionMessage[] = [{ role: 'user', content: text, message_id: incomingMessageId, media_url: extractedMediaUrl }];
      
      await supabaseAdmin.from('sessions').insert({
        alias: alias,
        messages: messages,
        pending_messages: pending,
        status: 'active',
        last_message_at: new Date().toISOString()
      });
    } else {
      // Existing Session
      const messages: SessionMessage[] = (session.messages as any) || [];
      const pending: SessionMessage[] = (session.pending_messages as any) || [];
      
      if (isDoneTrigger) {
        // --- SUBMISSION & WIPE SEQUENCE ---
        
        // FRESH FETCH: Ensure we have any operator replies that arrived during this request
        const { data: latestSession } = await supabaseAdmin
          .from('sessions')
          .select('*')
          .eq('id', session.id)
          .single();
        
        const latestMessages: SessionMessage[] = (latestSession?.messages as any) || messages;
        const latestPending: SessionMessage[] = (latestSession?.pending_messages as any) || pending;

        const combined = [...latestMessages, ...latestPending, { role: 'user', content: text, message_id: incomingMessageId }];
        
        const compiledText = combined
          .filter(m => m.role === 'user')
          .map(m => m.content)
          .join('\n');
          
        const mediaUrls = combined.filter(m => m.media_url).map(m => m.media_url);
        
        // Triage (Gemini)
        const triage = await analyzeTip(compiledText);
        await supabaseAdmin.from('tips').insert({
          alias: alias,
          encrypted_content: encryptData(JSON.stringify({ ...triage, raw_source_text: compiledText })),
          category: triage.category,
          priority: triage.priority,
          media_url: mediaUrls[0] || null
        });

        // Final deletion loop
        const goodbyeId = await sendTelegramMessage(chatId, "✅ Your report has been securely recorded. This chat is now being wiped.");
        
        // Use a Set to ensure unique IDs and avoid redundant delete calls
        const allMessageIds = new Set<number>();
        combined.forEach(m => { if (m.message_id) allMessageIds.add(m.message_id); });
        if (goodbyeId) allMessageIds.add(goodbyeId);

        // Physical Annihilation (Serial to ensure completion)
        for (const mid of Array.from(allMessageIds)) {
          await deleteTelegramMessage(chatId, mid);
        }

        await supabaseAdmin.from('sessions').delete().eq('id', session.id);
      } else {
        // --- NORMAL INTAKE ---
        // 1. Send Instant Static Follow-up
        const botMsgId = await sendTelegramMessage(chatId, FOLLOW_UP_PROMPT);
        
        // 2. Track all IDs
        if (botMsgId) messages.push({ role: 'assistant', content: 'PROMPT', message_id: botMsgId });
        pending.push({ role: 'user', content: text, message_id: incomingMessageId, media_url: extractedMediaUrl });
        
        await supabaseAdmin.from('sessions')
          .update({ 
            messages: messages, 
            pending_messages: pending,
            last_message_at: new Date().toISOString()
          })
          .eq('id', session.id);
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
    
  } catch (error: any) {
    console.error('Webhook Error:', error.message);
    const chatId = body?.message?.chat?.id?.toString();
    if (chatId) {
      await sendTelegramMessage(chatId, `❌ SYSTEM ERROR: ${error.message}\n\nPlease try again later.`);
    }
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}

export async function GET() {
  return new Response('INTELDROP WEBHOOK: ONLINE', { status: 200 });
}
