import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.AES_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

export function encryptData(text) {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error('CRITICAL: Missing or invalid AES_ENCRYPTION_KEY.');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

export function decryptData(encryptedPackage) {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error('CRITICAL: Missing or invalid AES_ENCRYPTION_KEY.');
  }
  const parts = encryptedPackage.split(':');
  if (parts.length !== 3) throw new Error('Corrupted encrypted package.');
  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(parts[2], 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function hashData(text) {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error('CRITICAL: Missing or invalid AES_ENCRYPTION_KEY.');
  }
  return crypto.createHmac('sha256', ENCRYPTION_KEY).update(text).digest('hex');
}
