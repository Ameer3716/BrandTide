import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { hash } from '../utils/encryption.js'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required']
  },
  emailHash: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  avatar: {
    type: String,
    default: null
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allow null values, only enforce uniqueness when present
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  },
  // Stripe subscription fields
  stripeCustomerId: {
    type: String,
    default: null
  },
  subscriptionId: {
    type: String,
    default: null
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete'],
    default: 'none'
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'pro', 'enterprise', 'none'],
    default: 'none'
  },
  trialEndsAt: {
    type: Date,
    default: null
  },
  subscriptionEndsAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // adds createdAt, updatedAt
  toJSON: { 
    getters: true,
    transform: function(doc, ret) {
      delete ret.emailHash
      delete ret.__v
      delete ret.password
      return ret
    }
  },
  toObject: { 
    getters: true,
    transform: function(doc, ret) {
      delete ret.emailHash
      delete ret.__v
      return ret
    }
  }
})

// Pre-save hook to hash email
userSchema.pre('save', function(next) {
  // Hash email if modified (for searching)
  if (this.isModified('email')) {
    const plainEmail = this.email.toLowerCase().trim()
    
    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(plainEmail)) {
      return next(new Error('Please provide a valid email'))
    }
    
    // Create hash for searching
    this.emailHash = hash(plainEmail)
    // Store plaintext email
    this.email = plainEmail
  }
  next()
})

// Static method to find by email
userSchema.statics.findByEmail = async function(email) {
  const emailHash = hash(email.toLowerCase().trim())
  return this.findOne({ emailHash })
}

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  if (this.password) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date()
  await this.save()
}

export default mongoose.model('User', userSchema)
