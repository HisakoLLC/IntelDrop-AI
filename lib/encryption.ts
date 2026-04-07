import crypto from 'crypto';

/**
 * Normalizes the encryption key string to a 32-byte Buffer.
 * Supports:
 * - 32-char literal strings (UTF-8)
 * - 64-char Hex strings
 * - 44-char Base64 strings (representing 32 bytes)
 */
function getEncryptionKeyBuffer(): Buffer {
  const rawKey = process.env.AES_ENCRYPTION_KEY?.trim();
  if (!rawKey) {
    throw new Error('CRITICAL: AES_ENCRYPTION_KEY is missing from environment.');
  }

  // Attempt literal 32-char string first
  if (rawKey.length === 32) {
    return Buffer.from(rawKey, 'utf8');
  }

  // Attempt Base64 (32 bytes = 44 chars)
  if (rawKey.length === 44) {
    try {
      const buf = Buffer.from(rawKey, 'base64');
      if (buf.length === 32) return buf;
    } catch (e) {
      // Fall through
    }
  }

  // Attempt Hex (32 bytes = 64 chars)
  if (rawKey.length === 64) {
    try {
      const buf = Buffer.from(rawKey, 'hex');
      if (buf.length === 32) return buf;
    } catch (e) {
      // Fall through
    }
  }

  // Final fallback: Use what we have, but warn/check length
  const finalBuf = Buffer.from(rawKey, 'utf8');
  if (finalBuf.length !== 32) {
    throw new Error(`CRITICAL: AES_ENCRYPTION_KEY must result in exactly 32 bytes. Current: ${finalBuf.length} bytes.`);
  }
  return finalBuf;
}

const ALGORITHM = 'aes-256-gcm';

export function encryptData(text: string): string {
  const key = getEncryptionKeyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

export function decryptData(encryptedPackage: string): string {
  const key = getEncryptionKeyBuffer();
  const parts = encryptedPackage.split(':');
  if (parts.length !== 3) throw new Error('Corrupted encrypted package.');
  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(parts[2], 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function hashData(text: string): string {
  const key = getEncryptionKeyBuffer();
  return crypto.createHmac('sha256', key).update(text).digest('hex');
}
