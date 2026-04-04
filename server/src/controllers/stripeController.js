import Stripe from 'stripe'
import config from '../config/config.js'
import User from '../models/User.js'

const stripe = new Stripe(config.stripe.secretKey)

/**
 * Create or retrieve a Stripe customer for the authenticated user
 */
async function getOrCreateCustomer(user) {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId
  }

  // Get user data
  const userData = user.toJSON()

  const customer = await stripe.customers.create({
    email: userData.email,
    name: userData.name,
    metadata: {
      userId: user._id.toString()
    }
  })

  user.stripeCustomerId = customer.id
  await user.save()

  return customer.id
}

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe Checkout session for the selected plan
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body // 'free', 'pro', or 'enterprise'
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(user)

    // Determine the price ID and checkout mode
    let priceId
    let trialDays = 0

    switch (plan) {
      case 'free':
        priceId = config.stripe.prices.free
        trialDays = 30 // 1 month free trial
        break
      case 'pro':
        priceId = config.stripe.prices.pro
        break
      case 'enterprise':
        priceId = config.stripe.prices.enterprise
        break
      default:
        return res.status(400).json({ success: false, message: 'Invalid plan selected' })
    }

    if (!priceId) {
      return res.status(400).json({
        success: false,
        message: `Stripe price not configured for ${plan} plan. Please set STRIPE_PRICE_${plan.toUpperCase()} env variable.`
      })
    }

    // Build checkout session options
    const sessionConfig = {
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${config.clientUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.clientUrl}/subscription/cancel`,
      metadata: {
        userId: user._id.toString(),
        plan: plan
      },
      subscription_data: {
        metadata: {
          userId: user._id.toString(),
          plan: plan
        }
      }
    }

    // Add free trial period for the free plan
    if (trialDays > 0) {
      sessionConfig.subscription_data.trial_period_days = trialDays
      // Require card even for trial
      sessionConfig.payment_method_collection = 'always'
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message
    })
  }
}

/**
 * GET /api/stripe/subscription-status
 * Returns the current user's subscription status
 */
export const getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const subscriptionData = {
      plan: user.subscriptionPlan,
      status: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
      subscriptionEndsAt: user.subscriptionEndsAt,
      stripeCustomerId: user.stripeCustomerId
    }

    // If there is an active subscription, fetch details from Stripe
    if (user.subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.subscriptionId)
        subscriptionData.currentPeriodEnd = new Date(subscription.current_period_end * 1000)
        subscriptionData.cancelAtPeriodEnd = subscription.cancel_at_period_end
      } catch (stripeError) {
        console.error('Stripe subscription fetch error:', stripeError.message)
      }
    }

    res.json({
      success: true,
      data: subscriptionData
    })
  } catch (error) {
    console.error('Subscription status error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription status',
      error: error.message
    })
  }
}

/**
 * POST /api/stripe/cancel-subscription
 * Cancels the user's current subscription at end of billing period
 */
export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user || !user.subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      })
    }

    // Cancel at end of current billing period (not immediately)
    const subscription = await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true
    })

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      data: {
        cancelAt: new Date(subscription.current_period_end * 1000)
      }
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    })
  }
}

/**
 * POST /api/stripe/create-portal-session
 * Creates a Stripe Customer Portal session for managing billing
 */
export const createPortalSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user || !user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No Stripe customer found. Please subscribe first.'
      })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${config.clientUrl}/app/profile`
    })

    res.json({
      success: true,
      data: { url: session.url }
    })
  } catch (error) {
    console.error('Portal session error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create portal session',
      error: error.message
    })
  }
}

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for subscription lifecycle
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw body
      sig,
      config.stripe.webhookSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  console.log(`📩 Stripe webhook received: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object
        await handleSubscriptionCreated(subscription)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        await handleInvoicePaymentFailed(invoice)
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object
        console.log(`⏰ Trial ending soon for subscription ${subscription.id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error(`Error handling webhook ${event.type}:`, error)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
}

// ─── Webhook Handler Helpers ────────────────────────────────────────────────

async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId
  const plan = session.metadata?.plan

  if (!userId) {
    console.error('No userId in checkout session metadata')
    return
  }

  const user = await User.findById(userId)
  if (!user) {
    console.error(`User ${userId} not found for checkout session`)
    return
  }

  // Update user with subscription info
  user.subscriptionPlan = plan || 'pro'
  user.stripeCustomerId = session.customer

  if (session.subscription) {
    user.subscriptionId = session.subscription
    // Fetch detailed subscription info
    const subscription = await stripe.subscriptions.retrieve(session.subscription)
    user.subscriptionStatus = subscription.status

    if (subscription.trial_end) {
      user.trialEndsAt = new Date(subscription.trial_end * 1000)
    }
    user.subscriptionEndsAt = new Date(subscription.current_period_end * 1000)
  }

  await user.save()
  console.log(`✅ Checkout completed: User ${userId} subscribed to ${plan}`)
}

async function handleSubscriptionCreated(subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) return

  const user = await User.findById(userId)
  if (!user) return

  user.subscriptionId = subscription.id
  user.subscriptionStatus = subscription.status
  user.subscriptionPlan = subscription.metadata?.plan || user.subscriptionPlan

  if (subscription.trial_end) {
    user.trialEndsAt = new Date(subscription.trial_end * 1000)
  }
  user.subscriptionEndsAt = new Date(subscription.current_period_end * 1000)

  await user.save()
  console.log(`✅ Subscription created: ${subscription.id} for user ${userId}`)
}

async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata?.userId

  // Try to find user by subscription metadata or by subscriptionId
  let user
  if (userId) {
    user = await User.findById(userId)
  }
  if (!user) {
    user = await User.findOne({ subscriptionId: subscription.id })
  }
  if (!user) {
    console.error(`No user found for subscription ${subscription.id}`)
    return
  }

  user.subscriptionStatus = subscription.status
  user.subscriptionEndsAt = new Date(subscription.current_period_end * 1000)

  if (subscription.trial_end) {
    user.trialEndsAt = new Date(subscription.trial_end * 1000)
  }

  // If subscription canceled at period end
  if (subscription.cancel_at_period_end) {
    console.log(`⚠️ Subscription ${subscription.id} will cancel at period end`)
  }

  await user.save()
  console.log(`🔄 Subscription updated: ${subscription.id} → ${subscription.status}`)
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata?.userId

  let user
  if (userId) {
    user = await User.findById(userId)
  }
  if (!user) {
    user = await User.findOne({ subscriptionId: subscription.id })
  }
  if (!user) return

  user.subscriptionStatus = 'canceled'
  user.subscriptionPlan = 'none'
  user.subscriptionId = null
  user.subscriptionEndsAt = null
  user.trialEndsAt = null

  await user.save()
  console.log(`❌ Subscription deleted: ${subscription.id} for user ${user._id}`)
}

async function handleInvoicePaymentSucceeded(invoice) {
  if (!invoice.subscription) return

  const user = await User.findOne({ subscriptionId: invoice.subscription })
  if (!user) return

  user.subscriptionStatus = 'active'
  await user.save()
  console.log(`💰 Payment succeeded for subscription ${invoice.subscription}`)
}

async function handleInvoicePaymentFailed(invoice) {
  if (!invoice.subscription) return

  const user = await User.findOne({ subscriptionId: invoice.subscription })
  if (!user) return

  user.subscriptionStatus = 'past_due'
  await user.save()
  console.log(`⚠️ Payment failed for subscription ${invoice.subscription}`)
}
