import React, { useState, useEffect, useRef } from 'react'
import { User, ActiveTab } from '@/types'
import { Home, Calendar, BookOpen, Settings, Users, LogOut, Briefcase, Menu, X } from 'lucide-react'

interface NavigationProps {
  currentUser: User
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  onLogout: () => void
}

const Navigation: React.FC<NavigationProps> = ({ currentUser, activeTab, setActiveTab, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const navButtonClasses = 'flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200'
  const activeClasses = {
    dashboard: 'bg-blue-50 text-blue-600 font-semibold',
    booking: 'bg-blue-50 text-blue-600 font-semibold',
    program: 'bg-purple-50 text-purple-600 font-semibold',
    admin: 'bg-green-50 text-green-600 font-semibold',
    userManagement: 'bg-yellow-50 text-yellow-700 font-semibold',
    facilities: 'bg-indigo-50 text-indigo-600 font-semibold',
  } as const
  const inactiveClasses = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:-translate-y-px'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FlexSpace Pro</span>
          </div>

          <nav className="hidden md:flex space-x-2">
            <button onClick={() => handleTabChange('dashboard')} className={`${navButtonClasses} ${activeTab === 'dashboard' ? activeClasses.dashboard : inactiveClasses}`}>
              <Home className="w-4 h-4" />
              <span>대시보드 / Dashboard</span>
            </button>
            <button onClick={() => handleTabChange('booking')} className={`${navButtonClasses} ${activeTab === 'booking' ? activeClasses.booking : inactiveClasses}`}>
              <Calendar className="w-4 h-4" />
              <span>체육관 대관 / Booking</span>
            </button>
            <button onClick={() => handleTabChange('program')} className={`${navButtonClasses} ${activeTab === 'program' ? activeClasses.program : inactiveClasses}`}>
              <BookOpen className="w-4 h-4" />
              <span>프로그램 / Program</span>
            </button>

            {currentUser.role === 'admin' && (
              <>
                <button onClick={() => handleTabChange('admin')} className={`${navButtonClasses} ${activeTab === 'admin' ? activeClasses.admin : inactiveClasses}`}>
                  <Settings className="w-4 h-4" />
                  <span>운영 관리 / Operations</span>
                </button>
                <button onClick={() => handleTabChange('facilities')} className={`${navButtonClasses} ${activeTab === 'facilities' ? activeClasses.facilities : inactiveClasses}`}>
                  <Briefcase className="w-4 h-4" />
                  <span>시설 관리 / Facilities</span>
                </button>
                <button onClick={() => handleTabChange('userManagement')} className={`${navButtonClasses} ${activeTab === 'userManagement' ? activeClasses.userManagement : inactiveClasses}`}>
                  <Users className="w-4 h-4" />
                  <span>회원 관리 / Users</span>
                </button>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="text-sm text-gray-600 font-medium hidden sm:block">
              {currentUser.name} ({currentUser.role === 'admin' ? '관리자' : '사용자'})
            </span>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 origin-top-right animate-on-load z-50" style={{ animationName: 'fadeInUp', animationDuration: '0.2s' }}>
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  <p className="font-semibold">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                </div>
                <div className="py-1">
                  <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" role="menuitem">
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃 / Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-2 space-y-1">
            <button onClick={() => handleTabChange('dashboard')} className={`w-full text-left ${navButtonClasses} ${activeTab === 'dashboard' ? activeClasses.dashboard : inactiveClasses}`}>
              <Home className="w-4 h-4" />
              <span>대시보드 / Dashboard</span>
            </button>
            <button onClick={() => handleTabChange('booking')} className={`w-full text-left ${navButtonClasses} ${activeTab === 'booking' ? activeClasses.booking : inactiveClasses}`}>
              <Calendar className="w-4 h-4" />
              <span>체육관 대관 / Booking</span>
            </button>
            <button onClick={() => handleTabChange('program')} className={`w-full text-left ${navButtonClasses} ${activeTab === 'program' ? activeClasses.program : inactiveClasses}`}>
              <BookOpen className="w-4 h-4" />
              <span>프로그램 / Program</span>
            </button>

            {currentUser.role === 'admin' && (
              <>
                <button onClick={() => handleTabChange('admin')} className={`w-full text-left ${navButtonClasses} ${activeTab === 'admin' ? activeClasses.admin : inactiveClasses}`}>
                  <Settings className="w-4 h-4" />
                  <span>운영 관리 / Operations</span>
                </button>
                <button onClick={() => handleTabChange('facilities')} className={`w-full text-left ${navButtonClasses} ${activeTab === 'facilities' ? activeClasses.facilities : inactiveClasses}`}>
                  <Briefcase className="w-4 h-4" />
                  <span>시설 관리 / Facilities</span>
                </button>
                <button onClick={() => handleTabChange('userManagement')} className={`w-full text-left ${navButtonClasses} ${activeTab === 'userManagement' ? activeClasses.userManagement : inactiveClasses}`}>
                  <Users className="w-4 h-4" />
                  <span>회원 관리 / Users</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Navigation

