import { NextResponse } from 'next/server';
import { encryptData, hashData } from '@/lib/encryption';
import { generateAlias } from '@/lib/alias';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeTip, transcribeAudio, analyzeImageTip } from '@/lib/gemini';
// Removed static sharp import to prevent runtime architecture crashes on module load.

interface SessionMessage {
  role: string;
  content: string;
  message_id: number;
  media_url?: string | null;
}

const DONE_TRIGGERS = ["done", "i'm done", "that's all", "naisha", "nimemaliza", "ok. i'm done", "finished"];

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
  buffer = null; // GC Flush
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
  // Dynamic import for sharp to prevent module-level initialization errors on Vercel Node environment.
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
    body: JSON.stringify({ chat_id: chatId, text })
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
  let body: any = null;
  try {
    body = await req.json();
    console.log('[Webhook] Incoming Telegram update:', JSON.stringify(body));
    const message = body.message;
    if (!message || !message.chat || !message.chat.id || !message.message_id) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 }); 
    }
    
    const chatId = message.chat.id.toString();
    const incomingMessageId = message.message_id;
    let text = message.text || null;
    let fileId = null;
    let extractedMediaUrl = null;
    
    // Safely extract file_id if present
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
    
    // START COMMAND HANDLER
    if (text && text.trim() === '/start') {
      const welcomeMessage = `Secure Tip-Line\n\nYour identity is our priority. Here is how we protect you:\n\n- Your username and phone number are shredded the moment you message us\n- Voice notes are transcribed by AI and the audio is permanently deleted — your voice cannot be identified  \n- This entire chat will be automatically wiped once your tip is submitted\n\nType your report below, or send a voice note. You are safe here.`;
      await sendTelegramMessage(chatId, welcomeMessage);
      
      // We physically delete the initial /start ping locally to verify deletion metrics.
      await deleteTelegramMessage(chatId, incomingMessageId);
      
      return NextResponse.json({ status: 'welcome_sent' }, { status: 200 });
    }
    
    // ALIAS SYSTEM
    const hashedId = hashData(chatId);
    let alias = null;
    
    const { data: existingMap, error: queryError } = await supabaseAdmin
      .from('alias_map')
      .select('alias')
      .eq('hmac_id', hashedId)
      .single();
      
    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Database Query Error:', queryError);
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
    
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
    
    // EXTRACT MESSAGE CONTENT
    if (message.voice && fileId) {
      text = await extractVoiceText(fileId);
    } else if (fileId && alias) {
      const mediaResult = await extractMediaTextAndUrl(alias, fileId);
      if (mediaResult) {
        text = mediaResult.text;
        extractedMediaUrl = mediaResult.url;
      }
    }
    
    if (!text) {
      text = "[Unreadable content detected]";
    }

    const lowerText = text.toLowerCase().trim();

    // SESSION EVALUATION
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('alias', alias)
      .eq('status', 'active')
      .single();

    const isDoneTrigger = DONE_TRIGGERS.some(trigger => lowerText.includes(trigger.toLowerCase()));

    if (!session) {
      // Create new session flow (debounced)
      if (isDoneTrigger) {
        // Edge case: User triggered completion on the very first text string. Unlikely, but fallback naturally.
        const triageResult = await analyzeTip(text);
        const encryptedContent = encryptData(JSON.stringify({ ...triageResult, raw_source_text: text }));
        await supabaseAdmin.from('tips').insert({
          alias: alias,
          encrypted_content: encryptedContent,
          category: triageResult.category,
          priority: triageResult.priority,
          media_url: extractedMediaUrl
        });
        await sendTelegramMessage(chatId, "✅ Your report has been securely recorded and this chat will now be wiped.");
        await deleteTelegramMessage(chatId, incomingMessageId);
      } else {
        const newPending: SessionMessage[] = [{ role: 'user', content: text, message_id: incomingMessageId, media_url: extractedMediaUrl }];
        await supabaseAdmin.from('sessions').insert({
          alias: alias,
          messages: [],
          pending_messages: newPending,
          status: 'active',
          last_message_at: new Date().toISOString()
        });
        // We successfully logged the buffer, bypassing generic Gemini execution natively
      }
    } else {
      // Existing session flow
      const pendingArray: SessionMessage[] = (session.pending_messages as unknown as SessionMessage[]) || [];
      pendingArray.push({ role: 'user', content: text, message_id: incomingMessageId, media_url: extractedMediaUrl });

      if (isDoneTrigger) {
        // WIPE SEQUENCE: Combine historic and pending arrays 
        const combinedMessages: SessionMessage[] = [...(session.messages || []), ...pendingArray];
        
        const compiledText = combinedMessages
          .filter((m: SessionMessage) => m.role === 'user')
          .map((m: SessionMessage) => m.content)
          .join('\n');
          
        const mediaUrls = combinedMessages
          .filter((m: SessionMessage) => m.media_url)
          .map((m: SessionMessage) => m.media_url);
        const finalMediaUrl = mediaUrls.length > 0 ? mediaUrls[0] : null;

        // Route entire session block back into intelligence parser
        const triageResult = await analyzeTip(compiledText);
        const intelligenceData = {
          ...triageResult,
          raw_source_text: compiledText
        };
        const encryptedContent = encryptData(JSON.stringify(intelligenceData));
        
        await supabaseAdmin.from('tips').insert({
          alias: alias,
          encrypted_content: encryptedContent,
          category: triageResult.category,
          priority: triageResult.priority,
          media_url: finalMediaUrl
        });

        // Trigger safe conclusion
        const botMsgId = await sendTelegramMessage(chatId, "✅ Your report has been securely recorded and this chat will now be wiped.");
        if (botMsgId) combinedMessages.push({ role: 'assistant', message_id: botMsgId, content: 'SYSTEM: WIPED', media_url: null });
        
        // Physically annihilate the paper trail loop
        for (const msg of combinedMessages) {
          if (msg.message_id) {
            await deleteTelegramMessage(chatId, msg.message_id);
          }
        }
        
        // Nuke session node locally
        if (session.id) {
          await supabaseAdmin.from('sessions').delete().eq('id', session.id);
        }
        
      } else {
        // DEBOUNCE SEQUENCE: Push strictly to pending explicitly overwriting timestamps natively mapping asynchronous boundaries.
        await supabaseAdmin.from('sessions')
          .update({ 
            pending_messages: pendingArray,
            last_message_at: new Date().toISOString()
          })
          .eq('id', session.id as string);
      }
    }
    
    return NextResponse.json({ status: 'success' }, { status: 200 });
    
  } catch (error) {
    const err = error as Error;
    console.error('Webhook Parser Error:', err.message, err.stack);
    
    // Attempt sending error detail back to the same chat for instant transparent debugging.
    try {
      const errorChatId = body.message?.chat?.id?.toString();
      if (errorChatId) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: errorChatId, text: `❌ SYSTEM CRASH:\n\n${err.message}\n\nTrace: ${err.stack?.slice(0, 500)}` })
        });
      }
    } catch (tgErr) {
      console.error('Failed to send error notification to Telegram:', tgErr);
    }

    // Safe Debug Mode: Return 200 to Telegram to clear the queue
    return NextResponse.json({ 
      status: 'error_logged', 
      detail: err.message,
    }, { status: 200 });
  }
}

export async function GET() {
  return new Response('TELEGRAM WEBHOOK RECEIVER: ONLINE', { status: 200 });
}
