# IntelDrop Client Onboarding Checklist

Follow this step-by-step guide to deploy a fresh, secure instance of IntelDrop for a new client.

## 🗄️ 1. Database Setup (Supabase)
- [ ] Create a new Supabase project. **Naming convention**: `client-[clientname]`
- [ ] Run the SQL migration file to initialize all tables, RLS policies, and indexes.
- [ ] Enable the `pgcrypto` extension if not already active.

## 🤖 2. Ingest Configuration (Telegram)
- [ ] Register a new Telegram bot via [@BotFather](https://t.me/botfather).
- [ ] Save the **Telegram Bot Token**.
- [ ] Set the bot's description and profile picture to match the client's branding.

## 🔐 3. Security Primitives
- [ ] Generate a fresh `AES_ENCRYPTION_KEY` (32 characters).
- [ ] Generate a random `TELEGRAM_WEBHOOK_SECRET`.
- [ ] Generate a random `CRON_SECRET` for the Scavenger job.

## 🚀 4. Deployment (Vercel)
- [ ] Create a new Vercel project by importing the master IntelDrop GitHub repository.
- [ ] **Environment Variables**: Add all mandatory keys (see `.env.example`).
- [ ] Deploy the project and note the final **Deployment URL**.
- [ ] Configure a custom subdomain (e.g., `client.inteldrop.ai`).

## 🔗 5. Webhook Activation
- [ ] Pair the Telegram bot with the deployment by calling the `setWebhook` API:
  `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<vercel-url>/api/webhook/telegram&secret_token=<secret>`

## 🎨 6. Finalization & Handover
- [ ] Update the `client_settings` table in Supabase with the client's name and logo URL.
- [ ] Send a test message to the bot and verify the report appears in the Analyst Dashboard.
- [ ] Hand over the **Dashboard URL** and **Initial Login Credentials** to the client.

---
*Confidential — IntelDrop Standard Operating Procedure*
