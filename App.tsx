import { useState, useEffect, lazy, Suspense } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useFirestore } from '@/hooks/use-firestore'
import { User, Booking, Program, ProgramApplication, ActiveTab } from '@/types'
const LoginForm = lazy(() => import('@/components/LoginForm'))
const Navigation = lazy(() => import('@/components/Navigation'))
const Dashboard = lazy(() => import('@/components/Dashboard'))
const BookingSection = lazy(() => import('@/components/BookingSection'))
const ProgramSection = lazy(() => import('@/components/ProgramSection'))
const AdminSection = lazy(() => import('@/components/AdminSection'))
const UserManagement = lazy(() => import('@/components/UserManagement'))
const FacilityManagement = lazy(() => import('@/components/FacilityManagement'))
import { NotificationContainer } from './components/Notification'

export default function Home() {
  const { user: currentUser, login, logout, signup, adminLogin } = useAuth()
  const {
    loading,
    bookings,
    setBookings,
    programs,
    setPrograms,
    applications,
    setApplications,
    users,
    setUsers,
  } = useFirestore()

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')

  // 로그인 완료 시 기본 탭 초기화
  useEffect(() => {
    if (currentUser && !loading) {
      setActiveTab('dashboard')
    }
  }, [currentUser, loading])

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      await login(email, password)
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const handleAdminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      await adminLogin(email, password)
      return true
    } catch (error) {
      console.error('Admin login failed:', error)
      return false
    }
  }

  const handleSignup = async (userData: Omit<User, 'id' | 'role'> & { password?: string }): Promise<boolean> => {
    try {
      await signup(userData)
      return true
    } catch (error) {
      console.error('Signup failed:', error)
      return false
    }
  }

  const handleLogout = async () => {
    await logout()
    setActiveTab('dashboard')
  }

  const renderContent = () => {
    if (!currentUser) return null

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            currentUser={currentUser}
            bookings={bookings}
            applications={applications}
            programs={programs}
            setActiveTab={setActiveTab}
          />
        )
      case 'booking':
        return (
          <BookingSection
            currentUser={currentUser}
            bookings={bookings}
            setBookings={setBookings}
          />
        )
      case 'program':
        return (
          <ProgramSection
            currentUser={currentUser}
            programs={programs}
            setPrograms={setPrograms}
            applications={applications}
            setApplications={setApplications}
          />
        )
      case 'admin':
        return (
          <AdminSection
            bookings={bookings}
            setBookings={setBookings}
            applications={applications}
            setApplications={setApplications}
            programs={programs}
            setPrograms={setPrograms}
            users={users}
          />
        )
      case 'userManagement':
        return <UserManagement users={users} setUsers={setUsers} />
      case 'facilities': // 시설 관리 탭
        return <FacilityManagement />
      default:
        return (
          <Dashboard
            currentUser={currentUser}
            bookings={bookings}
            applications={applications}
            programs={programs}
            setActiveTab={setActiveTab}
          />
        )
    }
  }

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 로그인하지 않은 경우
  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} onSignup={handleSignup} onAdminLogin={handleAdminLogin} />
  }

  // 로그인한 경우
  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationContainer />
      <Suspense fallback={<div className="p-4">로딩 중...</div>}>
        <Navigation currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
        <main>
          <Suspense fallback={<div className="p-6">콘텐츠 로딩 중...</div>}>
            {renderContent()}
          </Suspense>
        </main>
      </Suspense>
    </div>
  )
}
