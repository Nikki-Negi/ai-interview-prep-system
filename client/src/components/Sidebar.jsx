import { useEffect, useState } from 'react'
import {
  BarChart3,
  Clock,
  Home,
  LogOut,
  MessageSquare,
  PlayCircle,
  Settings,
  Shield,
  User,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { checkIsAdmin } from '../api/admin'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: Home },
  { label: 'Profile', to: '/profile', icon: User },
  { label: 'Start Interview', to: '/categories', icon: PlayCircle },
  { label: 'Interview History', to: '/history', icon: Clock },
  { label: 'Performance', to: '/performance', icon: BarChart3 },
  { label: 'Feedback', to: '/feedback-overview', icon: MessageSquare },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const loadAdminState = async () => {
      if (!user?.email) {
        setIsAdmin(false)
        return
      }

      try {
        const result = await checkIsAdmin(user.email)
        setIsAdmin(Boolean(result.is_admin))
      } catch {
        setIsAdmin(false)
      }
    }

    loadAdminState()
  }, [user?.email])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActivePath = (path) => location.pathname === path

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'border-l-2 border-blue-500 bg-gray-900 text-white shadow-sm'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-800 bg-gray-950 text-slate-100">
      <div className="border-b border-gray-800 px-5 py-5">
        <Link to="/dashboard" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-800 bg-gray-900 text-lg font-black text-slate-100">
            AI
          </span>
          <span className="text-base font-semibold tracking-tight text-white">
            AI Interview Prep
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            <Icon
              className={`h-5 w-5 ${
                isActivePath(to) ? 'text-blue-400' : 'text-slate-400'
              }`}
              aria-hidden="true"
            />
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin ? (
          <NavLink to="/admin" className={linkClass}>
            <Shield
              className={`h-5 w-5 ${
                isActivePath('/admin') ? 'text-blue-400' : 'text-slate-400'
              }`}
              aria-hidden="true"
            />
            <span>Admin</span>
          </NavLink>
        ) : null}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <div className="mb-3 rounded-md border border-gray-800 bg-gray-900 px-3 py-3">
          <p className="truncate text-sm font-medium text-slate-100">
            {user?.name || 'Guest'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {isAdmin ? 'Administrator' : 'Interview prep'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-5 w-5 text-slate-400" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
