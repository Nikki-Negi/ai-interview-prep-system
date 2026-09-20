import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

import { registerUser } from '../api/auth'
import { useAuth } from '../context/AuthContext'

const EMAIL_PATTERN =
  /^[a-z0-9](?:[a-z0-9._+-]*[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

function isValidEmail(value) {
  const [localPart] = value.split('@')

  return value.length < 254 && localPart.length < 64 && EMAIL_PATTERN.test(value)
}

export default function Signup() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

  const handleAuthSuccess = (authData) => {
    login(authData.access_token, authData.user)
    navigate('/dashboard')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const normalizedEmail = email.toLowerCase()
    let hasValidationError = false

    if (!/^[A-Za-z\s]+$/.test(name)) {
      setNameError('Name must contain only letters')
      hasValidationError = true
    }

    if (!isValidEmail(normalizedEmail)) {
      setEmail(normalizedEmail)
      setEmailError('Enter a valid email address')
      hasValidationError = true
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      hasValidationError = true
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match')
      hasValidationError = true
    }

    if (hasValidationError) {
      return
    }

    setLoading(true)
    setError('')

    try {
      await registerUser(name, normalizedEmail, password)
      navigate('/login')
    } catch (submitError) {
      const message =
        submitError?.response?.data?.detail ||
        submitError?.response?.data?.message ||
        'Registration failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    const credential = credentialResponse?.credential

    if (!credential) {
      setError('Google sign-in did not return a credential.')
      return
    }

    setGoogleLoading(true)
    setError('')

    try {
      const response = await axios.post('http://localhost:8000/auth/google', {
        credential,
      })

      handleAuthSuccess(response.data)
    } catch (submitError) {
      const message =
        submitError?.response?.data?.detail ||
        submitError?.response?.data?.message ||
        'Google sign-in failed'
      setError(message)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-md border border-gray-200 bg-white p-6">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            AI Interview Prep
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Create account</h1>
          <p className="mt-2 text-sm text-gray-500">
            Start preparing with a focused interview workflow.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setNameError('')
              }}
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
              placeholder="Your name"
            />
            {nameError ? <p className="mt-2 text-sm text-red-700">{nameError}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value.toLowerCase())
                setEmailError('')
              }}
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
              placeholder="you@example.com"
              required
            />
            {emailError ? <p className="mt-2 text-sm text-red-700">{emailError}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setPasswordError('')
                  setConfirmPasswordError('')
                }}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                placeholder="Create a password"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 transition hover:text-blue-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0 0 13.41 13.4" />
                    <path d="M9.88 5.1A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a18.3 18.3 0 0 1-2.18 3.14" />
                    <path d="M6.1 6.1C3.82 8.06 2 12 2 12s3 7 10 7c1.08 0 2.08-.15 3-.41" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError ? <p className="mt-2 text-sm text-red-700">{passwordError}</p> : null}
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  setConfirmPasswordError('')
                }}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                placeholder="Confirm your password"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 transition hover:text-blue-600"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0 0 13.41 13.4" />
                    <path d="M9.88 5.1A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a18.3 18.3 0 0 1-2.18 3.14" />
                    <path d="M6.1 6.1C3.82 8.06 2 12 2 12s3 7 10 7c1.08 0 2.08-.15 3-.41" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPasswordError ? (
              <p className="mt-2 text-sm text-red-700">{confirmPasswordError}</p>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            or
          </span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in failed')}
            shape="rectangular"
            theme="filled_black"
            size="large"
            text="signin_with"
            width={360}
          />
        </div>

        {googleLoading ? (
          <p className="mt-3 text-center text-xs text-gray-500">Signing in with Google...</p>
        ) : null}

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link className="font-semibold text-blue-600 hover:text-blue-700" to="/login">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}



