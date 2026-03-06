import express from 'express'
import passport from 'passport'
import {
  register,
  login,
  getMe,
  googleCallback,
  logout,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js'
import { authenticate } from '../middlewares/auth.js'
import { registerValidation, loginValidation, validate } from '../middlewares/validator.js'

const router = express.Router()

// Local authentication routes
router.post('/register', registerValidation, validate, register)
router.post('/login', loginValidation, validate, login)
router.get('/me', authenticate, getMe)
router.post('/logout', authenticate, logout)

// Password reset routes
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
)

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/auth/error' 
  }),
  googleCallback
)

export default router
