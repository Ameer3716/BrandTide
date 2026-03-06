import GlassCard from '@/components/ui/GlassCard'
import { useAuth } from '@/state/auth'
import { User, Mail, Activity, Clock } from 'lucide-react'

export default function Profile() {
  const { user } = useAuth()

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
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Clock size={14} className="text-content-muted" />
                  <div className="flex-1">
                    <p className="text-sm text-content">Single classify — "Battery zbrdst…"</p>
                    <p className="text-xs text-content-muted">Result: Positive</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Clock size={14} className="text-content-muted" />
                  <div className="flex-1">
                    <p className="text-sm text-content">Batch job — 342 rows (csv)</p>
                    <p className="text-xs text-content-muted">Completed successfully</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
