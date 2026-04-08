import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateFollowUpQuestion } from '@/lib/gemini';

export async function GET() {
  try {
    const now = new Date();
    const threshold = new Date(now.getTime() - 5000); // 5 seconds ago

    const { data: sessions, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('status', 'active')
      .lt('last_message_at', threshold.toISOString());

    if (error) throw error;
    
    if (!sessions || sessions.length === 0) {
      const { count: totalActive } = await supabaseAdmin
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
        
      return NextResponse.json({ 
        status: 'no_pending_sessions', 
        active_sessions_in_db: totalActive || 0,
        threshold_used: threshold.toISOString()
      });
    }

    const results = [];

    for (const session of sessions) {
      try {
        const pending = session.pending_messages || [];
        if (pending.length === 0) {
          // If no pending, update last_message_at to prevent re-scanning empty sessions
          await supabaseAdmin.from('sessions').update({
            last_message_at: null // Set to null effectively removes it from the .lt() filter
          }).eq('id', session.id);
          continue;
        }

        // 1. Prepare combined history
        const updatedHistory = [...(session.messages || []), ...pending];
        
        // 2. Generate AI Follow-up
        console.log(`[Heartbeat] Generating AI follow-up for alias: ${session.alias}`);
        const followUp = await generateFollowUpQuestion(updatedHistory);
        if (!followUp) throw new Error('AI generated an empty response');

        // 3. Send Telegram Reply
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!telegramToken) throw new Error('TELEGRAM_BOT_TOKEN missing');
        
        // Find the Telegram ID from alias_map
        const { data: aliasMap, error: mapError } = await supabaseAdmin
          .from('alias_map')
          .select('encrypted_telegram_id')
          .eq('alias', session.alias)
          .single();

        if (mapError || !aliasMap) throw new Error(`Alias mapping failed for: ${session.alias}`);

        const { decryptData } = await import('@/lib/encryption');
        const chatId = decryptData(aliasMap.encrypted_telegram_id);
        if (chatId.includes('ERROR')) throw new Error('Chat ID decryption failed');

        console.log(`[Heartbeat] Sending reply to chatId: ${chatId.slice(0, 5)}...`);
        const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: chatId, 
            text: followUp,
            parse_mode: 'Markdown' // Added for better formatting
          })
        });
        
        const tgData = await res.json();
        if (!tgData.ok) {
          throw new Error(`Telegram API Error: ${tgData.description || 'Unknown'}`);
        }

        // 4. ATOMIC COMMIT: Only if everything above succeeded, we clear pending
        const finalHistory = [
          ...updatedHistory,
          {
            role: 'assistant',
            content: followUp,
            message_id: tgData.result.message_id
          }
        ];

        const { error: updateError } = await supabaseAdmin.from('sessions').update({
          messages: finalHistory,
          pending_messages: [], // Clear the queue
          last_message_at: null  // Stop the heartbeat from picking up this session until new user message
        }).eq('id', session.id);

        if (updateError) throw updateError;

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
