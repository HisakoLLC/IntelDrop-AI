# IntelDrop AI — Complete Project Overview

> **Last Updated:** April 2026  
> **Version:** 1.0.0-production  
> **Framework:** Next.js 15 (App Router) · Supabase · Tailwind CSS v4

---

## 1. What Is IntelDrop?

IntelDrop is a **production-grade, AI-powered secure tip-line and whistleblower intake system** built for African investigative newsrooms and civic watchdog organizations. It allows citizens to anonymously submit intelligence via Telegram, which is then automatically triaged by a Gemini AI pipeline and surfaced to analysts in a secure, encrypted dashboard.

The product has two main interfaces:
1. **The Public Telegram Bot** — a dark, silent intake channel where sources submit tips.
2. **The Analyst Dashboard** — a professional, web-based investigative workspace for reviewing, triaging, and responding to intelligence leads.

---

## 2. Core Features

### 2.1 Whistleblower Intake (Telegram Bot)
- Sources send free-text messages, voice notes, or documents to a dedicated Telegram bot.
- The bot runs a **multi-step guided intake conversation** to gather structured intelligence.
- It is **completely dark/silent by default** — no acknowledgment until the source types `done`.
- Upon `done`, the session is finalized and submitted to the AI pipeline.

### 2.2 AI Triage Engine (Gemini)
- Every finalized tip is sent to **Google Gemini** for autonomous analysis.
- The AI assigns:
  - **Priority Level** — `low`, `medium`, `high`, `critical`
  - **Category** — e.g., `Financial Crime`, `Political Corruption`, `Abuse of Office`
  - **AI Summary** — a concise, analyst-ready intelligence brief
- The AI output is encrypted and stored in Supabase.

### 2.3 Voice Incineration
- Voice notes sent via Telegram are **transcribed in real time** using the Gemini audio API.
- The original audio file is **permanently destroyed** before it ever touches a persistent storage layer.
- The only artifact retained is the anonymized text transcript.
- This eliminates biometric voice signatures that could identify sources.

### 2.4 Zero-Identity Storage
- All tip content is encrypted using **AES-256-GCM** before database insertion.
- Sources are identified only by a randomly generated **routing alias** (e.g., `SRC-4F9A2B`).
- There is **no persistent mapping** between a Telegram user ID and the alias — the map is session-scoped and discarded after submission.
- Even a full database breach cannot expose source identities.

### 2.5 Metadata Shredding
- All file metadata (EXIF data, device fingerprints, creation timestamps) is stripped on ingest.
- The system stores zero identifying attributes beyond the anonymous alias.

### 2.6 Chat Auto-Wipe
- The Telegram session conversation history is purged from all gateway layers upon tip finalization.
- A nightly Vercel Cron job (`/api/cron/cleanup`) sweeps abandoned sessions older than 24 hours.

### 2.7 Analyst Dashboard
The dashboard is a full-featured investigative workstation with four primary surfaces:

| Page | Purpose |
|------|---------|
| **Analyst Inbox** (`/dashboard`) | The primary triage table — all incoming leads with priority/status pills |
| **Intelligence Insights** (`/dashboard/insights`) | Analytics — 30-day inbox volume chart, categorical spread donut |
| **System Settings** (`/dashboard/settings`) | Workspace identity and branding configuration |
| **Login Portal** (`/login`) | Secure authentication gate for analysts |

### 2.8 Tip Detail Modal
Clicking any row in the Analyst Inbox opens a full-detail modal containing:
- AI-generated intelligence summary
- Assigned priority and category
- Submission timestamp and source alias
- Decrypted raw tip content
- **Contact Source** action to open the Reply Interface

### 2.9 Secure Reply System
- Analysts can send a reply directly back to the whistleblower via the `Reply to Source` modal.
- The reply is routed to the source's Telegram alias via `/api/reply-to-source`.
- The source receives the message but the analyst never sees their real Telegram ID.

---

## 3. Security Architecture

