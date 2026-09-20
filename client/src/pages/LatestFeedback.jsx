import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getInterviewDetail, getUserHistory } from '../api/history'
import { useAuth } from '../context/AuthContext'
import { FeedbackReport } from './Feedback'

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

function averageScore(items) {
  const scores = (items || [])
    .map((item) => Number(item?.score || 0))
    .filter((score) => Number.isFinite(score))

  if (!scores.length) {
    return 0
  }

  return scores.reduce((total, score) => total + score, 0) / scores.length
}

export default function LatestFeedback() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userEmail = user?.email || ''

  const [latestRecord, setLatestRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasInterviews, setHasInterviews] = useState(true)

  const loadLatestFeedback = async () => {
    if (!userEmail) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const history = await getUserHistory(userEmail)
      const sortedHistory = [...history].sort(
        (left, right) =>
          new Date(right.completed_at).getTime() -
          new Date(left.completed_at).getTime(),
      )
      const latest = sortedHistory[0]

      if (!latest) {
        setHasInterviews(false)
        setLatestRecord(null)
        return
      }

      setHasInterviews(true)
      const detail = await getInterviewDetail(userEmail, latest.id)
      setLatestRecord(detail)
    } catch {
      setError('We could not load your latest feedback right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLatestFeedback()
  }, [userEmail])

  const feedbackItems = latestRecord?.qa_results || []
  const overallScore = useMemo(
    () => averageScore(feedbackItems),
    [feedbackItems],
  )

  if (!userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-slate-100">
        <div className="w-full max-w-xl rounded-md border border-gray-800 bg-gray-900 p-6 text-center">
          <h1 className="text-3xl font-bold text-white">No session found</h1>
          <p className="mt-3 text-slate-300">
            Please log in to view your feedback.
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

  if (loading) {
    return (
      <div className="bg-gray-950 px-4 py-12 text-slate-100">
        <div className="mx-auto w-full max-w-5xl rounded-md border border-gray-800 bg-gray-900 p-6 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-md border-4 border-gray-800 border-t-gray-500" />
          <p className="text-sm font-medium text-slate-300">Loading latest feedback...</p>
        </div>
      </div>
    )
  }

  if (!hasInterviews) {
    return (
      <div className="bg-gray-950 px-4 py-12 text-slate-100">
        <div className="mx-auto w-full max-w-5xl rounded-md border border-gray-800 bg-gray-900 p-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            Complete your first interview to see feedback here
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Your latest evaluation, strengths, and improvement suggestions will appear here.
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

  if (error) {
    return (
      <div className="bg-gray-950 px-4 py-12 text-slate-100">
        <div className="mx-auto w-full max-w-5xl rounded-md border border-red-900/50 bg-red-950/40 p-6">
          <p className="text-sm font-semibold text-red-300">Something went wrong</p>
          <p className="mt-2 text-sm text-red-200">{error}</p>
          <button
            type="button"
            onClick={loadLatestFeedback}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <FeedbackReport
      feedbackItems={feedbackItems}
      overallSummary={latestRecord?.overall_summary || ''}
      header={
        <div className="rounded-md border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Latest feedback
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-[1.4fr_1fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Interview Type
              </p>
              <h1 className="mt-2 break-words text-3xl font-bold text-white">
                {latestRecord?.category || 'Interview'}
              </h1>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Date
              </p>
              <p className="mt-2 text-base font-semibold text-slate-200">
                {formatDate(latestRecord?.completed_at)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Overall Score
              </p>
              <p className="mt-2 text-3xl font-bold text-blue-300">
                {overallScore.toFixed(1)}/10
              </p>
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-center">
          <Link
            to="/history"
            className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            View Interview History
          </Link>
        </div>
      }
    />
  )
}
