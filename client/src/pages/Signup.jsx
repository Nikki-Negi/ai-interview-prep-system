import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

import { registerUser } from '../api/auth'
import { useAuth } from '../context/AuthContext'

const EMAIL_PATTERN =
  /^[a-z0-9](?:[a-z0-9._+-]*[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
const PASSWORD_SPECIAL_CHARACTER_PATTERN = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/
const PASSWORD_REQUIREMENTS_HELPER =
  '8+ characters, not mostly spaces, 1 uppercase, 1 number, 1 special character'
const SIGNUP_EMPTY_FIELD_ERRORS = {
  name: 'Please enter your name',
  email: 'Please enter email address',
  password: 'Please enter password',
  confirmPassword: 'Please confirm your password',
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

function formatPasswordRequirements(requirements) {
  if (requirements.length === 1) {
    return requirements[0]
  }

  if (requirements.length === 2) {
    return `${requirements[0]} and ${requirements[1]}`
  }

  return `${requirements.slice(0, -1).join(', ')}, and ${requirements.at(-1)}`
}

function getMissingPasswordRequirements(value) {
  const trimmedPassword = value.trim()
  const nonWhitespacePassword = trimmedPassword.replace(/\s/g, '')
  const missingRequirements = []

  if (trimmedPassword.length < 8) {
    missingRequirements.push('be at least 8 characters')
  }

  if (nonWhitespacePassword.length < 8) {
    missingRequirements.push('not consist mainly of spaces')
  }

  if (!/[0-9]/.test(trimmedPassword)) {
    missingRequirements.push('include at least one number')
  }

  if (!PASSWORD_SPECIAL_CHARACTER_PATTERN.test(trimmedPassword)) {
    missingRequirements.push('include at least one special character')
  }

  if (!/[A-Z]/.test(trimmedPassword)) {
    missingRequirements.push('include at least one uppercase letter')
  }

  return missingRequirements
}

function getPasswordValidationError(value, email = '') {
  const missingRequirements = getMissingPasswordRequirements(value)
  const normalizedPassword = value.trim().toLowerCase()
  const normalizedEmail = email.trim().toLowerCase()

  if (normalizedEmail && normalizedPassword === normalizedEmail) {
    return 'Password must not be the same as email.'
  }

  if (!missingRequirements.length) {
    return ''
  }

  return `Password must ${formatPasswordRequirements(missingRequirements)}.`
}

function getNameValidationError(value, email = '') {
  if (email.trim() && value.trim().toLowerCase() === email.trim().toLowerCase()) {
    return 'Name must not be the same as email.'
  }

  if (!/^[A-Za-z\s]+$/.test(value)) {
    return 'Name must contain only letters'
  }

  return ''
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

  const setSignupEmptyErrors = (nextValues) => {
    const emptyFields = {
      name: !nextValues.name.trim(),
      email: !nextValues.email.trim(),
      password: !nextValues.password.trim(),
      confirmPassword: !nextValues.confirmPassword.trim(),
    }
    const emptyCount = Object.values(emptyFields).filter(Boolean).length

    if (!emptyCount) {
      setError('')
      setNameError('')
      setEmailError('')
      setPasswordError('')
      setConfirmPasswordError('')
      return false
    }

    if (emptyCount === Object.keys(emptyFields).length) {
      setError('Please fill all the fields')
      setNameError('')
      setEmailError('')
      setPasswordError('')
      setConfirmPasswordError('')
      return true
    }

    setError('')
    setNameError(emptyFields.name ? SIGNUP_EMPTY_FIELD_ERRORS.name : '')
    setEmailError(emptyFields.email ? SIGNUP_EMPTY_FIELD_ERRORS.email : '')
    setPasswordError(emptyFields.password ? SIGNUP_EMPTY_FIELD_ERRORS.password : '')
    setConfirmPasswordError(
      emptyFields.confirmPassword ? SIGNUP_EMPTY_FIELD_ERRORS.confirmPassword : '',
    )
    return true
  }

  const hasSignupEmptyErrors = () =>
    error === 'Please fill all the fields' ||
    nameError === SIGNUP_EMPTY_FIELD_ERRORS.name ||
    emailError === SIGNUP_EMPTY_FIELD_ERRORS.email ||
    passwordError === SIGNUP_EMPTY_FIELD_ERRORS.password ||
    confirmPasswordError === SIGNUP_EMPTY_FIELD_ERRORS.confirmPassword

  const updateSignupEmptyErrorsIfVisible = (nextValues) => {
    if (hasSignupEmptyErrors()) {
      setSignupEmptyErrors(nextValues)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    let hasValidationError = false

    if (setSignupEmptyErrors({ name, email, password, confirmPassword })) {
      return
    }

    const nextNameError = getNameValidationError(name, email)
    if (nextNameError) {
      setNameError(nextNameError)
      hasValidationError = true
    }

    const nextEmailError = getEmailValidationError(email)
    if (nextEmailError) {
      setEmailError(nextEmailError)
      hasValidationError = true
    }

    const nextPasswordError = getPasswordValidationError(password, email)
    if (nextPasswordError) {
      setPasswordError(nextPasswordError)
      hasValidationError = true
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match')
      hasValidationError = true
    }

    if (hasValidationError) {
      setError('')
      return
    }

    setLoading(true)
    setError('')
    const normalizedEmail = email.toLowerCase()

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
                const nextName = event.target.value

                setName(nextName)
                if (hasSignupEmptyErrors()) {
                  updateSignupEmptyErrorsIfVisible({
                    name: nextName,
                    email,
                    password,
                    confirmPassword,
                  })
                } else {
                  setError('')
                  setNameError('')
                }
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
                const nextEmail = event.target.value

                setEmail(nextEmail)
                if (hasSignupEmptyErrors()) {
                  updateSignupEmptyErrorsIfVisible({
                    name,
                    email: nextEmail,
                    password,
                    confirmPassword,
                  })
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
                  if (hasSignupEmptyErrors()) {
                    updateSignupEmptyErrorsIfVisible({
                      name,
                      email,
                      password: nextPassword,
                      confirmPassword,
                    })
                  } else {
                    setError('')
                    setPasswordError('')
                    setConfirmPasswordError('')
                  }
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
            <p className="mt-2 text-xs text-gray-500">{PASSWORD_REQUIREMENTS_HELPER}</p>
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
                  const nextConfirmPassword = event.target.value

                  setConfirmPassword(nextConfirmPassword)
                  if (hasSignupEmptyErrors()) {
                    updateSignupEmptyErrorsIfVisible({
                      name,
                      email,
                      password,
                      confirmPassword: nextConfirmPassword,
                    })
                  } else {
                    setError('')
                    setConfirmPasswordError('')
                  }
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



