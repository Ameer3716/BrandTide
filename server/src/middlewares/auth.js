import jwt from 'jsonwebtoken'
import config from '../config/config.js'
import User from '../models/User.js'

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authentication required.'
      })
    }
    
    const token = authHeader.split(' ')[1]
    
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret)
    
    // Get user from token
    const user = await User.findById(decoded.id).select('-password')
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      })
    }
    
    // Attach user to request
    req.user = user
    next()
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      })
    }
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    })
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }
    
    next()
  }
}

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, config.jwtSecret)
      const user = await User.findById(decoded.id).select('-password')
      
      if (user && user.isActive) {
        req.user = user
      }
    }
  } catch (error) {
    // Silently fail - authentication is optional
  }
  
  next()
}
