import express from 'express'
import {
  getDashboardMetrics,
  getOverview,
  initializeSampleData
} from '../controllers/dashboardController.js'
import { authenticate } from '../middlewares/auth.js'

const router = express.Router()

router.get('/metrics', authenticate, getDashboardMetrics)
router.get('/overview', authenticate, getOverview)
router.post('/init-sample', authenticate, initializeSampleData)

export default router
