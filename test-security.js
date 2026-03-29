import { encryptData, decryptData } from './lib/encryption.js';

const originalText = "SECRET_INTELLIGENCE_PAYLOAD_77";
try {
  const encrypted = encryptData(originalText);
  const decrypted = decryptData(encrypted);
  
  console.log(`Original: ${originalText}`);
  console.log(`Decrypted: ${decrypted}`);
  console.log(`Match: ${originalText === decrypted}`);
} catch (err) {
  console.error("Encryption Loop Failed:", err.message);
}
