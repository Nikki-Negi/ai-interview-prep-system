import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

import { loginUser } from '../api/auth'
import { useAuth } from '../context/AuthContext'

const EMAIL_PATTERN =
  /^[a-z0-9](?:[a-z0-9._+-]*[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
const LOGIN_EMPTY_FIELD_ERRORS = {
  email: 'Please enter email address',
  password: 'Please enter password',
}

function isValidEmail(value) {
  const [localPart] = value.split('@')

  return value.length < 254 && localPart.length < 64 && EMAIL_PATTERN.test(value)
}

function getEmailValidationError(rawValue) {
  if (/[A-Z]/.test(rawValue)) {
    return 'Email must not contain capital letters'
  }

  const value = rawValue.toLowerCase()
  const [localPart] = value.split('@')

  if (localPart && /^[0-9]/.test(localPart)) {
    return 'Email must start with a letter'
  }

  if (!isValidEmail(value)) {
    return 'Enter a valid email address'
  }

  return ''
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleAuthSuccess = (authData, rememberValue = rememberMe) => {
    login(authData.access_token, authData.user, rememberValue)
    navigate('/dashboard')
  }

  const setLoginEmptyErrors = (nextValues) => {
    const emptyFields = {
      email: !nextValues.email.trim(),
      password: !nextValues.password.trim(),
    }
    const emptyCount = Object.values(emptyFields).filter(Boolean).length

    if (!emptyCount) {
      setError('')
      setEmailError('')
      setPasswordError('')
      return false
    }

    if (emptyCount === Object.keys(emptyFields).length) {
      setError('Please fill all the fields')
      setEmailError('')
      setPasswordError('')
      return true
    }

    setError('')
    setEmailError(emptyFields.email ? LOGIN_EMPTY_FIELD_ERRORS.email : '')
    setPasswordError(emptyFields.password ? LOGIN_EMPTY_FIELD_ERRORS.password : '')
    return true
  }

  const hasLoginEmptyErrors = () =>
    error === 'Please fill all the fields' ||
    emailError === LOGIN_EMPTY_FIELD_ERRORS.email ||
    passwordError === LOGIN_EMPTY_FIELD_ERRORS.password

  const updateLoginEmptyErrorsIfVisible = (nextValues) => {
    if (hasLoginEmptyErrors()) {
      setLoginEmptyErrors(nextValues)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (setLoginEmptyErrors({ email, password })) {
      return
    }

    const nextEmailError = getEmailValidationError(email)
    if (nextEmailError) {
      setEmailError(nextEmailError)
      setError('')
      return
    }

    const normalizedEmail = email.toLowerCase()
    setLoading(true)
    setError('')

    try {
      const response = await loginUser(normalizedEmail, password)
      handleAuthSuccess(response, rememberMe)
    } catch (submitError) {
      const status = submitError?.response?.status
      setError(status === 401 ? 'Invalid email or password' : 'Login failed')
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
      const response = await axios.post(
        'http://localhost:8000/auth/google',
        {
          credential,
        },
        {
          timeout: 10000,
        },
      )
      handleAuthSuccess(response.data, rememberMe)
    } catch (submitError) {
      console.error('Google sign-in failed:', submitError)
      const message =
        submitError?.response?.data?.detail ||
        submitError?.message ||
        submitError?.response?.data?.message ||
        'Google sign-in failed'
      setError(message)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleGoogleError = () => {
    console.error('Google sign-in popup failed or was closed by the user.')
    setError('Google sign-in failed or was cancelled.')
    setGoogleLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-md border border-gray-200 bg-white p-6">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            AI Interview Prep
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-500">
            Log in to continue your interview practice.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                const nextEmail = event.target.value

                setEmail(nextEmail)
                if (hasLoginEmptyErrors()) {
                  updateLoginEmptyErrorsIfVisible({ email: nextEmail, password })
                } else {
                  setError('')
                  setEmailError('')
                }
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
                  const nextPassword = event.target.value

                  setPassword(nextPassword)
                  if (hasLoginEmptyErrors()) {
                    updateLoginEmptyErrorsIfVisible({ email, password: nextPassword })
                  } else {
                    setError('')
                    setPasswordError('')
                  }
                }}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                placeholder="Your password"
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

          <label className="flex items-center gap-3 text-sm text-gray-500">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 bg-gray-50 text-blue-500 accent-blue-500"
            />
            Keep me signed in
          </label>

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
            {loading ? 'Signing in...' : 'Log in'}
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
            onError={handleGoogleError}
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
          New here?{' '}
          <Link className="font-semibold text-blue-600 hover:text-blue-700" to="/signup">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}



