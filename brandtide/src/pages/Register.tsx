import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/state/auth'
import { Sparkles, ArrowRight, Mail, Lock, User, Brain, Layers, TrendingUp, CheckCircle2, Sparkles as SparkleIcon, Loader2 } from 'lucide-react'
import { createCheckoutSession, type Plan } from '@/services/stripe'

export default function Register(){
  const { user, signInWithGoogle, signUp, loading, error } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planFromUrl = searchParams.get('plan') as Plan | null
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false)

  async function handleGoogle(){
    await signInWithGoogle()
  }

  // After successful registration, redirect to Stripe checkout if a plan was selected
  async function redirectToCheckout() {
    if (planFromUrl && ['free', 'pro', 'enterprise'].includes(planFromUrl)) {
      setRedirectingToCheckout(true)
      try {
        const url = await createCheckoutSession(planFromUrl)
        if (url) {
          window.location.href = url
          return // Don't navigate away — we're redirecting to Stripe
        }
      } catch (err: any) {
        console.error('Stripe checkout redirect failed:', err)
        setLocalError(err.message || 'Failed to start checkout. Redirecting to dashboard...')
        setRedirectingToCheckout(false)
        // Wait a moment so user sees the error before redirect
        await new Promise(r => setTimeout(r, 2000))
      }
    }
    navigate('/app')
  }

  async function handleRegister(e: React.FormEvent){
    e.preventDefault()
    setLocalError('')
    try {
      await signUp(name, email, password)
      await redirectToCheckout()
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed')
    }
  }

  // Show "redirecting to checkout" screen instead of "Already Signed In" during checkout redirect
  if (redirectingToCheckout) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-sidebar via-sidebar-dark to-sidebar">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent flex items-center justify-center">
            <Loader2 className="text-white animate-spin" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-content mb-2">Setting Up Your Subscription</h2>
          <p className="text-content-muted mb-6">Redirecting you to the secure payment page...</p>
          <div className="flex justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <div className="w-2 h-2 bg-accent rounded-full"></div>
            </div>
          </div>
          {localError && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{localError}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if(user){
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-sidebar via-sidebar-dark to-sidebar">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent flex items-center justify-center">
            <Sparkles className="text-white" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-content mb-2">Already Signed In</h2>
          <p className="text-content-muted mb-6">
            {planFromUrl
              ? `You're signed in! Click below to subscribe to the ${planFromUrl} plan.`
              : 'You are already authenticated. Continue to your dashboard.'}
          </p>
          {localError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{localError}</p>
            </div>
          )}
          {planFromUrl ? (
            <button
              onClick={() => redirectToCheckout()}
              disabled={redirectingToCheckout}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {redirectingToCheckout
                ? <><Loader2 size={16} className="animate-spin" /> Redirecting to payment...</>
                : <>Subscribe to {planFromUrl.charAt(0).toUpperCase() + planFromUrl.slice(1)} <ArrowRight size={16}/></>
              }
            </button>
          ) : (
            <button onClick={()=>navigate('/app')} className="btn-primary w-full flex items-center justify-center gap-2">
              Go to Dashboard <ArrowRight size={16}/>
            </button>
          )}
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
            <h2 className="text-2xl font-bold text-white mb-2">Start Analyzing Reviews</h2>
            <p className="text-white/70 text-sm">Join 500+ brands using AI for customer insights.</p>
          </div>

          {/* Live Analytics Stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Platform Stats</h3>
              <span className="text-accent text-xs font-medium animate-pulse">● Live</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/10 rounded-lg p-2.5">
                <div className="text-xl font-bold text-accent mb-0.5">10K+</div>
                <div className="text-white/70 text-xs">Reviews</div>
                <div className="mt-1 flex items-center gap-1">
                  <TrendingUp size={12} className="text-green-400" />
                  <span className="text-green-400 text-[10px]">+24%</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-2.5">
                <div className="text-xl font-bold text-accent mb-0.5">98%</div>
                <div className="text-white/70 text-xs">Accuracy</div>
                <div className="mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-400" />
                  <span className="text-green-400 text-[10px]">Leading</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-2.5">
                <div className="text-xl font-bold text-accent mb-0.5">500+</div>
                <div className="text-white/70 text-xs">Brands</div>
                <div className="mt-1 flex items-center gap-1">
                  <SparkleIcon size={12} className="text-yellow-400" />
                  <span className="text-yellow-400 text-[10px]">Growing</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-2.5">
                <div className="text-xl font-bold text-accent mb-0.5">&lt;2s</div>
                <div className="text-white/70 text-xs">Response</div>
                <div className="mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-400" />
                  <span className="text-green-400 text-[10px]">Fast</span>
                </div>
              </div>
            </div>
          </div>

          {/* What You Get */}
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-xs mb-2">What You Get:</h3>
            {[
              { icon: Brain, text: 'AI sentiment analysis' },
              { icon: Layers, text: 'Topic detection' },
              { icon: TrendingUp, text: 'Trend tracking' },
              { icon: CheckCircle2, text: 'PDF reports' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-lg p-2 hover:bg-white/10 transition">
                <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="text-accent" size={14} />
                </div>
                <span className="text-white/90 text-xs">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-xs">© {new Date().getFullYear()} BrandTide. All rights reserved.</p>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 bg-surface-muted overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <img src="/logo.jpg" alt="BrandTide Logo" className="w-8 h-8 rounded-lg object-cover" />
            <h1 className="text-base font-bold text-content">BrandTide</h1>
          </div>

          <h2 className="text-xl font-bold text-content mb-1">Create your account</h2>
          <p className="text-content-muted text-sm mb-6">Start analyzing customer sentiment in minutes</p>

          {(error || localError) && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error || localError}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-content mb-1.5">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full pl-10 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition"
                />
              </div>
            </div>
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
            <button disabled={loading} className="bg-gradient-to-br from-sidebar via-sidebar-dark to-sidebar text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 w-full flex items-center justify-center gap-2">
              {loading ? 'Creating...' : 'Create Account'} <ArrowRight size={16} />
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
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-dark font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
