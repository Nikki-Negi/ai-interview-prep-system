import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getCategories } from '../api/categories'

export default function CategorySelect() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadCategories = async () => {
      try {
        const data = await getCategories()
        if (active) {
          setCategories(data)
        }
      } catch {
        if (active) {
          setError('Could not load categories.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadCategories()

    return () => {
      active = false
    }
  }, [])

  const handleSelect = (category) => {
    localStorage.setItem(
      'selectedCategory',
      JSON.stringify({ id: category.id, name: category.name }),
    )
    navigate('/setup')
  }

  return (
    <div className="bg-gray-950 px-4 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-md border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Choose a category
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Select your interview focus
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Pick a track to generate tailored interview practice and start answering questions
            immediately.
          </p>
        </section>

        {loading ? (
          <div className="rounded-md border border-gray-800 bg-gray-900 p-6 text-center text-slate-300">
            Loading categories...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-900/50 bg-red-950/40 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleSelect(category)}
                className="group rounded-md border border-gray-800 bg-gray-900 p-6 text-left transition hover:border-blue-500/40"
              >
                <div className="mb-4 inline-flex border-l-2 border-blue-500 pl-3 text-xs font-semibold text-slate-400">
                  {category.id}
                </div>
                <h2 className="text-xl font-bold text-white transition group-hover:text-blue-300">
                  {category.name}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {category.description}
                </p>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}



