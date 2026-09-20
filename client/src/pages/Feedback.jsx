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
    return 'border-l-2 border-emerald-400 text-emerald-700'
  }

  if (score >= 4) {
    return 'border-l-2 border-amber-400 text-amber-700'
  }

  return 'border-l-2 border-red-400 text-red-700'
}

export function FeedbackReport({
  feedbackItems,
  overallSummary,
  header,
  footer,
}) {
  return (
    <div className="bg-gray-50 px-4 py-12 text-gray-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {header || (
          <div className="rounded-md border border-gray-200 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Feedback report
            </p>
            <h1 className="mt-3 text-4xl font-bold text-gray-900">
              Your interview evaluation
            </h1>
          </div>
        )}

        {overallSummary ? (
          <div className="rounded-md border border-gray-200 bg-white p-6 border-l-2 border-blue-500">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Overall summary
            </p>
            <p className="mt-3 text-gray-700">{overallSummary}</p>
          </div>
        ) : null}

        <div className="space-y-4">
          {feedbackItems.map((item, index) => {
            const score = Number(item.score || 0)
            const questionPosition = `${index + 1}/${feedbackItems.length}`

            return (
              <div
                key={`${index}-${item.question}`}
                className="rounded-md border border-gray-200 bg-white p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Question
                    </p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
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
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-700">Your answer</p>
                          <p className="mt-2 break-words text-sm leading-6 text-gray-500">
                            <span className="font-semibold text-gray-900">
                              {getMcqOptionLabel(item, item.answer) || '-'}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-md border px-3 py-1 text-xs font-semibold ${
                            score >= 10
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                              : 'border-red-500/30 bg-red-500/10 text-red-700'
                          }`}
                        >
                          {score >= 10 ? 'Correct!' : 'Incorrect'}
                        </span>
                      </div>
                    </div>

                    {score < 10 ? (
                      <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <p className="text-sm font-semibold text-emerald-700">
                          Correct answer
                        </p>
                        <p className="mt-2 break-words text-sm leading-6 font-semibold text-emerald-800">
                          {getMcqOptionLabel(item, item.correct_answer)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-700">Your answer</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-500 break-words">
                        {item.answer}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-md border border-gray-200 bg-gray-50 p-4 border-l-2 border-emerald-400">
                        <p className="text-sm font-semibold text-gray-700">Strengths</p>
                        <p className="mt-2 text-sm leading-6 text-gray-700 break-words">
                          {item.strengths}
                        </p>
                      </div>

                      <div className="rounded-md border border-gray-200 bg-gray-50 p-4 border-l-2 border-amber-400">
                        <p className="text-sm font-semibold text-gray-700">
                          Improvement suggestion
                        </p>
                        <p className="mt-2 text-sm leading-6 text-gray-700 break-words">
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
            className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      }
    />
  )
}





