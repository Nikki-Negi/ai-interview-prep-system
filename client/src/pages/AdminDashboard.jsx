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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-gray-900">
      <div className="w-full max-w-xl rounded-md border border-gray-200 bg-white p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">No session found</h1>
          <p className="mt-3 text-gray-500">Please log in to continue.</p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-gray-900">
        <div className="rounded-md border border-gray-200 bg-white p-6 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-md border-4 border-gray-200 border-t-gray-400" />
          <p className="text-sm font-medium text-gray-500">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-gray-900">
      <div className="w-full max-w-xl rounded-md border border-gray-200 bg-white p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Access denied</h1>
          <p className="mt-3 text-gray-500">
            You do not have permission to view this page.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 px-4 py-12 text-gray-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="rounded-md border border-gray-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Admin dashboard
          </p>
          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            System overview
          </h1>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-semibold text-red-700">Something went wrong</p>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">All users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((item) => (
                    <tr key={`${item.email}-${item.created_at}`}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
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
                          <span className="text-xs font-medium text-gray-500">
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

          <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">All interviews</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      User Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Avg Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {interviews.map((item) => (
                    <tr key={`${item.id}-${item.completed_at}`}>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.user_email}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {Number(item.average_score || 0).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
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





