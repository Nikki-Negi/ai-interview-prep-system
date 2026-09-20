import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Eye, EyeOff, LogOut, Save, Shield } from 'lucide-react'

import { useAuth } from '../context/AuthContext'

const TOKEN_KEY = 'ai_interview_prep_token'
const emptyProfile = {
  name: '',
  email: '',
  goals: [],
  preferred_difficulty: 'medium',
  preferred_question_types: ['written'],
  preferred_topics: '',
  has_password: true,
}
const interviewTypes = [
  { label: 'Written', value: 'written' },
  { label: 'MCQ', value: 'mcq' },
  { label: 'Mixed', value: 'mixed' },
]

function getAuthHeaders() {
  const token =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)

  return token ? { Authorization: `Bearer ${token}` } : {}
}

function PasswordInput({ id, label, value, onChange, visible, onToggle }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
          placeholder={label}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-3 flex items-center text-gray-500 transition hover:text-blue-600"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const userEmail = user?.email || ''

  const [profile, setProfile] = useState(emptyProfile)
  const [name, setName] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [questionTypes, setQuestionTypes] = useState(['written'])
  const [preferredTopics, setPreferredTopics] = useState('')
  const [loading, setLoading] = useState(true)
  const [accountSaving, setAccountSaving] = useState(false)
  const [preferencesSaving, setPreferencesSaving] = useState(false)
  const [accountMessage, setAccountMessage] = useState('')
  const [preferencesMessage, setPreferencesMessage] = useState('')
  const [error, setError] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

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
      setName(nextProfile.name || '')
      setCurrentRole((nextProfile.goals || [])[0] || '')
      setDifficulty(nextProfile.preferred_difficulty || 'medium')
      setQuestionTypes(nextProfile.preferred_question_types?.length ? nextProfile.preferred_question_types : ['written'])
      setPreferredTopics(nextProfile.preferred_topics || '')
    } catch {
      setError('We could not load your settings right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [userEmail])

  const saveAccount = async (event) => {
    event.preventDefault()
    setAccountSaving(true)
    setAccountMessage('')
    setError('')

    try {
      const remainingGoals = (profile.goals || []).slice(1)
      const goals = currentRole.trim()
        ? [currentRole.trim(), ...remainingGoals]
        : remainingGoals
      const response = await axios.put(
        'http://localhost:8000/profile',
        { name, goals },
        { headers: getAuthHeaders() },
      )
      const nextProfile = { ...emptyProfile, ...(response.data || {}) }
      setProfile(nextProfile)
      setName(nextProfile.name || '')
      setCurrentRole((nextProfile.goals || [])[0] || '')
      setAccountMessage('Account information saved.')
    } catch {
      setError('We could not save your account information.')
    } finally {
      setAccountSaving(false)
    }
  }

  const savePreferences = async (event) => {
    event.preventDefault()
    setPreferencesSaving(true)
    setPreferencesMessage('')
    setError('')

    try {
      const nextTypes = questionTypes.length ? questionTypes : ['written']
      const response = await axios.put(
        'http://localhost:8000/profile',
        {
          preferred_difficulty: difficulty,
          preferred_question_types: nextTypes,
          preferred_topics: preferredTopics,
        },
        { headers: getAuthHeaders() },
      )
      const nextProfile = { ...emptyProfile, ...(response.data || {}) }
      setProfile(nextProfile)
      setDifficulty(nextProfile.preferred_difficulty || 'medium')
      setQuestionTypes(nextProfile.preferred_question_types?.length ? nextProfile.preferred_question_types : ['written'])
      setPreferredTopics(nextProfile.preferred_topics || '')
      setPreferencesMessage('Preferences saved.')
    } catch {
      setError('We could not save your preferences.')
    } finally {
      setPreferencesSaving(false)
    }
  }

  const toggleQuestionType = (value) => {
    setQuestionTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    )
  }

  const changePassword = async (event) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setPasswordSaving(true)

    try {
      await axios.post(
        'http://localhost:8000/auth/change-password',
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        { headers: getAuthHeaders() },
      )
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
      setPasswordMessage('Password changed successfully.')
    } catch (submitError) {
      const status = submitError?.response?.status
      setPasswordError(
        status === 400
          ? 'Password change is not available for Google sign-in accounts.'
          : 'Current password is incorrect or the password could not be changed.',
      )
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-gray-900">
        <div className="w-full max-w-xl rounded-md border border-gray-200 bg-white p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">No session found</h1>
          <p className="mt-3 text-gray-500">
            Please log in to manage your settings.
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Settings
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
            Account settings
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-500">
            Manage your profile, practice preferences, and account security.
          </p>
        </section>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={saveAccount} className="rounded-md border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">Account Information</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="settings-name">
                Name
              </label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                placeholder={loading ? 'Loading...' : 'Your name'}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="settings-email">
                Email
              </label>
              <input
                id="settings-email"
                type="email"
                value={profile.email || userEmail}
                readOnly
                className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-gray-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="settings-role">
                Current Role/Goal
              </label>
              <input
                id="settings-role"
                type="text"
                value={currentRole}
                onChange={(event) => setCurrentRole(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                placeholder="Frontend developer interview, product manager role, coding confidence"
              />
            </div>
          </div>
          {accountMessage ? <p className="mt-4 text-sm text-emerald-700">{accountMessage}</p> : null}
          <button
            type="submit"
            disabled={accountSaving}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {accountSaving ? 'Saving...' : 'Save Account'}
          </button>
        </form>

        <form onSubmit={savePreferences} className="rounded-md border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">Preferences</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">Interview Types</p>
              <div className="space-y-3">
                {interviewTypes.map((item) => (
                  <label key={item.value} className="flex items-center gap-3 text-sm text-gray-500">
                    <input
                      type="checkbox"
                      checked={questionTypes.includes(item.value)}
                      onChange={() => toggleQuestionType(item.value)}
                      className="h-4 w-4 rounded border-gray-300 bg-gray-50 text-blue-500 accent-blue-500"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="settings-difficulty">
                Difficulty
              </label>
              <select
                id="settings-difficulty"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="settings-topics">
                Preferred Topics
              </label>
              <input
                id="settings-topics"
                type="text"
                value={preferredTopics}
                onChange={(event) => setPreferredTopics(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                placeholder="React, arrays, SQL, leadership"
              />
            </div>
          </div>
          {preferencesMessage ? <p className="mt-4 text-sm text-emerald-700">{preferencesMessage}</p> : null}
          <button
            type="submit"
            disabled={preferencesSaving}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {preferencesSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>

        <section className="rounded-md border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Security</h2>
              <p className="mt-2 text-sm text-gray-500">
                Keep your account protected with a strong password.
              </p>
            </div>
            <Shield className="h-5 w-5 text-blue-600" aria-hidden="true" />
          </div>

          {!profile.has_password ? (
            <p className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              Password change is not available for Google sign-in accounts.
            </p>
          ) : (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowPasswordForm((current) => !current)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Change Password
              </button>

              {showPasswordForm ? (
                <form onSubmit={changePassword} className="mt-5 grid gap-5 md:grid-cols-3">
                  <PasswordInput
                    id="current-password"
                    label="Current Password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    visible={showCurrentPassword}
                    onToggle={() => setShowCurrentPassword((current) => !current)}
                  />
                  <PasswordInput
                    id="new-password"
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    visible={showNewPassword}
                    onToggle={() => setShowNewPassword((current) => !current)}
                  />
                  <PasswordInput
                    id="confirm-new-password"
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    visible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((current) => !current)}
                  />
                  <div className="md:col-span-3">
                    {passwordError ? <p className="mb-3 text-sm text-red-700">{passwordError}</p> : null}
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {passwordSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          )}

          {passwordMessage ? <p className="mt-4 text-sm text-emerald-700">{passwordMessage}</p> : null}
        </section>

        <section className="rounded-md border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-bold text-gray-900">Log Out</h2>
          <p className="mt-2 text-sm text-gray-500">
            End this session and return to the login screen.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log Out
          </button>
        </section>
      </div>
    </div>
  )
}


