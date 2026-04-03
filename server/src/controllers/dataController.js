import Review from '../models/Review.js'
import Product from '../models/Product.js'
import Brand from '../models/Brand.js'
import SentimentData from '../models/SentimentData.js'
import dayjs from 'dayjs'
import mongoose from 'mongoose'
import { decrypt } from '../utils/encryption.js'

// @desc    Get dashboard metrics
// @route   GET /api/data/metrics
// @access  Private
export const getMetrics = async (req, res) => {
  try {
    const userId = req.user._id
    
    // Run all queries in parallel for faster response
    const [sentimentStats, brandsCount, productsCount] = await Promise.all([
      Review.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 }
        }}
      ]),
      Brand.countDocuments({ userId, isActive: true }),
      Product.countDocuments({ userId, isActive: true })
    ])
    
    const distribution = { Positive: 0, Neutral: 0, Negative: 0 }
    let totalReviews = 0
    sentimentStats.forEach(stat => {
      distribution[stat._id] = stat.count
      totalReviews += stat.count
    })
    
    const positivePercent = totalReviews > 0 ? Math.round((distribution.Positive / totalReviews) * 100) : 0
    const neutralPercent = totalReviews > 0 ? Math.round((distribution.Neutral / totalReviews) * 100) : 0
    const negativePercent = totalReviews > 0 ? Math.round((distribution.Negative / totalReviews) * 100) : 0
    
    res.json({
      success: true,
      data: {
        totalReviews,
        brandsCount,
        productsCount,
        distribution: [
          { name: 'Positive', value: positivePercent },
          { name: 'Neutral', value: neutralPercent },
          { name: 'Negative', value: negativePercent }
        ],
        sentiment: {
          positive: distribution.Positive,
          neutral: distribution.Neutral,
          negative: distribution.Negative
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics',
      error: error.message
    })
  }
}

// @desc    Get sentiment trend
// @route   GET /api/data/sentiment-trend
// @access  Private
export const getSentimentTrend = async (req, res) => {
  try {
    const userId = req.user._id
    const { days = 30 } = req.query
    
    const startDate = dayjs().subtract(days, 'day').startOf('day').toDate()
    
    const trendData = await SentimentData.find({
      userId,
      date: { $gte: startDate }
    })
    .select('date positive neutral negative')
    .sort({ date: 1 })
    .lean()
    
    if (trendData.length === 0) {
      // Fallback: aggregate from Review collection directly
      const reviewTrend = await Review.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          pos: { $sum: { $cond: [{ $eq: ['$sentiment.label', 'Positive'] }, 1, 0] } },
          neu: { $sum: { $cond: [{ $eq: ['$sentiment.label', 'Neutral'] }, 1, 0] } },
          neg: { $sum: { $cond: [{ $eq: ['$sentiment.label', 'Negative'] }, 1, 0] } }
        }},
        { $sort: { _id: 1 } }
      ])
      
      const formattedReviewTrend = reviewTrend.map(item => ({
        date: item._id,
        pos: item.pos,
        neu: item.neu,
        neg: item.neg
      }))
      
      return res.json({ success: true, data: formattedReviewTrend })
    }
    
    const formattedData = trendData.map(item => ({
      date: dayjs(item.date).format('YYYY-MM-DD'),
      pos: item.positive,
      neu: item.neutral,
      neg: item.negative
    }))
    
    res.json({ success: true, data: formattedData })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trend',
      error: error.message
    })
  }
}

