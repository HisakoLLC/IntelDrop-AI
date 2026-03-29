# IntelDrop AI Deployment Sequence

Deploying a fresh white-label version of IntelDrop AI for a new security contractor or journalist organization requires standardizing the isolated environments natively. 

Follow this strict step-by-step procedure:

## Phase 1: Database Initialization
1. Create a fresh project inside **[Supabase](https://supabase.com)**.
2. Inside the Supabase SQL Editor, navigate to your schema architectures laying out `tips`, `client_settings`, and `alias_map` natively alongside storage rules.
3. Locate `client_settings` and assign a single row with the `client_name` (e.g. `Bellingcat Investigations`). This automatically populates the deployment's title and dashboard header.
4. Go to **Storage** and ensure a bucket named `evidence` is created specifically for tracking visual media correctly.
5. Setup a Dashboard Administrator Identity utilizing Email/Password within `Authentication -> Users`.

## Phase 2: Secure Environment Generation
Generate a fresh `AES_ENCRYPTION_KEY`. You can retrieve a highly secure 32-byte base64 string running:
`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

## Phase 3: Vercel Deployment Boundaries
1. Create a new frontend deployment target inside **Vercel** pointing to your initialized GitHub repository.
2. Under "Environment Variables", inject every explicit variable referenced inside `.env.example`.
3. Wait for the `next build` validation script to confirm deployment. (If an AES key is missing, Vercel will explicitly throw a `[INTELDROP SECURE STARTUP HALTED]` failure preventing vulnerable deployments).

## Phase 4: Downstream Telegram Ingestion
1. Message **@BotFather** on Telegram.
2. Hit `/newbot` assigning a target identity specifically.
3. Grab the generated API HTTP Token.
4. Manually trigger the Telegram Webhook registration mapping your newly generated Vercel instance explicitly using CURL:

```bash
curl -F "url=https://[YOUR-VERCEL-DOMAIN]/api/webhook/telegram" https://api.telegram.org/bot[TELEGRAM_BOT_TOKEN]/setWebhook
```

### Execution Confirmed
Once the Webhook executes `{'ok': true}`, the system is fully armed. Any user messaging your bot will immediately traverse through Gemini triage and securely populate the Postgres limits tracking natively behind your Next.js Dashboard.
