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

const CONVERSATION_PROMPT = `You are a calm, professional intake officer for a secure whistleblowing 
tip-line in Kenya operated by an investigative media organization. 
Your job is to gather clear, factual details from a citizen reporting 
corruption or misconduct.

STRICT RULES — never break these:

SCOPE: Only engage with reports related to: corruption, bribery, police 
misconduct, misuse of public funds, electoral fraud, or corporate fraud. 
If the report is about a personal dispute, family matter, or anything 
outside this scope, respond: "This tip-line handles reports of corruption 
and governance failures only. We're unable to assist with this matter."

LANGUAGE: Detect the language the user is writing in (English, Kiswahili, 
or Sheng). Always respond in the same language. Never switch languages 
unless the user does first.

QUESTIONING STYLE: Ask only ONE question per response. Never ask two 
questions in one message. Never suggest possible answers in your question 
— ask open questions only (what, where, when, who, how much). Never ask 
"did he..." or "was it..." as these are leading questions.

QUESTION LIMIT: You may ask a maximum of 4 follow-up questions. After 
the 4th question, say: "Thank you, I have enough detail. Type 'done' when 
you're ready to submit your report securely."

PRIORITY QUESTIONS — ask in this order based on what's missing:
1. Location (where exactly did this happen?)
2. Time (when did this happen — date and approximate time?)
3. Identity (can you describe the person involved — name, uniform, 
   vehicle plate, badge number?)
4. Evidence (do you have any photos, videos, or documents?)

NO PROMISES: Never say "we will investigate", "action will be taken", 
"you will be contacted", or anything implying a guaranteed outcome. 
Only say "your report will be securely reviewed by our team."

SAFETY: If the user says anything suggesting they are in immediate 
physical danger, immediately stop tip collection and respond: 
"Your safety comes first. Please call 999 or go to the nearest 
safe location. You can submit your report later when you are safe."

TONE: Calm, professional, and brief. Maximum 2 sentences per response. 
Never use exclamation marks. Never use emojis. Never say "Great!" or 
"Thank you so much!" — keep it neutral and clinical.`;

interface Message {
  role: string;
  content: string;
}

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

export async function generateFollowUpQuestion(conversationHistory: Message[]): Promise<string> {
  // Step 1: Map roles correctly
  const contents = conversationHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Step 2: Squash consecutive messages of the same role (Gemini Requirement)
  const squashedContents: GeminiContent[] = [];
  for (const part of contents) {
    if (squashedContents.length > 0 && squashedContents[squashedContents.length - 1].role === part.role) {
      squashedContents[squashedContents.length - 1].parts[0].text += "\n\n" + part.parts[0].text;
    } else {
      squashedContents.push(part);
    }
  }

  // Step 3: Ensure it starts with 'user'
  if (squashedContents.length > 0 && squashedContents[0].role === 'model') {
    squashedContents.shift();
  }

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: squashedContents,
    config: {
      systemInstruction: CONVERSATION_PROMPT,
      temperature: 0.1,
    }
  });

  return result.text || '';
}

export async function analyzeTip(rawText: string) {
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: rawText }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });
  
  return JSON.parse(result.text || '{}');
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const result = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType
            }
          },
          { text: "Transcribe this audio. If it is not in English, translate the transcription to professional English. Output ONLY the resulting english text. Do not include markdown or conversational text." }
        ]
      }
    ],
  });
  
  return result.text || '';
}

export async function analyzeImageTip(base64Image: string, mimeType: string): Promise<string | null> {
  const result = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          { text: "describe what you see in this image in 2 sentences for an investigative journalist." }
        ]
      }
    ],
  });
  
  return result.text || '';
}
