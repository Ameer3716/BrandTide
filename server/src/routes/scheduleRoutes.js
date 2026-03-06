import express from 'express'
import {
  createSchedule,
  getSchedules,
  deleteSchedule,
  toggleSchedule
} from '../controllers/scheduleController.js'
import { authenticate } from '../middlewares/auth.js'

const router = express.Router()

router.post('/', authenticate, createSchedule)
router.get('/', authenticate, getSchedules)
router.delete('/:id', authenticate, deleteSchedule)
router.patch('/:id/toggle', authenticate, toggleSchedule)

export default router
