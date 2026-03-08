// src/pages/Landing.tsx
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, CheckCircle2, Sparkles, TrendingUp, BarChart3,
  FileText, Zap, Shield, Globe, Users, Star, ChevronRight,
  MessageSquare, Target, PieChart, Download, Calendar, Upload,
  Github, Linkedin, Mail, Loader2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createCheckoutSession, type Plan } from '@/services/stripe'

export default function Landing() {
  const navigate = useNavigate()
  const [activePlan, setActivePlan] = useState('pro')
  const [typingText, setTypingText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [loopNum, setLoopNum] = useState(0)
  const [typingSpeed, setTypingSpeed] = useState(150)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  // Check if user is logged in
  const isLoggedIn = () => {
    const userStr = localStorage.getItem('bt:user')
    if (!userStr) return false
    try {
      const user = JSON.parse(userStr)
      return !!user.token
    } catch {
      return false
    }
  }

  // Handle pricing button click — redirect to Stripe Checkout
  const handlePricingClick = async (plan: Plan) => {
    // If user is not logged in, redirect to register with plan info
    if (!isLoggedIn()) {
      navigate(`/register?plan=${plan}`)
      return
    }

    setCheckoutLoading(plan)
    try {
      const url = await createCheckoutSession(plan)
      // Redirect to Stripe Checkout page
      window.location.href = url
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert(error.message || 'Failed to start checkout. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const phrases = [
    'Transform Customer Reviews',
    'Unlock Hidden Insights',
    'Analyze Sentiment Instantly',
    'Drive Data Decisions'
  ]

  useEffect(() => {
    const handleTyping = () => {
      const currentPhrase = phrases[loopNum % phrases.length]
      const updatedText = isDeleting
        ? currentPhrase.substring(0, typingText.length - 1)
        : currentPhrase.substring(0, typingText.length + 1)

      setTypingText(updatedText)

      if (!isDeleting && updatedText === currentPhrase) {
        setTimeout(() => setIsDeleting(true), 2000)
        setTypingSpeed(100)
      } else if (isDeleting && updatedText === '') {
        setIsDeleting(false)
        setLoopNum(loopNum + 1)
        setTypingSpeed(150)
      } else {
        setTypingSpeed(isDeleting ? 50 : 150)
      }
    }

    const timer = setTimeout(handleTyping, typingSpeed)
    return () => clearTimeout(timer)
  }, [typingText, isDeleting, loopNum, typingSpeed])

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Aurora/Wave Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Aurora wave 1 */}
        <div
          className="absolute w-[200%] h-[600px] -top-[200px] -left-[50%] opacity-30"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.3) 25%, rgba(52,211,153,0.2) 50%, rgba(16,185,129,0.3) 75%, transparent 100%)',
            transform: 'rotate(-5deg)',
            animation: 'wave1 12s linear infinite'
          }}
        ></div>

        {/* Aurora wave 2 */}
        <div
          className="absolute w-[200%] h-[500px] top-[100px] -left-[50%] opacity-20"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(10,45,35,0.25) 30%, rgba(16,185,129,0.15) 50%, rgba(10,45,35,0.25) 70%, transparent 100%)',
            transform: 'rotate(-3deg)',
            animation: 'wave2 15s linear infinite'
          }}
        ></div>

        {/* Aurora wave 3 - bottom */}
        <div
          className="absolute w-[200%] h-[400px] bottom-0 -left-[50%] opacity-25"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.2) 20%, rgba(16,185,129,0.3) 50%, rgba(52,211,153,0.2) 80%, transparent 100%)',
            transform: 'rotate(2deg)',
            animation: 'wave3 18s linear infinite'
          }}
        ></div>

        {/* Glow spots */}
        <div
          className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)',
            animation: 'glow 8s ease-in-out infinite'
          }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/4 w-[250px] h-[250px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(52,211,153,0.5) 0%, transparent 70%)',
            animation: 'glow 10s ease-in-out infinite reverse'
          }}
        ></div>

        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #0A2D23 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        ></div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes wave1 {
          0% { transform: translateX(-25%) rotate(-5deg); }
          100% { transform: translateX(25%) rotate(-5deg); }
        }
        @keyframes wave2 {
          0% { transform: translateX(25%) rotate(-3deg); }
          100% { transform: translateX(-25%) rotate(-3deg); }
        }
        @keyframes wave3 {
          0% { transform: translateX(-20%) rotate(2deg); }
          100% { transform: translateX(20%) rotate(2deg); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.1); }
        }
      `}</style>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="BrandTide Logo" className="w-10 h-10 rounded-xl object-cover" />
              <h1 className="text-2xl font-bold text-content">BrandTide</h1>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-content-muted hover:text-content transition font-medium">Features</a>
              <a href="#how-it-works" className="text-content-muted hover:text-content transition font-medium">How It Works</a>
              <a href="#pricing" className="text-content-muted hover:text-content transition font-medium">Pricing</a>
              <a href="#team" className="text-content-muted hover:text-content transition font-medium">Team</a>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary flex items-center gap-2"
            >
              Get Started <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-sidebar/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 relative">
          <div className="text-center space-y-8">
            

            <h1 className="text-5xl md:text-7xl font-bold text-content leading-tight min-h-[180px] md:min-h-[200px]">
              <span className="text-accent">
                {typingText}
                <span className="animate-pulse">|</span>
              </span>
              <br />
              <span className="text-content">Into Actionable Insights</span>
            </h1>

            <p className="text-xl text-content-muted max-w-3xl mx-auto leading-relaxed">
              BrandTide uses advanced AI to analyze customer sentiment, uncover trends,
              and help you make data-driven decisions that elevate your brand.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('/register')}
                className="btn-primary px-8 py-4 text-lg flex items-center gap-2"
              >
                Start Free Trial <ArrowRight size={20} />
              </button>
              <button
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary px-8 py-4 text-lg flex items-center gap-2"
              >
                Watch Demo <ChevronRight size={20} />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16">
              <div className="bg-gray-50 rounded-2xl shadow-lg border-2 border-gray-300 p-6 hover:shadow-xl transition-shadow">
                <div className="text-3xl font-bold text-accent">98%</div>
                <div className="text-content-muted text-sm mt-1">Accuracy</div>
              </div>
              <div className="bg-gray-50 rounded-2xl shadow-lg border-2 border-gray-300 p-6 hover:shadow-xl transition-shadow">
                <div className="text-3xl font-bold text-accent">10K+</div>
                <div className="text-content-muted text-sm mt-1">Reviews Analyzed</div>
              </div>
              <div className="bg-gray-50 rounded-2xl shadow-lg border-2 border-gray-300 p-6 hover:shadow-xl transition-shadow">
                <div className="text-3xl font-bold text-accent">500+</div>
                <div className="text-content-muted text-sm mt-1">Brands Trust Us</div>
              </div>
              <div className="bg-gray-50 rounded-2xl shadow-lg border-2 border-gray-300 p-6 hover:shadow-xl transition-shadow">
                <div className="text-3xl font-bold text-accent">24/7</div>
                <div className="text-content-muted text-sm mt-1">Real-time Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-content mb-4">What We Offer</h2>
            <p className="text-content-muted text-lg max-w-3xl mx-auto">
              BrandTide solves the challenge of understanding customer sentiment at scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-8 rounded-2xl shadow-lg border-2 border-gray-300">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                <MessageSquare className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-content mb-2">Sentiment Analysis</h3>
              <p className="text-content-muted">Automatically classify reviews as positive, negative, or neutral with industry-leading accuracy.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl shadow-lg border-2 border-gray-300">
              <div className="w-12 h-12 rounded-xl bg-sidebar flex items-center justify-center mb-4">
                <Target className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-content mb-2">Topic Detection</h3>
              <p className="text-content-muted">Identify key themes and topics customers talk about most to prioritize improvements.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl shadow-lg border-2 border-gray-300">
              <div className="w-12 h-12 rounded-xl bg-accent-dark flex items-center justify-center mb-4">
                <TrendingUp className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-content mb-2">Trend Tracking</h3>
              <p className="text-content-muted">Monitor sentiment trends over time and catch emerging issues before they escalate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-content mb-16">How It Works</h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Upload, num: '01', title: 'Upload Data', desc: 'Import reviews from CSV files or connect your data sources directly.' },
              { icon: Sparkles, num: '02', title: 'AI Analysis', desc: 'Our advanced AI models process and classify sentiment in real-time.' },
              { icon: PieChart, num: '03', title: 'View Insights', desc: 'Explore beautiful dashboards with charts, trends, and key metrics.' },
              { icon: Download, num: '04', title: 'Export & Share', desc: 'Generate PDF reports and schedule automated insights delivery.' },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-accent flex items-center justify-center">
                  <item.icon className="text-white" size={32} />
                </div>
                <div className="text-5xl font-bold text-accent/20">{item.num}</div>
                <h3 className="text-xl font-bold text-content">{item.title}</h3>
                <p className="text-content-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Breakdown */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-content mb-16">Powerful Features</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: BarChart3, title: 'Interactive Dashboard', desc: 'Real-time sentiment overview with beautiful charts, metrics, and trends at a glance.', items: ['Live sentiment distribution charts', 'Key performance indicators', 'Customizable time ranges'] },
              { icon: Sparkles, title: 'Advanced Insights', desc: 'Deep dive into sentiment patterns, topic distributions, and temporal trends.', items: ['Topic modeling and clustering', 'Sentiment trend analysis', 'Comparative brand analysis'] },
              { icon: Upload, title: 'Batch Processing', desc: 'Upload and analyze thousands of reviews simultaneously with CSV support.', items: ['CSV import and validation', 'Bulk sentiment classification', 'Export analyzed results'] },
              { icon: FileText, title: 'Automated Reports', desc: 'Generate beautiful PDF reports and schedule automated delivery to stakeholders.', items: ['One-click PDF generation', 'Scheduled report delivery', 'Custom branding options'] },
            ].map((feature, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-2xl shadow-lg border-2 border-gray-300">
                <feature.icon className="text-accent mb-4" size={40} />
                <h3 className="text-2xl font-bold text-content mb-3">{feature.title}</h3>
                <p className="text-content-muted mb-4">{feature.desc}</p>
                <ul className="space-y-2">
                  {feature.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle2 className="text-accent mt-0.5 flex-shrink-0" size={18} />
                      <span className="text-content-muted">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo */}
      <section id="demo" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-sidebar to-sidebar-dark rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">See It In Action</h2>
            <p className="text-white/70 text-lg mb-8">Watch how BrandTide transforms raw review data into actionable insights</p>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden mb-6">
                <img src="/logo.jpg" alt="BrandTide Logo" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Interactive Demo Dashboard</h3>
              <p className="text-white/60 mb-6">Experience the full power of sentiment analysis with our live demo</p>
              <button
                onClick={() => navigate('/register')}
                className="bg-white text-sidebar px-8 py-3 rounded-xl font-medium hover:bg-gray-100 transition"
              >
                Try Demo Now <ArrowRight className="inline ml-2" size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why BrandTide */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-content mb-16">Why Choose BrandTide?</h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Process thousands of reviews in seconds with our optimized AI pipeline.' },
              { icon: Shield, title: 'Enterprise Security', desc: 'Your data is protected with industry-standard encryption and secure processing.' },
              { icon: Globe, title: 'Multi-Platform', desc: 'Analyze reviews from any source - Amazon, Google, social media, or custom feeds.' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-2xl shadow-lg border-2 border-gray-300 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent flex items-center justify-center">
                  <item.icon className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-content mb-4">{item.title}</h3>
                <p className="text-content-muted">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-12 rounded-2xl shadow-lg border-2 border-gray-300">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-content mb-6">Built by Experts, For Businesses</h3>
                <p className="text-content-muted mb-4">
                  BrandTide was developed as a Final Year Project at a leading university,
                  combining cutting-edge research in natural language processing with practical
                  business intelligence needs.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-content">React + TypeScript</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-content">Advanced NLP</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-content">Real-time Analytics</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: TrendingUp, value: '98%', label: 'Model Accuracy' },
                  { icon: Zap, value: '< 100ms', label: 'Processing Time' },
                  { icon: Globe, value: '15+', label: 'Languages' },
                  { icon: Shield, value: '100%', label: 'Secure' },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50 p-6 rounded-xl">
                    <stat.icon className="text-accent mb-3" size={24} />
                    <div className="text-2xl font-bold text-content">{stat.value}</div>
                    <div className="text-content-muted text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-content mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-content-muted text-lg mb-16">Choose the plan that fits your needs.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div
              className={`bg-white p-8 rounded-2xl border-2 transition cursor-pointer ${activePlan === 'free' ? 'border-accent shadow-card' : 'border-gray-200 hover:border-accent/50'
                }`}
              onClick={() => setActivePlan('free')}
            >
              <h3 className="text-2xl font-bold text-content mb-2">Free</h3>
              <div className="text-4xl font-bold text-content mb-6">Rs 0<span className="text-lg text-content-muted">/month</span></div>
              <p className="text-content-muted mb-6">Perfect for trying out BrandTide</p>
              <ul className="space-y-3 mb-8">
                {['100 reviews/month', 'Basic sentiment analysis', 'Dashboard access', 'CSV export'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="text-accent mt-0.5 flex-shrink-0" size={18} />
                    <span className="text-content-muted">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                className="btn-secondary w-full flex items-center justify-center gap-2"
                onClick={(e) => { e.stopPropagation(); handlePricingClick('free') }}
                disabled={checkoutLoading === 'free'}
              >
                {checkoutLoading === 'free' ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : 'Free Trial'}
              </button>
            </div>

            {/* Pro Plan */}
            <div
              className={`bg-white p-8 rounded-2xl border-2 relative transition cursor-pointer ${activePlan === 'pro' ? 'border-accent shadow-card' : 'border-gray-200 hover:border-accent/50'
                }`}
              onClick={() => setActivePlan('pro')}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-sm font-medium rounded-full">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-content mb-2">Pro</h3>
              <div className="text-4xl font-bold text-content mb-6">Rs 490<span className="text-lg text-content-muted">/month</span></div>
              <p className="text-content-muted mb-6">For growing businesses</p>
              <ul className="space-y-3 mb-8">
                {['5,000 reviews/month', 'Advanced sentiment analysis', 'Topic detection', 'PDF reports', 'Scheduled reports', 'Priority support'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="text-accent mt-0.5 flex-shrink-0" size={18} />
                    <span className="text-content-muted">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={(e) => { e.stopPropagation(); handlePricingClick('pro') }}
                disabled={checkoutLoading === 'pro'}
              >
                {checkoutLoading === 'pro' ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : 'Get Started'}
              </button>
            </div>

            {/* Enterprise Plan */}
            <div
              className={`bg-white p-8 rounded-2xl border-2 transition cursor-pointer ${activePlan === 'enterprise' ? 'border-accent shadow-card' : 'border-gray-200 hover:border-accent/50'
                }`}
              onClick={() => setActivePlan('enterprise')}
            >
              <h3 className="text-2xl font-bold text-content mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-content mb-6">Custom</div>
              <p className="text-content-muted mb-6">For large organizations</p>
              <ul className="space-y-3 mb-8">
                {['Unlimited reviews', 'Custom AI models', 'API access', 'Dedicated support', 'On-premise deployment', 'SLA guarantee'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="text-accent mt-0.5 flex-shrink-0" size={18} />
                    <span className="text-content-muted">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                className="btn-secondary w-full flex items-center justify-center gap-2"
                onClick={(e) => { e.stopPropagation(); handlePricingClick('enterprise') }}
                disabled={checkoutLoading === 'enterprise'}
              >
                {checkoutLoading === 'enterprise' ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-20 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-content mb-4">Meet The Team</h2>
          <p className="text-center text-content-muted text-lg mb-16">Built by passionate students combining AI research with real-world applications</p>

          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {[
              {
                name: 'Dr. Qamar-uz-Zaman',
                role: 'Supervisor',
                gradient: 'from-sidebar to-sidebar-dark',
                initials: 'QZ',
                image: '/team/qamar.png'  // Add your photo to: public/team/qamar.png
              },
              {
                name: 'Waleed Ahmad',
                role: 'AI / ML Engineer',
                gradient: 'from-accent to-accent-dark',
                initials: 'WA',
                image: '/team/waleed.png'  // Add your photo to: public/team/waleed.png
              },
              {
                name: 'Abdullah Cheema',
                role: 'AI / ML Engineer',
                gradient: 'from-accent-dark to-sidebar',
                initials: 'AC',
                image: '/team/abdullah.png'  // Add your photo to: public/team/abdullah.png
              },
              {
                name: 'Ameer Sultan',
                role: 'Web & AI / ML Engineer',
                gradient: 'from-sidebar to-accent',
                initials: 'AS',
                image: '/team/ameer.png'  // Add your photo to: public/team/ameer.png
              },
            ].map((member, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center group">
                {/* Large Profile Picture */}
                <div className={`w-28 h-28 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300 ${!member.image ? `bg-gradient-to-br ${member.gradient}` : ''}`}>
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If image fails to load, show initials instead
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.classList.add('bg-gradient-to-br', member.gradient.split(' ').join(''), 'flex', 'items-center', 'justify-center');
                        target.parentElement!.innerHTML = `<span class="text-white text-3xl font-bold">${member.initials}</span>`;
                      }}
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${member.gradient}`}>
                      <span className="text-white text-3xl font-bold">{member.initials}</span>
                    </div>
                  )}
                </div>

                {/* Name and Role */}
                <h4 className="text-xl font-bold text-content mb-1">{member.name}</h4>
                <p className="text-sm text-content-muted mb-5">{member.role}</p>

                {/* Divider */}
                <div className="w-12 h-1 mx-auto bg-gradient-to-r from-accent to-accent-dark rounded-full mb-5"></div>

                {/* Social Links */}
                <div className="flex justify-center gap-3">
                  <a href="#" className="p-2.5 bg-gray-100 hover:bg-accent hover:text-white rounded-xl transition-all duration-200">
                    <Mail size={18} className="text-content-muted group-hover:text-inherit" />
                  </a>
                  <a href="#" className="p-2.5 bg-gray-100 hover:bg-sidebar hover:text-white rounded-xl transition-all duration-200">
                    <Github size={18} className="text-content-muted" />
                  </a>
                  <a href="#" className="p-2.5 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-200">
                    <Linkedin size={18} className="text-content-muted" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="bg-gray-50 p-12 rounded-2xl shadow-lg border-2 border-gray-300">
            <h3 className="text-3xl font-bold text-center text-content mb-12">What People Say</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { name: 'Hamza Ali Mazaari', role: 'Product Manager, TechCorp', quote: '"BrandTide transformed how we understand our customers. The insights are incredibly actionable and the interface is beautiful."' },
                { name: 'Bilal Abbas', role: 'Data Analyst, RetailHub', quote: '"The batch processing feature saved us countless hours. We can now analyze thousands of reviews in minutes instead of days."' },
              ].map((testimonial, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-xl">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="text-amber-400 fill-amber-400" size={18} />
                    ))}
                  </div>
                  <p className="text-content-muted mb-4">{testimonial.quote}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent"></div>
                    <div>
                      <div className="font-semibold text-content">{testimonial.name}</div>
                      <div className="text-content-muted text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-sidebar to-sidebar-dark rounded-3xl p-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Insights?</h2>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Join hundreds of brands using BrandTide to understand their customers better.
              Start your free trial today - no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="bg-white text-sidebar px-12 py-4 rounded-xl text-lg font-medium hover:bg-gray-100 transition flex items-center gap-2"
              >
                Start Free Trial <ArrowRight size={20} />
              </button>
              <button className="bg-white/10 backdrop-blur text-white px-12 py-4 rounded-xl text-lg font-medium hover:bg-white/20 transition">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="BrandTide Logo" className="w-8 h-8 rounded-lg object-cover" />
              <span className="text-white font-bold">BrandTide</span>
            </div>
            <div className="flex gap-6">
              <a href="#features" className="text-white/60 hover:text-white transition text-sm">Features</a>
              <a href="#pricing" className="text-white/60 hover:text-white transition text-sm">Pricing</a>
              <a href="#team" className="text-white/60 hover:text-white transition text-sm">Team</a>
            </div>
            <p className="text-white/40 text-sm">© {new Date().getFullYear()} BrandTide. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
