/**
 * Field-Level Encryption for Sensitive Data
 *
 * Uses AES-256-GCM for encrypting sensitive fields like medical data,
 * blood reports, and progress photos metadata.
 *
 * IMPORTANT: This module should only be used on the server side.
 * Never expose encryption keys to the client.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
const KEY_LENGTH = 32; // 256 bits for AES-256

// Environment variable keys
const MEDICAL_KEY_ENV = "MEDICAL_ENCRYPTION_KEY";
const PHOTO_KEY_ENV = "PHOTO_ENCRYPTION_KEY";

export type EncryptionKeyType = "medical" | "photo";

interface EncryptedData {
  encrypted: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded IV
  authTag: string; // Base64 encoded auth tag
  salt: string; // Base64 encoded salt (for key derivation)
  version: number; // Encryption version for future migrations
}

/**
 * Get encryption key from environment
 */
function getEncryptionKey(keyType: EncryptionKeyType): Buffer {
  const envKey = keyType === "medical" ? MEDICAL_KEY_ENV : PHOTO_KEY_ENV;
  const keyHex = process.env[envKey];

  if (!keyHex) {
    throw new Error(`Encryption key not configured: ${envKey}`);
  }

  // Key should be 32 bytes (64 hex characters) for AES-256
  if (keyHex.length !== 64) {
    throw new Error(`Invalid encryption key length for ${envKey}. Expected 64 hex characters.`);
  }

  return Buffer.from(keyHex, "hex");
}

/**
 * Derive a unique key for each encryption operation using scrypt
 * This provides additional security through key stretching
 */
function deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
  return scryptSync(masterKey, salt, KEY_LENGTH);
}

/**
 * Encrypt a string value using AES-256-GCM
 *
 * @param plaintext - The string to encrypt
 * @param keyType - The type of encryption key to use
 * @returns Encrypted data object that can be stored in database
 */
export function encryptField(
  plaintext: string,
  keyType: EncryptionKeyType = "medical"
): EncryptedData {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty value");
  }

  const masterKey = getEncryptionKey(keyType);
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = deriveKey(masterKey, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    salt: salt.toString("base64"),
    version: 1,
  };
}

/**
 * Decrypt an encrypted field value
 *
 * @param encryptedData - The encrypted data object from database
 * @param keyType - The type of encryption key to use
 * @returns Decrypted plaintext string
 */
export function decryptField(
  encryptedData: EncryptedData,
  keyType: EncryptionKeyType = "medical"
): string {
  if (!encryptedData || !encryptedData.encrypted) {
    throw new Error("Invalid encrypted data");
  }

  const masterKey = getEncryptionKey(keyType);
  const salt = Buffer.from(encryptedData.salt, "base64");
  const derivedKey = deriveKey(masterKey, salt);
  const iv = Buffer.from(encryptedData.iv, "base64");
  const authTag = Buffer.from(encryptedData.authTag, "base64");
  const encrypted = Buffer.from(encryptedData.encrypted, "base64");

  const decipher = createDecipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Encrypt an object's specified fields
 *
 * @param data - Object containing fields to encrypt
 * @param fieldsToEncrypt - Array of field names to encrypt
 * @param keyType - The type of encryption key to use
 * @returns Object with specified fields encrypted
 */
export function encryptObjectFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToEncrypt: (keyof T)[],
  keyType: EncryptionKeyType = "medical"
): T {
  const result = { ...data };

  for (const field of fieldsToEncrypt) {
    const value = data[field];
    if (value !== null && value !== undefined) {
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      (result as Record<string, unknown>)[field as string] = encryptField(stringValue, keyType);
    }
  }

  return result;
}

/**
 * Decrypt an object's specified fields
 *
 * @param data - Object containing encrypted fields
 * @param fieldsToDecrypt - Array of field names to decrypt
 * @param keyType - The type of encryption key to use
 * @param parseJson - Whether to parse decrypted values as JSON
 * @returns Object with specified fields decrypted
 */
export function decryptObjectFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToDecrypt: (keyof T)[],
  keyType: EncryptionKeyType = "medical",
  parseJson: boolean = false
): T {
  const result = { ...data };

  for (const field of fieldsToDecrypt) {
    const encryptedValue = data[field] as EncryptedData | null | undefined;
    if (encryptedValue && typeof encryptedValue === "object" && "encrypted" in encryptedValue) {
      const decrypted = decryptField(encryptedValue, keyType);
      (result as Record<string, unknown>)[field as string] = parseJson
        ? JSON.parse(decrypted)
        : decrypted;
    }
  }

  return result;
}

/**
 * Check if a value is encrypted (has the expected structure)
 */
export function isEncrypted(value: unknown): value is EncryptedData {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.encrypted === "string" &&
    typeof obj.iv === "string" &&
    typeof obj.authTag === "string" &&
    typeof obj.salt === "string" &&
    typeof obj.version === "number"
  );
}

/**
 * Hash a value for searching (one-way, deterministic)
 * Use this when you need to search encrypted fields
 * WARNING: This reduces security - use sparingly
 */
export function hashForSearch(
  value: string,
  keyType: EncryptionKeyType = "medical"
): string {
  const masterKey = getEncryptionKey(keyType);
  // Use a fixed salt for deterministic hashing
  const fixedSalt = Buffer.from("strenx-search-salt-v1");
  const hash = scryptSync(value.toLowerCase().trim(), Buffer.concat([masterKey, fixedSalt]), 32);
  return hash.toString("base64");
}

/**
 * Medical data fields that should be encrypted
 */
export const MEDICAL_ENCRYPTED_FIELDS = [
  "medical_conditions",
  "surgeries",
  "medications",
  "allergies",
  "family_history",
  "blood_values",
  "notes",
] as const;

/**
 * Photo metadata fields that should be encrypted
 */
export const PHOTO_ENCRYPTED_FIELDS = [
  "storage_path",
  "metadata",
] as const;
