import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import User from '../models/User.js'

// Get directory path
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from the correct path
dotenv.config({ path: join(__dirname, '../../.env') })

async function clearUsers() {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI ? 'MongoDB URI found' : 'No URI')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')
    
    const result = await User.deleteMany({})
    console.log(`✅ Deleted ${result.deletedCount} users`)
    
    await mongoose.disconnect()
    console.log('✅ Disconnected from MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

clearUsers()
