import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import User from '../models/User.js'
import Review from '../models/Review.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../../.env') })

async function testDataFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')
    
    // Get users
    const users = await User.find({})
    console.log(`\n📊 Users in DB: ${users.length}`)
    
    if (users.length > 0) {
      const user = users[0]
      console.log('\n👤 Sample User:')
      console.log('- ID:', user._id)
      console.log('- Name (decrypted):', user.toJSON().name)
      console.log('- Email (decrypted):', user.toJSON().email)
      console.log('- Auth Provider:', user.authProvider)
      
      // Get reviews for this user
      const reviews = await Review.find({ userId: user._id })
      console.log(`\n📝 Reviews for user: ${reviews.length}`)
      
      if (reviews.length > 0) {
        const review = reviews[0]
        const reviewJson = review.toJSON()
        console.log('\n📄 Sample Review:')
        console.log('- Text (decrypted):', reviewJson.text?.substring(0, 50) + '...')
        console.log('- Product:', reviewJson.productName)
        console.log('- Brand:', reviewJson.brand)
        console.log('- Sentiment:', reviewJson.sentiment.label, `(${reviewJson.sentiment.confidence})`)
      }
    } else {
      console.log('\n⚠️  No users found. Register a user first!')
    }
    
    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB')
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

testDataFlow()
