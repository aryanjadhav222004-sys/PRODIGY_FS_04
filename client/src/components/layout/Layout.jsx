import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { selectSidebarOpen, selectMobileSidebarOpen, setSidebarOpen, setMobileSidebarOpen, selectMobileView } from '../store/slices/uiSlice'

export default function Layout() {
  const dispatch = useDispatch()
  const sidebarOpen = useSelector(selectSidebarOpen)
  const mobileSidebarOpen = useSelector(selectMobileSidebarOpen)
  const mobileView = useSelector(selectMobileView)

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024
      dispatch(setMobileView(isMobile))
      if (isMobile) {
        dispatch(setSidebarOpen(false))
        dispatch(setMobileSidebarOpen(false))
      } else {
        dispatch(setSidebarOpen(true))
        dispatch(setMobileSidebarOpen(false))
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [dispatch])

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 flex">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => dispatch(setMobileSidebarOpen(false))}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-96 transform transition-transform duration-300 ease-in-out bg-white dark:bg-dark-900 border-r border-dark-200 dark:border-dark-700 flex flex-col ${
          mobileView
            ? mobileSidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full'
            : 'translate-x-0'
        }`}
        aria-label="Chat rooms sidebar"
      >
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Header />
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  )
}