# IntelDrop AI: Complete Project Handover & Technical Blueprint

**Project Version:** 1.0.0-Stable  
**Owner:** IntelDrop Investigative Team  
**Design Paradigm:** Notion-Minimalist Modern Workspace  

---

## 1. Project Mission
IntelDrop AI was developed to empower investigative journalists and civil society organizations in high-risk environments. It provides a secure, anonymous, and AI-driven pipeline for citizen intelligence that protects the source's identity through technical enforcement rather than just policy promises.

---

## 2. The Investigative Journey (End-to-End Workflow)

### Step 1: Secure Submission (The Source)
A whistleblower contacts the IntelDrop Telegram Bot. 
- **Privacy First:** No personal data is stored. 
- **Silent Interaction:** The bot remains perfectly silent until the user types `done`, minimizing the visibility of the chat interaction on a source's device.
- **Multimodal Intake:** Sources can send text documents, images, and voice notes.

### Step 2: Ingest & Incineration (The Gateway)
When a source submits their tip:
- **Voice Incineration:** Audio files are sent to the Gemini AI for transcription and immediately purged from all system memory/queues. No biometric voice data is ever stored.
- **Metadata Shredding:** Files (images/docs) have their EXIF, GPS, and device metadata stripped before being stored as anonymized blobs.
- **Encryption:** Tip content is encrypted using **AES-256-GCM** before reaching the database.

### Step 3: AI-Automated Triage (The Analyst)
Every finalized tip is processed by the **Google Gemini AI Engine**:
- **Categorization:** Automatically identifies the lead's domain (e.g., Financial Crime, Corruption).
- **Prioritization:** Assigns a risk level from `Low` to `Critical` based on the gravity of the claim.
- **Intelligence Briefing:** Generates a concise, high-level summary so analysts can triage dozens of leads in minutes.

### Step 4: Secure Communication (The Secure Link)
- Analysts use the dashboard to read the intelligence.
- If more info is needed, analysts can send a secure reply through the dashboard.
- The system routes the reply back to the source on Telegram using a temporary, anonymous alias.

---

## 3. Core Features & Guarantees

### 🛡️ Security Pillars
- **Zero-Identity Architecture:** Telegram IDs are mapped to ephemeral aliases and then discarded. There is no permanent database record linking a source's identity to their tip.
- **Data-at-Rest Protection:** Everything is encrypted. A database breach without the `AES_ENCRYPTION_KEY` yields only gibberish.
- **Webhook Hardening:** The API gateway validates every incoming message using a unique `X-Telegram-Bot-Api-Secret-Token`.

### 🖥️ Analyst Dashboard
- **Triage Inbox:** Dense table layout for efficient lead management.
- **Intelligence Detail:** View decrypted source text, AI summaries, and media attachments in a side-by-side modal.
- **Strategic Insights:** Real-time analytics on tip volume trends and categorical spread.
- **System Control:** Manage organizational branding and logo directly from the settings panel.

---

## 4. The Design Transformation: From "Brutalist" to "Notion"

During this project, we successfully pivoted the entire UI/UX from a "Hardened Terminal" aesthetic to a high-clarity, minimalist "Notion" design system.

### The Design Philosophy
Investigative work is mentally heavy. The new UI uses **Warm Neutrals** (`#FBFBFA`) and **Whisper-thin Borders** to reduce cognitive load, allowing analysts to focus entirely on the intelligence.

### Key Visual Changes
- **Typography:** Switched to **Geist Sans** with tight tracking for a premium, modern feel.
- **Color Palette:**
  - Background: `warm-white` (#FBFBFA)
  - Contrast: `notion-black` (#050505)
  - Action: `notion-blue` (#0075DE)
- **Language Pivot:** We softened the "hardened" technical jargon into professional, investigative terminology (e.g., `RESTRICTED` → `Secure Workspace`).

---

## 5. Technical Stack & Architecture

- **Core Framework:** Next.js 15.5 (App Router / Turbopack)
- **Language:** Type-Safe TypeScript
- **Database / Auth:** Supabase
- **Artificial Intelligence:** Google Gemini AI
- **Error Tracking:** Sentry (@sentry/nextjs)
- **Infrastructure:** Vercel (Optimized for Hobby Plan)

### Database Schema Highlights
- `tips`: Stores encrypted intelligence and AI triage results.
- `sessions`: Ephemeral state management for ongoing Telegram conversations.
- `alias_map`: Temporary bridge between Telegram IDs and Routing Aliases (purged post-submission).
- `client_settings`: Global branding and workspace identity.

---

## 6. Operations & Maintenance

### 🧹 Auto-Cleanup
A nightly Vercel Cron job (`/api/cron/cleanup`) runs at **00:00 UTC** to:
1. Identify sessions with no activity for 24+ hours.
2. Triage any pending content as "Incomplete Submissions."
3. Physically wipe the Telegram message history for that source.
4. Delete the session and alias mapping.

### 🚀 Scaling for New Clients
The system is built for rapid deployment. A new client instance can be stood up in ~15 minutes using the **`ONBOARDING.md`** checklist provided in the root directory.

---

## 7. Audit Log of Major Changes
1.  **Phase 1:** Deployed the "Passive Ingest" model.
2.  **Phase 2:** Instrumented Sentry and hardened Webhook security.
3.  **Phase 3:** Redesigned the Hero section and Marketing Landing Page.
4.  **Phase 4:** Overhauled Auth and analyst Login portal.
5.  **Phase 5:** Rebuilt the Analyst Inbox and Insights dashboard.
6.  **Phase 6:** Redesigned AI Triage modals and Secure Reply interface.

---

*IntelDrop AI — Built for the front lines of investigative journalism.*
