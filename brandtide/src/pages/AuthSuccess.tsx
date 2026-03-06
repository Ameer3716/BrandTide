import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/state/auth'
import { Loader2 } from 'lucide-react'

export default function AuthSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (token) {
      // Store the token and user info
      // Fetch user info from the backend using the token
      fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Store user with token
            const userData = {
              ...data.data.user,
              token
            }
            localStorage.setItem('bt:user', JSON.stringify(userData))
            setUser(userData)
            
            // Check if user has an active subscription
            const subStatus = data.data.user.subscriptionStatus
            const subPlan = data.data.user.subscriptionPlan
            const hasActiveSubscription = 
              (subStatus === 'active' || subStatus === 'trialing') && 
              subPlan && subPlan !== 'none'
            
            if (hasActiveSubscription) {
              // User has a subscription — go to dashboard
              navigate('/app', { replace: true })
            } else {
              // No subscription — choose a plan first
              navigate('/choose-plan', { replace: true })
            }
          } else {
            navigate('/login', { replace: true })
          }
        })
        .catch(err => {
          console.error('Auth error:', err)
          navigate('/login', { replace: true })
        })
    } else {
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar via-sidebar-dark to-sidebar">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Completing sign in...</p>
      </div>
    </div>
  )
}
