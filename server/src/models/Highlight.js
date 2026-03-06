import mongoose from 'mongoose'

const highlightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  snippet: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['positive', 'negative', 'feature_request', 'bug_report'],
    required: true
  },
  product: {
    productId: String,
    productName: String,
    brand: String
  },
  frequency: {
    type: Number,
    default: 1
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  tags: [String],
  isBookmarked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

highlightSchema.index({ userId: 1, type: 1 })

export default mongoose.model('Highlight', highlightSchema)
