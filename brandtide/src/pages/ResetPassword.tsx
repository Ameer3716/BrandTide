import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Key, ArrowRight, CheckCircle, Lock, Sparkles, AlertCircle } from 'lucide-react'
import { useAuth } from '@/state/auth'

const API_URL = import.meta.env.VITE_API_URL

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenError, setTokenError] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setTokenError(true)
      setError('Invalid or missing reset token. Please request a new password reset link.')
    }
  }, [token])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (response.ok) {
        // Auto-login after successful password reset
        if (data.data?.token && data.data?.user) {
          localStorage.setItem('token', data.data.token)
          localStorage.setItem('user', JSON.stringify(data.data.user))
          setUser(data.data.user)
        }
        setDone(true)
      } else {
        setError(data.message || 'Failed to reset password')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleContinue() {
    navigate('/app')
  }

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-surface-muted">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
              <AlertCircle className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-content">Invalid Link</h2>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <Link to="/forgot" className="btn-primary w-full flex items-center justify-center gap-2">
            Request New Reset Link <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
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
          <h2 className="text-4xl font-bold text-white mb-4">Secure your account</h2>
          <p className="text-white/70 text-lg">Create a strong password to protect your data and insights.</p>
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
              {done ? <CheckCircle className="text-white" size={24} /> : <Key className="text-white" size={24} />}
            </div>
            <h2 className="text-2xl font-bold text-content">
              {done ? 'Password Updated' : 'Reset Password'}
            </h2>
          </div>

          {!done && (
            <>
              <p className="text-content-muted mb-8">Choose a new password for your account.</p>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-content mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition"
                    />
                  </div>
                  <p className="text-xs text-content-muted mt-1.5">Minimum 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-content mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition"
                    />
                  </div>
                </div>
                <button
                  disabled={loading || !password || !confirm}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Set New Password'} <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}

          {done && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  Your password has been successfully updated. You can now access your account with your new credentials.
                </p>
              </div>
              <button onClick={handleContinue} className="btn-primary w-full flex items-center justify-center gap-2">
                Go to Dashboard <ArrowRight size={16} />
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