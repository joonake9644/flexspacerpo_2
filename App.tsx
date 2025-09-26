import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useFirestore } from '@/hooks/use-firestore'
import { User, ActiveTab } from '@/types'
import { getFirebaseErrorMessage } from '@/utils'

// Direct imports - no lazy loading for maximum stability
import LoginForm from '@/components/LoginForm'
import Navigation from '@/components/Navigation'
import Dashboard from '@/components/Dashboard'
import BookingSection from '@/components/BookingSection'
import ProgramSection from '@/components/ProgramSection'
import AdminSection from '@/components/AdminSection'
import UserManagement from '@/components/UserManagement'
import FacilityManagement from '@/components/FacilityManagement'
import { NotificationContainer } from './components/Notification'

export default function Home() {
  const { user: currentUser, login, logout, signup, adminLogin, googleLogin, loading: authLoading } = useAuth()
  const {
    loading,
    syncing,
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

    try {
      switch (activeTab) {
        case 'dashboard':
          return (
            <Dashboard
              currentUser={currentUser}
              bookings={bookings}
              applications={applications}
              programs={programs}
              setActiveTab={setActiveTab}
              syncing={syncing}
            />
          )
        case 'booking':
          return (
            <BookingSection
              currentUser={currentUser}
              bookings={bookings}
              setBookings={setBookings}
              syncing={syncing}
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
              syncing={syncing}
            />
          )
      }
    } catch (error) {
      console.error('Component rendering error:', error)
      return (
        <div className="min-h-96 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">화면을 불러오는 중 오류가 발생했습니다</h2>
            <p className="text-gray-600 mb-4">다른 메뉴를 선택하거나 페이지를 새로고침해주세요.</p>
            <div className="space-x-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                대시보드로 이동
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
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
      {!currentUser ? (
        <LoginForm
          onLogin={handleLogin}
          onSignup={handleSignup}
          onAdminLogin={handleAdminLogin}
          onGoogleLogin={handleGoogleLogin}
        />
      ) : (
        <div className="min-h-screen bg-gray-50">
          <Navigation
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
          />
          <main>
            {renderContent()}
          </main>
        </div>
      )}
    </>
  )
}