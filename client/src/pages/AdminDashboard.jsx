import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { checkIsAdmin, deleteUser, getAllInterviews, getAllUsers } from '../api/admin'
import { useAuth } from '../context/AuthContext'

function formatDate(value) {
  if (!value) {
    return 'Unknown date'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  return date.toLocaleString()
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const userEmail = user?.email || ''
  const currentEmail = userEmail.toLowerCase()

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [interviews, setInterviews] = useState([])
  const [deletingEmail, setDeletingEmail] = useState('')

  useEffect(() => {
    const loadAdminData = async () => {
      if (!userEmail) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const adminResult = await checkIsAdmin(userEmail)
        setIsAdmin(Boolean(adminResult.is_admin))

        if (adminResult.is_admin) {
          const [usersData, interviewsData] = await Promise.all([
            getAllUsers(),
            getAllInterviews(),
          ])
          setUsers(usersData)
          setInterviews(interviewsData)
        }
      } catch {
        setError('We could not load the admin dashboard right now.')
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [userEmail])

  if (!userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-slate-100">
      <div className="w-full max-w-xl rounded-md border border-gray-800 bg-gray-900 p-6 text-center">
        <h1 className="text-3xl font-bold text-white">No session found</h1>
          <p className="mt-3 text-slate-300">Please log in to continue.</p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-slate-100">
        <div className="rounded-md border border-gray-800 bg-gray-900 p-6 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-md border-4 border-gray-800 border-t-gray-500" />
          <p className="text-sm font-medium text-slate-300">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-slate-100">
      <div className="w-full max-w-xl rounded-md border border-gray-800 bg-gray-900 p-6 text-center">
        <h1 className="text-3xl font-bold text-white">Access denied</h1>
          <p className="mt-3 text-slate-300">
            You do not have permission to view this page.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-950 px-4 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="rounded-md border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Admin dashboard
          </p>
          <h1 className="mt-3 text-4xl font-bold text-white">
            System overview
          </h1>
        </div>

        {error ? (
          <div className="rounded-md border border-red-900/50 bg-red-950/40 p-6">
            <p className="text-sm font-semibold text-red-300">Something went wrong</p>
            <p className="mt-2 text-sm text-red-200">{error}</p>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900">
            <div className="border-b border-gray-800 px-6 py-4">
              <h2 className="text-xl font-bold text-white">All users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-gray-950/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-gray-900">
                  {users.map((item) => (
                    <tr key={`${item.email}-${item.created_at}`}>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {item.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.email.toLowerCase() !== currentEmail ? (
                          <button
                            type="button"
                            disabled={deletingEmail === item.email}
                            onClick={async () => {
                              const confirmed = window.confirm(
                                'Are you sure you want to delete this user? This will also delete their interview history.',
                              )

                              if (!confirmed) {
                                return
                              }

                              setDeletingEmail(item.email)

                              try {
                                await deleteUser(item.email)
                                const [usersData, interviewsData] = await Promise.all([
                                  getAllUsers(),
                                  getAllInterviews(),
                                ])
                                setUsers(usersData)
                                setInterviews(interviewsData)
                              } catch {
                                setError('We could not delete that user right now.')
                              } finally {
                                setDeletingEmail('')
                              }
                            }}
                            className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingEmail === item.email ? 'Deleting...' : 'Delete'}
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">
                            Current admin
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900">
            <div className="border-b border-gray-800 px-6 py-4">
              <h2 className="text-xl font-bold text-white">All interviews</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-gray-950/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      User Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Avg Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-gray-900">
                  {interviews.map((item) => (
                    <tr key={`${item.id}-${item.completed_at}`}>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {item.user_email}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {Number(item.average_score || 0).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatDate(item.completed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



