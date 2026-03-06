import crypto from 'crypto'
import config from '../config/config.js'

// Algorithm for encryption
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const TAG_POSITION = SALT_LENGTH + IV_LENGTH
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH

/**
 * Derives a key from the secret using PBKDF2
 */
function getKey(salt) {
  return crypto.pbkdf2Sync(
    config.encryptionKey,
    salt,
    100000,
    32,
    'sha512'
  )
}

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted string
 */
export function encrypt(text) {
  // ENCRYPTION COMMENTED OUT FOR PERFORMANCE
  return text
  
  /* if (!text) return text
  
  const iv = crypto.randomBytes(IV_LENGTH)
  const salt = crypto.randomBytes(SALT_LENGTH)
  const key = getKey(salt)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(String(text), 'utf8'),
    cipher.final()
  ])
  
  const tag = cipher.getAuthTag()
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64') */
}

/**
 * Decrypt sensitive data
 * @param {string} data - Encrypted string
 * @returns {string} - Decrypted plain text
 */
export function decrypt(data) {
  // DECRYPTION COMMENTED OUT FOR PERFORMANCE
  return data
  
  /* if (!data) return data
  
  try {
    const buffer = Buffer.from(data, 'base64')
    
    const salt = buffer.slice(0, SALT_LENGTH)
    const iv = buffer.slice(SALT_LENGTH, TAG_POSITION)
    const tag = buffer.slice(TAG_POSITION, ENCRYPTED_POSITION)
    const encrypted = buffer.slice(ENCRYPTED_POSITION)
    
    const key = getKey(salt)
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    return decipher.update(encrypted) + decipher.final('utf8')
  } catch (error) {
    console.error('Decryption error:', error.message)
    return data // Return original if decryption fails
  } */
}

/**
 * Hash data (one-way, for comparison)
 */
export function hash(text) {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex')
}
