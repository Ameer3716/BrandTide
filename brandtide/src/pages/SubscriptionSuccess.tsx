// src/pages/SubscriptionSuccess.tsx
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function SubscriptionSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/app')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="text-green-600" size={40} />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Subscription Activated!
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 mb-6">
          Your payment was successful and your subscription is now active.
          Enjoy all the premium features of BrandTide!
        </p>

        {/* Features */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
            <Sparkles size={16} className="text-yellow-500" />
            <span>All premium features are now unlocked</span>
          </div>
        </div>

        {/* Session ID (debug info) */}
        {sessionId && (
          <p className="text-xs text-gray-400 mb-4 break-all">
            Session: {sessionId}
          </p>
        )}

        {/* CTA Button */}
        <button
          onClick={() => navigate('/app')}
          className="w-full bg-accent hover:bg-accent-dark text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          Go to Dashboard <ArrowRight size={18} />
        </button>

        {/* Auto-redirect */}
        <p className="text-sm text-gray-400 mt-4">
          Redirecting to dashboard in {countdown} seconds...
        </p>
      </div>
    </div>
  )
}
