import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowRight, Sparkles, CheckCircle, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setSent(true)
      } else {
        setError(data.message || 'Failed to send reset email')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sidebar via-sidebar-dark to-sidebar p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Sparkles className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold text-white">BrandTide</h1>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white mb-4">Reset your password</h2>
          <p className="text-white/70 text-lg">We'll help you regain access to your account quickly and securely.</p>
        </div>
        <p className="text-white/40 text-sm">© {new Date().getFullYear()} BrandTide. All rights reserved.</p>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-muted">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-content">BrandTide</h1>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
              {sent ? <CheckCircle className="text-white" size={24} /> : <Mail className="text-white" size={24} />}
            </div>
            <h2 className="text-2xl font-bold text-content">
              {sent ? 'Check your email' : 'Forgot Password'}
            </h2>
          </div>

          {!sent && (
            <>
              <p className="text-content-muted mb-8">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSend} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-content mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition"
                    />
                  </div>
                </div>
                <button 
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'} <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}

          {sent && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  We've sent a password reset link to <span className="font-medium">{email}</span>.
                  Please check your inbox and follow the instructions.
                </p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>📧 Note:</strong> The reset link will expire in 1 hour. If you don't see the email, please check your spam folder.
                </p>
              </div>
              <button 
                onClick={() => { setSent(false); setEmail(''); }}
                className="btn-secondary w-full"
              >
                Send Another Email
              </button>
            </div>
          )}

          <p className="text-center text-sm text-content-muted mt-8">
            Remember your password?{' '}
            <Link to="/login" className="text-accent hover:text-accent-dark font-medium">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
