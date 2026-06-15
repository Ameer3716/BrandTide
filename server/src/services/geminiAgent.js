import config from '../config/config.js'

class GeminiAgentError extends Error {
  constructor(code, message, userMessage, suggestion) {
    super(message)
    this.name = 'GeminiAgentError'
    this.code = code
    this.userMessage = userMessage
    this.suggestion = suggestion
  }
}

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

async function callGeminiAPI(prompt, timeoutMs = 30000) {
  if (!config.geminiApiKey) {
    throw new GeminiAgentError(
      'INVALID_API_KEY',
      'API key not configured',
      'AI service configuration error',
      'Contact the administrator to configure the AI service API key.'
    )
  }

  const url = `${GEMINI_URL}?key=${config.geminiApiKey}`
  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.1, // Low temp for more deterministic structured output
      responseMimeType: 'application/json'
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      if (response.status === 400) {
        if (errorData.error?.message?.includes('API key not valid')) {
            throw new GeminiAgentError(
              'INVALID_API_KEY',
              'API key invalid',
              'AI service configuration error',
              'Contact the administrator to configure the AI service API key.'
            )
        }
        throw new GeminiAgentError('GEMINI_ERROR', 'Bad Request', 'AI processing failed', 'Check your input data.')
      }
      if (response.status === 401 || response.status === 403) {
        throw new GeminiAgentError('INVALID_API_KEY', 'Auth Error', 'AI service configuration error', 'Contact the administrator to configure the AI service API key.')
      }
      if (response.status === 429) {
        throw new GeminiAgentError('QUOTA_EXCEEDED', 'Rate Limit', 'AI service rate limit reached', 'Wait a few minutes and try again.')
      }
      
      throw new GeminiAgentError('GEMINI_ERROR', `Gemini API Error: ${response.status}`, 'AI processing failed', 'Try again later.')
    }

    const data = await response.json()
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!textContent) {
       throw new GeminiAgentError('PARSE_ERROR', 'Empty response from Gemini', 'Could not parse AI response', 'Try rephrasing your input.')
    }
    
    try {
      // It should be JSON since we requested responseMimeType: 'application/json'
      return JSON.parse(textContent)
    } catch (e) {
       throw new GeminiAgentError('PARSE_ERROR', 'Invalid JSON from Gemini', 'Could not parse AI response', 'Try rephrasing your input.')
    }

  } catch (error) {
    if (error instanceof GeminiAgentError) throw error
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new GeminiAgentError('TIMEOUT', 'Request timed out', 'AI processing timed out', 'Try with fewer rows or shorter text.')
    }
    if (error.message && error.message.includes('fetch')) {
      throw new GeminiAgentError('NETWORK_ERROR', error.message, 'Could not reach the AI service', 'Check your internet connection.')
    }
    throw new GeminiAgentError('GEMINI_ERROR', error.message, 'AI processing failed', 'An unexpected error occurred.')
  }
}

