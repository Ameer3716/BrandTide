import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, Home } from 'lucide-react'
import { useAuth } from '@/state/auth'

export default function NotFound() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-sidebar via-sidebar-dark to-sidebar">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 max-w-lg w-full p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-accent flex items-center justify-center">
          <Sparkles className="text-white" size={40} />
        </div>
        <h1 className="text-5xl font-bold text-content mb-4">404</h1>
        <p className="text-content-muted mb-8">
          We couldn't find the page you were looking for. It may have been moved or removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary flex items-center justify-center gap-2">
            <Home size={16} />
            Go Home
          </Link>
          {user && (
            <Link to="/app" className="btn-secondary flex items-center justify-center gap-2">
              Dashboard <ArrowRight size={16} />
            </Link>
          )}
        </div>
        <p className="text-xs text-content-muted mt-8">Need help? Contact support.</p>
      </div>
    </div>
  )
}
