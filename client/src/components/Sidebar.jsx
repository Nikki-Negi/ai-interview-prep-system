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
        ? 'border-l-2 border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white text-gray-900">
      <div className="border-b border-gray-200 px-5 py-5">
        <Link to="/dashboard" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-lg font-black text-gray-900">
            AI
          </span>
          <span className="text-base font-semibold tracking-tight text-gray-900">
            AI Interview Prep
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            <Icon
              className={`h-5 w-5 ${
                isActivePath(to) ? 'text-blue-700' : 'text-gray-500'
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
                isActivePath('/admin') ? 'text-blue-700' : 'text-gray-500'
              }`}
              aria-hidden="true"
            />
            <span>Admin</span>
          </NavLink>
        ) : null}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="mb-3 rounded-md border border-gray-200 bg-white px-3 py-3">
          <p className="truncate text-sm font-medium text-gray-900">
            {user?.name || 'Guest'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isAdmin ? 'Administrator' : 'Interview prep'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
        >
          <LogOut className="h-5 w-5 text-gray-500" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}