export const geminiAgent = {
  async cleanSingleText(rawText) {
    if (!rawText || !rawText.trim()) {
      throw new GeminiAgentError('VALIDATION_ERROR', 'Empty input', 'Please provide valid input data', 'Input text cannot be empty.')
    }

    // Check if data is already in required format (clean text without HTML)
    const isClean = !/<[a-z][\s\S]*>/i.test(rawText) && rawText.trim().length > 3
    if (isClean && rawText.length < 500) {
        // Bypass API if it's already a simple, clean string
        return {
            cleanedText: rawText.trim(),
            isValidReview: true,
            modifications: [],
            detectedLanguage: "Auto",
            extractedBrand: "General",
            extractedProduct: "Unspecified",
            extractedTopic: "General",
            issues: []
        }
    }

    const prompt = `
    You are an AI Data Agent for an e-commerce review sentiment analysis system.
    Your task is to analyze, clean, and extract structured data from raw, messy text input.
    
    The raw text might contain HTML tags, encoding issues, mixed languages (English, Roman Urdu, Urdu), multiple paragraphs, or extra noise.
    
    Analyze the following raw text:
    """
    ${rawText}
    """
    
    Return a strictly valid JSON object with the following schema:
    {
      "cleanedText": "The core review content, cleaned of HTML/noise, with fixed encoding",
      "isValidReview": boolean, // true if the text actually contains a product/brand review, false if it's complete garbage/spam
      "modifications": ["list of string descriptions of what you fixed/changed. e.g. 'Removed HTML tags', 'Fixed encoding', 'Auto-filled missing brand'"],
      "detectedLanguage": "English, Roman Urdu, Urdu, or Mixed",
      "extractedBrand": "Extracted brand name, or 'General' if none found",
      "extractedProduct": "Extracted product name, or 'Unspecified' if none found",
      "extractedTopic": "Main topic discussed (e.g., Battery, Camera, Service), or 'General'",
      "issues": ["list of any unfixable issues or reasons why isValidReview is false"]
    }
    
    Important rules:
    - If no brand is explicitly mentioned, set extractedBrand to "General" and add "Auto-filled missing brand" to modifications.
    - If no specific product is mentioned, set extractedProduct to "Unspecified" and add "Auto-filled missing product" to modifications.
    - If the text is completely unrelated to a review, set isValidReview: false and explain why in issues.
    `

    return await callGeminiAPI(prompt, 30000)
  },

  async cleanBatchData(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new GeminiAgentError('VALIDATION_ERROR', 'Empty batch', 'Please provide valid input data', 'Input rows array cannot be empty.')
    }

    if (rows.length > 500) {
        throw new GeminiAgentError('DATA_TOO_LARGE', 'Too many rows', 'Data exceeds maximum size (500 rows)', 'Try uploading a smaller batch.')
    }

    // Check if data is already in required format
    const hasRequiredColumns = rows.length > 0 && ('text' in rows[0] || 'review_text' in rows[0] || 'review' in rows[0]);
    let isCleanFormat = false;
    let textColName = '';
    
    if (hasRequiredColumns) {
        textColName = ('text' in rows[0]) ? 'text' : ('review_text' in rows[0] ? 'review_text' : 'review');
        isCleanFormat = rows.slice(0, 10).every(row => {
            const text = String(row[textColName] || '');
            return text.length > 3 && !/<[a-z][\s\S]*>/i.test(text); // No HTML
        });
    }

    let mapping = {};
    let aiAnalysis = {};
    const allKeys = [...new Set(rows.slice(0, 5).flatMap(row => Object.keys(row)))]

    if (isCleanFormat) {
        // Bypass API - Data is already in required format
        mapping = {
            text: textColName,
            brand: allKeys.find(k => k.toLowerCase().includes('brand')) || null,
            product_name: allKeys.find(k => k.toLowerCase().includes('product')) || null,
            topic: allKeys.find(k => k.toLowerCase().includes('topic')) || null
        }
    } else {
        // Data is not in required format, use API to convert
        const sampleRows = rows.slice(0, 5)
        const prompt = `
        You are an AI Data Agent for an e-commerce review sentiment analysis system.
        Your task is to map arbitrary CSV/Excel column names to our standard schema and detect data quality issues.
        
        Here are the column names found in the uploaded file:
        ${JSON.stringify(allKeys)}
        
        Here is a sample of the data (first few rows):
        ${JSON.stringify(sampleRows, null, 2)}
        
        Return a strictly valid JSON object with the following schema:
        {
          "columnMapping": {
            "text": "name of the column that contains the actual review text/comment",
            "brand": "name of the column containing brand/company (or null if none exists)",
            "product_name": "name of the column containing product/item name (or null)",
            "product_id": "name of the column containing product ID/SKU (or null)",
            "topic": "name of the column containing topic/category (or null)"
          },
          "warnings": ["list of strings for any general data quality warnings detected in the sample (e.g. 'Review texts appear very short')"]
        }
        `
        try {
            aiAnalysis = await callGeminiAPI(prompt, 45000)
            mapping = aiAnalysis.columnMapping || {}
        } catch (err) {
            console.warn('⚠️ Gemini API failed during batch mapping, using fallback heuristics:', err.message)
            mapping = {
                text: allKeys.find(k => /text|review|comment|msg|desc/i.test(k)) || allKeys[0],
                brand: allKeys.find(k => /brand|company|maker/i.test(k)) || null,
                product_name: allKeys.find(k => /product|item|name/i.test(k)) || null,
                product_id: allKeys.find(k => /id|sku|code/i.test(k)) || null,
                topic: allKeys.find(k => /topic|category|subject/i.test(k)) || null
            }
            aiAnalysis = { warnings: ['AI Service Rate Limit reached. Safely applied fallback column mapping heuristics.'] }
        }
    }
    
    const textCol = mapping.text

    if (!textCol || !allKeys.includes(textCol)) {
        throw new GeminiAgentError('INVALID_DATA', 'No text column detected', 'Could not identify review text column', 'Make sure your data contains a column with review comments.')
    }

    // Apply mapping and clean locally
    const cleanedRows = []
    const skippedDetails = []
    let totalProcessed = 0
    let totalSkipped = 0
    
    const modifications = new Set()
    const missingDataHandling = new Set()

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const textValue = String(row[textCol] || '').trim()

        if (!textValue || textValue.length < 3) {
            skippedDetails.push({ row: i + 1, reason: 'Text is empty or too short' })
            totalSkipped++
            continue
        }

        const cleanedRow = {
            text: textValue.replace(/<[^>]*>?/gm, ''), // Basic HTML stripping locally
            brand: row[mapping.brand] ? String(row[mapping.brand]).trim() : '',
            product_name: row[mapping.product_name] ? String(row[mapping.product_name]).trim() : '',
            product_id: row[mapping.product_id] ? String(row[mapping.product_id]).trim() : '',
            topic: row[mapping.topic] ? String(row[mapping.topic]).trim() : '',
            original_index: i
        }

        if (textValue !== cleanedRow.text) {
             modifications.add('Stripped HTML tags from text')
        }

        if (!cleanedRow.brand) {
            cleanedRow.brand = 'General'
            missingDataHandling.add('Auto-filled missing brand with "General"')
        }
        if (!cleanedRow.product_name) {
            cleanedRow.product_name = 'Unspecified'
            missingDataHandling.add('Auto-filled missing product name with "Unspecified"')
        }

        cleanedRows.push(cleanedRow)
        totalProcessed++
    }

    if (cleanedRows.length === 0) {
        throw new GeminiAgentError('INVALID_DATA', 'No valid rows', 'No valid review data found after cleaning', 'Ensure rows have sufficient text length.')
    }

    return {
        cleanedRows,
        columnMapping: mapping,
        report: {
            totalInput: rows.length,
            totalProcessed,
            totalSkipped,
            skippedDetails,
            modifications: Array.from(modifications),
            warnings: aiAnalysis.warnings || [],
            missingDataHandling: Array.from(missingDataHandling)
        }
    }
  }
}

export { GeminiAgentError }
