import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react'

export default function RouteError() {
  const error = useRouteError()
  let title = 'Unexpected Error'
  let message = 'Something went wrong while rendering this view.'
  let status: number | undefined

  if (isRouteErrorResponse(error)) {
    status = error.status
    if (error.status === 404) {
      title = 'Page Not Found'
      message = 'The page you are looking for does not exist or has moved.'
    } else {
      title = `Error ${error.status}`
      message = error.statusText || message
    }
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-sidebar via-sidebar-dark to-sidebar">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 max-w-lg w-full p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500 flex items-center justify-center">
          <AlertTriangle className="text-white" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-content mb-2">{title}</h1>
        {status && (
          <p className="text-xs uppercase tracking-wider text-content-muted mb-4">HTTP {status}</p>
        )}
        <p className="text-content-muted mb-8 leading-relaxed">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary flex items-center justify-center gap-2">
            <Home size={16} />
            Home
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <RefreshCcw size={16} />
            Reload
          </button>
        </div>
        <p className="text-xs text-content-muted mt-8">
          Enhanced error boundary • Customize further for logging & telemetry
        </p>
      </div>
    </div>
  )
}
