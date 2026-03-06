import DashboardMetric from '../models/DashboardMetric.js'
import Review from '../models/Review.js'
import dayjs from 'dayjs'

// @desc    Get dashboard metrics
// @route   GET /api/dashboard/metrics
// @access  Private
export const getDashboardMetrics = async (req, res) => {
  try {
    const { days = 30 } = req.query
    const userId = req.user._id
    
    // Calculate date range
    const endDate = dayjs().endOf('day').toDate()
    const startDate = dayjs().subtract(days, 'day').startOf('day').toDate()
    
    // Fetch reviews for the period
    const reviews = await Review.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate }
    })
    
    // Calculate sentiment distribution
    const sentimentDist = {
      positive: 0,
      neutral: 0,
      negative: 0
    }
    
    reviews.forEach(review => {
      const label = review.sentiment.label.toLowerCase()
      sentimentDist[label] = (sentimentDist[label] || 0) + 1
    })
    
    // Calculate time series data
    const timeSeries = []
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
      const dayReviews = reviews.filter(r => 
        dayjs(r.createdAt).format('YYYY-MM-DD') === date
      )
      
      timeSeries.push({
        date,
        pos: dayReviews.filter(r => r.sentiment.label === 'Positive').length,
        neu: dayReviews.filter(r => r.sentiment.label === 'Neutral').length,
        neg: dayReviews.filter(r => r.sentiment.label === 'Negative').length
      })
    }
    
    // Top products
    const productCounts = {}
    reviews.forEach(review => {
      const key = `${review.productId}|${review.productName}|${review.brand}`
      productCounts[key] = (productCounts[key] || 0) + 1
    })
    
    const topProducts = Object.entries(productCounts)
      .map(([key, count]) => {
        const [productId, productName, brand] = key.split('|')
        return { productId, productName, brand, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    res.json({
      success: true,
      data: {
        sentimentDistribution: [
          { name: 'Positive', value: sentimentDist.positive },
          { name: 'Neutral', value: sentimentDist.neutral },
          { name: 'Negative', value: sentimentDist.negative }
        ],
        timeSeries,
        topProducts,
        totalReviews: reviews.length,
        averageConfidence: reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.sentiment.confidence, 0) / reviews.length
          : 0
      }
    })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics',
      error: error.message
    })
  }
}

// @desc    Get overview stats
// @route   GET /api/dashboard/overview
// @access  Private
export const getOverview = async (req, res) => {
  try {
    const userId = req.user._id
    
    const totalReviews = await Review.countDocuments({ userId })
    
    const positiveReviews = await Review.countDocuments({
      userId,
      'sentiment.label': 'Positive'
    })
    
    const negativeReviews = await Review.countDocuments({
      userId,
      'sentiment.label': 'Negative'
    })
    
    const recentReviews = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
    
    res.json({
      success: true,
      data: {
        totalReviews,
        positiveReviews,
        negativeReviews,
        sentimentRatio: totalReviews > 0 ? (positiveReviews / totalReviews * 100).toFixed(1) : 0,
        recentReviews
      }
    })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overview',
      error: error.message
    })
  }
}

// @desc    Initialize sample data
// @route   POST /api/dashboard/init-sample
// @access  Private
export const initializeSampleData = async (req, res) => {
  try {
    const userId = req.user._id
    
    // Check if user already has reviews
    const existingCount = await Review.countDocuments({ userId })
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: 'User already has data',
        data: { initialized: false, count: existingCount }
      })
    }
    
    // Sample review texts
    const reviewTexts = [
      { text: 'Battery lasts all day even with GPS.', sentiment: 'Positive', conf: 0.92 },
      { text: 'Build quality feels premium for the price.', sentiment: 'Positive', conf: 0.88 },
      { text: 'Camera struggles in low light situations.', sentiment: 'Negative', conf: 0.85 },
      { text: 'Customer support was quick and helpful.', sentiment: 'Positive', conf: 0.95 },
      { text: 'The latest update fixed most of my issues.', sentiment: 'Neutral', conf: 0.75 },
      { text: 'The UI is smooth but has occasional stutters.', sentiment: 'Neutral', conf: 0.68 },
      { text: 'Great value and solid performance overall.', sentiment: 'Positive', conf: 0.91 },
      { text: 'Speaker quality is tinny at high volumes.', sentiment: 'Negative', conf: 0.82 },
      { text: 'Love the compact size and feel.', sentiment: 'Positive', conf: 0.89 },
      { text: 'Shipping took longer than expected.', sentiment: 'Negative', conf: 0.79 }
    ]
    
    const products = [
      { id: 'P-100', brand: 'Aurora', name: 'Aurora X1' },
      { id: 'P-101', brand: 'Aurora', name: 'Aurora Mini' },
      { id: 'P-200', brand: 'Nimbus', name: 'Nimbus Air' },
      { id: 'P-201', brand: 'Nimbus', name: 'Nimbus Max' },
      { id: 'P-300', brand: 'Vertex', name: 'Vertex Pro' },
      { id: 'P-301', brand: 'Vertex', name: 'Vertex Lite' }
    ]
    
    // Create sample reviews
    const sampleReviews = []
    for (let i = 0; i < 60; i++) {
      const review = reviewTexts[i % reviewTexts.length]
      const product = products[i % products.length]
      
      const newReview = new Review({
        userId,
        text: review.text,
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        sentiment: {
          label: review.sentiment,
          confidence: review.conf
        },
        source: 'manual',
        createdAt: dayjs().subtract(Math.floor(Math.random() * 30), 'day').toDate()
      })
      
      await newReview.save() // Use save() to trigger pre-save hooks for encryption
      sampleReviews.push(newReview)
    }
    
    res.json({
      success: true,
      message: 'Sample data initialized successfully',
      data: {
        initialized: true,
        reviewsCreated: sampleReviews.length
      }
    })
    
  } catch (error) {
    console.error('Initialize sample data error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to initialize sample data',
      error: error.message
    })
  }
}
