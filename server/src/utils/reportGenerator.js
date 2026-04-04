import Review from '../models/Review.js'
import Brand from '../models/Brand.js'
import Product from '../models/Product.js'
import mongoose from 'mongoose'
import dayjs from 'dayjs'
import { decrypt } from './encryption.js'

/**
 * Generate sentiment report data for a user
 * Returns structured data that can be used to create a PDF or email body
 */
export const generateSentimentReport = async (userId) => {
  try {
    const objectId = new mongoose.Types.ObjectId(userId)

    // Get statistics
    const [totalReviews, sentimentStats, topBrands, topProducts, recentReviews] = await Promise.all([
      Review.countDocuments({ userId: objectId }),
      Review.aggregate([
        { $match: { userId: objectId } },
        { $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 }
        }}
      ]),
      Review.aggregate([
        { $match: { userId: objectId } },
        { $group: {
          _id: '$brand',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$sentiment.confidence' }
        }},
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Review.aggregate([
        { $match: { userId: objectId } },
        { $group: {
          _id: '$productName',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$sentiment.confidence' }
        }},
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Review.find({ userId: objectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ])

    // Build sentiment distribution
    const distribution = { Positive: 0, Neutral: 0, Negative: 0 }
    sentimentStats.forEach(stat => {
      distribution[stat._id] = stat.count
    })

    const positivePercent = totalReviews > 0 ? Math.round((distribution.Positive / totalReviews) * 100) : 0
    const neutralPercent = totalReviews > 0 ? Math.round((distribution.Neutral / totalReviews) * 100) : 0
    const negativePercent = totalReviews > 0 ? Math.round((distribution.Negative / totalReviews) * 100) : 0

    // Decrypt reviews for the report
    const decryptedReviews = recentReviews.map(r => ({
      text: decrypt(r.text),
      sentiment: r.sentiment.label,
      confidence: r.sentiment.confidence,
      brand: decrypt(r.brand),
      product: decrypt(r.productName),
      date: r.createdAt
    }))

    const report = {
      generatedAt: dayjs().format('MMMM D, YYYY [at] h:mm A'),
      period: `Last 30 days`,
      totalReviews,
      sentiment: {
        positive: distribution.Positive,
        neutral: distribution.Neutral,
        negative: distribution.Negative,
        positivePercent,
        neutralPercent,
        negativePercent
      },
      topBrands: topBrands.map(b => ({
        name: decrypt(b._id),
        count: b.count,
        confidence: Math.round(b.avgConfidence * 100) / 100
      })),
      topProducts: topProducts.map(p => ({
        name: decrypt(p._id),
        count: p.count,
        confidence: Math.round(p.avgConfidence * 100) / 100
      })),
      recentReviews: decryptedReviews
    }

    return report
  } catch (error) {
    console.error('Error generating sentiment report:', error)
    throw error
  }
}

/**
 * Create HTML email body for sentiment report
 */
export const createReportEmailHTML = (report) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; background: #f9fafb; }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; border-radius: 8px 8px 0 0; color: white; }
        .header h2 { margin: 0 0 10px 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .metric-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 20px 0; }
        .metric { background: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-number { font-size: 28px; font-weight: bold; color: #10B981; }
        .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .section-title { font-size: 18px; font-weight: bold; margin: 25px 0 15px 0; color: #1f2937; border-bottom: 2px solid #10B981; padding-bottom: 10px; }
        .item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .item:last-child { border-bottom: none; }
        .sentiment-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .positive { background: #d1fae5; color: #065f46; }
        .neutral { background: #e5e7eb; color: #374151; }
        .negative { background: #fee2e2; color: #991b1b; }
        .confidence { color: #6b7280; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📊 Sentiment Analysis Report</h2>
          <p style="margin: 0; opacity: 0.95;">Generated on ${report.generatedAt}</p>
        </div>
        
        <div class="content">
          <div class="metric-grid">
            <div class="metric">
              <div class="metric-number">${report.totalReviews}</div>
              <div class="metric-label">Total Reviews</div>
            </div>
            <div class="metric">
              <div class="metric-number">${report.sentiment.positivePercent}%</div>
              <div class="metric-label">Positive</div>
            </div>
            <div class="metric">
              <div class="metric-number">${report.sentiment.negativePercent}%</div>
              <div class="metric-label">Negative</div>
            </div>
          </div>

          <div class="section-title">Sentiment Distribution</div>
          <table>
            <tr>
              <th>Sentiment</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
            <tr>
              <td><span class="sentiment-badge positive">Positive</span></td>
              <td>${report.sentiment.positive}</td>
              <td>${report.sentiment.positivePercent}%</td>
            </tr>
            <tr>
              <td><span class="sentiment-badge neutral">Neutral</span></td>
              <td>${report.sentiment.neutral}</td>
              <td>${report.sentiment.neutralPercent}%</td>
            </tr>
            <tr>
              <td><span class="sentiment-badge negative">Negative</span></td>
              <td>${report.sentiment.negative}</td>
              <td>${report.sentiment.negativePercent}%</td>
            </tr>
          </table>

          ${report.topBrands.length > 0 ? `
            <div class="section-title">Top Brands</div>
            <div>
              ${report.topBrands.map(b => `
                <div class="item">
                  <strong>${b.name}</strong>
                  <div class="confidence">${b.count} review${b.count !== 1 ? 's' : ''} • Confidence: ${b.confidence}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${report.topProducts.length > 0 ? `
            <div class="section-title">Top Products</div>
            <div>
              ${report.topProducts.map(p => `
                <div class="item">
                  <strong>${p.name}</strong>
                  <div class="confidence">${p.count} review${p.count !== 1 ? 's' : ''} • Confidence: ${p.confidence}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${report.recentReviews.length > 0 ? `
            <div class="section-title">Recent Reviews</div>
            <div>
              ${report.recentReviews.map((r, i) => `
                <div class="item">
                  <div style="margin-bottom: 8px;">
                    <span class="sentiment-badge ${r.sentiment.toLowerCase()}">${r.sentiment}</span>
                    <span class="confidence" style="margin-left: 10px;">Confidence: ${r.confidence}</span>
                  </div>
                  <div><strong>${r.product}</strong> by ${r.brand}</div>
                  <div style="color: #6b7280; margin-top: 5px; font-size: 13px;">"${r.text.substring(0, 100)}${r.text.length > 100 ? '...' : ''}"</div>
                  <div style="color: #9ca3af; font-size: 11px; margin-top: 5px;">${dayjs(r.date).format('MMM D, YYYY')}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="footer">
            <p>This is your scheduled sentiment analysis report from BrandTide.</p>
            <p>Questions? Contact us or visit your dashboard to explore more insights.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
