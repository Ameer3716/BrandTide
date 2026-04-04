import mongoose from 'mongoose'

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
      delete ret.__v
      return ret
    }
  },
  toObject: {
    getters: true,
    transform: function(doc, ret) {
      delete ret.__v
      return ret
    }
  }
})

// Indexes for faster queries
reviewSchema.index({ userId: 1, createdAt: -1 })
reviewSchema.index({ userId: 1, 'sentiment.label': 1 })
reviewSchema.index({ userId: 1, 'sentiment.label': 1, 'sentiment.confidence': -1 })
reviewSchema.index({ brand: 1, productId: 1 })
reviewSchema.index({ productId: 1 })

export default mongoose.model('Review', reviewSchema)
