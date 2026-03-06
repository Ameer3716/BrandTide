import Review from '../models/Review.js'

// ── ML Service configuration ────────────────────────────────────────────────
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

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

// @desc    Classify single review
// @route   POST /api/classifier/single
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

// @desc    Classify batch reviews
// @route   POST /api/classifier/batch
// @access  Private
export const classifyBatch = async (req, res) => {
  try {
    const { reviews } = req.body
    
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reviews array is required'
      })
    }
    
    // Prepare texts for ML service
    const mlReviews = reviews.map(r => ({
      ...r,
      text: r.text || r.review_text || r.review || ''
    }))
    
    // Classify via ML service (batch)
    const results = await classifySentimentBatch(mlReviews)
    
    // Add index to results
    const indexed = results.map((r, i) => ({ ...r, index: i }))
    
    res.json({
      success: true,
      data: indexed
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
    
    // Create review
    const review = await Review.create({
      userId: req.user._id,
      text,
      productId,
      productName,
      brand,
      sentiment: {
        label: sentiment.label,
        confidence: sentiment.confidence
      },
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
