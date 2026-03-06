import mongoose from 'mongoose'

const dashboardMetricSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  sentimentDistribution: {
    positive: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
    negative: { type: Number, default: 0 }
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  averageConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  topBrands: [{
    brand: String,
    count: Number,
    avgSentiment: Number
  }],
  topProducts: [{
    productId: String,
    productName: String,
    brand: String,
    count: Number,
    sentiment: String
  }],
  topTopics: [{
    name: String,
    count: Number,
    sentiment: String
  }],
  trends: {
    sentimentChange: Number, // percentage change from previous period
    volumeChange: Number,
    emergingTopics: [String]
  }
}, {
  timestamps: true
})

// Compound index for efficient date-based queries
dashboardMetricSchema.index({ userId: 1, date: -1 })

export default mongoose.model('DashboardMetric', dashboardMetricSchema)
