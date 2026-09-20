import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

function getMcqOptionLabel(item, answerKey) {
  if (!answerKey) {
    return ''
  }

  const optionText = item?.options?.[answerKey] || ''
  return optionText ? `${answerKey}) ${optionText}` : answerKey
}

function getScoreClasses(score) {
  if (score >= 8) {
    return 'border-l-2 border-emerald-400 text-emerald-300'
  }

  if (score >= 4) {
    return 'border-l-2 border-amber-400 text-amber-300'
  }

  return 'border-l-2 border-red-400 text-red-300'
}

export function FeedbackReport({
  feedbackItems,
  overallSummary,
  header,
  footer,
}) {
  return (
    <div className="bg-gray-950 px-4 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {header || (
          <div className="rounded-md border border-gray-800 bg-gray-900 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              Feedback report
            </p>
            <h1 className="mt-3 text-4xl font-bold text-white">
              Your interview evaluation
            </h1>
          </div>
        )}

        {overallSummary ? (
          <div className="rounded-md border border-gray-800 bg-gray-900 p-6 border-l-2 border-blue-500">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              Overall summary
            </p>
            <p className="mt-3 text-slate-200">{overallSummary}</p>
          </div>
        ) : null}

        <div className="space-y-4">
          {feedbackItems.map((item, index) => {
            const score = Number(item.score || 0)
            const questionPosition = `${index + 1}/${feedbackItems.length}`

            return (
              <div
                key={`${index}-${item.question}`}
                className="rounded-md border border-gray-800 bg-gray-900 p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Question
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {item.question}
                    </p>
                  </div>
                    <span
                      className={`inline-flex items-center rounded-md border px-3 py-1 text-sm font-semibold ${getScoreClasses(score)}`}
                    >
                    {questionPosition}
                  </span>
                </div>

                {item.type === 'mcq' ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-md border border-gray-800 bg-gray-950 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-200">Your answer</p>
                          <p className="mt-2 break-words text-sm leading-6 text-slate-300">
                            <span className="font-semibold text-white">
                              {getMcqOptionLabel(item, item.answer) || '-'}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-md border px-3 py-1 text-xs font-semibold ${
                            score >= 10
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : 'border-red-500/30 bg-red-500/10 text-red-300'
                          }`}
                        >
                          {score >= 10 ? 'Correct!' : 'Incorrect'}
                        </span>
                      </div>
                    </div>

                    {score < 10 ? (
                      <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <p className="text-sm font-semibold text-emerald-300">
                          Correct answer
                        </p>
                        <p className="mt-2 break-words text-sm leading-6 font-semibold text-emerald-100">
                          {getMcqOptionLabel(item, item.correct_answer)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-md border border-gray-800 bg-gray-950 p-4">
                      <p className="text-sm font-semibold text-slate-200">Your answer</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300 break-words">
                        {item.answer}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-md border border-gray-800 bg-gray-950 p-4 border-l-2 border-emerald-400">
                        <p className="text-sm font-semibold text-gray-300">Strengths</p>
                        <p className="mt-2 text-sm leading-6 text-slate-200 break-words">
                          {item.strengths}
                        </p>
                      </div>

                      <div className="rounded-md border border-gray-800 bg-gray-950 p-4 border-l-2 border-amber-400">
                        <p className="text-sm font-semibold text-gray-300">
                          Improvement suggestion
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-200 break-words">
                          {item.improvement}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {footer}
      </div>
    </div>
  )
}

export default function Feedback() {
  const navigate = useNavigate()

  const evaluation = useMemo(() => {
    const raw = localStorage.getItem('lastEvaluation')

    if (!raw) {
      return []
    }

    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }, [])

  const overallSummary =
    evaluation.find((item) => item && item.overall_summary)?.overall_summary || ''

  const feedbackItems = evaluation.filter((item) => item && item.question)

  return (
    <FeedbackReport
      feedbackItems={feedbackItems}
      overallSummary={overallSummary}
      footer={
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Back to Dashboard
          </button>
        </div>
      }
    />
  )
}



