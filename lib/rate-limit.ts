import { supabaseAdmin } from './supabase';

/**
 * Checks if an alias has exceeded the rate limit (20 messages per hour).
 * @param alias The whistleblower alias to check.
 * @returns { isLimited: boolean, remaining?: number }
 */
export async function checkRateLimit(alias: string): Promise<{ isLimited: boolean }> {
  const HOUR_MS = 60 * 60 * 1000;
  const LIMIT = 20;
  const now = new Date();

  // 1. Fetch current rate limit status
  const { data, error } = await supabaseAdmin
    .from('rate_limits')
    .select('*')
    .eq('alias', alias)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Rate limit fetch error:', error);
    return { isLimited: false }; // Fail open to avoid blocking legitimate tips on DB error
  }

  if (!data) {
    // 2. First message in the window
    await supabaseAdmin.from('rate_limits').insert({
      alias,
      message_count: 1,
      window_start: now.toISOString(),
      updated_at: now.toISOString()
    });
    return { isLimited: false };
  }

  const windowStart = new Date(data.window_start);
  const timeElapsed = now.getTime() - windowStart.getTime();

  if (timeElapsed > HOUR_MS) {
    // 3. Window expired, reset
    await supabaseAdmin
      .from('rate_limits')
      .update({
        message_count: 1,
        window_start: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('alias', alias);
    return { isLimited: false };
  }

  if (data.message_count >= LIMIT) {
    // 4. Over limit
    return { isLimited: true };
  }

  // 5. Within window, increment count
  await supabaseAdmin
    .from('rate_limits')
    .update({
      message_count: data.message_count + 1,
      updated_at: now.toISOString()
    })
    .eq('alias', alias);

  return { isLimited: false };
}
