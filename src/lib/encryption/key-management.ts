/**
 * Key Management Utilities
 *
 * Utilities for generating and managing encryption keys.
 * These should only be run during setup, not in production code.
 */

import { randomBytes, createHash } from "crypto";

/**
 * Generate a new 256-bit encryption key
 * Run this once during setup and save to environment variables
 *
 * Usage: npx ts-node -e "require('./src/lib/encryption/key-management').generateEncryptionKey()"
 */
export function generateEncryptionKey(): string {
  const key = randomBytes(32); // 256 bits
  return key.toString("hex");
}

/**
 * Generate all required encryption keys
 * Run this once during initial setup
 */
export function generateAllKeys(): Record<string, string> {
  return {
    MEDICAL_ENCRYPTION_KEY: generateEncryptionKey(),
    PHOTO_ENCRYPTION_KEY: generateEncryptionKey(),
  };
}

/**
 * Derive a key ID from a key (for key rotation tracking)
 * This creates a non-reversible identifier for the key
 */
export function getKeyId(keyHex: string): string {
  const hash = createHash("sha256");
  hash.update(keyHex);
  return hash.digest("hex").substring(0, 16);
}

/**
 * Validate encryption key format
 */
export function validateKeyFormat(keyHex: string): { valid: boolean; error?: string } {
  if (!keyHex) {
    return { valid: false, error: "Key is empty" };
  }

  if (keyHex.length !== 64) {
    return {
      valid: false,
      error: `Key must be 64 hex characters (256 bits). Got ${keyHex.length} characters.`,
    };
  }

  if (!/^[0-9a-fA-F]+$/.test(keyHex)) {
    return { valid: false, error: "Key must contain only hexadecimal characters" };
  }

  return { valid: true };
}

/**
 * Check if all required encryption keys are configured
 */
export function checkEncryptionConfig(): {
  configured: boolean;
  missing: string[];
  errors: string[];
} {
  const requiredKeys = ["MEDICAL_ENCRYPTION_KEY", "PHOTO_ENCRYPTION_KEY"];
  const missing: string[] = [];
  const errors: string[] = [];

  for (const key of requiredKeys) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
    } else {
      const validation = validateKeyFormat(value);
      if (!validation.valid) {
        errors.push(`${key}: ${validation.error}`);
      }
    }
  }

  return {
    configured: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

/**
 * Print setup instructions for encryption keys
 */
export function printSetupInstructions(): void {
  console.log("\n=== Strenx Fitness Encryption Key Setup ===\n");

  const keys = generateAllKeys();

  console.log("Add the following to your .env.local file:\n");

  for (const [name, value] of Object.entries(keys)) {
    console.log(`${name}=${value}`);
  }

  console.log("\n⚠️  IMPORTANT:");
  console.log("  - Store these keys securely (use a secrets manager in production)");
  console.log("  - Never commit these keys to version control");
  console.log("  - Back up these keys - losing them means losing encrypted data");
  console.log("  - Use different keys for each environment (dev, staging, prod)\n");
}

// Allow running directly with ts-node for key generation
if (require.main === module) {
  printSetupInstructions();
}
