/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Sentry from '@sentry/nextjs';

// Direct REST API — bypasses @google/genai SDK v1beta routing issues
// These model names are confirmed valid at the v1 REST endpoint
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const PRIMARY_MODEL = 'gemini-2.0-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash-lite';

interface SessionMessage {
  role: string;
  content: string;
  message_id?: number;
  media_url?: string | null;
}

/**
 * Direct REST call to Gemini API with retry logic.
 * Avoids @google/genai SDK model routing issues entirely.
 */
async function callGemini(
  model: string,
  body: Record<string, any>,
  attempt = 1
): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  console.log(`[AI] Attempt ${attempt}/4 using ${model}...`);

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    const isThrottled = res.status === 429 || res.status === 503;

    // If throttled and retries remain, wait and retry the SAME model
    if (isThrottled && attempt < 3) {
      const delay = attempt * 3000;
      console.warn(`[AI] ${model} throttled (${res.status}). Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      return callGemini(model, body, attempt + 1);
    }

    // If primary model exhausted, try fallback once
    if (attempt >= 3 && model === PRIMARY_MODEL) {
      console.warn(`[AI] Primary model exhausted. Switching to ${FALLBACK_MODEL}...`);
      return callGemini(FALLBACK_MODEL, body, 1);
    }

    Sentry.captureException(new Error(`Gemini ${model} error ${res.status}: ${errText}`));
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  return res.json();
}

/**
 * Parse the text from a Gemini REST response.
 */
function extractText(response: any): string {
  return response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─────────────────────────────────────────────
// PROMPTS
// ─────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the lead intelligence intake officer for IntelDrop.
Your goal is to perform "Multimodal Triage" on whistleblower reports.
Return ONLY valid JSON in this format:
{
  "category": "Corruption" | "Crime" | "Corporate" | "Spam / Unrelated" | "Other",
  "priority": "High" | "Medium" | "Low" | "Spam",
  "summary": "one sentence summary",
  "risk_assessment": "short risk note",
  "original_language": "Detected language (e.g. English, Swahili, Russian)"
}
If the submission is a greeting, casual conversation, random text, or irrelevant to intelligence, set category to "Spam / Unrelated" and priority to "Spam".`;

const CONVERSATION_PROMPT = `You are "Naisha", the IntelDrop intake officer.
You are speaking with a whistleblower. They are anonymous and likely stressed.
Your tone: Professional, empathetic, and security-focused.
Goal: Gather the WHO, WHAT, WHEN, WHERE, and WHY of the incident.
Ask ONE focused follow-up question at a time. Be concise but always write complete sentences.
NEVER end a message mid-sentence or mid-word. Always complete your thought before ending.
If they say they are done, thank them and inform them the chat will be securely wiped.`;

// ─────────────────────────────────────────────
// EXPORTED FUNCTIONS
// ─────────────────────────────────────────────

export async function generateFollowUpQuestion(messages: SessionMessage[]): Promise<string> {
  // Filter out internal sentinel strings that would confuse the model
  const filtered = messages.filter(
    m => m.content && m.content !== 'WELCOME' && m.content !== 'PROMPT'
  );

  const contents = filtered.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || '[Media Content]' }],
  }));

  // Gemini requires conversation to start with a user turn
  if (contents.length === 0 || contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: 'I have information to report.' }] });
  }

  try {
    const response = await callGemini(PRIMARY_MODEL, {
      system_instruction: { parts: [{ text: CONVERSATION_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.6, maxOutputTokens: 300 },
    });

    const raw = extractText(response).trim();
    if (!raw || raw.length < 5) {
      return 'Thank you. Can you share any additional details about this incident?';
    }
    return raw;
  } catch (err) {
    console.error('[Naisha] Follow-up generation failed:', err);
    return 'Thank you for sharing. Can you provide any additional details?';
  }
}

export async function analyzeTip(rawText: string): Promise<any> {
  const response = await callGemini(PRIMARY_MODEL, {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: rawText }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });

  try {
    const raw = extractText(response);
    return JSON.parse(raw || '{}');
  } catch {
    return { category: 'Other', priority: 'Medium', summary: 'Failed to parse triage JSON' };
  }
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const response = await callGemini(PRIMARY_MODEL, {
    contents: [{
      role: 'user',
      parts: [
        { inline_data: { mime_type: mimeType, data: base64Audio } },
        { text: "Transcribe this audio exactly. If it's not clear, summarize what you can hear." },
      ],
    }],
  });
  return extractText(response);
}

export async function analyzeImageTip(base64Image: string, mimeType: string): Promise<string> {
  const response = await callGemini(PRIMARY_MODEL, {
    contents: [{
      role: 'user',
      parts: [
        { inline_data: { mime_type: mimeType, data: base64Image } },
        { text: 'Describe this image in the context of a whistleblower report. What evidence is visible?' },
      ],
    }],
  });
  return extractText(response) || '[Visual Content]';
}
