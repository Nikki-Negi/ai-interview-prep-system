import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Star, TrendingUp, Users } from 'lucide-react'

import { getUserHistory } from '../api/history'
import { useAuth } from '../context/AuthContext'

const TOKEN_KEY = 'ai_interview_prep_token'
const emptyStats = {
  total_interviews: 0,
  average_score: 0,
  best_score: 0,
  category_breakdown: [],
  score_trend: [],
}
const chartColors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed']

function getAuthHeaders() {
  const token =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)

  return token ? { Authorization: `Bearer ${token}` } : {}
}

function normalizeScore(score) {
  const numericScore = Number(score || 0)
  const percentage = numericScore <= 10 ? numericScore * 10 : numericScore
  return Math.max(0, Math.min(100, percentage))
}

function formatScore(score) {
  return `${Math.round(normalizeScore(score))}%`
}

function formatDate(value) {
  if (!value) {
    return 'Unknown'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return date.toLocaleDateString()
}

function getFeedback(score) {
  const normalizedScore = normalizeScore(score)

  if (normalizedScore >= 75) {
    return { label: 'Good', className: 'text-emerald-700' }
  }

  if (normalizedScore >= 50) {
    return { label: 'Average', className: 'text-amber-700' }
  }

  return { label: 'Needs Improvement', className: 'text-red-700' }
}

function EmptyChart() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-6 text-center">
      <p className="max-w-xs text-sm text-gray-500">
        Complete your first interview to see stats here.
      </p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userEmail = user?.email || ''

  const [stats, setStats] = useState(emptyStats)
  const [recentInterviews, setRecentInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    if (!userEmail) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const [statsResponse, historyData] = await Promise.all([
        axios.get(
          `http://localhost:8000/history/${encodeURIComponent(userEmail)}/stats`,
          { headers: getAuthHeaders() },
        ),
        getUserHistory(userEmail),
      ])

      const sortedHistory = [...historyData].sort(
        (left, right) =>
          new Date(right.completed_at).getTime() -
          new Date(left.completed_at).getTime(),
      )

      setStats(statsResponse.data || emptyStats)
      setRecentInterviews(sortedHistory.slice(0, 5))
    } catch {
      setError('We could not load your dashboard stats right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [userEmail])

  const scoreTrend = useMemo(
    () =>
      (stats.score_trend || []).map((item) => ({
        date: formatDate(item.date),
        score: normalizeScore(item.score),
      })),
    [stats.score_trend],
  )

  const categoryBreakdown = useMemo(
    () =>
      (stats.category_breakdown || []).map((item, index) => ({
        name: item.category || 'Uncategorized',
        value: normalizeScore(item.average_score),
        fill: chartColors[index % chartColors.length],
      })),
    [stats.category_breakdown],
  )

  if (!userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-gray-900">
        <div className="w-full max-w-xl rounded-md border border-gray-200 bg-white p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">No session found</h1>
          <p className="mt-3 text-gray-500">
            Please log in to view your dashboard.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 px-4 py-12 text-gray-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-md border border-gray-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
            Welcome, {user?.name || 'Guest'}!
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-500">
            Keep building momentum with focused interview practice and clear
            performance feedback.
          </p>
        </section>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-semibold text-red-700">Something went wrong</p>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={loadDashboard}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: 'Total Interviews',
              value: loading ? '-' : stats.total_interviews || 0,
              icon: Users,
            },
            {
              label: 'Average Score',
              value: loading ? '-' : formatScore(stats.average_score),
              icon: TrendingUp,
            },
            {
              label: 'Best Score',
              value: loading ? '-' : formatScore(stats.best_score),
              icon: Star,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-md border border-gray-200 bg-white p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {label}
                </p>
                <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
              </div>
              <p className="mt-5 text-3xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-bold text-gray-900">Performance Overview</h2>
            <div className="mt-6">
              {loading ? (
                <EmptyChart />
              ) : scoreTrend.length > 0 ? (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreTrend} margin={{ left: -20, right: 12 }}>
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#374151', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: '#374151', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          color: '#111827',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#60a5fa' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-bold text-gray-900">Category Breakdown</h2>
            <div className="mt-6">
              {loading ? (
                <EmptyChart />
              ) : categoryBreakdown.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={62}
                          outerRadius={92}
                          paddingAngle={3}
                        stroke="#ffffff"
                        />
                        <Tooltip
                          formatter={(value) => `${Math.round(value)}%`}
                          contentStyle={{
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            color: '#111827',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center gap-3">
                    {categoryBreakdown.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-sm"
                            style={{ backgroundColor: item.fill }}
                            aria-hidden="true"
                          />
                          <span className="truncate text-sm text-gray-700">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {Math.round(item.value)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>
        </section>

        <section className="rounded-md border border-gray-200 bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Interviews</h2>
            <Link
              to="/history"
              className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
            >
              View all
            </Link>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Score</th>
                  <th className="py-3 pr-4">Feedback</th>
                  <th className="py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-6 text-sm text-gray-500" colSpan={5}>
                      Loading recent interviews...
                    </td>
                  </tr>
                ) : recentInterviews.length > 0 ? (
                  recentInterviews.map((item) => {
                    const feedback = getFeedback(item.average_score)

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <td className="py-4 pr-4 text-sm text-gray-500">
                          {formatDate(item.completed_at)}
                        </td>
                        <td className="py-4 pr-4 text-sm font-medium text-gray-900">
                          {item.category || 'Uncategorized'}
                        </td>
                        <td className="py-4 pr-4 text-sm text-gray-700">
                          {formatScore(item.average_score)}
                        </td>
                        <td className={`py-4 pr-4 text-sm font-semibold ${feedback.className}`}>
                          {feedback.label}
                        </td>
                        <td className="py-4 text-right">
                          <Link
                            to={`/history?record=${encodeURIComponent(item.id)}`}
                            className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td className="py-6 text-sm text-gray-500" colSpan={5}>
                      Complete your first interview to see stats here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}