// @desc    Get top products
// @route   GET /api/data/top-products
// @access  Private
export const getTopProducts = async (req, res) => {
  try {
    const userId = req.user._id
    
    // Use facet to run both aggregations in a single query
    const results = await Review.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $facet: {
          positive: [
            { $match: { 'sentiment.label': 'Positive' } },
            { $group: {
              _id: { productId: '$productId', productName: '$productName', brand: '$brand' },
              count: { $sum: 1 },
              avgConf: { $avg: '$sentiment.confidence' }
            }},
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          negative: [
            { $match: { 'sentiment.label': 'Negative' } },
            { $group: {
              _id: { productId: '$productId', productName: '$productName', brand: '$brand' },
              count: { $sum: 1 },
              avgConf: { $avg: '$sentiment.confidence' }
            }},
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ])
    
    const topPositive = results[0].positive
    const topNegative = results[0].negative
    
    res.json({
      success: true,
      data: {
        pos: topPositive.map(p => ({
          id: p._id.productId,
          name: decrypt(p._id.productName),
          brand: decrypt(p._id.brand),
          count: p.count,
          conf: Math.round(p.avgConf * 100) / 100
        })),
        neg: topNegative.map(p => ({
          id: p._id.productId,
          name: decrypt(p._id.productName),
          brand: decrypt(p._id.brand),
          count: p.count,
          conf: Math.round(p.avgConf * 100) / 100
        }))
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top products',
      error: error.message
    })
  }
}

// @desc    Get representative reviews
// @route   GET /api/data/representative-reviews
// @access  Private
export const getRepresentativeReviews = async (req, res) => {
  try {
    const userId = req.user._id
    const { kind = 'pos', limit = 10 } = req.query
    
    const sentimentLabel = kind === 'pos' ? 'Positive' : 'Negative'
    
    // Use lean() and select only needed fields for better performance
    const reviews = await Review.find({
      userId,
      'sentiment.label': sentimentLabel
    })
    .select('text productId productName brand sentiment.confidence')
    .sort({ 'sentiment.confidence': -1 })
    .limit(parseInt(limit))
    .lean()
    
    // Decrypt only the fields we need
    const formatted = reviews.map(r => ({
      id: r._id,
      snippet: decrypt(r.text).substring(0, 100) + (decrypt(r.text).length > 100 ? '...' : ''),
      product: {
        id: r.productId,
        name: decrypt(r.productName),
        brand: decrypt(r.brand)
      },
      freq: 1,
      conf: r.sentiment.confidence
    }))
    
    res.json({ success: true, data: formatted })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    })
  }
}

// @desc    Get brands
// @route   GET /api/data/brands
// @access  Private
export const getBrands = async (req, res) => {
  try {
    const userId = req.user._id
    
    const brands = await Brand.find({ userId, isActive: true }).select('name').lean()
    
    res.json({
      success: true,
      data: brands.map(b => b.name)
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brands',
      error: error.message
    })
  }
}

// @desc    Get products
// @route   GET /api/data/products
// @access  Private
export const getProducts = async (req, res) => {
  try {
    const userId = req.user._id
    const { brand } = req.query
    
    const query = { userId, isActive: true }
    if (brand) query.brand = brand
    
    const products = await Product.find(query).select('productId name brand').lean()
    
    res.json({
      success: true,
      data: products.map(p => ({
        id: p.productId,
        name: p.name,
        brand: p.brand
      }))
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    })
  }
}

