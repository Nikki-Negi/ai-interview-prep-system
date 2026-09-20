import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { checkIsAdmin } from '../api/admin'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
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

  const linkClass = ({ isActive }) =>
    `rounded-md px-4 py-2 text-sm font-medium transition ${
      isActive
        ? 'border-l-2 border-blue-500 bg-gray-900 text-white'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`

  return (
    <header className="border-b border-gray-800 bg-gray-950/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-800 bg-gray-900 text-lg font-black text-slate-100">
            AI
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            AI Interview Prep
          </span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center justify-center gap-2">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/categories" className={linkClass}>
            Categories
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            History
          </NavLink>
          {isAdmin ? (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-100">
              {user?.name || 'Guest'}
            </p>
            <p className="text-xs text-slate-400">
              {isAdmin ? 'Administrator' : 'Interview prep'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}



