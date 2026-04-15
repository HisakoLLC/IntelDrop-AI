/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

import * as Sentry from "@sentry/nextjs";

// 2026 Stable Model Hierarchy
const PRIMARY_MODEL = 'gemini-2.0-flash-001';
const FALLBACK_1 = 'gemini-2.5-flash';
const FALLBACK_2 = 'gemini-3.1-flash-live-preview';

interface SessionMessage {
  role: string;
  content: string;
  message_id?: number;
  media_url?: string | null;
}

/**
 * Resilient wrapper for AI calls with exponential backoff and multi-tier model fallback.
 */
async function callResilientAI(options: Record<string, any>, attempt = 1): Promise<any> {
  // Rotate through models as attempts fail
  let modelToUse = PRIMARY_MODEL;
  if (attempt === 2) modelToUse = FALLBACK_1;
  if (attempt >= 3) modelToUse = FALLBACK_2;
  
  return await Sentry.startSpan({ 
    name: "callResilientAI", 
    op: "ai.generate",
    attributes: { model: modelToUse, attempt } 
  }, async () => {
    try {
      console.log(`[AI] Attempt ${attempt}/6 using ${modelToUse}...`);
      return await ai.models.generateContent({
        ...options,
        model: modelToUse
      } as any);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isRetryable = errorMessage.includes('503') || 
                          errorMessage.includes('429') || 
                          errorMessage.includes('UNAVAILABLE');
      
      // Capture non-retryable errors or final death immediately
      if (!isRetryable || attempt === 6) {
        Sentry.captureException(err, { extra: { model: modelToUse, attempt } });
      }

      // Max 6 retries (~60s of persistence)
      if (isRetryable && attempt < 6) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[AI] ${modelToUse} busy or throttled. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callResilientAI(options, attempt + 1);
      }
      throw err;
    }
  });
}

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

export async function generateFollowUpQuestion(messages: SessionMessage[]) {
  // Filter out internal sentinel strings that would confuse the model
  const filteredMessages = messages.filter(
    m => m.content && m.content !== 'WELCOME' && m.content !== 'PROMPT'
  );

  const squashedContents = filteredMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || '[Media Content]' }]
  }));

  // Ensure conversation starts with a user turn (Gemini requirement)
  if (squashedContents.length === 0 || squashedContents[0].role !== 'user') {
    squashedContents.unshift({ role: 'user', parts: [{ text: 'I have information to report.' }] });
  }

  const result: any = await callResilientAI({
    contents: squashedContents,
    config: {
      systemInstruction: CONVERSATION_PROMPT,
      temperature: 0.6,
      maxOutputTokens: 300,
    }
  });

  const raw = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // Safety net: if the response is empty or very short, fall back to a safe prompt
  if (!raw || raw.trim().length < 5) {
    return 'Thank you. Can you share any additional details about this incident?';
  }
  return raw.trim();
}

export async function analyzeTip(rawText: string) {
  const result: any = await callResilientAI({
    contents: [{ role: 'user', parts: [{ text: rawText }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json'
    }
  });

  try {
    return JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
  } catch {
    return { category: 'Other', priority: 'Medium', summary: 'Failed to parse triage JSON' };
  }
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const result: any = await callResilientAI({
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64Audio } },
          { text: "Transcribe this audio exactly. If it's not clear, summarize what you can hear." }
        ]
      }
    ]
  });
  return result.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function analyzeImageTip(base64Image: string, mimeType: string): Promise<string> {
  const result: any = await callResilientAI({
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: "Describe this image in the context of a whistleblower report. What evidence is visible?" }
        ]
      }
    ]
  });
  return result.candidates?.[0]?.content?.parts?.[0]?.text || "[Visual Content]";
}
