import { geminiAgent, GeminiAgentError } from '../services/geminiAgent.js'
import Review from '../models/Review.js'
import Brand from '../models/Brand.js'
import Product from '../models/Product.js'
import SentimentData from '../models/SentimentData.js'
import BatchJob from '../models/BatchJob.js'
import { hash } from '../utils/encryption.js'
import dayjs from 'dayjs'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:7860'

function capitalizeLabel(label) {
  if (!label) return 'Neutral'
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()
}

// Fallbacks from reviewController.js in case ML service is down
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

async function classifySentiment(text) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(30000)
    })
    if (!response.ok) throw new Error(`ML service responded with ${response.status}`)
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

async function classifySentimentBatch(reviews) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviews }),
      signal: AbortSignal.timeout(120000)
    })
    if (!response.ok) throw new Error(`ML service responded with ${response.status}`)
    const result = await response.json()
    if (result.success && Array.isArray(result.data)) {
      return result.data
    }
    throw new Error('Invalid ML batch response format')
  } catch (err) {
    console.warn('⚠️ ML batch service unavailable, using fallback:', err.message)
    return reviews.map(r => ({
      ...r,
      label: fallbackClassifier(r.text || '').label,
      confidence: fallbackClassifier(r.text || '').confidence
    }))
  }
}

// @desc    Clean and classify a single review
// @route   POST /api/agent/smart-classify
// @access  Private
export const smartClassifySingle = async (req, res) => {
  try {
    const { text } = req.body
    const userId = req.user._id

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Review text is required',
        userMessage: 'Review text is required',
        suggestion: 'Please provide valid input data.'
      })
    }

    // 1. Clean with Gemini
    const geminiResult = await geminiAgent.cleanSingleText(text)

    if (!geminiResult.isValidReview) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_DATA',
        message: 'Not a valid review',
        userMessage: 'The provided text does not appear to be a valid review.',
        suggestion: geminiResult.issues.join(' ') || 'Check that your data contains valid review text.'
      })
    }

    const cleanedText = geminiResult.cleanedText || text

    // 2. Classify with ML service
    const sentiment = await classifySentiment(cleanedText)

    const finalBrand = geminiResult.extractedBrand || 'General'
    const finalProductName = geminiResult.extractedProduct || 'Review'
    const finalProductId = `P-${finalProductName.replace(/\s+/g, '-').substring(0, 20)}`
    const topics = geminiResult.extractedTopic !== 'General' 
        ? [{ name: geminiResult.extractedTopic, confidence: 0.9 }] 
        : [{ name: 'General', confidence: 0.5 }]

    // 3. Save to DB
    const review = new Review({
      userId,
      text: cleanedText,
      productId: finalProductId,
      productName: finalProductName.trim(),
      brand: finalBrand.trim(),
      contentHash: hash(cleanedText),
      sentiment: {
        label: capitalizeLabel(sentiment.label),
        confidence: sentiment.confidence
      },
      topics,
      source: 'manual' // Or maybe 'agent' if you want to track it
    })
    await review.save()

    res.json({
      success: true,
      data: {
        original: text,
        cleaned: cleanedText,
        modifications: geminiResult.modifications || [],
        sentiment: {
          label: sentiment.label,
          confidence: sentiment.confidence,
          scores: sentiment.scores || {}
        },
        metadata: {
          brand: finalBrand,
          product: finalProductName,
          language: geminiResult.detectedLanguage || 'auto',
          topic: geminiResult.extractedTopic || 'General',
          isValidReview: geminiResult.isValidReview
        },
        report: {
          issues: geminiResult.issues || [],
          geminiUsed: true
        }
      }
    })

  } catch (error) {
     if (error instanceof GeminiAgentError) {
        return res.status(error.code === 'VALIDATION_ERROR' || error.code === 'INVALID_DATA' ? 400 : 
                          error.code === 'QUOTA_EXCEEDED' ? 429 : 
                          error.code === 'INVALID_API_KEY' ? 503 : 500).json({
            success: false,
            code: error.code,
            message: error.message,
            userMessage: error.userMessage,
            suggestion: error.suggestion
        })
     }

    res.status(500).json({
      success: false,
      code: 'UNKNOWN',
      message: 'Smart classification failed',
      userMessage: 'Smart classification failed',
      suggestion: 'Please try again.',
      error: error.message
    })
  }
}

