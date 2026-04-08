import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateFollowUpQuestion } from '@/lib/gemini';
import { Receiver } from '@upstash/qstash';

export async function POST(req: Request) {
  // 1. QSTASH SIGNATURE VERIFICATION
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (currentSigningKey && nextSigningKey) {
    const receiver = new Receiver({
      currentSigningKey,
      nextSigningKey,
    });

    const signature = req.headers.get('upstash-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing QStash signature' }, { status: 401 });
    }

    const body = await req.text();
    const isValid = await receiver.verify({
      signature,
      body,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid QStash signature' }, { status: 401 });
    }

    // Re-parse body for logic below
    try {
      const parsedBody = JSON.parse(body);
      return await processHeartbeat(parsedBody.alias);
    } catch (e) {
      return NextResponse.json({ error: 'Body parsing failed' }, { status: 400 });
    }
  }

  // Fallback if keys aren't set yet (for local debugging)
  const body = await req.json().catch(() => ({}));
  return await processHeartbeat(body.alias);
}

// Support GET for manual testing/legacy cron
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const alias = searchParams.get('alias');
  return await processHeartbeat(alias || undefined);
}

async function processHeartbeat(targetAlias?: string) {
  try {
    const now = new Date();
    const threshold = new Date(now.getTime() - 5000); // 5 seconds ago

    let query = supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('status', 'active');

    if (targetAlias) {
      // Targeted mode: ignore threshold because QStash already handled the delay
      query = query.eq('alias', targetAlias);
    } else {
      // Global cron mode: check all sessions that have been silent for 5s
      query = query.lt('last_message_at', threshold.toISOString());
    }

    const { data: sessions, error } = await query;

    if (error) throw error;
    
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ 
        status: 'no_pending_sessions',
        target: targetAlias || 'global'
      });
    }

    const results = [];

    for (const session of sessions) {
      try {
        const pending = session.pending_messages || [];
        if (pending.length === 0) {
          // If no pending, stop the heartbeat from picking up this session
          await supabaseAdmin.from('sessions').update({
            last_message_at: null
          }).eq('id', session.id);
          continue;
        }

        const updatedHistory = [...(session.messages || []), ...pending];
        
        console.log(`[Heartbeat] Generating AI follow-up for alias: ${session.alias}`);
        const followUp = await generateFollowUpQuestion(updatedHistory);
        if (!followUp) throw new Error('AI generated an empty response');

        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!telegramToken) throw new Error('TELEGRAM_BOT_TOKEN missing');
        
        const { data: aliasMap, error: mapError } = await supabaseAdmin
          .from('alias_map')
          .select('encrypted_telegram_id')
          .eq('alias', session.alias)
          .single();

        if (mapError || !aliasMap) throw new Error(`Alias mapping failed for: ${session.alias}`);

        const { decryptData } = await import('@/lib/encryption');
        const chatId = decryptData(aliasMap.encrypted_telegram_id);
        if (chatId.includes('ERROR')) throw new Error('Chat ID decryption failed');

        const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: chatId, 
            text: followUp,
            parse_mode: 'Markdown'
          })
        });
        
        const tgData = await res.json();
        if (!tgData.ok) {
          throw new Error(`Telegram API Error: ${tgData.description || 'Unknown'}`);
        }

        const finalHistory = [
          ...updatedHistory,
          {
            role: 'assistant',
            content: followUp,
            message_id: tgData.result.message_id
          }
        ];

        await supabaseAdmin.from('sessions').update({
          messages: finalHistory,
          pending_messages: [],
          last_message_at: null 
        }).eq('id', session.id);

        results.push({ alias: session.alias, success: true });

      } catch (sessionErr) {
        const msg = sessionErr instanceof Error ? sessionErr.message : 'Unknown Session Error';
        console.error(`[Heartbeat] Error processing session ${session.alias}:`, msg);
        results.push({ alias: session.alias, success: false, error: msg });
      }
    }

    return NextResponse.json({ 
      status: 'success', 
      processed: results.filter(r => r.success).length,
      details: results 
    });

  } catch (globalErr) {
    const err = globalErr as Error;
    console.error('Critical Heartbeat failure:', err.message);
    return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
  }
}
