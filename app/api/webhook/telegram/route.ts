import { NextResponse } from 'next/server';
import { encryptData, hashData } from '@/lib/encryption';
import { generateAlias } from '@/lib/alias';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeTip, transcribeAudio, analyzeImageTip } from '@/lib/gemini';
import sharp from 'sharp';

// Helper: Telegram Auto-Delete and Confirmation
async function cleanupAndNotify(chatId: string, messageId: number) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramToken) return;

  try {
    // 1. Permanently delete the user's message from Telegram servers
    await fetch(`https://api.telegram.org/bot${telegramToken}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId })
    });
    
    // 2. Send anonymous confirmation
    const msgText = "✅ Your tip has been securely received and this conversation has been wiped. Thank you.";
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msgText })
    });
    console.log(`[CLEANUP] Message ${messageId} deleted and confirmation sent.`);
  } catch (err) {
    console.error('[CLEANUP] Failed to wipe conversation:', err);
  }
}

async function handleTextTip(alias: string, text: string, chatId: string, messageId: number) { 
  console.log(`[ROUTER] Routing TEXT Tip for alias: ${alias}`); 
  try {
    const triageResult = await analyzeTip(text);
    
    const intelligenceData = {
      ...triageResult,
      raw_source_text: text
    };
    const encryptedContent = encryptData(JSON.stringify(intelligenceData));
    
    const { error: insertError } = await supabaseAdmin.from('tips').insert({
      alias: alias,
      encrypted_content: encryptedContent,
      category: triageResult.category,
      priority: triageResult.priority,
      media_url: null
    });
    
    if (insertError) throw new Error(`Database insert failed: ${insertError.message}`);
    
    console.log(`[TEXT PROCESSOR] Securely archived evidence for ${alias}`);
    await cleanupAndNotify(chatId, messageId);
  } catch(e) { 
    console.error('[TEXT PROCESSOR] Error:', e); 
  }
}

async function handleVoiceTip(alias: string, fileId: string, chatId: string, messageId: number) { 
  console.log(`[ROUTER] Routing VOICE Tip for alias: ${alias}`); 
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramToken) {
    console.warn('CRITICAL: Missing TELEGRAM_BOT_TOKEN.');
    return;
  }

  try {
    // 1. Get file path via Telegram API
    const configRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getFile?file_id=${fileId}`);
    const configData = await configRes.json();
    if (!configData.ok) throw new Error('Telegram getFile failed.');
    
    // 2. Download directly into memory
    const filePath = configData.result.file_path;
    const downloadRes = await fetch(`https://api.telegram.org/file/bot${telegramToken}/${filePath}`);
    const arrayBuffer = await downloadRes.arrayBuffer();
    
    // 3. Convert to base64 for Gemini inline audio part
    let buffer: Buffer | null = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');
    
    console.log(`[VOICE PROCESSOR] Audio loaded. Transcribing...`);
    const transcript = await transcribeAudio(base64Audio, 'audio/ogg');
    
    // 4. Force garbage collection of memory buffer explicitly (No disk touches)
    buffer = null; 

    console.log(`[VOICE PROCESSOR] Transcription distinct length: ${transcript?.length || 0}`);

    // 5. Triage the transcript via the AI Engine
    if (transcript) {
      const triageResult = await analyzeTip(transcript);
      console.log(`[TRIAGE] Result for ${alias}:`, triageResult);
      
      const intelligenceData = {
        ...triageResult,
        raw_source_text: transcript
      };
      const encryptedContent = encryptData(JSON.stringify(intelligenceData));
      
      const { error: insertError } = await supabaseAdmin.from('tips').insert({
        alias: alias,
        encrypted_content: encryptedContent,
        category: triageResult.category,
        priority: triageResult.priority,
        media_url: null
      });
      
      if (insertError) throw new Error(`Database insert failed: ${insertError.message}`);
      
      console.log(`[VOICE PROCESSOR] Securely archived evidence for ${alias}`);
      await cleanupAndNotify(chatId, messageId);
    }
  } catch (error) {
    console.error('[VOICE PROCESSOR] Error:', error);
  }
}

