import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const TOKEN_KEY = 'ai_interview_prep_token'
const USER_KEY = 'ai_interview_prep_user'

function readStoredAuth() {
  const savedToken =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  const savedUser =
    localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)

  if (!savedUser) {
    return { savedToken, savedUser: null }
  }

  try {
    return { savedToken, savedUser: JSON.parse(savedUser) }
  } catch {
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(USER_KEY)
    return { savedToken, savedUser: null }
  }
}

export function AuthProvider({ children }) {
  const [storedAuth] = useState(() => readStoredAuth())
  const [token, setToken] = useState(storedAuth.savedToken)
  const [user, setUser] = useState(storedAuth.savedUser)

  useEffect(() => {
    const nextStoredAuth = readStoredAuth()
    setToken(nextStoredAuth.savedToken)
    setUser(nextStoredAuth.savedUser)
  }, [])

  const login = (nextToken, nextUser, rememberMe = true) => {
    setToken(nextToken)
    setUser(nextUser)

    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, nextToken)
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
      return
    }

    sessionStorage.setItem(TOKEN_KEY, nextToken)
    sessionStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
