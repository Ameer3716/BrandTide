import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import config from '../config/config.js'
import { sendPasswordResetEmail } from '../utils/email.js'

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpire
  })
}

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    
    console.log('Registration attempt:', { name, email })
    
    // Check if user exists
    const existingUser = await User.findByEmail(email)
    console.log('Existing user check:', existingUser ? 'Found' : 'Not found')
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      })
    }
    
    console.log('Creating new user...')
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      authProvider: 'local'
    })
    
    console.log('User created:', user._id)
    
    // Update last login
    await user.updateLastLogin()
    
    // Generate token
    const token = generateToken(user._id)
    
    // Convert to JSON
    const userJson = user.toJSON()
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: userJson._id,
          name: userJson.name,
          email: userJson.email,
          avatar: userJson.avatar,
          role: userJson.role,
          authProvider: userJson.authProvider,
          lastLogin: userJson.lastLogin,
          createdAt: userJson.createdAt,
          subscriptionPlan: userJson.subscriptionPlan || 'none',
          subscriptionStatus: userJson.subscriptionStatus || 'none',
          trialEndsAt: userJson.trialEndsAt,
          subscriptionEndsAt: userJson.subscriptionEndsAt
        },
        token
      }
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    
    // Find user with password field
    const user = await User.findByEmail(email)
    if (user) {
      await user.populate({ path: '_id', select: '+password' })
    }
    const userWithPassword = user ? await User.findById(user._id).select('+password') : null
    
    if (!userWithPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }
    
    // Check if user is active
    if (!userWithPassword.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      })
    }
    
    // Check password
    const isMatch = await userWithPassword.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }
    
    // Update last login
    await userWithPassword.updateLastLogin()
    
    // Generate token
    const token = generateToken(userWithPassword._id)
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: userWithPassword._id,
          name: userWithPassword.name,
          email: userWithPassword.email,
          avatar: userWithPassword.avatar,
          role: userWithPassword.role,
          subscriptionPlan: userWithPassword.subscriptionPlan || 'none',
          subscriptionStatus: userWithPassword.subscriptionStatus || 'none',
          trialEndsAt: userWithPassword.trialEndsAt,
          subscriptionEndsAt: userWithPassword.subscriptionEndsAt
        },
        token
      }
    })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    })
  }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    
    // Convert to JSON
    const userJson = user.toJSON()
    
    res.json({
      success: true,
      data: {
        user: {
          id: userJson._id,
          name: userJson.name,
          email: userJson.email,
          avatar: userJson.avatar,
          role: userJson.role,
          authProvider: userJson.authProvider,
          lastLogin: userJson.lastLogin,
          createdAt: userJson.createdAt,
          subscriptionPlan: user.subscriptionPlan || 'none',
          subscriptionStatus: user.subscriptionStatus || 'none',
          trialEndsAt: user.trialEndsAt,
          subscriptionEndsAt: user.subscriptionEndsAt
        }
      }
    })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    })
  }
}

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = async (req, res) => {
  try {
    // User is attached by passport
    const token = generateToken(req.user._id)
    
    // Update last login
    await req.user.updateLastLogin()
    
    // Redirect to frontend with token
    res.redirect(`${config.clientUrl}/auth/success?token=${token}`)
    
  } catch (error) {
    res.redirect(`${config.clientUrl}/auth/error?message=${error.message}`)
  }
}

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
}

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findByEmail(email)

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      })
    }

    // Check if user is using OAuth
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in. Please use Google to access your account.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    // Set expire time (1 hour)
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000

    await user.save()

    // Send email
    try {
      await sendPasswordResetEmail(user, resetToken)

      res.json({
        success: true,
        message: 'Password reset email sent successfully'
      })
    } catch (emailError) {
      // If email fails, clear the reset token
      user.resetPasswordToken = null
      user.resetPasswordExpire = null
      await user.save()

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.'
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    })
  }
}

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      })
    }

    // Hash the token from URL
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      })
    }

    // Set new password
    user.password = password
    user.resetPasswordToken = null
    user.resetPasswordExpire = null
    await user.save()

    // Generate token for auto-login
    const authToken = generateToken(user._id)

    res.json({
      success: true,
      message: 'Password reset successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        },
        token: authToken
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    })
  }
}
