import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['sentiment', 'topic', 'trend', 'comprehensive'],
    default: 'comprehensive'
  },
  schedule: {
    frequency: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly'],
      default: 'once'
    },
    nextRun: Date,
    lastRun: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  filters: {
    dateRange: {
      start: Date,
      end: Date
    },
    brands: [String],
    products: [String],
    sentiments: [String]
  },
  sections: [{
    type: String,
    enum: ['overview', 'sentiment', 'topics', 'trends', 'highlights', 'recommendations']
  }],
  format: {
    type: String,
    enum: ['pdf', 'excel', 'json'],
    default: 'pdf'
  },
  recipients: [{
    email: String,
    name: String
  }],
  generatedFiles: [{
    filename: String,
    url: String,
    size: Number,
    createdAt: Date
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'draft'
  }
}, {
  timestamps: true
})

reportSchema.index({ userId: 1, status: 1 })

export default mongoose.model('Report', reportSchema)
