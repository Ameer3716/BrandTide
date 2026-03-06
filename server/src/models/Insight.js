import mongoose from 'mongoose'

const insightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['topic', 'trend', 'sentiment_shift', 'anomaly'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['performance', 'quality', 'service', 'price', 'features', 'other'],
    default: 'other'
  },
  sentiment: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative'],
    required: true
  },
  impact: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  affectedProducts: [{
    productId: String,
    productName: String,
    brand: String
  }],
  metrics: {
    frequency: Number,
    trendDirection: String, // 'up', 'down', 'stable'
    changePercent: Number
  },
  dateRange: {
    start: Date,
    end: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

insightSchema.index({ userId: 1, type: 1, createdAt: -1 })

export default mongoose.model('Insight', insightSchema)
