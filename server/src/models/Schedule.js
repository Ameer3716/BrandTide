import mongoose from 'mongoose'

const scheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  cadence: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  lastSent: {
    type: Date,
    default: null
  },
  nextSend: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
})

// Index for efficient queries
scheduleSchema.index({ userId: 1, active: 1 })
scheduleSchema.index({ nextSend: 1, active: 1 })

export default mongoose.model('Schedule', scheduleSchema)
