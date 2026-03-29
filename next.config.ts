import type { NextConfig } from "next";

// ------------------------------------------------------------------------
// SECURE STARTUP VALIDATION 
// Forces Next.js/Vercel boundaries to throw hard stops if critical crypto
// or mapping hooks are missing from the build-time environment.
// ------------------------------------------------------------------------
const requiredEnvs = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'AES_ENCRYPTION_KEY',
  'GEMINI_API_KEY',
  'TELEGRAM_BOT_TOKEN'
];

for (const envVar of requiredEnvs) {
  if (!process.env[envVar]) {
    throw new Error(`[INTELDROP SECURE STARTUP HALTED] Missing Critical Environment Variable: ${envVar}`);
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
