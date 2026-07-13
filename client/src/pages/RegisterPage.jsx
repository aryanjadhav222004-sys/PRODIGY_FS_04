import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { register } from '@/store/slices/authSlice'
import { selectAuthError, selectAuthLoading } from '@/store/slices/authSlice'
import { useSelector } from 'react-redux'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const error = useSelector(selectAuthError)
  const loading = useSelector(selectAuthLoading)
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!formData.username.trim()) newErrors.username = 'Username is required'
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters'
    else if (formData.username.length > 30) newErrors.username = 'Username must be at most 30 characters'
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) newErrors.username = 'Username can only contain letters, numbers, and underscores'
    
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format'
    
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) newErrors.password = 'Password must contain uppercase, lowercase, and number'
    
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    
    const { confirmPassword, ...data } = formData
    dispatch(register(data)).unwrap()
      .then(() => navigate('/'))
      .catch(() => {})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-dark-900 dark:text-dark-100">Prodigy Chat</span>
          </Link>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-dark-100">Create an account</h1>
          <p className="text-dark-500 dark:text-dark-400 mt-2">Start chatting with friends and communities</p>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-dark-200 dark:border-dark-700 p-8 shadow-sm">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="username" className="label">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={clsx('input pl-10', errors.username && 'input-error')}
                  placeholder="johndoe"
                  autoComplete="username"
                  disabled={loading}
                  maxLength={30}
                />
              </div>
              {errors.username && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="email" className="label">Email</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={clsx('input pl-10', errors.email && 'input-error')}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={clsx('input pl-10 pr-12', errors.password && 'input-error')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirm Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={clsx('input pl-10', errors.confirmPassword && 'input-error')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-600 dark:text-dark-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}