import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { MapPin, Pencil, Save, X } from 'lucide-react'

import { useAuth } from '../context/AuthContext'

const TOKEN_KEY = 'ai_interview_prep_token'
const emptyProfile = {
  name: '',
  email: '',
  bio: '',
  skills: [],
  goals: [],
  location: '',
  preferred_difficulty: 'medium',
  preferred_question_types: ['written'],
  preferred_topics: '',
  created_at: '',
}

function getAuthHeaders() {
  const token =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)

  return token ? { Authorization: `Bearer ${token}` } : {}
}

function splitCommaList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitLineList(value) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="rounded-md border border-gray-300 p-2 text-blue-700 transition hover:border-blue-500 hover:bg-gray-100 hover:text-blue-800"
    >
      {children}
    </button>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userEmail = user?.email || ''

  const [profile, setProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [savingField, setSavingField] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState('')
  const [bioDraft, setBioDraft] = useState('')
  const [skillsDraft, setSkillsDraft] = useState('')
  const [goalsDraft, setGoalsDraft] = useState('')

  const tagline = useMemo(() => {
    return (profile.bio || '').split('\n').find((line) => line.trim()) || ''
  }, [profile.bio])

  const loadProfile = async () => {
    if (!userEmail) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.get(
        `http://localhost:8000/profile/${encodeURIComponent(userEmail)}`,
        { headers: getAuthHeaders() },
      )
      const nextProfile = { ...emptyProfile, ...(response.data || {}) }
      setProfile(nextProfile)
      setBioDraft(nextProfile.bio || '')
      setSkillsDraft((nextProfile.skills || []).join(', '))
      setGoalsDraft((nextProfile.goals || []).join('\n'))
    } catch {
      setError('We could not load your profile right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [userEmail])

  const saveProfileField = async (field, value) => {
    setSavingField(field)
    setError('')

    try {
      const response = await axios.put(
        'http://localhost:8000/profile',
        { [field]: value },
        { headers: getAuthHeaders() },
      )
      const nextProfile = { ...emptyProfile, ...(response.data || {}) }
      setProfile(nextProfile)
      setBioDraft(nextProfile.bio || '')
      setSkillsDraft((nextProfile.skills || []).join(', '))
      setGoalsDraft((nextProfile.goals || []).join('\n'))
      setEditing('')
    } catch {
      setError('We could not save that change. Please try again.')
    } finally {
      setSavingField('')
    }
  }

  if (!userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-gray-900">
        <div className="w-full max-w-xl rounded-md border border-gray-200 bg-white p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">No session found</h1>
          <p className="mt-3 text-gray-500">
            Please log in to view your profile.
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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-md border border-gray-200 bg-white p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                Profile
              </p>
              <h1 className="mt-3 break-words text-4xl font-bold tracking-tight text-gray-900">
                {loading ? 'Loading...' : profile.name || 'Add your name'}
              </h1>
              <p className="mt-2 break-words text-sm text-gray-500">
                {profile.email || userEmail}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                <span>{profile.location || 'Add your location'}</span>
              </div>
              {tagline ? (
                <p className="mt-5 max-w-2xl text-base leading-7 text-gray-700">
                  {tagline}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setEditing('bio')}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit Profile
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-md border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">About Me</h2>
            <IconButton label="Edit bio" onClick={() => setEditing('bio')}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>

          {editing === 'bio' ? (
            <div className="mt-5">
              <textarea
                value={bioDraft}
                onChange={(event) => setBioDraft(event.target.value)}
                rows={6}
                className="w-full rounded-md border border-gray-300 bg-gray-50 p-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-blue-500"
                placeholder="Add your bio to help personalize your practice"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => saveProfileField('bio', bioDraft)}
                  disabled={savingField === 'bio'}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {savingField === 'bio' ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBioDraft(profile.bio || '')
                    setEditing('')
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-gray-500">
              {profile.bio || 'Add your bio to help personalize your practice'}
            </p>
          )}
        </section>

        <section className="rounded-md border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">Skills</h2>
            <IconButton label="Edit skills" onClick={() => setEditing('skills')}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>

          {editing === 'skills' ? (
            <div className="mt-5">
              <input
                type="text"
                value={skillsDraft}
                onChange={(event) => setSkillsDraft(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-blue-500"
                placeholder="JavaScript, system design, behavioral interviews"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => saveProfileField('skills', splitCommaList(skillsDraft))}
                  disabled={savingField === 'skills'}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {savingField === 'skills' ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSkillsDraft((profile.skills || []).join(', '))
                    setEditing('')
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Cancel
                </button>
              </div>
            </div>
          ) : profile.skills?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-gray-500">
              Add skills to tailor your practice sessions.
            </p>
          )}
        </section>

        <section className="rounded-md border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">Goals</h2>
            <IconButton label="Edit goals" onClick={() => setEditing('goals')}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>

          {editing === 'goals' ? (
            <div className="mt-5">
              <textarea
                value={goalsDraft}
                onChange={(event) => setGoalsDraft(event.target.value)}
                rows={5}
                className="w-full rounded-md border border-gray-300 bg-gray-50 p-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-blue-500"
                placeholder={'Practice concise answers\nPrepare for system design\nImprove confidence'}
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => saveProfileField('goals', splitLineList(goalsDraft))}
                  disabled={savingField === 'goals'}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {savingField === 'goals' ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGoalsDraft((profile.goals || []).join('\n'))
                    setEditing('')
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Cancel
                </button>
              </div>
            </div>
          ) : profile.goals?.length ? (
            <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-500">
              {profile.goals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-gray-500">
              Add goals so your practice has a clear target.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}


