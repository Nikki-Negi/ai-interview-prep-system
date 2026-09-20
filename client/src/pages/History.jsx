import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { getInterviewDetail, getUserHistory } from '../api/history'
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

function scoreClasses(score) {
  if (score >= 8) {
    return 'border-l-2 border-emerald-400 text-emerald-300'
  }

  if (score >= 4) {
    return 'border-l-2 border-amber-400 text-amber-300'
  }

  return 'border-l-2 border-red-400 text-red-300'
}

export default function History() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()

  const recordId = searchParams.get('record')
  const userEmail = user?.email || ''

  const [historyItems, setHistoryItems] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')

  const loadHistory = async () => {
    if (!userEmail) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await getUserHistory(userEmail)
      const sorted = [...data].sort(
        (left, right) =>
          new Date(right.completed_at).getTime() - new Date(left.completed_at).getTime(),
      )
      setHistoryItems(sorted)
    } catch {
      setError('We could not load your interview history right now.')
    } finally {
      setLoading(false)
    }
  }

  const loadDetail = async (selectedId) => {
    if (!userEmail || !selectedId) {
      return
    }

    setDetailLoading(true)
    setDetailError('')

    try {
      const data = await getInterviewDetail(userEmail, selectedId)
      setSelectedRecord(data)
    } catch {
      setDetailError('We could not load that interview detail right now.')
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [userEmail])

  useEffect(() => {
    if (recordId) {
      loadDetail(recordId)
    } else {
      setSelectedRecord(null)
      setDetailError('')
    }
  }, [recordId, userEmail])

  const handleOpenDetail = (id) => {
    setSearchParams({ record: id })
  }

  const handleBackToList = () => {
    setSearchParams({})
    setSelectedRecord(null)
    setDetailError('')
  }

  const detailQuestionResults = useMemo(() => {
    return selectedRecord?.qa_results || []
  }, [selectedRecord])

  if (!userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-slate-100">
        <div className="w-full max-w-xl rounded-md border border-gray-800 bg-gray-900 p-6 text-center">
          <h1 className="text-3xl font-bold text-white">No session found</h1>
          <p className="mt-3 text-slate-300">Please log in to view your history.</p>
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

  if (recordId && selectedRecord) {
    return (
      <div className="bg-gray-950 px-4 py-12 text-slate-100">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="rounded-md border border-gray-800 bg-gray-900 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              Interview detail
            </p>
            <h1 className="mt-3 text-4xl font-bold text-white">
              {selectedRecord.category}
            </h1>
            <p className="mt-3 text-slate-300">
              Completed {formatDate(selectedRecord.completed_at)}
            </p>
          </div>

          <div className="w-full rounded-md border border-gray-800 border-l-2 border-blue-500 bg-gray-900 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              Overall summary
            </p>
            <p className="mt-3 break-words text-slate-200">
              {selectedRecord.overall_summary}
            </p>
          </div>

          <div className="space-y-4">
            {detailQuestionResults.map((item, index) => (
              <div
                key={`${index}-${item.question}`}
                className="w-full rounded-md border border-gray-800 bg-gray-900 p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Question
                    </p>
                    <p className="mt-2 break-words text-lg font-semibold text-white">
                      {item.question}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md border px-3 py-1 text-sm font-semibold ${scoreClasses(
                      Number(item.score || 0),
                    )}`}
                  >
                    {item.score}/10
                  </span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="min-w-0 rounded-md border border-gray-800 bg-gray-950 p-4">
                    <p className="text-sm font-semibold text-slate-200">Answer</p>
                    <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {item.answer}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-md border border-gray-800 bg-gray-950 p-4 border-l-2 border-emerald-400">
                      <p className="text-sm font-semibold text-gray-300">Strengths</p>
                      <p className="mt-2 break-words text-sm leading-6 text-emerald-100">
                        {item.strengths}
                      </p>
                    </div>
                    <div className="rounded-md border border-gray-800 bg-gray-950 p-4 border-l-2 border-amber-400">
                      <p className="text-sm font-semibold text-gray-300">
                        Improvement suggestion
                      </p>
                      <p className="mt-2 break-words text-sm leading-6 text-amber-100">
                        {item.improvement}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleBackToList}
              className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Back to History
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-950 px-4 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="rounded-md border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Performance history
          </p>
          <h1 className="mt-3 text-4xl font-bold text-white">
            Your past interviews
          </h1>
        </div>

        {loading ? (
          <div className="rounded-md border border-gray-800 bg-gray-900 p-6 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-md border-4 border-gray-800 border-t-gray-500" />
            <p className="text-sm font-medium text-slate-300">Loading history...</p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-900/50 bg-red-950/40 p-6">
            <p className="text-sm font-semibold text-red-300">Something went wrong</p>
            <p className="mt-2 text-sm text-red-200">{error}</p>
            <button
              type="button"
              onClick={loadHistory}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!loading && !error && historyItems.length === 0 ? (
          <div className="rounded-md border border-gray-800 bg-gray-900 p-6 text-center">
            <p className="text-lg font-semibold text-white">No interviews yet</p>
            <p className="mt-2 text-sm text-slate-300">
              Complete your first interview to see it here.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4">
          {historyItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleOpenDetail(item.id)}
              className="w-full rounded-md border border-gray-800 bg-gray-900 p-6 text-left transition hover:border-blue-500/30"
            >
              <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                    {item.category}
                  </p>
                  <p className="mt-2 break-words text-base font-semibold text-white">
                    {item.overall_summary}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {formatDate(item.completed_at)}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center self-start rounded-md border px-3 py-1 text-sm font-semibold ${scoreClasses(
                    Number(item.average_score || 0),
                  )}`}
                >
                  {Number(item.average_score || 0).toFixed(1)}/10
                </span>
              </div>
            </button>
          ))}
        </div>

        {recordId && detailLoading ? (
          <div className="rounded-md border border-gray-800 bg-gray-900 p-6 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-md border-4 border-gray-800 border-t-gray-500" />
            <p className="text-sm font-medium text-slate-300">Loading interview detail...</p>
          </div>
        ) : null}

        {recordId && detailError ? (
          <div className="rounded-md border border-red-900/50 bg-red-950/40 p-6">
            <p className="text-sm font-semibold text-red-300">Something went wrong</p>
            <p className="mt-2 text-sm text-red-200">{detailError}</p>
            <button
              type="button"
              onClick={() => loadDetail(recordId)}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}



