import mongoose from 'mongoose'
import { encrypt, decrypt } from '../utils/encryption.js'

const batchJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  rowCount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  results: {
    positive: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
    negative: { type: Number, default: 0 }
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      if (ret.fileName) {
        ret.fileName = decrypt(ret.fileName)
      }
      delete ret.__v
      return ret
    }
  }
})

// Encrypt sensitive fields before saving
batchJobSchema.pre('save', function(next) {
  if (this.isModified('fileName') && this.fileName) {
    this.fileName = encrypt(this.fileName)
  }
  next()
})

export default mongoose.model('BatchJob', batchJobSchema)
