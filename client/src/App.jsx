import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import Footer from './components/Footer'
import Sidebar from './components/Sidebar'
import { AuthProvider, useAuth } from './context/AuthContext'
import CategorySelect from './pages/CategorySelect'
import InterviewSetup from './pages/InterviewSetup'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import Feedback from './pages/Feedback'
import History from './pages/History'
import Interview from './pages/Interview'
import LatestFeedback from './pages/LatestFeedback'
import Login from './pages/Login'
import Performance from './pages/Performance'
import PlaceholderPage from './pages/PlaceholderPage'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Signup from './pages/Signup'

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-slate-100">
      <Sidebar />
      <div className="ml-64 flex min-h-screen flex-col">
        <main className="flex-1 overflow-y-auto">{children}</main>
        <Footer />
      </div>
    </div>
  )
}

function RootRedirect() {
  const { token } = useAuth()
  return <Navigate to={token ? '/dashboard' : '/login'} replace />
}

function LoginRoute() {
  const { token } = useAuth()
  return token ? <Navigate to="/dashboard" replace /> : <Login />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
          <Route path="/categories" element={<Shell><CategorySelect /></Shell>} />
          <Route path="/setup" element={<Shell><InterviewSetup /></Shell>} />
          <Route path="/interview" element={<Shell><Interview /></Shell>} />
          <Route path="/feedback" element={<Shell><Feedback /></Shell>} />
          <Route path="/history" element={<Shell><History /></Shell>} />
          <Route path="/admin" element={<Shell><AdminDashboard /></Shell>} />
          <Route path="/profile" element={<Shell><Profile /></Shell>} />
          <Route path="/performance" element={<Shell><Performance /></Shell>} />
          <Route path="/feedback-overview" element={<Shell><LatestFeedback /></Shell>} />
          <Route path="/settings" element={<Shell><Settings /></Shell>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App



