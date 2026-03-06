import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Sparkles, Flame, BarChart3, Upload, ListOrdered, FileText, User, X } from 'lucide-react'

const items = [
  { to: '/app', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { to: '/app/insights', label: 'Insights', icon: <Sparkles size={20} /> },
  { to: '/app/highlights', label: 'Highlights', icon: <Flame size={20} /> },
  { to: '/app/classifier', label: 'Classifier', icon: <BarChart3 size={20} /> },
  { to: '/app/batch', label: 'Batch', icon: <Upload size={20} /> },
  { to: '/app/ranking', label: 'Ranking', icon: <ListOrdered size={20} /> },
  { to: '/app/reviews', label: 'Reviews', icon: <FileText size={20} /> },
  { to: '/app/reports', label: 'Reports', icon: <FileText size={20} /> },
  { to: '/app/profile', label: 'Profile', icon: <User size={20} /> },
]

export default function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-40 ${open ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside className={`fixed z-50 top-0 left-0 h-full w-[280px] max-w-[85vw] bg-sidebar flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white">BrandTide</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition"
          >
            <X size={20} className="text-white/70" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive
                  ? 'bg-accent text-white font-medium'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
              end={item.to === '/app'}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/40">© {new Date().getFullYear()} BrandTide</p>
        </div>
      </aside>
    </>
  )
}
