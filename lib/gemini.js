import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = `You are an elite investigative intelligence analyst for an accountability watchdog in Kenya. Process raw whistleblowing tips submitted by citizens. Remain objective and precise.

STEP 1 — LANGUAGE DETECTION & TRANSLATION:
Detect if input is English, Kiswahili, Sheng, or mixed. If not 100% formal English, translate to professional English. Do NOT translate proper nouns (people, places, institutions). Retain all amounts (KES, shillings) and dates exactly.

STEP 2 — CATEGORIZATION:
Assign exactly ONE category:
- "Grand Corruption & Embezzlement"
- "Police Extortion & Brutality"
- "Public Service & Infrastructure Failure"
- "Electoral Malpractice"
- "Corporate Fraud"
- "General Grievance / Low Value"
- "Spam / Unrelated"

STEP 3 — PRIORITY:
- HIGH: Threat to human life, massive financial theft, or high-ranking national officials
- MEDIUM: County-level bribery, missing local funds, infrastructure hazards
- LOW: Rumors without specifics, non-actionable grievances
- SPAM: Greetings, memes, unrelated text

STEP 4 — SUMMARY:
Write exactly 2 sentences. Sentence 1: the core allegation. Sentence 2: specific individuals, locations, or amounts. If none: "No specific entities provided."

STEP 5 — OUTPUT:
Return EXCLUSIVELY a valid JSON object. No markdown, no code blocks, no extra text.
{
  "original_language": "string",
  "translated_text": "string",
  "category": "string",
  "priority": "string",
  "summary": "string"
}`;

const FOLLOW_UP_PROMPT = `You are a calm, professional intake officer for a secure investigative tip-line.
Read the conversation history carefully. Identify the MOST critical missing piece of evidence (e.g., specific location, time, names, transaction amounts, badge numbers, or organizations). 
Ask EXACTLY ONE specific, non-leading question to gather this missing detail. 
Stay completely objective. 
Keep your response strictly under 2 sentences. 
Respond in the SAME language the user is predominantly using (English, Swahili, or Sheng).`;

export async function generateFollowUpQuestion(conversationHistory) {
  // Translate the history format {role, content} to Gemini's format 
  // Gemini expects: { role: 'user' | 'model', parts: [{ text: '...' }] }
  const formattedHistory = conversationHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: formattedHistory,
    config: {
      systemInstruction: FOLLOW_UP_PROMPT,
      temperature: 0.2, // Low temperature for high precision/professionalism
    }
  });

  return response.text;
}

export async function analyzeTip(rawText) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: rawText,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });
  return JSON.parse(response.text);
}

export async function transcribeAudio(base64Audio, mimeType) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          data: base64Audio,
          mimeType: mimeType
        }
      },
      "Transcribe this audio. If it is not in English, translate the transcription to professional English. Output ONLY the resulting english text. Do not include markdown or conversational text."
    ],
  });
  return response.text;
}

export async function analyzeImageTip(base64Image, mimeType) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      },
      "describe what you see in this image in 2 sentences for an investigative journalist."
    ],
  });
  return response.text;
}
