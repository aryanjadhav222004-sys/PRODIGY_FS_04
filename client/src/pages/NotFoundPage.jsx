import { Link } from 'react-router-dom'
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-950 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <span className="text-9xl font-bold text-primary-500/20 dark:text-primary-500/10">404</span>
        </div>
        <h1 className="text-3xl font-bold text-dark-900 dark:text-dark-100 mb-4">Page Not Found</h1>
        <p className="text-dark-500 dark:text-dark-400 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary">
            <HomeIcon className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          <Link to="/" className="btn-secondary">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Chat
          </Link>
        </div>
      </div>
    </div>
  )
}