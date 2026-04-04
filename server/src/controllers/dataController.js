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
      Brand.countDocuments({ userId, isActive: true, name: { $nin: ['General', 'Unknown', 'N/A', 'Other'] } }),
      Product.countDocuments({ userId, isActive: true, name: { $nin: ['Review', 'Product', 'Item', 'N/A', 'Other'] } })
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
    const { brand, product } = req.query
    
    // Build aggregation pipeline with case-insensitive filtering
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId)
        }
      }
    ]
    
    // Add brand filter if provided (case-insensitive)
    if (brand && brand !== '') {
      pipeline.push({
        $match: {
          $expr: {
            $eq: [
              { $toLower: '$brand' },
              brand.toLowerCase()
            ]
          }
        }
      })
    }
    
    // Add product filter if provided (case-insensitive)
    if (product && product !== '') {
      pipeline.push({
        $match: {
          $expr: {
            $eq: [
              { $toLower: '$productName' },
              product.toLowerCase()
            ]
          }
        }
      })
    }
    
    // Use facet to run both aggregations in a single query
    pipeline.push({
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
    })
    
    const results = await Review.aggregate(pipeline)
    
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
    const { kind = 'pos', limit = 10, brand, product, topic } = req.query
    
    const sentimentLabel = kind === 'pos' ? 'Positive' : 'Negative'
    
    // Build aggregation pipeline for case-insensitive filtering
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          'sentiment.label': sentimentLabel
        }
      }
    ]
    
    // Add brand filter if provided (case-insensitive)
    if (brand && brand !== '') {
      pipeline.push({
        $match: {
          $expr: {
            $eq: [
              { $toLower: '$brand' },
              brand.toLowerCase()
            ]
          }
        }
      })
    }
    
    // Add product filter if provided (case-insensitive)
    if (product && product !== '') {
      pipeline.push({
        $match: {
          $expr: {
            $eq: [
              { $toLower: '$productName' },
              product.toLowerCase()
            ]
          }
        }
      })
    }
    
    // Add topic filter if provided (case-insensitive)
    if (topic && topic !== '') {
      pipeline.push({
        $match: {
          'topics.name': {
            $regex: topic,
            $options: 'i'
          }
        }
      })
    }
    
    // Sort and limit
    pipeline.push(
      { $sort: { 'sentiment.confidence': -1 } },
      { $limit: parseInt(limit) },
      { $project: {
        _id: 1,
        text: 1,
        productId: 1,
        productName: 1,
        brand: 1,
        'sentiment.confidence': 1,
        topics: 1
      }}
    )
    
    const reviews = await Review.aggregate(pipeline)
    
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
      conf: r.sentiment.confidence,
      topics: r.topics || []
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
    
    // Get unique brands from actual review data (only from user's uploaded documents)
    const brandsFromReviews = await Review.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$brand' } },
      { $sort: { _id: 1 } }
    ])
    
    const genericBrands = ['general', 'unknown', 'n/a', 'other']
    const brands = brandsFromReviews
      .map(b => b._id)
      .filter(b => b && b.trim() && !genericBrands.includes(b.toLowerCase())) // Filter out null/empty and generic brands
    
    res.json({
      success: true,
      data: brands
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
    
    // Build aggregation pipeline from actual review data
    const pipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(userId) } }
    ]
    
    // Add brand filter if provided (case-insensitive)
    if (brand && brand !== '') {
      pipeline.push({
        $match: {
          $expr: {
            $eq: [{ $toLower: '$brand' }, brand.toLowerCase()]
          }
        }
      })
    }
    
    // Group by product to get unique products with their details
    pipeline.push(
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          brand: { $first: '$brand' }
        }
      },
      { $sort: { productName: 1 } }
    )
    
    const products = await Review.aggregate(pipeline)
    
    const genericProducts = ['review', 'product', 'item', 'n/a', 'other']
    const result = products
      .map(p => ({
        id: p._id,
        name: p.productName,
        brand: p.brand
      }))
      .filter(p => p.name && p.name.trim() && !genericProducts.includes(p.name.toLowerCase())) // Filter out null/empty and generic products
    
    res.json({
      success: true,
      data: result
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

// @desc    Get topics aggregated from review data
// @route   GET /api/data/topics
// @access  Private
export const getTopics = async (req, res) => {
  try {
    const userId = req.user._id
    const { brand, product } = req.query

    // Build aggregation pipeline with case-insensitive filtering
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId)
        }
      }
    ]
    
    // Add brand filter if provided (case-insensitive)
    if (brand && brand !== '') {
      pipeline.push({
        $match: {
          $expr: {
            $eq: [
              { $toLower: '$brand' },
              brand.toLowerCase()
            ]
          }
        }
      })
    }
    
    // Add product filter if provided (case-insensitive)
    if (product && product !== '') {
      pipeline.push({
        $match: {
          $expr: {
            $eq: [
              { $toLower: '$productName' },
              product.toLowerCase()
            ]
          }
        }
      })
    }
    
    // Group and aggregate topics
    pipeline.push(
      { $unwind: '$topics' },
      { $group: {
        _id: '$topics.name',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$topics.confidence' }
      }},
      { $sort: { count: -1 } },
      { $limit: 20 }
    )
    
    const topicAgg = await Review.aggregate(pipeline)
    
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
