// src/pages/ChoosePlan.tsx
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { CheckCircle2, Loader2, Sparkles, ArrowRight, Crown, Zap } from 'lucide-react'
import { createCheckoutSession, type Plan } from '@/services/stripe'
import { useAuth } from '@/state/auth'

export default function ChoosePlan() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activePlan, setActivePlan] = useState<Plan>('pro')
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  // If not logged in, redirect to login
  if (!user) {
    navigate('/login')
    return null
  }

  const handleSelectPlan = async (plan: Plan) => {
    setError('')
    setCheckoutLoading(plan)
    try {
      const url = await createCheckoutSession(plan)
      if (url) {
        window.location.href = url
        return
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Failed to start checkout. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const plans = [
    {
      id: 'free' as Plan,
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for trying out BrandTide',
      icon: Sparkles,
      features: ['100 reviews/month', 'Basic sentiment analysis', 'Dashboard access', 'CSV export'],
      buttonText: 'Start Free Trial',
      buttonClass: 'btn-secondary',
      trial: '30-day free trial • Card required'
    },
    {
      id: 'pro' as Plan,
      name: 'Pro',
      price: '$49',
      period: '/month',
      description: 'For growing businesses',
      icon: Zap,
      popular: true,
      features: ['5,000 reviews/month', 'Advanced sentiment analysis', 'Topic detection', 'PDF reports', 'Scheduled reports', 'Priority support'],
      buttonText: 'Get Started',
      buttonClass: 'btn-primary',
    },
    {
      id: 'enterprise' as Plan,
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations',
      icon: Crown,
      features: ['Unlimited reviews', 'Custom AI models', 'API access', 'Dedicated support', 'On-premise deployment', 'SLA guarantee'],
      buttonText: 'Get Started',
      buttonClass: 'btn-secondary',
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <img src="/logo.jpg" alt="BrandTide Logo" className="w-10 h-10 rounded-xl object-cover" />
            </div>
            <span className="text-lg font-bold text-gray-900">BrandTide</span>
          </div>
          <div className="text-sm text-gray-500">
            Signed in as <span className="font-medium text-gray-700">{user.name || user.email}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-5xl w-full">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Choose Your Plan</h1>
            <p className="text-gray-600 text-lg">Select a subscription to unlock BrandTide's features</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white p-7 rounded-2xl border-2 transition cursor-pointer relative ${
                  activePlan === plan.id
                    ? 'border-accent shadow-lg scale-[1.02]'
                    : 'border-gray-200 hover:border-accent/50 hover:shadow-md'
                }`}
                onClick={() => setActivePlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activePlan === plan.id ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <plan.icon size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                </div>

                <div className="mb-1">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-500">{plan.period}</span>}
                </div>
                <p className="text-gray-500 text-sm mb-5">{plan.description}</p>

                {plan.trial && (
                  <div className="mb-4 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg inline-block">
                    {plan.trial}
                  </div>
                )}

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="text-accent mt-0.5 flex-shrink-0" size={16} />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`${plan.buttonClass} w-full flex items-center justify-center gap-2`}
                  onClick={(e) => { e.stopPropagation(); handleSelectPlan(plan.id) }}
                  disabled={checkoutLoading === plan.id}
                >
                  {checkoutLoading === plan.id ? (
                    <><Loader2 size={16} className="animate-spin" /> Processing...</>
                  ) : (
                    <>{plan.buttonText} <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Skip option */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/app')}
              className="text-gray-400 hover:text-gray-600 text-sm underline transition"
            >
              Skip for now - continue to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
