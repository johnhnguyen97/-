import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Get encryption key from environment or generate a secure one
function getEncryptionKey(salt: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is not set');
  }
  // Derive a key using scrypt (more secure than raw key)
  return scryptSync(secret, salt, KEY_LENGTH);
}

export interface EncryptedData {
  encrypted: string;  // base64 encoded
  iv: string;         // base64 encoded
  authTag: string;    // base64 encoded
  salt: string;       // base64 encoded
}

export function encrypt(plaintext: string): EncryptedData {
  const salt = randomBytes(SALT_LENGTH);
  const key = getEncryptionKey(salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    salt: salt.toString('base64'),
  };
}

export function decrypt(data: EncryptedData): string {
  const salt = Buffer.from(data.salt, 'base64');
  const key = getEncryptionKey(salt);
  const iv = Buffer.from(data.iv, 'base64');
  const authTag = Buffer.from(data.authTag, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(data.encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