```
[Citizen]
   │
   ▼ Telegram Message
[Telegram Bot API]
   │
   ├── Webhook validation: X-Telegram-Bot-Api-Secret-Token header checked
   │
   ▼
[/api/webhook/telegram] (Next.js Route Handler)
   │
   ├── Rate limiting per alias (rate_limits table)
   ├── Spam detection (spam_log table)
   ├── AES-256-GCM encryption of tip content
   │
   ▼
[Gemini AI Triage]
   │
   ├── Priority: low | medium | high | critical
   ├── Category: Financial Crime | Corruption | etc.
   └── AI Summary generated
   │
   ▼
[Supabase Database]
   │
   ├── tips (encrypted content, AI output, alias, status)
   ├── sessions (ephemeral session state)
   ├── alias_map (discarded post-submission)
   ├── rate_limits
   ├── spam_log
   └── client_settings
   │
   ▼
[Analyst Dashboard] ← Only accessible behind Supabase Auth
```

### 3.1 Security Guarantees

| Guarantee | Implementation |
|-----------|---------------|
| Webhook authentication | `X-Telegram-Bot-Api-Secret-Token` header validation |
| Startup secret validation | `next.config.ts` build-time env check |
| Data encryption | AES-256-GCM via `AES_ENCRYPTION_KEY` |
| Voice destruction | Audio transcribed then deleted before any storage |
| Session auto-destruct | Cron job purges sessions > 24h |
| Source anonymity | Alias-only storage, no Telegram ID persistence |
| Rate limiting | Per-alias request throttling |

---

## 4. Technical Architecture

### 4.1 Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI Engine | Google Gemini API |
| Bot Gateway | Telegram Bot API (passive webhook) |
| Monitoring | Sentry (`@sentry/nextjs`) |
| Deployment | Vercel |
| Schema Mgmt | Supabase Migrations |

### 4.2 Database Schema

**`tips`**
```sql
id, alias, encrypted_content, ai_summary, priority,
category, status, created_at, client_id
```

**`sessions`**
```sql
id, alias, state, step, created_at, updated_at
```

**`alias_map`**  
```sql
alias, telegram_chat_id, created_at
-- Discarded after submission
```

**`rate_limits`**
```sql
alias, request_count, window_start
```

**`spam_log`**
```sql
alias, reason, flagged_at
```

**`client_settings`**
```sql
client_id, client_name, logo_url, created_at
```

### 4.3 Key API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/webhook/telegram` | POST | Receive and process Telegram messages |
| `/api/reply-to-source` | POST | Send analyst reply to whistleblower |
| `/api/cron/cleanup` | GET | Purge abandoned sessions (Vercel Cron) |

### 4.4 Architecture Decisions

**Q: Why no QStash?**  
Originally, QStash was used for async message queuing. It was decommissioned because the AI does not reply to users during intake — the bot is a passive, silent receiver. The simpler passive ingest model eliminates infrastructure overhead with zero functional loss.

**Q: Why passive webhook vs. polling?**  
Webhooks are instantaneous, serverless-friendly, and require no persistent connection. Polling would require a background worker, which is expensive on Vercel.

**Q: Why Telegram?**  
Telegram provides an accessible, low-friction interface for sources in low-bandwidth environments across Africa, while its Bot API provides programmatic control over the entire conversation.

---

## 5. Environment Variables

Every deployment requires the following environment variables:

```bash
# [1] AI ENGINE
GEMINI_API_KEY="your-gemini-api-key"

# [2] TELEGRAM
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_WEBHOOK_SECRET="your-webhook-secret"

# [3] ENCRYPTION
AES_ENCRYPTION_KEY="32-character-random-string"

# [4] SUPABASE
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# [5] SENTRY (Monitoring)
SENTRY_DSN="https://your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="https://your-sentry-dsn"

# [6] CRON (Security)
CRON_SECRET="your-vercel-cron-secret"
```

