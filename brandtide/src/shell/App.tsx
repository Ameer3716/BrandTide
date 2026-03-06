// src/shell/App.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Bell, LogIn, LogOut, Menu, LayoutDashboard, Flame, Sparkles,
  Upload, BarChart3, ListOrdered, FileText, User, ChevronLeft, Building2
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/state/auth'
import MobileSidebar from '@/shell/MobileSidebar'

export default function App() {
  const [open, setOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signInWithGoogle, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex bg-surface-muted">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-sidebar transition-all duration-300 ${open ? 'w-64' : 'w-20'}`}>
        {/* Logo section */}
        <div className="p-4 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
            <Sparkles className="text-white" size={20} />
          </div>
          <h1 className={`text-xl font-bold text-white transition-opacity ${open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            BrandTide
          </h1>
        </div>

        {/* Company selector */}
        <div className={`px-3 py-4 border-b border-white/10 ${open ? 'block' : 'hidden'}`}>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-white">
            <Building2 size={18} />
            <span className="flex-1 text-left truncate">Demo Company</span>
            <ChevronLeft size={16} className="rotate-[-90deg]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Item to="/app" icon={<LayoutDashboard size={20} />} label="Dashboard" open={open} />
          <Item to="/app/insights" icon={<Sparkles size={20} />} label="Insights" open={open} />
          <Item to="/app/highlights" icon={<Flame size={20} />} label="Highlights" open={open} />
          <Item to="/app/classifier" icon={<BarChart3 size={20} />} label="Classifier" open={open} />
          <Item to="/app/batch" icon={<Upload size={20} />} label="Batch" open={open} />
          <Item to="/app/ranking" icon={<ListOrdered size={20} />} label="Ranking" open={open} />
          <Item to="/app/reviews" icon={<FileText size={20} />} label="Reviews" open={open} />
          <Item to="/app/reports" icon={<FileText size={20} />} label="Reports" open={open} />
          <Item to="/app/profile" icon={<User size={20} />} label="Profile" open={open} />
        </nav>

        {/* Sign in/out button */}
        <div className="p-3 border-t border-white/10">
          {!user ? (
            <button
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white text-sm font-medium transition ${!open && 'px-0'}`}
              onClick={() => signInWithGoogle().then(() => navigate('/app'))}
            >
              <LogIn size={18} />
              <span className={open ? 'block' : 'hidden'}>Sign in</span>
            </button>
          ) : (
            <button
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white text-sm transition ${!open && 'px-0'}`}
              onClick={() => signOut().then(() => navigate('/'))}
            >
              <LogOut size={18} />
              <span className={open ? 'block' : 'hidden'}>Sign out</span>
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="absolute top-20 -right-3 w-6 h-6 rounded-full bg-white shadow-card border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition hidden md:flex"
        >
          <ChevronLeft size={14} className={`text-gray-600 transition-transform ${!open && 'rotate-180'}`} />
        </button>
      </aside>

      {/* Mobile sidebar (off-canvas) */}
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} className="text-content" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-content">Dashboard</h2>
              <p className="text-sm text-content-muted hide-on-tiny">
                Explore brand/product sentiment and analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-success">
              <span className="status-dot status-dot-live"></span>
              LIVE
            </span>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition relative">
              <Bell size={20} className="text-content-muted" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 lg:p-6 p-safe">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function Item(
  { to, icon, label, open }:
    { to: string; icon: React.ReactNode; label: string; open: boolean }
) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive
      ? 'bg-accent text-white font-medium'
      : 'text-white/70 hover:text-white hover:bg-white/10'
    }`;

  return (
    <NavLink to={to} className={linkClass} end={to === '/app'}>
      {icon}
      <span className={`transition-opacity ${open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{label}</span>
    </NavLink>
  );
}
