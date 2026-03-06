import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/state/auth'
import { ArrowRight, Sparkles, Mail, Lock, MessageSquare, ThumbsUp, ThumbsDown, Star, BarChart3, FileText, Upload } from 'lucide-react'
import { useState } from 'react'
import { getSubscriptionStatus } from '@/services/stripe'

export default function Login(){
  const { user, signInWithGoogle, signIn, loading, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  // Check subscription and navigate accordingly
  async function navigateAfterLogin() {
    try {
      const sub = await getSubscriptionStatus()
      const hasActiveSub = (sub.status === 'active' || sub.status === 'trialing') && sub.plan && sub.plan !== 'none'
      if (hasActiveSub) {
        navigate('/app')
      } else {
        navigate('/choose-plan')
      }
    } catch {
      // If subscription check fails, send to choose-plan (safe default)
      navigate('/choose-plan')
    }
  }

  async function handleGoogle(){
    await signInWithGoogle()
  }

  async function handleLogin(e: React.FormEvent){
    e.preventDefault()
    setLocalError('')
    try {
      await signIn(email, password)
      await navigateAfterLogin()
    } catch (err: any) {
      setLocalError(err.message || 'Login failed')
    }
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-sidebar via-sidebar-dark to-sidebar">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent flex items-center justify-center">
            <Sparkles className="text-white" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-content mb-2">Already Signed In</h2>
          <p className="text-content-muted mb-6">You are already authenticated. Continue to your dashboard.</p>
          <button onClick={() => navigate('/app')} className="btn-primary w-full flex items-center justify-center gap-2">
            Go to Dashboard <ArrowRight size={16} />
          </button>
          <p className="text-xs text-content-muted mt-4">Need another account? Sign out from inside the app.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sidebar via-sidebar-dark to-sidebar p-6 flex-col justify-between overflow-y-auto">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="BrandTide Logo" className="w-8 h-8 rounded-lg object-cover" />
          <h1 className="text-base font-bold text-white">BrandTide</h1>
        </div>
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-white/70 text-sm">Transform customer reviews into actionable insights.</p>
          </div>

          {/* Sentiment Distribution Visualization */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Recent Sentiment</h3>
              <span className="text-accent text-xs font-medium">10K+ Reviews</span>
            </div>
            <div className="flex items-center justify-center gap-6">
              {/* Sentiment Donut */}
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="12" />
                  <circle cx="48" cy="48" r="40" fill="none" stroke="#10B981" strokeWidth="12"
                    strokeDasharray="156 251" strokeLinecap="round" />
                  <circle cx="48" cy="48" r="40" fill="none" stroke="#FCD34D" strokeWidth="12"
                    strokeDasharray="63 251" strokeDashoffset="-156" strokeLinecap="round" />
                  <circle cx="48" cy="48" r="40" fill="none" stroke="#EF4444" strokeWidth="12"
                    strokeDasharray="32 251" strokeDashoffset="-219" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">62%</div>
                    <div className="text-[10px] text-white/60">Positive</div>
                  </div>
                </div>
              </div>
              {/* Legend */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <ThumbsUp size={14} className="text-green-400" />
                  <span className="text-white text-xs">Positive</span>
                  <span className="text-white/60 text-xs ml-auto">62%</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-yellow-400" />
                  <span className="text-white text-xs">Neutral</span>
                  <span className="text-white/60 text-xs ml-auto">25%</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown size={14} className="text-red-400" />
                  <span className="text-white text-xs">Negative</span>
                  <span className="text-white/60 text-xs ml-auto">13%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/15 transition">
              <BarChart3 className="text-accent mb-1.5" size={20} />
              <h4 className="text-white font-medium text-xs mb-0.5">Dashboard</h4>
              <p className="text-white/60 text-[10px]">Real-time metrics</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/15 transition">
              <Star className="text-accent mb-1.5" size={20} />
              <h4 className="text-white font-medium text-xs mb-0.5">Highlights</h4>
              <p className="text-white/60 text-[10px]">Top insights</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/15 transition">
              <FileText className="text-accent mb-1.5" size={20} />
              <h4 className="text-white font-medium text-xs mb-0.5">Reports</h4>
              <p className="text-white/60 text-[10px]">PDF exports</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/15 transition">
              <Upload className="text-accent mb-1.5" size={20} />
              <h4 className="text-white font-medium text-xs mb-0.5">Batch Upload</h4>
              <p className="text-white/60 text-[10px]">CSV import</p>
            </div>
          </div>
        </div>
        <p className="text-white/40 text-xs">© {new Date().getFullYear()} BrandTide. All rights reserved.</p>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 bg-surface-muted overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/logo.jpg" alt="BrandTide Logo" className="w-10 h-10 rounded-xl object-cover" />
            <h1 className="text-xl font-bold text-content">BrandTide</h1>
          </div>

          <h2 className="text-2xl font-bold text-content mb-2">Sign in to your account</h2>
          <p className="text-content-muted mb-8">Enter your credentials to access your dashboard</p>

          {(error || localError) && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error || localError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
            <div>
              <label className="block text-sm font-medium text-content mb-1.5">Password</label>
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300 text-accent focus:ring-accent" />
                <span className="text-sm text-content-muted">Remember me</span>
              </label>
              <Link to="/forgot" className="text-sm text-accent hover:text-accent-dark font-medium">
                Forgot password?
              </Link>
            </div>

            <button disabled={loading} className="bg-gradient-to-br from-sidebar via-sidebar-dark to-sidebar text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 w-full flex items-center justify-center gap-2">
              {loading ? 'Signing in...' : 'Sign in'} <ArrowRight size={16} />
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-content-muted">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            disabled={loading}
            onClick={handleGoogle}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-content-muted mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-dark font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
