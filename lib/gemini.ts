/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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
    
    // Max 6 retries (~60s of persistence)
    if (isRetryable && attempt < 6) {
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`[AI] ${modelToUse} busy or throttled. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callResilientAI(options, attempt + 1);
    }
    throw err;
  }
}

const SYSTEM_PROMPT = `You are the lead intelligence intake officer for IntelDrop. 
Your goal is to perform "Multimodal Triage" on whistleblower reports.
Return ONLY valid JSON in this format:
{
  "category": "Corruption" | "Crime" | "Corporate" | "Other",
  "priority": "High" | "Medium" | "Low",
  "summary": "one sentence summary",
  "risk_assessment": "short risk note"
}`;

const CONVERSATION_PROMPT = `You are "Naisha", the IntelDrop intake officer. 
You are speaking with a whistleblower. They are anonymous and likely stressed.
Your tone: Professional, empathetic, and security-focused.
Goal: Gather the WHO, WHAT, WHEN, WHERE, and WHY.
If information is missing, ask ONE follow-up question at a time.
Keep responses under 50 words. Do not use your name in every message.
If they say they are done, thank them and tell them the chat will be wiped.`;

export async function generateFollowUpQuestion(messages: SessionMessage[]) {
  const squashedContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || '[Media Content]' }]
  }));

  const result: any = await callResilientAI({
    contents: squashedContents,
    config: {
      systemInstruction: CONVERSATION_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 200,
    }
  });

  return result.candidates?.[0]?.content?.parts?.[0]?.text || "Thank you. Please continue.";
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
