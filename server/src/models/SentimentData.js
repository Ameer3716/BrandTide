import mongoose from 'mongoose'

const sentimentDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  positive: {
    type: Number,
    default: 0
  },
  neutral: {
    type: Number,
    default: 0
  },
  negative: {
    type: Number,
    default: 0
  },
  brand: {
    type: String,
    default: 'all'
  },
  product: {
    type: String,
    default: 'all'
  }
}, {
  timestamps: true
})

sentimentDataSchema.index({ userId: 1, date: 1 })
sentimentDataSchema.index({ userId: 1, brand: 1, date: 1 })

export default mongoose.model('SentimentData', sentimentDataSchema)
