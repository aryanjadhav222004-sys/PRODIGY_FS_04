import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { selectSidebarOpen, selectMobileSidebarOpen, selectMobileView, selectModals, closeModal } from '../../store/slices/uiSlice'
import Header from './Header'
import Sidebar from './Sidebar'
import CreateRoomModal from '../chat/CreateRoomModal'
import { clsx } from 'clsx'

export default function ChatLayout() {
  const dispatch = useDispatch()
  const sidebarOpen = useSelector(selectSidebarOpen)
  const mobileSidebarOpen = useSelector(selectMobileSidebarOpen)
  const mobileView = useSelector(selectMobileView)
  const showCreateRoomModal = useSelector(state => state.ui.modals.createRoom)
  const [showSidebar, setShowSidebar] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024
      dispatch({ type: 'ui/setMobileView', payload: isMobile })
      if (isMobile) {
        setShowSidebar(false)
      } else {
        setShowSidebar(true)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [dispatch])

  // Close mobile sidebar on route change
  useEffect(() => {
    if (mobileSidebarOpen) {
      dispatch({ type: 'ui/setMobileSidebarOpen', payload: false })
    }
  }, [dispatch, mobileSidebarOpen])

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 flex">
      {/* Mobile sidebar overlay */}
      {mobileView && mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => dispatch({ type: 'ui/setMobileSidebarOpen', payload: false })}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:relative z-40 bg-white dark:bg-dark-900 border-r border-dark-200 dark:border-dark-700 transition-all duration-300 flex flex-col',
          mobileView
            ? 'w-80 transform lg:translate-x-0'
              + (mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full')
            : sidebarOpen
              ? 'w-80'
              : 'w-20'
        )}
        aria-label="Conversations"
      >
        <Sidebar 
          collapsed={!mobileView && !sidebarOpen}
          onToggle={() => dispatch({ type: 'ui/toggleSidebar' })}
        />
      </aside>

      {/* Main content */}
      <main className={clsx(
        'flex-1 flex flex-col min-w-0',
        mobileView ? 'lg:ml-0' : sidebarOpen ? 'lg:ml-80' : 'lg:ml-20'
      )}>
        <Header />
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>

      {/* Create Room Modal */}
      <CreateRoomModal 
        isOpen={showCreateRoomModal}
        onClose={() => dispatch({ type: 'ui/closeModal', payload: 'createRoom' })}
      />
    </div>
  )
}