// @desc    Clean and classify batch reviews
// @route   POST /api/agent/smart-batch
// @access  Private
export const smartClassifyBatch = async (req, res) => {
  try {
    const { reviews } = req.body
    const userId = req.user._id

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Reviews array is required',
        userMessage: 'Reviews array is required',
        suggestion: 'Please provide valid input data.'
      })
    }

    if (reviews.length > 500) {
        return res.status(413).json({
            success: false,
            code: 'DATA_TOO_LARGE',
            message: 'Too many rows',
            userMessage: 'Data exceeds maximum size (500 rows)',
            suggestion: 'Try uploading a smaller batch.'
        })
    }

    // 1. Clean with Gemini
    const cleanResult = await geminiAgent.cleanBatchData(reviews)

    // 2. Classify with ML service
    const results = await classifySentimentBatch(cleanResult.cleanedRows)

    // 3. Save to database
    const brandSet = new Set()
    const productMap = new Map()

    for (const row of cleanResult.cleanedRows) {
        let brand = (row.brand || '').trim()
        let productName = (row.product_name || '').trim()
        if (brand && !['general', 'unknown', 'n/a', 'na', 'other'].includes(brand.toLowerCase())) {
            brandSet.add(brand)
        }
        if (productName && !['review', 'product', 'item', 'n/a', 'na', 'other'].includes(productName.toLowerCase())) {
            const productId = row.product_id || `P-${productName.replace(/\s+/g, '-').substring(0, 20)}`
            if (!productMap.has(productId)) {
                productMap.set(productId, { name: productName, brand: brand || 'General' })
            }
        }
    }

    for (const brandName of brandSet) {
        try {
            await Brand.findOneAndUpdate(
                { userId, name: brandName },
                { userId, name: brandName, isActive: true },
                { upsert: true, new: true }
            )
        } catch (e) {}
    }

    for (const [productId, info] of productMap.entries()) {
        try {
            await Product.findOneAndUpdate(
                { userId, productId },
                { userId, productId, name: info.name, brand: info.brand, isActive: true },
                { upsert: true, new: true }
            )
        } catch (e) {}
    }

    const sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0 }
    let savedCount = 0
    let duplicatesFound = 0

    // Pre-calculate hashes for the batch to check DB efficiently
    const batchHashes = cleanResult.cleanedRows.map(row => {
        const reviewText = (row.text || '').trim()
        const brand = (row.brand || 'General').trim()
        const productName = (row.product_name || 'Review').trim()
        const topic = (row.topic || 'General').trim()
        const hashInput = `${brand.toLowerCase()}|${productName.toLowerCase()}|${topic.toLowerCase()}|${reviewText.toLowerCase()}`
        return hash(hashInput)
    })

    // Fetch existing hashes from DB in one query
    const existingReviews = await Review.find({ userId, contentHash: { $in: batchHashes } }).select('contentHash').lean()
    const existingHashSet = new Set(existingReviews.map(r => r.contentHash))
    const currentBatchHashSet = new Set()

    for (let i = 0; i < results.length; i++) {
        const row = cleanResult.cleanedRows[i] || {}
        const pred = results[i] || {}
        const rowHash = batchHashes[i]

        // Skip if duplicate found in DB or earlier in the same uploaded file
        if (existingHashSet.has(rowHash) || currentBatchHashSet.has(rowHash)) {
            duplicatesFound++
            cleanResult.report.totalSkipped++
            cleanResult.report.totalProcessed--
            cleanResult.report.skippedDetails.push({
                row: row.original_index !== undefined ? row.original_index + 1 : i + 1,
                reason: 'Duplicated data found (skipped)'
            })
            continue // Skip saving
        }

        currentBatchHashSet.add(rowHash)

        const reviewText = row.text || ''
        const brand = (row.brand || 'General').trim()
        const productName = (row.product_name || 'Review').trim()
        const productId = row.product_id || `P-${productName.replace(/\s+/g, '-').substring(0, 20)}`
        const label = capitalizeLabel(pred.label)
        const confidence = typeof pred.confidence === 'number' ? pred.confidence : 0.5
        
        const topics = row.topic && row.topic !== 'General'
            ? [{ name: row.topic, confidence: 0.9 }]
            : [{ name: 'General', confidence: 0.5 }]

        try {
            const review = new Review({
                userId,
                text: reviewText,
                contentHash: rowHash,
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
        } catch (e) {}
    }

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
    } catch (e) {}

    const fileName = `agent_batch_${Date.now()}`
    try {
        const batchJob = new BatchJob({
            userId,
            fileName,
            rowCount: cleanResult.cleanedRows.length,
            status: 'completed',
            results: {
                positive: sentimentCounts.Positive,
                neutral: sentimentCounts.Neutral,
                negative: sentimentCounts.Negative
            },
            processedAt: new Date()
        })
        await batchJob.save()
    } catch (e) {}

    const combinedData = cleanResult.cleanedRows.map((row, i) => {
        const pred = results[i] || {}
        return {
            review_id: `R-${Date.now()}-${i}`,
            text: row.text || '',
            product_name: row.product_name || 'Unspecified',
            product_id: row.product_id || '',
            brand: row.brand || 'General',
            topic: row.topic || 'General',
            label: pred.label || 'Neutral',
            confidence: typeof pred.confidence === 'number' ? pred.confidence : 0,
            index: i
        }
    })

    // Add duplicate info to report
    if (duplicatesFound > 0) {
        cleanResult.report.duplicatesSkipped = duplicatesFound
        cleanResult.report.warnings.unshift(`${duplicatesFound} duplicated rows found and skipped.`)
    }

    res.json({
      success: true,
      data: combinedData,
      report: cleanResult.report,
      saved: {
        count: savedCount,
        breakdown: sentimentCounts
      }
    })

  } catch (error) {
     if (error instanceof GeminiAgentError) {
        return res.status(error.code === 'VALIDATION_ERROR' || error.code === 'INVALID_DATA' ? 400 : 
                          error.code === 'QUOTA_EXCEEDED' ? 429 : 
                          error.code === 'INVALID_API_KEY' ? 503 : 
                          error.code === 'DATA_TOO_LARGE' ? 413 : 500).json({
            success: false,
            code: error.code,
            message: error.message,
            userMessage: error.userMessage,
            suggestion: error.suggestion
        })
     }

    res.status(500).json({
      success: false,
      code: 'UNKNOWN',
      message: 'Smart batch classification failed',
      userMessage: 'Smart batch classification failed',
      suggestion: 'Please try again.',
      error: error.message
    })
  }
}
