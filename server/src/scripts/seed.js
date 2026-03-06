import mongoose from 'mongoose'
import dotenv from 'dotenv'
import dayjs from 'dayjs'
import User from '../models/User.js'
import Review from '../models/Review.js'
import Product from '../models/Product.js'
import Insight from '../models/Insight.js'
import Highlight from '../models/Highlight.js'
import config from '../config/config.js'

dotenv.config()

// Sample data
const brands = ['Aurora', 'Nimbus', 'Vertex']

const products = [
  { productId: 'P-100', brand: 'Aurora', name: 'Aurora X1', category: 'Electronics' },
  { productId: 'P-101', brand: 'Aurora', name: 'Aurora Mini', category: 'Electronics' },
  { productId: 'P-200', brand: 'Nimbus', name: 'Nimbus Air', category: 'Electronics' },
  { productId: 'P-201', brand: 'Nimbus', name: 'Nimbus Max', category: 'Electronics' },
  { productId: 'P-300', brand: 'Vertex', name: 'Vertex Pro', category: 'Electronics' },
  { productId: 'P-301', brand: 'Vertex', name: 'Vertex Lite', category: 'Electronics' },
]

const reviewTexts = {
  positive: [
    'Battery lasts all day even with GPS enabled. Absolutely amazing!',
    'Build quality feels premium for the price. Very satisfied with purchase.',
    'Customer support was quick and helpful when I had questions.',
    'The latest update fixed most of my issues. Great product overall.',
    'Great value and solid performance. Highly recommend to others.',
    'Love the compact size and feel. Perfect for daily use.',
    'Screen quality is excellent. Colors are vibrant and bright.',
    'Fast charging is a game changer. Charges in less than an hour.',
    'Camera quality exceeded my expectations. Takes stunning photos.',
    'Software is smooth and responsive. No lag at all.'
  ],
  neutral: [
    'The UI is smooth but has occasional stutters here and there.',
    'Product meets expectations. Nothing exceptional but does the job.',
    'Average performance for the price range. Could be better.',
    'Design is okay but nothing special compared to competitors.',
    'Features are standard. Nothing groundbreaking or innovative.',
    'Battery life is decent. Gets me through most of the day.',
    'Sound quality is acceptable for casual listening.',
    'Camera performs well in good lighting conditions.',
    'Build feels solid but not premium like flagship models.',
    'Interface is functional but could use some improvements.'
  ],
  negative: [
    'Camera struggles in low light situations. Very disappointing.',
    'Speaker quality is tinny at high volumes. Not great for media.',
    'Shipping took longer than expected. Frustrating experience.',
    'Battery drains too quickly with normal use. Needs improvement.',
    'Apps crash frequently. Very frustrating to deal with.',
    'Overheats during gaming. Makes it uncomfortable to hold.',
    'Screen has dead pixels. Quality control is lacking.',
    'Customer service was unhelpful and slow to respond.',
    'Price is too high for what you get. Not worth the money.',
    'Build quality feels cheap. Plastic feels flimsy.'
  ]
}

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongodbUri)
    console.log('✅ Connected to MongoDB')
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await User.deleteMany({})
    await Review.deleteMany({})
    await Product.deleteMany({})
    await Insight.deleteMany({})
    await Highlight.deleteMany({})
    
    // Create demo user
    console.log('👤 Creating demo user...')
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@brandtide.com',
      password: 'demo123',
      authProvider: 'local',
      role: 'user'
    })
    console.log(`   Created user: ${demoUser.email}`)
    
    // Create products
    console.log('📦 Creating products...')
    const createdProducts = await Product.insertMany(products)
    console.log(`   Created ${createdProducts.length} products`)
    
    // Create reviews
    console.log('💬 Creating reviews...')
    const reviews = []
    const numReviews = 150
    
    for (let i = 0; i < numReviews; i++) {
      const sentiment = Math.random()
      let label, texts
      
      if (sentiment > 0.6) {
        label = 'Positive'
        texts = reviewTexts.positive
      } else if (sentiment > 0.3) {
        label = 'Neutral'
        texts = reviewTexts.neutral
      } else {
        label = 'Negative'
        texts = reviewTexts.negative
      }
      
      const product = products[Math.floor(Math.random() * products.length)]
      const text = texts[Math.floor(Math.random() * texts.length)]
      
      reviews.push({
        userId: demoUser._id,
        text,
        productId: product.productId,
        productName: product.name,
        brand: product.brand,
        sentiment: {
          label,
          confidence: 0.7 + Math.random() * 0.25
        },
        topics: [
          { name: ['battery', 'performance', 'camera', 'design', 'price'][Math.floor(Math.random() * 5)], confidence: 0.8 }
        ],
        language: 'en',
        source: 'csv',
        createdAt: dayjs().subtract(Math.floor(Math.random() * 60), 'day').toDate()
      })
    }
    
    const createdReviews = await Review.insertMany(reviews)
    console.log(`   Created ${createdReviews.length} reviews`)
    
    // Create insights
    console.log('💡 Creating insights...')
    const insights = [
      {
        userId: demoUser._id,
        type: 'topic',
        title: 'Battery Life Concerns Increasing',
        description: 'Multiple customers reporting battery drain issues, particularly with Aurora X1',
        category: 'performance',
        sentiment: 'Negative',
        impact: 'high',
        affectedProducts: [
          { productId: 'P-100', productName: 'Aurora X1', brand: 'Aurora' }
        ],
        metrics: {
          frequency: 45,
          trendDirection: 'up',
          changePercent: 23
        },
        dateRange: {
          start: dayjs().subtract(30, 'day').toDate(),
          end: dayjs().toDate()
        }
      },
      {
        userId: demoUser._id,
        type: 'trend',
        title: 'Camera Quality Praised Across Models',
        description: 'Positive sentiment around camera performance, especially in Nimbus lineup',
        category: 'features',
        sentiment: 'Positive',
        impact: 'medium',
        affectedProducts: [
          { productId: 'P-200', productName: 'Nimbus Air', brand: 'Nimbus' },
          { productId: 'P-201', productName: 'Nimbus Max', brand: 'Nimbus' }
        ],
        metrics: {
          frequency: 67,
          trendDirection: 'up',
          changePercent: 15
        },
        dateRange: {
          start: dayjs().subtract(30, 'day').toDate(),
          end: dayjs().toDate()
        }
      }
    ]
    
    const createdInsights = await Insight.insertMany(insights)
    console.log(`   Created ${createdInsights.length} insights`)
    
    // Create highlights
    console.log('⭐ Creating highlights...')
    const highlights = []
    
    reviewTexts.positive.slice(0, 5).forEach(snippet => {
      const product = products[Math.floor(Math.random() * products.length)]
      highlights.push({
        userId: demoUser._id,
        snippet,
        type: 'positive',
        product: {
          productId: product.productId,
          productName: product.name,
          brand: product.brand
        },
        frequency: Math.floor(5 + Math.random() * 20),
        confidence: 0.75 + Math.random() * 0.2
      })
    })
    
    reviewTexts.negative.slice(0, 5).forEach(snippet => {
      const product = products[Math.floor(Math.random() * products.length)]
      highlights.push({
        userId: demoUser._id,
        snippet,
        type: 'negative',
        product: {
          productId: product.productId,
          productName: product.name,
          brand: product.brand
        },
        frequency: Math.floor(5 + Math.random() * 20),
        confidence: 0.75 + Math.random() * 0.2
      })
    })
    
    const createdHighlights = await Highlight.insertMany(highlights)
    console.log(`   Created ${createdHighlights.length} highlights`)
    
    console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║     ✅ Database Seeded Successfully!      ║
║                                            ║
║  Demo Account Credentials:                 ║
║  Email:    demo@brandtide.com              ║
║  Password: demo123                         ║
║                                            ║
║  Data Created:                             ║
║  - Users: 1                                ║
║  - Products: ${createdProducts.length.toString().padEnd(33)} ║
║  - Reviews: ${createdReviews.length.toString().padEnd(32)} ║
║  - Insights: ${createdInsights.length.toString().padEnd(31)} ║
║  - Highlights: ${createdHighlights.length.toString().padEnd(29)} ║
║                                            ║
╚════════════════════════════════════════════╝
    `)
    
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
