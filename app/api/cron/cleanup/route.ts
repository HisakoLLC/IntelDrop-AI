/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeTip } from '@/lib/gemini';
import { encryptData, decryptData } from '@/lib/encryption';

interface SessionMessage {
  role: string;
  content: string;
  message_id: number;
  media_url?: string | null;
}

// Reuse Telegram helpers
async function sendTelegramMessage(chatId: string, text: string): Promise<number | null> {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramToken) return null;
  const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
  const data = await res.json();
  return data.ok ? data.result.message_id : null;
}

async function deleteTelegramMessage(chatId: string, messageId: number) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramToken) return;
  await fetch(`https://api.telegram.org/bot${telegramToken}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId })
  });
}

export async function GET(req: Request) {
  // CRON_SECRET check
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch sessions older than 24h that are still active
    const { data: abandonedSessions, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('status', 'active')
      .lt('created_at', twentyFourHoursAgo);

    if (sessionError) throw sessionError;
    if (!abandonedSessions || abandonedSessions.length === 0) {
       return NextResponse.json({ processed: 0, status: 'no_sessions_found' });
    }

    const results = [];

    for (const session of abandonedSessions) {
      const alias = session.alias;
      
      // 2. Resolve Chat ID
      const { data: aliasData } = await supabaseAdmin
        .from('alias_map')
        .select('encrypted_telegram_id')
        .eq('alias', alias)
        .single();

      if (!aliasData) {
        console.error(`[Cleanup] No alias map found for ${alias}`);
        continue;
      }

      const chatId = decryptData(aliasData.encrypted_telegram_id);
      
      // 3. Compile Content
      const messages: SessionMessage[] = (session.messages as any) || [];
      const pending: SessionMessage[] = (session.pending_messages as any) || [];
      const combined = [...messages, ...pending];

      const compiledText = combined
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('\n');

      if (compiledText.trim().length > 0) {
        // 4. Triage (Gemini)
        const triage = await analyzeTip(compiledText);
        
        // Mark as incomplete
        triage.summary = `[INCOMPLETE SUBMISSION] ${triage.summary}`;

        if (triage.category !== "Spam / Unrelated") {
          const mediaUrls = combined.filter(m => m.media_url).map(m => m.media_url);
          
          await supabaseAdmin.from('tips').insert({
            alias: alias,
            encrypted_content: encryptData(JSON.stringify({ ...triage, raw_source_text: compiledText })),
            category: triage.category,
            priority: triage.priority,
            media_url: mediaUrls[0] || null,
            status: 'New'
          });
        }
      }

      // 5. WIPE Telegram
      const msgId = await sendTelegramMessage(chatId, "⚠️ This session has timed out (24h inactivity). The chat history is being securely wiped for your protection.");
      
      const allMessageIds = new Set<number>();
      combined.forEach(m => { if (m.message_id) allMessageIds.add(m.message_id); });
      if (msgId) allMessageIds.add(msgId);

      for (const mid of Array.from(allMessageIds)) {
        await deleteTelegramMessage(chatId, mid);
      }

      // 6. Delete Session
      await supabaseAdmin.from('sessions').delete().eq('id', session.id);
      results.push(alias);
    }

    // --- NEW: 30-DAY ALIAS PURGE ---
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      const { error: purgeErr } = await supabaseAdmin
        .from('alias_map')
        .delete()
        .lt('last_contact_at', thirtyDaysAgo);
      
      if (purgeErr) throw purgeErr;
      console.log(`[Cleanup] Purged expired alias mappings.`);
    } catch (purgeErr) {
       console.warn('[Cleanup] Alias purge skipped or failed (Column might be missing):', purgeErr);
    }

    return NextResponse.json({ 
      processed: results.length, 
      aliases: results,
      status: 'success' 
    });

  } catch (error: any) {
    console.error('[Cleanup Job Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
