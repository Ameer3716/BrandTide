import Review from '../models/Review.js'
import Brand from '../models/Brand.js'
import Product from '../models/Product.js'
import SentimentData from '../models/SentimentData.js'
import dayjs from 'dayjs'

// ── ML Service configuration ────────────────────────────────────────────────
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:7860'

/**
 * Capitalize first letter of sentiment label to match DB enum: Positive, Neutral, Negative
 */
function capitalizeLabel(label) {
  if (!label) return 'Neutral'
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()
}

/**
 * Call the Python ML service for single-text sentiment classification.
 * Falls back to a simple keyword heuristic if the service is unreachable.
 */
async function classifySentiment(text) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(30000) // 30s timeout
    })

    if (!response.ok) {
      throw new Error(`ML service responded with ${response.status}`)
    }

    const result = await response.json()
    if (result.success && result.data) {
      return {
        label: result.data.label,
        confidence: result.data.confidence,
        scores: result.data.scores || {}
      }
    }
    throw new Error('Invalid ML response format')
  } catch (err) {
    console.warn('⚠️ ML service unavailable, using fallback:', err.message)
    return fallbackClassifier(text)
  }
}

/**
 * Call the Python ML service for batch classification.
 */
async function classifySentimentBatch(reviews) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviews }),
      signal: AbortSignal.timeout(120000) // 2min for large batches
    })

    if (!response.ok) {
      throw new Error(`ML service responded with ${response.status}`)
    }

    const result = await response.json()
    if (result.success && Array.isArray(result.data)) {
      return result.data
    }
    throw new Error('Invalid ML batch response format')
  } catch (err) {
    console.warn('⚠️ ML batch service unavailable, using fallback:', err.message)
    return reviews.map(r => ({
      ...r,
      label: fallbackClassifier(r.text || r.review_text || '').label,
      confidence: fallbackClassifier(r.text || r.review_text || '').confidence
    }))
  }
}

/**
 * Simple keyword-based fallback when ML service is down.
 */
function fallbackClassifier(text) {
  const words = text.toLowerCase()
  let score = 0.5

  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'best', 'awesome', 'fantastic']
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'poor', 'disappointing', 'horrible', 'useless']

  positiveWords.forEach(word => { if (words.includes(word)) score += 0.1 })
  negativeWords.forEach(word => { if (words.includes(word)) score -= 0.1 })

  const confidence = +(0.5 + Math.random() * 0.2).toFixed(4)

  if (score > 0.6) return { label: 'positive', confidence }
  if (score < 0.4) return { label: 'negative', confidence }
  return { label: 'neutral', confidence }
}

/**
 * Extract simple topic keywords from review text
 */
function extractTopics(text) {
  const topicKeywords = {
    'Battery': ['battery', 'charge', 'charging', 'power', 'drain', 'mah'],
    'Camera': ['camera', 'photo', 'picture', 'lens', 'selfie', 'video', 'zoom'],
    'Display': ['display', 'screen', 'resolution', 'amoled', 'oled', 'brightness'],
    'Performance': ['performance', 'speed', 'fast', 'slow', 'lag', 'processor', 'ram', 'gaming'],
    'Build Quality': ['build', 'quality', 'premium', 'solid', 'plastic', 'metal', 'glass', 'design'],
    'Price': ['price', 'value', 'expensive', 'cheap', 'affordable', 'money', 'cost', 'worth'],
    'Delivery': ['delivery', 'shipping', 'package', 'arrived', 'delayed', 'packaging'],
    'Customer Support': ['support', 'service', 'customer', 'warranty', 'helpline', 'response'],
    'Software': ['software', 'update', 'ui', 'interface', 'app', 'os', 'android', 'ios', 'bug'],
    'Heating': ['heat', 'hot', 'overheat', 'warm', 'temperature', 'heating'],
    'Storage': ['storage', 'memory', 'space', 'gb', 'internal'],
    'Sound': ['sound', 'speaker', 'audio', 'volume', 'bass', 'earphone', 'headphone']
  }

  const lower = text.toLowerCase()
  const found = []

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    const matchCount = keywords.filter(kw => lower.includes(kw)).length
    if (matchCount > 0) {
      found.push({ name: topic, confidence: Math.min(0.5 + matchCount * 0.2, 1.0) })
    }
  }

  return found.length > 0 ? found : [{ name: 'General', confidence: 0.5 }]
}

// @desc    Classify single review
// @route   POST /api/reviews/classifier/single
// @access  Private
export const classifySingle = async (req, res) => {
  try {
    const { text } = req.body
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Review text is required'
      })
    }
    
    // Classify sentiment via ML service
    const sentiment = await classifySentiment(text)
    
    res.json({
      success: true,
      data: {
        label: sentiment.label,
        confidence: sentiment.confidence,
        scores: sentiment.scores || {},
        lang: 'auto'
      }
    })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Classification failed',
      error: error.message
    })
  }
}

