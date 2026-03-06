// server/src/scripts/setup-stripe-products.js
// Run: node src/scripts/setup-stripe-products.js
// Creates Stripe products and prices in TEST mode, and prints env variables

import Stripe from 'stripe'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../../.env') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function setup() {
  console.log('🔧 Setting up Stripe products and prices in TEST mode...\n')

  // 1. Create Free Trial product ($0/month with 30-day trial)
  const freeProduct = await stripe.products.create({
    name: 'BrandTide Free',
    description: 'Free plan with 30-day trial - 100 reviews/month, basic sentiment analysis, dashboard access, CSV export'
  })
  const freePrice = await stripe.prices.create({
    product: freeProduct.id,
    unit_amount: 0, // $0
    currency: 'usd',
    recurring: { interval: 'month' }
  })
  console.log(`✅ Free product created: ${freeProduct.id}`)
  console.log(`   Free price created:   ${freePrice.id}`)

  // 2. Create Pro plan product ($49/month)
  const proProduct = await stripe.products.create({
    name: 'BrandTide Pro',
    description: 'Pro plan - 5,000 reviews/month, advanced sentiment analysis, topic detection, PDF reports, scheduled reports, priority support'
  })
  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 4900, // $49.00
    currency: 'usd',
    recurring: { interval: 'month' }
  })
  console.log(`✅ Pro product created:  ${proProduct.id}`)
  console.log(`   Pro price created:    ${proPrice.id}`)

  // 3. Create Enterprise plan product ($199/month)
  const enterpriseProduct = await stripe.products.create({
    name: 'BrandTide Enterprise',
    description: 'Enterprise plan - Unlimited reviews, custom AI models, API access, dedicated support, on-premise deployment, SLA guarantee'
  })
  const enterprisePrice = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 19900, // $199.00
    currency: 'usd',
    recurring: { interval: 'month' }
  })
  console.log(`✅ Enterprise product created: ${enterpriseProduct.id}`)
  console.log(`   Enterprise price created:   ${enterprisePrice.id}`)

  // Print the env variables
  console.log('\n' + '═'.repeat(60))
  console.log('📋 Add these to your server/.env file:')
  console.log('═'.repeat(60))
  console.log(`STRIPE_PRICE_FREE=${freePrice.id}`)
  console.log(`STRIPE_PRICE_PRO=${proPrice.id}`)
  console.log(`STRIPE_PRICE_ENTERPRISE=${enterprisePrice.id}`)
  console.log('═'.repeat(60))
}

setup().catch(console.error)
