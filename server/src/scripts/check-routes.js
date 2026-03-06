import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../../.env') })

async function checkRouteStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    // Get collections
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log('📦 Available Collections:')
    collections.forEach(col => {
      console.log(`   - ${col.name}`)
    })
    
    // Count documents in each collection
    console.log('\n📊 Document Counts:')
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments()
      console.log(`   - ${col.name}: ${count} documents`)
    }
    
    // Check if models are registered
    console.log('\n🔧 Registered Mongoose Models:')
    Object.keys(mongoose.models).forEach(model => {
      console.log(`   - ${model}`)
    })
    
    // Check routes setup
    console.log('\n🛣️  Expected API Routes:')
    const routes = [
      { path: '/api/auth/register', method: 'POST', description: 'User registration' },
      { path: '/api/auth/login', method: 'POST', description: 'User login' },
      { path: '/api/auth/me', method: 'GET', description: 'Get current user' },
      { path: '/api/dashboard/metrics', method: 'GET', description: 'Dashboard metrics' },
      { path: '/api/dashboard/overview', method: 'GET', description: 'Dashboard overview' },
      { path: '/api/dashboard/init-sample', method: 'POST', description: 'Initialize sample data' },
      { path: '/api/reviews', method: 'GET', description: 'Get reviews' },
      { path: '/api/reviews', method: 'POST', description: 'Create review' },
      { path: '/api/data/metrics', method: 'GET', description: 'Data metrics' },
      { path: '/api/data/sentiment-trend', method: 'GET', description: 'Sentiment trend' }
    ]
    
    routes.forEach(route => {
      console.log(`   ${route.method.padEnd(6)} ${route.path.padEnd(35)} - ${route.description}`)
    })
    
    console.log('\n✅ Route Status Check Complete')
    console.log('\n📝 Next Steps:')
    console.log('   1. Start the server: npm run dev')
    console.log('   2. Register a user at: http://localhost:3000/register')
    console.log('   3. Login and navigate to Dashboard')
    console.log('   4. Sample data will auto-initialize if needed')
    
    await mongoose.disconnect()
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

checkRouteStatus()