// @desc    Classify batch reviews AND save to database
// @route   POST /api/reviews/classifier/batch
// @access  Private
export const classifyBatch = async (req, res) => {
  try {
    const { reviews } = req.body
    const userId = req.user._id
    
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reviews array is required'
      })
    }
    
    // Normalize CSV column keys (lowercase + alias mapping)
    const COLUMN_ALIASES = {
      'review_text': 'text', 'review': 'text', 'comment': 'text', 'sentence': 'text',
      'product': 'product_name', 'productname': 'product_name',
      'productid': 'product_id',
      'brand_name': 'brand',
      'topic': 'topic', 'category': 'topic'
    }
    
    const normalizedReviews = reviews.map(row => {
      const normalized = {}
      for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.toLowerCase().trim()
        const standardKey = COLUMN_ALIASES[lowerKey] || lowerKey
        normalized[standardKey] = value
      }
      return normalized
    })
    
    // Prepare texts for ML service
    const mlReviews = normalizedReviews.map(r => ({
      ...r,
      text: r.text || ''
    }))
    
    // Classify via ML service (batch)
    const results = await classifySentimentBatch(mlReviews)
    
    // ── Save classified reviews to database ──────────────────────────────
    console.log(`💾 Saving ${results.length} classified reviews to database...`)
    
    // Collect unique brands and products from CSV data
    const brandSet = new Set()
    const productMap = new Map() // productId -> { name, brand }
    
    for (const row of normalizedReviews) {
      const brand = row.brand || 'Unknown'
      const productName = row.product_name || 'Unknown Product'
      const productId = row.product_id || `P-${productName.replace(/\s+/g, '-').substring(0, 20)}`
      
      brandSet.add(brand)
      if (!productMap.has(productId)) {
        productMap.set(productId, { name: productName, brand })
      }
    }
    
    // Upsert Brands
    for (const brandName of brandSet) {
      try {
        await Brand.findOneAndUpdate(
          { userId, name: brandName },
          { userId, name: brandName, isActive: true },
          { upsert: true, new: true }
        )
      } catch (e) {
        // Ignore duplicate key errors
        if (e.code !== 11000) console.warn('Brand upsert error:', e.message)
      }
    }
    
    // Upsert Products
    for (const [productId, info] of productMap.entries()) {
      try {
        await Product.findOneAndUpdate(
          { userId, productId },
          { userId, productId, name: info.name, brand: info.brand, isActive: true },
          { upsert: true, new: true }
        )
      } catch (e) {
        if (e.code !== 11000) console.warn('Product upsert error:', e.message)
      }
    }
    
    // Save each review to the database
    const sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0 }
    let savedCount = 0
    
    for (let i = 0; i < results.length; i++) {
      const row = normalizedReviews[i] || {}
      const pred = results[i] || {}
      
      const reviewText = row.text || ''
      const brand = row.brand || 'Unknown'
      const productName = row.product_name || 'Unknown Product'
      const productId = row.product_id || `P-${productName.replace(/\s+/g, '-').substring(0, 20)}`
      const label = capitalizeLabel(pred.label)
      const confidence = typeof pred.confidence === 'number' ? pred.confidence : 0.5
      
      // Extract topics from the review text
      const topics = extractTopics(reviewText)
      
      try {
        const review = new Review({
          userId,
          text: reviewText,
          productId,
          productName,
          brand,
          sentiment: { label, confidence },
          topics,
          source: 'csv'
        })
        await review.save()
        savedCount++
        sentimentCounts[label] = (sentimentCounts[label] || 0) + 1
      } catch (e) {
        console.warn(`Failed to save review ${i}:`, e.message)
      }
    }
    
    // Update SentimentData for today's trend
    try {
      const today = dayjs().startOf('day').toDate()
      await SentimentData.findOneAndUpdate(
        { userId, date: today },
        {
          $inc: {
            positive: sentimentCounts.Positive || 0,
            neutral: sentimentCounts.Neutral || 0,
            negative: sentimentCounts.Negative || 0
          }
        },
        { upsert: true }
      )
    } catch (e) {
      console.warn('SentimentData update error:', e.message)
    }
    
    console.log(`✅ Saved ${savedCount}/${results.length} reviews (${sentimentCounts.Positive} positive, ${sentimentCounts.Neutral} neutral, ${sentimentCounts.Negative} negative)`)
    
    // Add index to results for frontend
    const indexed = results.map((r, i) => ({ ...r, index: i }))
    
    res.json({
      success: true,
      data: indexed,
      saved: {
        count: savedCount,
        breakdown: sentimentCounts
      }
    })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Batch classification failed',
      error: error.message
    })
  }
}

// @desc    Create review with classification
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    const { text, productId, productName, brand } = req.body
    
    // Classify sentiment via ML service
    const sentiment = await classifySentiment(text)
    
    // Extract topics
    const topics = extractTopics(text)
    
    // Create review
    const review = await Review.create({
      userId: req.user._id,
      text,
      productId,
      productName,
      brand,
      sentiment: {
        label: capitalizeLabel(sentiment.label),
        confidence: sentiment.confidence
      },
      topics,
      source: 'manual'
    })
    
    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    })
  }
}

// @desc    Get all user reviews
// @route   GET /api/reviews
// @access  Private
export const getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, sentiment, brand, product } = req.query
    
    const query = { userId: req.user._id }
    
    if (sentiment) query['sentiment.label'] = sentiment
    if (brand) query.brand = brand
    if (product) query.productId = product
    
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
    
    const total = await Review.countDocuments(query)
    
    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    })
  }
}
