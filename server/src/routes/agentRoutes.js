import express from 'express'
import { smartClassifySingle, smartClassifyBatch } from '../controllers/agentController.js'
import { authenticate } from '../middlewares/auth.js'

const router = express.Router()

router.post('/smart-classify', authenticate, smartClassifySingle)
router.post('/smart-batch', authenticate, smartClassifyBatch)

export default router
