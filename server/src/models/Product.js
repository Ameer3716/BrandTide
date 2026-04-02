import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  brandRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },
  category: {
    type: String,
    default: 'General'
  },
  description: {
    type: String,
    default: ''
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Analytics
  reviewCount: {
    type: Number,
    default: 0
  },
  avgSentiment: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

productSchema.index({ brand: 1, productId: 1 })
productSchema.index({ userId: 1 })

export default mongoose.model('Product', productSchema)
