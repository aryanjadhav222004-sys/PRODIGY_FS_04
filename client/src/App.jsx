import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from './store/slices/authSlice'
import { useSocket } from './socket/socket'
import Layout from './components/layout/ChatLayout'
import Header from './components/layout/Header'

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const FriendsPage = lazy(() => import('./pages/FriendsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function PublicRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" /></div>}>{children}</Suspense>
}

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const { emit } = useSocket()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" /></div>}>{children}</Suspense>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } 
      />

      {/* Protected routes with layout */}
      <Route 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<ChatPage />} />
        <Route path="/rooms/:roomId" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/friends/:userId" element={<FriendsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <>
      <AppRoutes />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1e293b',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            borderRadius: '0.75rem',
            padding: '1rem',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  )
}