import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env from server root directory
dotenv.config({ path: join(__dirname, '../../.env') })

export default {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/brandtide',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  emailHost: process.env.EMAIL_HOST,
  emailPort: parseInt(process.env.EMAIL_PORT) || 587,
  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASSWORD,
  emailFrom: process.env.EMAIL_FROM || 'noreply@brandtide.com',
  emailFromName: process.env.EMAIL_FROM_NAME || 'BrandTide',
  encryptionKey: process.env.ENCRYPTION_KEY || 'dev_encryption_key_change_in_production_must_be_32_chars_long',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    prices: {
      free: process.env.STRIPE_PRICE_FREE || '',       // Price ID for Free trial ($0 with trial)
      pro: process.env.STRIPE_PRICE_PRO || '',          // Price ID for Pro plan ($49/month)
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '' // Price ID for Enterprise plan
    }
  }
}
