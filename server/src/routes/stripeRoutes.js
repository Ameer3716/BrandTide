import express from 'express'
import { authenticate } from '../middlewares/auth.js'
import {
  createCheckoutSession,
  getSubscriptionStatus,
  cancelSubscription,
  createPortalSession,
  handleWebhook
} from '../controllers/stripeController.js'

const router = express.Router()

// Stripe webhook — must use raw body (no JSON parsing)
// This route is mounted before express.json() in index.js
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook)

// All other routes require authentication
router.post('/create-checkout-session', authenticate, createCheckoutSession)
router.get('/subscription-status', authenticate, getSubscriptionStatus)
router.post('/cancel-subscription', authenticate, cancelSubscription)
router.post('/create-portal-session', authenticate, createPortalSession)

export default router