> **Where to find your Sentry DSN:**  
> Sentry Dashboard → Your Project → Settings → Client Keys (DSN) → Copy the DSN string.

---

## 6. Design System — "Notion Minimalist"

The entire platform was redesigned from a "Brutalist Terminal" aesthetic to a premium, professional investigative workspace inspired by Notion's design language.

### 6.1 Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `notion-black` | `#050505` | Primary text, headings |
| `notion-blue` | `#0075DE` | Accent, CTAs, status pills |
| `warm-white` | `#FBFBFA` | Page backgrounds |
| `warm-gray-300` | `#9b9b9b` | Secondary text |
| `warm-gray-500` | `#6b6b6b` | Sub-labels, placeholders |
| `border-whisper` | `rgba(0,0,0,0.1)` | All borders and dividers |
| `shadow-notion-card` | Subtle 2-layer | Card containers |
| `shadow-notion-deep` | 3-layer elevated | Modals, focused elements |

### 6.2 Language Transformation

| Before (Brutalist) | After (Notion Minimalist) |
|---|---|
| `RESTRICTED ACCESS TERMINAL` | `Secure Workspace Portal` |
| `OPERATOR PANEL` | `Analyst Inbox` |
| `INTERROGATION MODE` | `Contact Source` |
| `TARGET ROUTING ALIAS` | `Source Alias` |
| `Execute Dispatch` | `Submit Reply` |
| `SYSTEM ONLINE` | `Active Channel` (blue pill) |
| `Volume Intercepts` | `Inbox Activity` |
| `Threat Vector` | `Lead Intel Category` |
| `UNDEFINED CLASSIFIED ENTITY` | `IntelDrop Investigative Team` |

### 6.3 Components Redesigned

| Component | Key Changes |
|-----------|------------|
| `app/login/page.tsx` | Centered card, warm background, professional language |
| `components/auth/AuthForm.tsx` | Notion Blue focus rings, sans-serif inputs |
| `app/dashboard/layout.tsx` | Light shell, white sidebar, whisper borders |
| `components/dashboard/Sidebar.tsx` | Light nav, accent status pill badge |
| `components/dashboard/Topbar.tsx` | Minimal header, soft logout button |
| `components/dashboard/TriageTable.tsx` | Density-optimized rows, pill badges |
| `components/dashboard/TipDetailModal.tsx` | Full reconstruction — dual-panel layout |
| `components/dashboard/ReplyModal.tsx` | Soft reply card, `Submit Reply` CTA |
| `components/dashboard/InsightsSummary.tsx` | White stat cards, blue pulse indicator |
| `components/dashboard/CategoryDonutChart.tsx` | Light tooltip, clean chart shell |
| `components/dashboard/InboxVolumeChart.tsx` | Notion Blue bars, whisper axis lines |
| `app/dashboard/page.tsx` | Clean inbox header with live indicator |
| `app/dashboard/insights/page.tsx` | Clean analytics layout |
| `app/dashboard/settings/page.tsx` | Professional configuration hub |
| `app/page.tsx` | Full marketing landing page |
| `app/layout.tsx` | Brand metadata updated |

---

## 7. Marketing Landing Page (`inteldrop.ai`)

A single-page marketing site built in Next.js targeting investigative teams.

### 7.1 Sections

| Section | Content |
|---------|---------|
| **Navigation** | Sticky, glassmorphism nav with "Request a Demo" CTA |
| **Hero** | `The AI-Powered Secure Tip-Line for Investigative Teams` + rotating hero image |
| **Problem** | 3 pain points: Tip Line Spam, Voice Note Risk, Source Exposure |
| **Solution** | 3 features: AI Triage, Voice Incineration, Zero-Identity Storage |
| **How It Works** | 3-step visual: Citizen Submits → AI Triages → Analyst Investigates |
| **Security** | 4 absolute guarantees with Notion Blue accent borders |
| **CTA** | Tally.so embedded demo request form |
| **Footer** | Branding lockup |

