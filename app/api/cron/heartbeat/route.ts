import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateFollowUpQuestion } from '@/lib/gemini';

export async function GET() {
  // Simple auth check for cron if needed, though for now we just run it
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
      return NextResponse.json({ status: 'no_pending_sessions' });
    }

    const results = [];

    for (const session of sessions) {
      const pending = session.pending_messages || [];
      if (pending.length === 0) continue;

      // 1. Move pending to main messages
      const updatedMessages = [...(session.messages || []), ...pending];
      
      // 2. Clear pending locally
      await supabaseAdmin.from('sessions').update({
        messages: updatedMessages,
        pending_messages: []
      }).eq('id', session.id);

      // 3. Generate AI Follow-up
      const followUp = await generateFollowUpQuestion(updatedMessages);

      // 4. Send Telegram Reply
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
      if (telegramToken && session.alias) {
        // Find the Telegram ID from alias_map
        const { data: aliasMap } = await supabaseAdmin
          .from('alias_map')
          .select('encrypted_telegram_id')
          .eq('alias', session.alias)
          .single();

        if (aliasMap) {
          // Decrypt chatId
          const { decryptData } = await import('@/lib/encryption');
          const chatId = decryptData(aliasMap.encrypted_telegram_id);

          const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: followUp })
          });
          
          const tgData = await res.json();
          if (tgData.ok) {
            // Log the assistant message
            updatedMessages.push({
              role: 'assistant',
              content: followUp,
              message_id: tgData.result.message_id
            });
            
            await supabaseAdmin.from('sessions').update({
              messages: updatedMessages
            }).eq('id', session.id);
          }
        }
      }
      
      results.push({ alias: session.alias, success: true });
    }

    return NextResponse.json({ status: 'success', processed: results.length });
  } catch (error) {
    const err = error as Error;
    console.error('Heartbeat Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
