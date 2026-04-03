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
    // Auto-initialization is disabled - only user-uploaded data is shown
    res.json({
      success: false,
      message: 'Auto-initialization is disabled. Please upload a CSV file to populate your data.'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initialize data',
      error: error.message
    })
  }
}