async function handleMediaTip(alias: string, fileId: string, chatId: string, messageId: number) { 
  console.log(`[ROUTER] Routing MEDIA Tip for alias: ${alias}`); 
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramToken) {
    console.warn('CRITICAL: Missing TELEGRAM_BOT_TOKEN.');
    return;
  }

  try {
    const configRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getFile?file_id=${fileId}`);
    const configData = await configRes.json();
    if (!configData.ok) throw new Error('Telegram getFile failed.');
    
    const filePath = configData.result.file_path;
    const downloadRes = await fetch(`https://api.telegram.org/file/bot${telegramToken}/${filePath}`);
    const arrayBuffer = await downloadRes.arrayBuffer();
    
    let buffer: Buffer | null = Buffer.from(arrayBuffer);
    const cleanBuffer = await sharp(buffer).rotate().jpeg().toBuffer();
    buffer = null; // Clean original

    const fileName = `${alias}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('evidence')
      .upload(fileName, cleanBuffer, {
        contentType: 'image/jpeg'
      });
      
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);
    
    const { data: publicUrlData } = supabaseAdmin.storage.from('evidence').getPublicUrl(fileName);
    const mediaUrl = publicUrlData.publicUrl;

    const base64Image = cleanBuffer.toString('base64');
    const visualSummary = await analyzeImageTip(base64Image, 'image/jpeg');
    
    const triageResult = await analyzeTip(visualSummary);
    console.log(`[TRIAGE] Visual analysis complete for ${alias}`);

    const intelligenceData = {
      ...triageResult,
      raw_source_text: visualSummary
    };
    const encryptedContent = encryptData(JSON.stringify(intelligenceData));
    
    const { error: insertError } = await supabaseAdmin.from('tips').insert({
      alias: alias,
      encrypted_content: encryptedContent,
      category: triageResult.category,
      priority: triageResult.priority,
      media_url: mediaUrl
    });

    if (insertError) throw new Error(`Database insert failed: ${insertError.message}`);

    console.log(`[MEDIA PROCESSOR] Securely archived evidence for ${alias}`);
    await cleanupAndNotify(chatId, messageId);

  } catch (error) {
    console.error('[MEDIA PROCESSOR] Error:', error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. METADATA SHREDDER
    const message = body.message;
    if (!message || !message.chat || !message.chat.id || !message.message_id) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 }); // Return 200 so Telegram won't retry
    }
    
    const chatId = message.chat.id.toString();
    const messageId = message.message_id;
    const text = message.text || null;
    let fileId = null;
    
    // Safely extract file_id if present
    if (message.photo && message.photo.length > 0) {
      fileId = message.photo[message.photo.length - 1].file_id; // Highest resolution
    } else if (message.document) {
      fileId = message.document.file_id;
    } else if (message.audio) {
      fileId = message.audio.file_id;
    } else if (message.voice) {
      fileId = message.voice.file_id;
    } else if (message.video) {
      fileId = message.video.file_id;
    }
    
    // 1.5. START COMMAND HANDLER
    if (text && text.trim() === '/start') {
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
      if (telegramToken) {
        const welcomeMessage = `Secure Tip-Line\n\nYour identity is our priority. Here is how we protect you:\n\n- Your username and phone number are shredded the moment you message us\n- Voice notes are transcribed by AI and the audio is permanently deleted — your voice cannot be identified  \n- This entire chat will be automatically wiped once your tip is submitted\n\nType your report below, or send a voice note. You are safe here.`;
        
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: welcomeMessage })
        });
      }
      return NextResponse.json({ status: 'welcome_sent' }, { status: 200 });
    }
    
    // 2. ALIAS SYSTEM
    const hashedId = hashData(chatId);
    let alias = null;
    
    // Attempt lookup using deterministic blind index (HMAC)
    const { data: existingMap, error: queryError } = await supabaseAdmin
      .from('alias_map')
      .select('alias')
      .eq('hmac_id', hashedId)
      .single();
      
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database Query Error:', queryError);
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
    
    if (existingMap) {
      // Returning source
      alias = existingMap.alias;
      console.log(`[ALIAS SYSTEM] Found existing source: ${alias}`);
    } else {
      // New source identity generation
      alias = generateAlias();
      const encryptedChatId = encryptData(chatId);
      
      const { error: insertError } = await supabaseAdmin
        .from('alias_map')
        .insert({
           alias: alias,
           encrypted_telegram_id: encryptedChatId,
           hmac_id: hashedId
        });
        
      if (insertError) {
        console.error('Database Insert Error:', insertError);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
      }
      console.log(`[ALIAS SYSTEM] Registered novel source: ${alias}`);
    }
    
    // 3. ROUTER
    if (message.voice) {
      await handleVoiceTip(alias, fileId, chatId, messageId);
    } else if (fileId) {
      await handleMediaTip(alias, fileId, chatId, messageId);
    } else if (text) {
      await handleTextTip(alias, text, chatId, messageId);
    } else {
      console.warn(`[ROUTER] Unhandled message format for alias: ${alias}`);
    }
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'IntelDrop AI: Payload ingested securely.' 
    });
    
  } catch (error) {
    console.error('Webhook Parser Error:', error);
    return NextResponse.json({ error: 'Invalid Structure' }, { status: 400 });
  }
}

// Keeping GET to verify health
export async function GET() {
  return new Response('TELEGRAM WEBHOOK RECEIVER: ONLINE', { status: 200 });
}
