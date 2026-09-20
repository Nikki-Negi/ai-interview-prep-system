import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileQuestion,
  TrendingUp,
} from 'lucide-react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getUserHistory } from '../api/history'
import { useAuth } from '../context/AuthContext'

const TOKEN_KEY = 'ai_interview_prep_token'
const emptyStats = {
  total_interviews: 0,
  questions_attempted: 0,
  average_score: 0,
  best_score: 0,
  category_breakdown: [],
  score_trend: [],
}

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

function scoreClass(score) {
  const normalizedScore = normalizeScore(score)

  if (normalizedScore >= 75) {
    return 'text-emerald-300'
  }

  if (normalizedScore >= 50) {
    return 'text-amber-300'
  }

  return 'text-red-300'
}

function EmptyChart() {
  return (
    <div className="flex h-[300px] items-center justify-center rounded-md border border-gray-800 bg-gray-950 p-6 text-center">
      <p className="max-w-xs text-sm text-slate-300">
        Complete more interviews to see your score trend.
      </p>
    </div>
  )
}

export default function Performance() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userEmail = user?.email || ''

  const [stats, setStats] = useState(emptyStats)
  const [historyItems, setHistoryItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPerformance = async () => {
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

      setStats({ ...emptyStats, ...(statsResponse.data || {}) })
      setHistoryItems(sortedHistory.slice(0, 5))
    } catch {
      setError('We could not load your performance right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPerformance()
  }, [userEmail])

  const scoreTrend = useMemo(
    () =>
      (stats.score_trend || []).map((item) => ({
        date: formatDate(item.date),
        score: normalizeScore(item.score),
      })),
    [stats.score_trend],
  )

  const trendMessage = useMemo(() => {
    if (scoreTrend.length < 2) {
      return 'Complete more interviews to track your trend.'
    }

    const firstScore = scoreTrend[0].score
    const lastScore = scoreTrend[scoreTrend.length - 1].score
    const difference = Math.round(lastScore - firstScore)

    if (difference > 0) {
      return `Keep going! Your average score has improved by ${difference}% recently.`
    }

    return 'Complete more interviews to track your trend.'
  }, [scoreTrend])

  if (!userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-slate-100">
        <div className="w-full max-w-xl rounded-md border border-gray-800 bg-gray-900 p-6 text-center">
          <h1 className="text-3xl font-bold text-white">No session found</h1>
          <p className="mt-3 text-slate-300">
            Please log in to view your performance.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (!loading && !error && Number(stats.total_interviews || 0) === 0) {
    return (
      <div className="bg-gray-950 px-4 py-12 text-slate-100">
        <div className="mx-auto w-full max-w-5xl rounded-md border border-gray-800 bg-gray-900 p-8 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-blue-400" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-bold text-white">
            Your performance story starts here
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Complete your first mock interview to unlock stats, recent attempts,
            and your score trend.
          </p>
          <Link
            to="/categories"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Start an Interview
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-950 px-4 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-md border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Performance
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
            Progress overview
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
            Review your mock interview activity, recent attempts, and score trend.
          </p>
        </section>

        {error ? (
          <div className="rounded-md border border-red-900/50 bg-red-950/40 p-6">
            <p className="text-sm font-semibold text-red-300">Something went wrong</p>
            <p className="mt-2 text-sm text-red-200">{error}</p>
            <button
              type="button"
              onClick={loadPerformance}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Retry
            </button>
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: 'Mock Interviews',
              value: loading ? '-' : stats.total_interviews || 0,
              icon: ClipboardList,
            },
            {
              label: 'Average Score',
              value: loading ? '-' : formatScore(stats.average_score),
              icon: TrendingUp,
            },
            {
              label: 'Questions Attempted',
              value: loading ? '-' : stats.questions_attempted || 0,
              icon: FileQuestion,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-md border border-gray-800 bg-gray-900 p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  {label}
                </p>
                <Icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <p className="mt-5 text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <div className="rounded-md border border-gray-800 bg-gray-900 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-white">Recent Attempts</h2>
              <Link
                to="/history"
                className="text-sm font-semibold text-blue-300 transition hover:text-blue-200"
              >
                View All
              </Link>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-800 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Interview Type</th>
                    <th className="py-3 pr-4">Score</th>
                    <th className="py-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="py-6 text-sm text-slate-300" colSpan={4}>
                        Loading recent attempts...
                      </td>
                    </tr>
                  ) : historyItems.length > 0 ? (
                    historyItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-800 last:border-b-0"
                      >
                        <td className="py-4 pr-4 text-sm text-slate-300">
                          {formatDate(item.completed_at)}
                        </td>
                        <td className="py-4 pr-4 text-sm font-medium text-white">
                          {item.category || 'Uncategorized'}
                        </td>
                        <td
                          className={`py-4 pr-4 text-sm font-semibold ${scoreClass(
                            item.average_score,
                          )}`}
                        >
                          {formatScore(item.average_score)}
                        </td>
                        <td className="py-4 text-right">
                          <Link
                            to={`/history?record=${encodeURIComponent(item.id)}`}
                            aria-label={`View ${item.category || 'interview'} details`}
                            className="inline-flex items-center justify-center rounded-md border border-gray-700 p-2 text-blue-300 transition hover:border-blue-500 hover:bg-gray-800 hover:text-blue-200"
                          >
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-6 text-sm text-slate-300" colSpan={4}>
                        Complete an interview to see recent attempts.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-md border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-xl font-bold text-white">Score Trend</h2>
              <div className="mt-6">
                {loading ? (
                  <EmptyChart />
                ) : scoreTrend.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scoreTrend} margin={{ left: -20, right: 12 }}>
                        <XAxis
                          dataKey="date"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          axisLine={{ stroke: '#374151' }}
                          tickLine={{ stroke: '#374151' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          axisLine={{ stroke: '#374151' }}
                          tickLine={{ stroke: '#374151' }}
                        />
                        <Tooltip
                          formatter={(value) => `${Math.round(value)}%`}
                          contentStyle={{
                            background: '#111827',
                            border: '1px solid #1f2937',
                            borderRadius: '6px',
                            color: '#e5e7eb',
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

            <div className="rounded-md border border-gray-800 bg-gray-900 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Encouragement
              </p>
              <p className="mt-3 text-base leading-7 text-slate-200">
                {trendMessage}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
