import express from 'express'
import {
  classifySingle,
  classifyBatch,
  createReview,
  getReviews,
  getRecentActivity
} from '../controllers/reviewController.js'
import { authenticate } from '../middlewares/auth.js'
import { reviewValidation, validate } from '../middlewares/validator.js'

const router = express.Router()

// Classifier routes
router.post('/classifier/single', authenticate, classifySingle)
router.post('/classifier/batch', authenticate, classifyBatch)

// Review routes
router.post('/', authenticate, reviewValidation, validate, createReview)
router.get('/', authenticate, getReviews)
router.get('/recent-activity', authenticate, getRecentActivity)

export default router