### 7.2 Design Decisions
- **No pricing** is shown — all commercial discussions happen in the demo meeting.
- Hero image uses `grayscale` by default, revealing color on hover — a deliberate motion design choice.
- Security section uses an inverted dark background (`bg-notion-black`) for visual impact.

---

## 8. Monitoring & Observability

### 8.1 Sentry Integration
- `@sentry/nextjs` is instrumented across the full stack.
- Errors in API routes, the webhook handler, and the AI pipeline are captured.
- Source maps are uploaded automatically on Vercel deploy.

### 8.2 Vercel Cron
- `/api/cron/cleanup` runs nightly to purge sessions older than 24 hours.
- Protected by `CRON_SECRET` header validation.

---

## 9. Deployment — New Client Checklist

Use this checklist when spinning up a new client instance:

```
[ ] Create new Supabase project, name it client-[clientname]
[ ] Run the SQL migration file to create all tables
[ ] Register new Telegram bot via @BotFather, save token
[ ] Generate fresh AES_ENCRYPTION_KEY (32 chars)
[ ] Create new Vercel project from the same GitHub repo
[ ] Add all environment variables to Vercel
[ ] Deploy to Vercel, get the deployment URL
[ ] Set Telegram webhook:
      POST https://api.telegram.org/bot{TOKEN}/setWebhook
      {"url": "https://[vercel-url]/api/webhook/telegram",
       "secret_token": "[TELEGRAM_WEBHOOK_SECRET]"}
[ ] Add custom subdomain in Vercel (client.inteldrop.ai)
[ ] Update client_settings table with client name and logo URL
[ ] Send test message to bot, verify tip appears in dashboard
[ ] Configure Sentry alerting rules for error notifications
[ ] Hand client their dashboard URL and login credentials
```

---

## 10. Pending / Future Work

| Item | Priority | Notes |
|------|----------|-------|
| Sentry email alerting | High | Configure in Sentry dashboard → Alerts |
| Multi-client support | Medium | `client_id` column already exists in `tips` table |
| Document intake | Medium | PDF/image submission via Telegram |
| Analyst roles | Medium | Read-only vs. full-access analyst accounts |
| Export to PDF | Low | Export tip detail as redacted briefing document |
| Two-factor auth | Low | Add TOTP for analyst login |
| Mobile dashboard | Low | Responsive pass on modal components |

---

## 11. Repository Structure

```
inteldrop-ai/
├── app/
│   ├── layout.tsx              # Root layout + metadata
│   ├── page.tsx                # Marketing landing page
│   ├── globals.css             # Design system tokens
│   ├── login/
│   │   └── page.tsx            # Analyst login portal
│   └── dashboard/
│       ├── layout.tsx          # Dashboard shell
│       ├── page.tsx            # Analyst Inbox
│       ├── insights/
│       │   └── page.tsx        # Intelligence Insights
│       └── settings/
│           └── page.tsx        # System Settings
├── components/
│   ├── auth/
│   │   └── AuthForm.tsx        # Login form
│   └── dashboard/
│       ├── Sidebar.tsx
│       ├── Topbar.tsx
│       ├── TriageTable.tsx
│       ├── TipDetailModal.tsx
│       ├── ReplyModal.tsx
│       ├── InsightsSummary.tsx
│       ├── CategoryDonutChart.tsx
│       └── InboxVolumeChart.tsx
├── actions/
│   ├── tips.ts                 # getDecryptedTips server action
│   └── insights.ts             # getInsightMetrics server action
├── app/api/
│   ├── webhook/telegram/       # Telegram ingest endpoint
│   ├── reply-to-source/        # Analyst → Source reply
│   └── cron/cleanup/           # Session purge cron
├── PROJECT_OVERVIEW.md         # This document
├── ONBOARDING.md               # Client deployment checklist
└── next.config.ts              # Build-time secret validation
```

---

*IntelDrop AI — Protecting Sources. Empowering Investigators.*
