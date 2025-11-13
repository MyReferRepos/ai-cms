/**
 * Encryption utilities for sensitive data
 * Uses AES-256-GCM encryption
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Derive encryption key from secret
 */
function getKey(salt: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET

  if (!secret) {
    throw new Error('ENCRYPTION_SECRET or NEXTAUTH_SECRET must be set')
  }

  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha512')
}

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    const key = getKey(salt)

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    // Combine salt + iv + tag + encrypted data
    const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')])

    return result.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  try {
    const buffer = Buffer.from(encryptedData, 'base64')

    // Extract components
    const salt = buffer.subarray(0, SALT_LENGTH)
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = buffer.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    )
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

    const key = getKey(salt)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Hash data (one-way, for verification)
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}
