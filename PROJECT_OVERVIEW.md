# IntelDrop AI: The Definitive Project Manual

**Project Name:** IntelDrop AI  
**Deployment State:** Production-Ready (V1.0)  
**Brand Identity:** Notion-Minimalist Investigative Workspace  

---

## 1. Executive Summary
IntelDrop AI is a secure intelligence-gathering platform designed for high-risk whistleblowing environments (specifically targeting investigative teams in Africa). It bridges the gap between secure, anonymous intake (via Telegram) and high-clarity intelligence analysis (via a private dashboard).

The system prioritizes **Source Protection** above all else, ensuring that neither the platform owners nor potential adversaries can link a tip back to a physical identity.

---

## 2. The Core Workflow

### A. Intake (The "Black Box")
1.  **Source Entry:** A citizen initiates contact with the IntelDrop Telegram Bot.
2.  **Guided Conversation:** The bot leads a structured multi-step intake (Context, Evidence, Urgency).
3.  **Silent Mode:** The bot operates in "Dark Mode"—it does not respond or acknowledge inputs until the source declares `done`. This prevents identifiable chat history patterns.
4.  **Finalization:** Once submitted, the session is moved to the AI pipeline and immediately wiped from the gateway.

### B. Triage (The "AI Engine")
1.  **Transcription:** Voice notes are transcribed via Gemini Pro Vision/Audio.
2.  **Incineration:** The raw audio file is **permanently destroyed** immediately after text is extracted to prevent biometric identification.
3.  **Analysis:** Gemini analyzes the raw text for:
    -   **Priority:** `critical`, `high`, `medium`, `low`.
    -   **Category:** e.g., `Financial Crime`, `Human Rights`, `Corruption`.
    -   **Summary:** A concise intel brief for the analyst.
4.  **Encryption:** The results are encrypted with **AES-256-GCM** and stored.

### C. Investigation (The "Analyst Workspace")
1.  **Inbox:** Analysts view a prioritized list of incoming leads.
2.  **Detail View:** Analysts read decrypted summaries and can view the raw intelligence.
3.  **Secure Reply:** Analysts can communicate back to the source using the random **Source Alias** (e.g., `SRC-9X2L`). The system routes messages back to the source's Telegram without revealing the source's ID.

---

## 3. Security & Anonymity Architecture

| Feature | Technical Implementation |
|:---|:---|
| **Zero-Identity Storage** | Telegram IDs are never recorded in permanent storage. They exist only in ephemeral `alias_map` entries that are purged upon submission. |
| **Data At Rest** | All tip content is encrypted with a server-side `AES_ENCRYPTION_KEY`. |
| **Voice Protection** | Real-time transcription followed by immediate binary deletion of audio files. |
| **Webhook Security** | Incoming Telegram updates are verified against a unique `X-Telegram-Bot-Api-Secret-Token`. |
| **Session Cleanup** | A nightly Vercel Cron job (`api/cron/cleanup`) purges abandoned or stale sessions older than 24 hours. |
| **Metadata Stripping** | Automated removal of EXIF/GPS/Device tags from all incoming media. |

---

## 4. Design System: "Notion Minimalist" Evolution

The platform underwent a total UI/UX transformation from a "Brutalist/Terminal" look to a clean, professional "Notion" style.

### Design Tokens
*   **Neutral Palette:** `#FBFBFA` (Warm White background) and `#050505` (Notion Black text).
*   **The "Notion Blue":** `#0075DE` used for calls-to-action, status pills, and focus states.
*   **Shadow System:** Whisper-thin borders combined with soft multi-layered shadows (`shadow-notion-card`).
*   **Typography:** Switched from Monospaced to **Geist Sans** (Inter-like) with tight tracking (`-tracking-[1.5px]`).

### Cultural/Tonal Softening
To make the platform more approachable for non-technical users, we transformed the UI language:
- `RESTRICTED ACCESS` → `Secure Workspace`
- `INTERROGATION` → `Contact Source`
- `TARGET ALIAS` → `Anonymous Source Alias`
- `EXECUTE DISPATCH` → `Submit Reply`

---

## 5. Technical Stack

| Layer | Technology |
|:---|:---|
| **Framework** | Next.js 15 (App Router) with Turbopack |
| **Runtime** | Node.js (Vercel Edge/Serverless) |
| **Database** | Supabase (PostgreSQL) |
| **Intelligence** | Google Gemini 1.5 Pro |
| **Styling** | Tailwind CSS v4 |
| **Monitoring** | Sentry (Full-stack instrumentation) |
| **Automation** | Vercel Cron (Daily cleanups) |

---

## 6. Deployment & Operations

### Client Onboarding Workflow
1.  **Supabase:** Provision a new project and apply SQL migrations.
2.  **Telegram:** Create bot via `@BotFather` and set the `Secret Token`.
3.  **Vercel:** Fork the repo, connect env vars, and deploy.
4.  **Environment Variables:**
    - `GEMINI_API_KEY`: Core AI functionality.
    - `TELEGRAM_WEBHOOK_SECRET`: Secure gateway entry.
    - `AES_ENCRYPTION_KEY`: 32-char key for database security.
    - `CRON_SECRET`: Vercel internal security for cleanup tasks.

### Vercel Hobby Plan Constraints
We have optimized the system for the **Vercel Hobby Plan**:
- **Cron Limit:** Only 1 cron job allowed.
- **Implementation:** The `/api/cron/cleanup` endpoint handles all maintenance once Every 24 hours at midnight.

---

## 7. Repository Map

- `/app/api/webhook/telegram`: The entry point for all intelligence.
- `/app/api/reply-to-source`: The communication bridge back to whistleblowers.
- `/components/dashboard`: The complete set of redesigned Notion-style components.
- `/lib/encryption.ts`: The cryptographic heart of the system.
- `/lib/gemini.ts`: AI logic for audio transcription and automated triage.

---

*Document prepared by Antigravity AI Implementation Team.*
