import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import '../config/database.js'
import User from '../models/User.js'
import config from '../config/config.js'

async function testAuthToken() {
  try {
    console.log('🔍 Testing authentication token...\n')
    
    // Find a user
    const users = await User.find().limit(1)
    
    if (users.length === 0) {
      console.log('❌ No users found in database!')
      console.log('Please register a user first at http://localhost:5173/register')
      process.exit(0)
    }
    
    const user = users[0]
    console.log('✅ Found user:', user.name, '(', user.email, ')')
    
    // Generate a token
    const token = jwt.sign(
      { id: user._id },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
    
    console.log('\n📋 JWT Token (copy this):')
    console.log(token)
    
    console.log('\n🔐 To use this token:')
    console.log('1. Open browser console at http://localhost:5173')
    console.log('2. Run this command:')
    console.log(`localStorage.setItem('bt:user', '${JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      token: token
    })}')`)
    console.log('3. Refresh the page')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

testAuthToken()
