import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkModels() {
  const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
  });

  try {
    const models = await genAI.models.list();
    console.log('--- AVAILABLE MODELS ---');
    models.forEach(m => {
      console.log(`- ${m.name} (${m.displayName})`);
    });
  } catch (err) {
    console.error('Error listing models:', err);
  }
}

checkModels();
