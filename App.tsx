import { useState, useEffect, lazy, Suspense } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useFirestore } from '@/hooks/use-firestore'
import { User, ActiveTab } from '@/types'
import { getFirebaseErrorMessage } from '@/utils'
const LoginForm = lazy(() => import('@/components/LoginForm'))
const Navigation = lazy(() => import('@/components/Navigation'))
import Dashboard from '@/components/Dashboard'
const BookingSection = lazy(() => import('@/components/BookingSection'))
const ProgramSection = lazy(() => import('@/components/ProgramSection'))
const AdminSection = lazy(() => import('@/components/AdminSection'))
const UserManagement = lazy(() => import('@/components/UserManagement'))
const FacilityManagement = lazy(() => import('@/components/FacilityManagement'))
import { NotificationContainer } from './components/Notification'

export default function Home() {
  const { user: currentUser, login, logout, signup, adminLogin, googleLogin, loading: authLoading } = useAuth()
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
    facilities,
  } = useFirestore()

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')

  useEffect(() => {
    if (currentUser && !loading) {
      setActiveTab('dashboard')
    }
  }, [currentUser, loading])

  const handleLogin = async (email: string, password: string): Promise<[boolean, string | null]> => {
    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('이메일과 비밀번호를 입력해주세요.')
      }
      await login(email, password)
      return [true, null]
    } catch (error) {
      console.error('Login failed:', error)
      return [false, getFirebaseErrorMessage(error)]
    }
  }

  const handleAdminLogin = async (email: string, password: string): Promise<[boolean, string | null]> => {
    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('이메일과 비밀번호를 입력해주세요.')
      }
      await adminLogin(email, password)
      return [true, null]
    } catch (error) {
      console.error('Admin login failed:', error)
      return [false, getFirebaseErrorMessage(error)]
    }
  }

  const handleSignup = async (userData: Omit<User, 'id' | 'role'> & { password?: string }): Promise<[boolean, string | null]> => {
    try {
      const { name, email, password } = userData
      if (!name?.trim()) {
        throw new Error('이름을 입력해주세요.')
      }
      if (!email?.trim()) {
        throw new Error('이메일을 입력해주세요.')
      }
      if (!password?.trim()) {
        throw new Error('비밀번호를 입력해주세요.')
      }
      await signup(userData)
      return [true, '회원가입이 완료되었습니다. 이메일 인증을 확인해주세요.']
    } catch (error) {
      console.error('Signup failed:', error)
      return [false, getFirebaseErrorMessage(error)]
    }
  }

  const handleGoogleLogin = async (): Promise<[boolean, string | null]> => {
    try {
      await googleLogin()
      return [true, null]
    } catch (error) {
      console.error('Google login failed:', error)
      return [false, getFirebaseErrorMessage(error)]
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
            currentUser={currentUser}
            bookings={bookings}
            setBookings={setBookings}
            applications={applications}
            setApplications={setApplications}
            programs={programs}
            setPrograms={setPrograms}
            users={users}
            facilities={facilities}
          />
        )
      case 'userManagement':
        return <UserManagement users={users} setUsers={setUsers} />
      case 'facilities':
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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <NotificationContainer />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>}>
        {!currentUser ? (
          <LoginForm onLogin={handleLogin} onSignup={handleSignup} onAdminLogin={handleAdminLogin} onGoogleLogin={handleGoogleLogin} />
        ) : (
          <div className="min-h-screen bg-gray-50">
            <Navigation currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
            <main>
              {renderContent()}
            </main>
          </div>
        )}
      </Suspense>
    </>
  )
}