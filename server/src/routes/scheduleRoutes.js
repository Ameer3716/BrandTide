import express from 'express'
import {
  createSchedule,
  getSchedules,
  deleteSchedule,
  toggleSchedule
} from '../controllers/scheduleController.js'
import { authenticate } from '../middlewares/auth.js'
import { checkAndSendScheduledReports } from '../jobs/scheduleReportJob.js'
import config from '../config/config.js'

const router = express.Router()

router.post('/', authenticate, createSchedule)
router.get('/', authenticate, getSchedules)
router.delete('/:id', authenticate, deleteSchedule)
router.patch('/:id/toggle', authenticate, toggleSchedule)

// Development/Testing: Manually trigger schedule check
// Only available in development mode for testing purposes
if (config.nodeEnv === 'development') {
  router.post('/admin/trigger-check', async (req, res) => {
    try {
      console.log('🧪 Manual trigger: Running scheduled reports check...')
      await checkAndSendScheduledReports()
      res.json({ success: true, message: 'Schedule check triggered successfully' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  })
}

export default router
