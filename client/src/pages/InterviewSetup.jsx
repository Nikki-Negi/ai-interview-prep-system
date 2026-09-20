import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const difficultyOptions = ['easy', 'medium', 'hard']
const questionTypeOptions = ['written', 'mcq', 'mixed']
const numberOptions = [5, 10, 'custom']

function OptionGroup({ label, options, value, onChange }) {
  const formatOption = (option) => {
    if (typeof option === 'string' && option.toLowerCase() === 'mcq') {
      return 'MCQ'
    }

    if (typeof option === 'string' && option.toLowerCase() === 'written') {
      return 'Written'
    }

    if (typeof option === 'string' && option.toLowerCase() === 'mixed') {
      return 'Mixed'
    }

    if (typeof option === 'string' && option.toLowerCase() === 'custom') {
      return 'Custom'
    }

    return String(option).charAt(0).toUpperCase() + String(option).slice(1)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
        {label}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const isSelected = value === option

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-md border px-4 py-3 text-sm font-semibold transition ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                  : 'border-gray-800 bg-gray-950 text-slate-300 hover:border-blue-500/40 hover:text-white'
              }`}
            >
              {formatOption(option)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function InterviewSetup() {
  const navigate = useNavigate()
  const [difficulty, setDifficulty] = useState(difficultyOptions[0])
  const [questionType, setQuestionType] = useState(questionTypeOptions[0])
  const [questionCountOption, setQuestionCountOption] = useState(numberOptions[0])
  const [customNumQuestions, setCustomNumQuestions] = useState('')
  const [numQuestionsError, setNumQuestionsError] = useState('')

  const selectedCategory = (() => {
    const raw = localStorage.getItem('selectedCategory')

    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  })()

  const handleStart = () => {
    const selectedNumQuestions =
      questionCountOption === 'custom'
        ? Number(customNumQuestions)
        : questionCountOption

    if (
      questionCountOption === 'custom' &&
      (!Number.isInteger(selectedNumQuestions) ||
        selectedNumQuestions < 1 ||
        selectedNumQuestions > 30)
    ) {
      setNumQuestionsError('Enter a number between 1 and 30.')
      return
    }

    localStorage.setItem('difficulty', difficulty)
    localStorage.setItem('questionType', questionType)
    localStorage.setItem('numQuestions', String(selectedNumQuestions))
    navigate('/interview')
  }

  return (
    <div className="bg-gray-950 px-4 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-md border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Interview setup
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
            Configure your session
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            {selectedCategory?.name
              ? `Preparing questions for ${selectedCategory.name}.`
              : 'Choose your interview preferences before starting.'}
          </p>
        </section>

        <div className="grid gap-6 rounded-md border border-gray-800 bg-gray-900 p-6">
          <OptionGroup
            label="Difficulty"
            options={difficultyOptions}
            value={difficulty}
            onChange={setDifficulty}
          />
          <OptionGroup
            label="Question Type"
            options={questionTypeOptions}
            value={questionType}
            onChange={setQuestionType}
          />
          <OptionGroup
            label="Number of Questions"
            options={numberOptions}
            value={questionCountOption}
            onChange={(nextOption) => {
              setQuestionCountOption(nextOption)
              setNumQuestionsError('')
            }}
          />
          {questionCountOption === 'custom' ? (
            <div className="max-w-xs space-y-2">
              <label
                className="block text-sm font-medium text-slate-200"
                htmlFor="customNumQuestions"
              >
                Custom number of questions
              </label>
              <input
                id="customNumQuestions"
                type="number"
                min="1"
                max="30"
                value={customNumQuestions}
                onChange={(event) => {
                  setCustomNumQuestions(event.target.value)
                  setNumQuestionsError('')
                }}
                className="w-full rounded-md border border-gray-800 bg-gray-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                placeholder="12"
              />
              <p className="text-sm text-slate-400">Choose between 1 and 30.</p>
              {numQuestionsError ? (
                <p className="text-sm text-red-200">{numQuestionsError}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleStart}
            className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  )
}

