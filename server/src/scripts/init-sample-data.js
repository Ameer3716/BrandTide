import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import User from '../models/User.js'
import Review from '../models/Review.js'
import dayjs from 'dayjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../../.env') })

async function initSampleData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    // Get the first user
    const user = await User.findOne({})
    if (!user) {
      console.log('❌ No user found. Please register first.')
      process.exit(1)
    }
    
    console.log(`👤 Found user: ${user.toJSON().name}`)
    
    // Check if user already has reviews
    const existingReviews = await Review.countDocuments({ userId: user._id })
    if (existingReviews > 0) {
      console.log(`⚠️  User already has ${existingReviews} reviews`)
      process.exit(0)
    }
    
    console.log('\n📝 Creating sample reviews...')
    
    const reviewData = [
      { text: 'Battery lasts all day even with GPS.', sentiment: 'Positive', conf: 0.92, product: 'Aurora X1', brand: 'Aurora', id: 'P-100' },
      { text: 'Build quality feels premium for the price.', sentiment: 'Positive', conf: 0.88, product: 'Aurora Mini', brand: 'Aurora', id: 'P-101' },
      { text: 'Camera struggles in low light situations.', sentiment: 'Negative', conf: 0.85, product: 'Nimbus Air', brand: 'Nimbus', id: 'P-200' },
      { text: 'Customer support was quick and helpful.', sentiment: 'Positive', conf: 0.95, product: 'Nimbus Max', brand: 'Nimbus', id: 'P-201' },
      { text: 'The latest update fixed most of my issues.', sentiment: 'Neutral', conf: 0.75, product: 'Vertex Pro', brand: 'Vertex', id: 'P-300' },
      { text: 'The UI is smooth but has occasional stutters.', sentiment: 'Neutral', conf: 0.68, product: 'Vertex Lite', brand: 'Vertex', id: 'P-301' },
      { text: 'Great value and solid performance overall.', sentiment: 'Positive', conf: 0.91, product: 'Aurora X1', brand: 'Aurora', id: 'P-100' },
      { text: 'Speaker quality is tinny at high volumes.', sentiment: 'Negative', conf: 0.82, product: 'Nimbus Air', brand: 'Nimbus', id: 'P-200' },
      { text: 'Love the compact size and feel.', sentiment: 'Positive', conf: 0.89, product: 'Aurora Mini', brand: 'Aurora', id: 'P-101' },
      { text: 'Shipping took longer than expected.', sentiment: 'Negative', conf: 0.79, product: 'Vertex Pro', brand: 'Vertex', id: 'P-300' }
    ]
    
    const reviews = []
    for (let i = 0; i < 50; i++) {
      const review = reviewData[i % reviewData.length]
      const newReview = new Review({
        userId: user._id,
        text: review.text,
        productId: review.id,
        productName: review.product,
        brand: review.brand,
        sentiment: {
          label: review.sentiment,
          confidence: review.conf
        },
        source: 'manual',
        createdAt: dayjs().subtract(Math.floor(Math.random() * 30), 'day').toDate()
      })
      
      await newReview.save() // Use save() to trigger encryption
      reviews.push(newReview)
      
      if ((i + 1) % 10 === 0) {
        console.log(`   Created ${i + 1}/50 reviews...`)
      }
    }
    
    console.log(`✅ Created ${reviews.length} sample reviews (encrypted)`)
    
    // Verify encryption
    console.log('\n🔐 Verifying Encryption...')
    const savedReview = await Review.findOne({ userId: user._id })
    const reviewJson = savedReview.toJSON()
    
    console.log('Sample Review (decrypted):')
    console.log(`   Text: ${reviewJson.text.substring(0, 50)}`)
    console.log(`   Product: ${reviewJson.productName}`)
    console.log(`   Brand: ${reviewJson.brand}`)
    console.log(`   Sentiment: ${reviewJson.sentiment.label} (${reviewJson.sentiment.confidence})`)
    
    // Check raw database value
    const rawDoc = await mongoose.connection.db.collection('reviews').findOne({ _id: savedReview._id })
    console.log('\nRaw Database Value (encrypted):')
    console.log(`   Text: ${rawDoc.text.substring(0, 60)}...`)
    console.log(`   Product: ${rawDoc.productName.substring(0, 60)}...`)
    console.log(`   Brand: ${rawDoc.brand.substring(0, 40)}...`)
    
    const isEncrypted = rawDoc.text !== reviewJson.text
    console.log(`\n🔒 Encryption Status: ${isEncrypted ? '✅ ENABLED' : '❌ DISABLED'}`)
    
    if (!isEncrypted) {
      console.log('⚠️  Warning: Data is not encrypted! Pre-save hooks may not be running with insertMany()')
      console.log('   Recommendation: Use individual save() calls or create() for encryption')
    }
    
    console.log('\n✅ Sample data initialized successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Total Reviews: ${reviews.length}`)
    console.log(`   - Encrypted Fields: text, productName, brand`)
    console.log(`   - Date Range: Last 30 days`)
    
    await mongoose.disconnect()
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

initSampleData()
