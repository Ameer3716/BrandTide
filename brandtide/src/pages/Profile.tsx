import GlassCard from '@/components/ui/GlassCard'
import { useAuth } from '@/state/auth'
import { User, Mail, Activity, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Profile() {
  const { user } = useAuth()
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)

  useEffect(() => {
    if (user?.token) {
      fetchRecentActivity()
    }
  }, [user?.token])

  async function fetchRecentActivity() {
    setLoadingActivity(true)
    try {
      const response = await fetch(`${API_URL}/reviews/recent-activity`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRecentActivity(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
    } finally {
      setLoadingActivity(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <GlassCard>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
            <User className="text-white" size={28} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-content">Profile</h3>
            <p className="text-sm text-content-muted">Manage your account settings</p>
          </div>
        </div>

        {!user ? (
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-content-muted">Please sign in to view your profile.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-content-muted" />
                  <p className="text-xs text-content-muted uppercase tracking-wide">Name</p>
                </div>
                <p className="font-medium text-content">{user.name}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={16} className="text-content-muted" />
                  <p className="text-xs text-content-muted uppercase tracking-wide">Email</p>
                </div>
                <p className="font-medium text-content">{user.email}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} className="text-content-muted" />
                <h4 className="text-sm font-medium text-content">Recent Activity</h4>
              </div>
              {loadingActivity ? (
                <div className="text-center p-4 text-content-muted text-sm">Loading activity...</div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center p-4 text-content-muted text-sm">No recent activity</div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Clock size={14} className="text-content-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-content">{activity.description}</p>
                        <p className="text-xs text-content-muted">{activity.result}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
