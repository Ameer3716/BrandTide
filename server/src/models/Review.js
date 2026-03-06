import mongoose from 'mongoose'
import { encrypt, decrypt } from '../utils/encryption.js'

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Review text is required']
  },
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  sentiment: {
    label: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    }
  },
  topics: [{
    name: String,
    confidence: Number
  }],
  language: {
    type: String,
    default: 'en'
  },
  source: {
    type: String,
    enum: ['csv', 'manual', 'api'],
    default: 'manual'
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: {
    getters: true,
    transform: function(doc, ret) {
      if (ret.text) {
        ret.text = decrypt(ret.text)
      }
      if (ret.productName) {
        ret.productName = decrypt(ret.productName)
      }
      if (ret.brand) {
        ret.brand = decrypt(ret.brand)
      }
      delete ret.__v
      return ret
    }
  },
  toObject: {
    getters: true,
    transform: function(doc, ret) {
      if (ret.text) {
        ret.text = decrypt(ret.text)
      }
      if (ret.productName) {
        ret.productName = decrypt(ret.productName)
      }
      if (ret.brand) {
        ret.brand = decrypt(ret.brand)
      }
      delete ret.__v
      return ret
    }
  }
})

// Pre-save hook to encrypt sensitive fields
reviewSchema.pre('save', function(next) {
  if (this.isModified('text') && this.text) {
    this.text = encrypt(this.text)
  }
  if (this.isModified('productName') && this.productName) {
    this.productName = encrypt(this.productName)
  }
  if (this.isModified('brand') && this.brand) {
    this.brand = encrypt(this.brand)
  }
  next()
})

// Indexes for faster queries
reviewSchema.index({ userId: 1, createdAt: -1 })
reviewSchema.index({ userId: 1, 'sentiment.label': 1 })
reviewSchema.index({ userId: 1, 'sentiment.label': 1, 'sentiment.confidence': -1 })
reviewSchema.index({ brand: 1, productId: 1 })
reviewSchema.index({ productId: 1 })

export default mongoose.model('Review', reviewSchema)