// @desc    Initialize sample data for user
// @route   POST /api/data/init-sample-data
// @access  Private
export const initializeSampleData = async (req, res) => {
  try {
    const userId = req.user._id
    
    // Check if user already has data
    const existingBrands = await Brand.countDocuments({ userId })
    if (existingBrands > 0) {
      return res.json({
        success: true,
        message: 'Data already initialized'
      })
    }
    
    // Create brands
    const brands = await Brand.insertMany([
      { name: 'Aurora', userId },
      { name: 'Nimbus', userId },
      { name: 'Vertex', userId }
    ])
    
    // Create products
    await Product.insertMany([
      { productId: 'P-100', name: 'Aurora X1', brand: 'Aurora', userId, brandRef: brands[0]._id },
      { productId: 'P-101', name: 'Aurora Mini', brand: 'Aurora', userId, brandRef: brands[0]._id },
      { productId: 'P-200', name: 'Nimbus Air', brand: 'Nimbus', userId, brandRef: brands[1]._id },
      { productId: 'P-201', name: 'Nimbus Max', brand: 'Nimbus', userId, brandRef: brands[1]._id },
      { productId: 'P-300', name: 'Vertex Pro', brand: 'Vertex', userId, brandRef: brands[2]._id },
      { productId: 'P-301', name: 'Vertex Lite', brand: 'Vertex', userId, brandRef: brands[2]._id }
    ])
    
    // Generate sentiment trend data for last 30 days
    const sentimentData = []
    for (let i = 29; i >= 0; i--) {
      sentimentData.push({
        userId,
        date: dayjs().subtract(i, 'day').toDate(),
        positive: Math.floor(40 + Math.random() * 40),
        neutral: Math.floor(10 + Math.random() * 20),
        negative: Math.floor(10 + Math.random() * 30)
      })
    }
    await SentimentData.insertMany(sentimentData)
    
    // Create sample reviews with encrypted data
    const sampleReviews = []
    const reviewTexts = [
      { text: 'Great battery life! Lasts all day with heavy use.', sentiment: 'Positive', product: 'P-100', productName: 'Aurora X1', brand: 'Aurora' },
      { text: 'Camera quality is outstanding, especially in low light.', sentiment: 'Positive', product: 'P-100', productName: 'Aurora X1', brand: 'Aurora' },
      { text: 'Fast delivery and excellent packaging.', sentiment: 'Positive', product: 'P-101', productName: 'Aurora Mini', brand: 'Aurora' },
      { text: 'Value for money is exceptional.', sentiment: 'Positive', product: 'P-200', productName: 'Nimbus Air', brand: 'Nimbus' },
      { text: 'Build quality feels premium and solid.', sentiment: 'Positive', product: 'P-201', productName: 'Nimbus Max', brand: 'Nimbus' },
      { text: 'Delivery was delayed by 3 days.', sentiment: 'Negative', product: 'P-100', productName: 'Aurora X1', brand: 'Aurora' },
      { text: 'Device overheats during gaming.', sentiment: 'Negative', product: 'P-200', productName: 'Nimbus Air', brand: 'Nimbus' },
      { text: 'Battery drains too quickly.', sentiment: 'Negative', product: 'P-300', productName: 'Vertex Pro', brand: 'Vertex' },
      { text: 'Camera performance is just okay.', sentiment: 'Neutral', product: 'P-101', productName: 'Aurora Mini', brand: 'Aurora' },
      { text: 'Decent product for the price.', sentiment: 'Neutral', product: 'P-201', productName: 'Nimbus Max', brand: 'Nimbus' },
      { text: 'Love the sleek design and premium feel!', sentiment: 'Positive', product: 'P-100', productName: 'Aurora X1', brand: 'Aurora' },
      { text: 'Screen is vibrant and responsive.', sentiment: 'Positive', product: 'P-200', productName: 'Nimbus Air', brand: 'Nimbus' },
      { text: 'Very satisfied with the purchase.', sentiment: 'Positive', product: 'P-300', productName: 'Vertex Pro', brand: 'Vertex' },
      { text: 'Customer support was very helpful.', sentiment: 'Positive', product: 'P-101', productName: 'Aurora Mini', brand: 'Aurora' },
      { text: 'Fast charging is a game changer.', sentiment: 'Positive', product: 'P-201', productName: 'Nimbus Max', brand: 'Nimbus' },
      { text: 'Screen has some light bleeding issues.', sentiment: 'Negative', product: 'P-300', productName: 'Vertex Pro', brand: 'Vertex' },
      { text: 'Audio quality is below expectations.', sentiment: 'Negative', product: 'P-101', productName: 'Aurora Mini', brand: 'Aurora' },
      { text: 'Price is a bit high for the features.', sentiment: 'Negative', product: 'P-200', productName: 'Nimbus Air', brand: 'Nimbus' },
      { text: 'Average performance, nothing special.', sentiment: 'Neutral', product: 'P-300', productName: 'Vertex Pro', brand: 'Vertex' },
      { text: 'Does the job, no complaints.', sentiment: 'Neutral', product: 'P-100', productName: 'Aurora X1', brand: 'Aurora' }
    ]
    
    for (let i = 0; i < 60; i++) {
      const sample = reviewTexts[i % reviewTexts.length]
      const daysAgo = Math.floor(Math.random() * 30)
      const review = new Review({
        userId,
        text: sample.text,
        productId: sample.product,
        productName: sample.productName,
        brand: sample.brand,
        sentiment: {
          label: sample.sentiment,
          confidence: 0.75 + Math.random() * 0.2
        },
        topics: [
          { name: 'Battery', confidence: Math.random() },
          { name: 'Camera', confidence: Math.random() }
        ],
        createdAt: dayjs().subtract(daysAgo, 'day').toDate()
      })
      await review.save() // Save individually to trigger encryption
    }
    
    console.log(`✅ Initialized ${60} encrypted reviews for user ${userId}`)
    
    res.json({
      success: true,
      message: 'Sample data initialized successfully with encrypted reviews'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initialize data',
      error: error.message
    })
  }
}

// @desc    Get topics aggregated from review data
// @route   GET /api/data/topics
// @access  Private
export const getTopics = async (req, res) => {
  try {
    const userId = req.user._id
    
    const topicAgg = await Review.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$topics' },
      { $group: {
        _id: '$topics.name',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$topics.confidence' }
      }},
      { $sort: { count: -1 } },
      { $limit: 20 }
    ])
    
    const topics = topicAgg.map(t => ({
      label: t._id,
      count: t.count,
      confidence: Math.round(t.avgConfidence * 100) / 100
    }))
    
    res.json({ success: true, data: topics })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch topics',
      error: error.message
    })
  }
}
