import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

function MicIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
      {active ? (
        <>
          <path d="M12 18a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v8a4 4 0 0 0 4 4Z" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
          <path d="M9 21h6" />
        </>
      ) : (
        <>
          <path d="M12 18a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v8a4 4 0 0 0 4 4Z" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
          <path d="M9 21h6" />
        </>
      )}
    </svg>
  )
}

function loadJson(key, fallback = null) {
  const raw = localStorage.getItem(key)

  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function normalizeQuestion(item) {
  if (typeof item === 'string') {
    return { type: 'written', question: item }
  }

  return {
    type: item?.type || 'written',
    question: item?.question || '',
    options: item?.options || null,
    correct_answer: item?.correct_answer || null,
  }
}

export default function Interview() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const recognitionRef = useRef(null)
  const activeAnswerKeyRef = useRef('')

  const selectedCategory = useMemo(() => loadJson('selectedCategory'), [])
  const difficulty = useMemo(() => localStorage.getItem('difficulty') || 'easy', [])
  const questionType = useMemo(() => localStorage.getItem('questionType') || 'written', [])
  const numQuestions = useMemo(() => {
    const storedValue = Number(localStorage.getItem('numQuestions') || '5')
    return Number.isFinite(storedValue) && storedValue > 0 ? storedValue : 5
  }, [])

  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [loadingSubmission, setLoadingSubmission] = useState(false)
  const [questionsError, setQuestionsError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [listeningAnswerKey, setListeningAnswerKey] = useState('')
  const [voiceSupported, setVoiceSupported] = useState(true)

  const categoryName = selectedCategory?.name || ''

  const fetchQuestions = async () => {
    if (!categoryName) {
      return
    }

    setLoadingQuestions(true)
    setQuestionsError('')

    try {
      const response = await axios.post('http://localhost:8000/questions/generate', {
        category: categoryName,
        difficulty,
        question_type: questionType,
        num_questions: numQuestions,
      })

      const normalizedQuestions = (response.data.questions || []).map(normalizeQuestion)
      setQuestions(normalizedQuestions)
      setAnswers({})
    } catch {
      setQuestionsError('We could not generate questions right now. Please try again.')
    } finally {
      setLoadingQuestions(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [categoryName, difficulty, questionType, numQuestions])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setVoiceSupported(false)
      return undefined
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim()

      if (!transcript) {
        return
      }

      const answerKey = activeAnswerKeyRef.current

      setAnswers((currentAnswers) => {
        const previousAnswer = currentAnswers[answerKey] || ''
        const nextValue = `${previousAnswer}${previousAnswer ? ' ' : ''}${transcript}`.trim()

        return {
          ...currentAnswers,
          [answerKey]: nextValue,
        }
      })
    }

    recognition.onerror = () => {
      setListeningAnswerKey('')
    }

    recognition.onend = () => {
      setListeningAnswerKey('')
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  const handleAnswerChange = (answerKey, value) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [answerKey]: value,
    }))
  }

  const handleMicClick = (answerKey) => {
    if (!recognitionRef.current) {
      return
    }

    if (listeningAnswerKey === answerKey) {
      recognitionRef.current.stop()
      return
    }

    activeAnswerKeyRef.current = answerKey
    setListeningAnswerKey(answerKey)
    recognitionRef.current.stop()

    setTimeout(() => {
      recognitionRef.current?.start()
    }, 50)
  }

  const allAnswered =
    questions.length === numQuestions &&
    questions.every((question, index) => {
      const answerKey = `${index}-${question.question}`
      return (answers[answerKey] || '').trim().length > 0
    })

  const handleSubmitAll = async () => {
    if (!allAnswered) {
      return
    }

    setLoadingSubmission(true)
    setSubmitError('')

    try {
      const qa_pairs = questions.map((question, index) => {
        const answerKey = `${index}-${question.question}`
        const payload = {
          question: question.question,
          answer: (answers[answerKey] || '').trim(),
          type: question.type || 'written',
        }

        if ((question.type || 'written') === 'mcq') {
          payload.options = question.options || {}
          payload.correct_answer = question.correct_answer || ''
        }

        return payload
      })

      const response = await axios.post('http://localhost:8000/answers/evaluate', {
        category: categoryName,
        qa_pairs,
        user_email: user?.email || '',
      })

      localStorage.setItem('lastEvaluation', JSON.stringify(response.data))
      navigate('/feedback')
    } catch {
      setSubmitError('We could not evaluate your answers right now. Please try again.')
    } finally {
      setLoadingSubmission(false)
    }
  }

  const renderWrittenQuestion = (question, index, answerKey, answerValue, isListening) => (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <textarea
        value={answerValue}
        onChange={(event) => handleAnswerChange(answerKey, event.target.value)}
        rows={5}
        className="min-h-[140px] flex-1 rounded-md border border-gray-800 bg-gray-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
        placeholder="Type your answer here, or use the microphone button..."
      />

      <div className="flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={() => handleMicClick(answerKey)}
          disabled={!voiceSupported}
          className={`inline-flex h-12 w-12 items-center justify-center rounded-md border text-lg font-semibold transition ${
            voiceSupported
              ? isListening
                ? 'animate-pulse border-red-500/40 bg-red-500 text-white hover:bg-red-600'
                : 'border-gray-800 bg-gray-950 text-slate-300 hover:border-blue-500 hover:text-blue-300'
              : 'cursor-not-allowed border-gray-800 bg-gray-950 text-slate-600'
          }`}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        >
          <MicIcon active={isListening} />
        </button>
        {!voiceSupported ? (
          <p className="max-w-[10rem] text-xs leading-5 text-slate-400">
            Voice input not supported in this browser.
          </p>
        ) : (
          <p className="max-w-[10rem] text-xs leading-5 text-slate-400">
            {isListening ? 'Listening...' : 'Use voice input'}
          </p>
        )}
      </div>
    </div>
  )

  const renderMcqQuestion = (question, answerKey, answerValue) => (
    <div className="grid gap-3">
      {['A', 'B', 'C', 'D'].map((optionKey) => (
        <label
          key={optionKey}
          className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition ${
            answerValue === optionKey
              ? 'border-blue-500 bg-blue-500/15 text-blue-300'
              : 'border-gray-800 bg-gray-950 text-slate-300 hover:border-blue-500/40 hover:text-white'
          }`}
        >
          <input
            type="radio"
            name={answerKey}
            value={optionKey}
            checked={answerValue === optionKey}
            onChange={() => handleAnswerChange(answerKey, optionKey)}
            className="h-4 w-4 accent-blue-500"
          />
          <span className="min-w-8 font-semibold text-white">{optionKey}.</span>
          <span className="break-words">{question.options?.[optionKey] || ''}</span>
        </label>
      ))}
    </div>
  )

  const renderQuestionCard = (question, index) => {
    const answerKey = `${index}-${question.question}`
    const answerValue = answers[answerKey] || ''
    const isListening = listeningAnswerKey === answerKey
    const isMcq = question.type === 'mcq'

    return (
      <li
        key={answerKey}
        className="rounded-md border border-gray-800 bg-gray-900 p-6 text-slate-100   transition hover:border-blue-500/30"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-blue-500 bg-gray-900 text-sm font-semibold text-white">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold leading-7 text-white break-words">
              {question.question}
            </p>
          </div>
        </div>

        {isMcq ? renderMcqQuestion(question, answerKey, answerValue) : renderWrittenQuestion(question, index, answerKey, answerValue, isListening)}
      </li>
    )
  }

  return (
    <div className="bg-gray-950 px-4 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="rounded-md border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Interview mode
          </p>
          <h1 className="mt-3 text-4xl font-bold text-white">
            {selectedCategory?.name
              ? `You selected: ${selectedCategory.name}.`
              : 'No category selected.'}
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            {selectedCategory?.name
              ? 'Answer each question below, then submit all responses.'
              : 'Go back and choose a category to continue.'}
          </p>
        </div>

        {loadingQuestions ? (
          <div className="rounded-md border border-gray-800 bg-gray-900 p-6 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-md border-4 border-gray-800 border-t-gray-500" />
            <p className="text-sm font-medium text-slate-300">
              Generating your interview questions...
            </p>
          </div>
        ) : null}

        {questionsError ? (
          <div className="rounded-md border border-red-900/50 bg-red-950/40 p-6">
            <p className="text-sm font-semibold text-red-300">Something went wrong</p>
            <p className="mt-2 text-sm text-red-200">{questionsError}</p>
            <button
              type="button"
              onClick={fetchQuestions}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!loadingQuestions && !questionsError && questions.length > 0 ? (
          <div className="rounded-md border border-gray-800 bg-gray-900 p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Questions
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Practice these questions
                </h2>
              </div>
            </div>

            <ol className="space-y-4">{questions.map(renderQuestionCard)}</ol>

            {submitError ? (
              <div className="mt-6 rounded-md border border-red-900/50 bg-red-950/40 p-4 text-sm text-red-200">
                <p>{submitError}</p>
                <button
                  type="button"
                  onClick={handleSubmitAll}
                  className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Retry
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={!allAnswered || loadingSubmission}
              className="mt-8 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {loadingSubmission ? 'Submitting answers...' : 'Submit All Answers'}
            </button>

            {!allAnswered ? (
              <p className="mt-3 text-sm text-slate-400">
                Fill in all questions to enable submission.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

