/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { decryptData } from '@/lib/encryption';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Explicit session lock
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized Access Trapped' }, { status: 401 });
    }
    
    const body = await req.json();
    const { alias, message } = body;
    
    if (!alias || !message) {
      return NextResponse.json({ error: 'Missing specific node parameters payload.' }, { status: 400 });
    }
    
    // 1. Fetch the encrypted_telegram_id and existing session messages
    const { data: routeData, error: mapError } = await supabaseAdmin
      .from('alias_map')
      .select('encrypted_telegram_id')
      .eq('alias', alias)
      .single();
      
    if (mapError || !routeData) {
      console.error('Failed locating deterministic map:', mapError);
      return NextResponse.json({ error: 'Unknown Alias Target' }, { status: 404 });
    }

    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('alias', alias)
      .eq('status', 'active')
      .single();
    
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!telegramToken) {
      return NextResponse.json({ error: 'Missing System Hooks' }, { status: 500 });
    }
    
    // 2. Decrypt target chatId
    let chatId: string | null = null;
    try {
      chatId = decryptData(routeData.encrypted_telegram_id);
    } catch (decErr) {
      console.error('Failed decryption execution logic parameters.', decErr);
      return NextResponse.json({ error: 'Failed Target Decryption' }, { status: 500 });
    }
    
    const transmitMsg = `[INTELDROP SECURE OPERATOR]:\n\n${message}`;
    
    // 3. Send the message to the chat_id via Telegram Bot API
    const telRes = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: transmitMsg })
    });
    
    // 4. CRITICAL: Immediate memory destructure (exists <100ms)
    chatId = null; 
    
    const telData = await telRes.json();
    if (!telData.ok) {
       console.error('Telegram Transmission Blockage:', telData);
       return NextResponse.json({ error: 'Upstream Message Delivery Blocked' }, { status: 502 });
    }

    const newMessageId = telData.result.message_id;

    // 5. TRACK THE OPERATOR MESSAGE ID FOR WIPING
    if (newMessageId) {
      // Re-fetch session to ensure we have the absolute latest state
      const { data: latestSession } = await supabaseAdmin
        .from('sessions')
        .select('id, messages')
        .eq('alias', alias)
        .eq('status', 'active')
        .single();

      if (latestSession) {
        const messages: any[] = (latestSession.messages as any) || [];
        messages.push({ role: 'assistant', content: 'OPERATOR_REPLY', message_id: newMessageId });
        await supabaseAdmin.from('sessions').update({ messages: messages }).eq('id', latestSession.id);
      } else {
        // AUTO-ANCHOR: Create a session just to track this message if none exists
        await supabaseAdmin.from('sessions').insert({
          alias: alias,
          messages: [{ role: 'assistant', content: 'OPERATOR_REPLY', message_id: newMessageId }],
          pending_messages: [],
          status: 'active',
          last_message_at: new Date().toISOString()
        });
      }
      console.log(`[Dashboard] Locked Operator Reply ID: ${newMessageId} for alias: ${alias}`);
    }
    
    return NextResponse.json({ status: 'sent', message: 'Payload Dispatched SECURELY' }, { status: 200 });
    
  } catch (err) {
    console.error('Reply Route General Execution Disruption:', err);
    return NextResponse.json({ error: 'General Dispatch Failure' }, { status: 500 });
  }
}
