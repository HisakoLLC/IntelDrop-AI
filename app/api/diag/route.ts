 
// Triggering fresh deployment for IntelDrop AI verification.

export async function GET() {
  const diag = {
    AES_ENCRYPTION_KEY: {
      isSet: !!process.env.AES_ENCRYPTION_KEY,
      length: process.env.AES_ENCRYPTION_KEY?.length || 0,
    },
    TELEGRAM_BOT_TOKEN: {
      isSet: !!process.env.TELEGRAM_BOT_TOKEN,
      length: process.env.TELEGRAM_BOT_TOKEN?.length || 0,
      preview: process.env.TELEGRAM_BOT_TOKEN ? `${process.env.TELEGRAM_BOT_TOKEN.slice(0, 10)}...` : 'N/A',
    },
    SUPABASE_URL: {
      isSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      isSet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    NODE_VERSION: process.version,
    PLATFORM: process.platform,
    ARCH: process.arch,
  };

  return NextResponse.json(diag);
}
