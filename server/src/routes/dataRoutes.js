import express from 'express'
import {
  getMetrics,
  getSentimentTrend,
  getTopProducts,
  getRepresentativeReviews,
  getBrands,
  getProducts,
  initializeSampleData
} from '../controllers/dataController.js'
import { authenticate } from '../middlewares/auth.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Dashboard data endpoints
router.get('/metrics', getMetrics)
router.get('/sentiment-trend', getSentimentTrend)
router.get('/top-products', getTopProducts)
router.get('/representative-reviews', getRepresentativeReviews)
router.get('/brands', getBrands)
router.get('/products', getProducts)

// Initialize sample data (development only)
router.post('/init-sample-data', initializeSampleData)

export default router
