import React, { useMemo, useState, lazy, Suspense } from 'react'
// 개발 가이드라인: 사용자별 데이터 필터링과 Firebase Timestamp 안전 처리 적용
import { User, Booking, ProgramApplication, Program, ActiveTab } from '../types'
import { Calendar as CalendarIcon, Users, BookOpen, UserCheck } from 'lucide-react'
import { useFirestore } from '@/hooks/use-firestore'
const DashboardCalendar = lazy(() => import('./DashboardCalendar'))

interface DashboardProps {
  currentUser: User
  bookings: Booking[]
  applications: ProgramApplication[]
  programs: Program[]
  setActiveTab: (tab: ActiveTab) => void
  syncing?: boolean
}

const getProgramStatus = (program: Program) => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(program.startDate); start.setHours(0, 0, 0, 0)
  const end = new Date(program.endDate); end.setHours(0, 0, 0, 0)
  if (today > end) return { text: '종료', dDay: null as number | null }
  if (today >= start && today <= end) return { text: '진행중', dDay: null as number | null }
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return { text: '모집중', dDay: diff }
}

const StatusBadge: React.FC<{ status: 'approved' | 'pending' | 'rejected' | 'completed' | 'cancelled' }> = ({ status }) => {
  const statusMap = {
    approved: { text: '승인됨 / Approved', color: 'bg-green-100 text-green-800' },
    pending: { text: '대기중 / Pending', color: 'bg-orange-100 text-orange-800' },
    rejected: { text: '거절됨 / Rejected', color: 'bg-red-100 text-red-800' },
    completed: { text: '종료 / Ended', color: 'bg-gray-100 text-gray-800' },
    cancelled: { text: '취소됨 / Cancelled', color: 'bg-gray-100 text-gray-800' },
  } as const
  const { text, color } = statusMap[status]
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>{text}</span>
}

const weekDays = ['일', '월', '화', '수', '목', '금', '토']

const formatBookingDate = (booking: Booking) => {
  const { startDate, endDate, recurrenceRule } = booking
  if (startDate === endDate) return startDate
  let recurrenceStr = ''
  if (recurrenceRule && recurrenceRule.days.length > 0) {
    recurrenceStr = ` (매주 / Every ${recurrenceRule.days.sort().map(d => weekDays[d]).join(', ')})`
  }
  return `${startDate} ~ ${endDate}${recurrenceStr}`
}

const formatProgramSchedule = (program: Program) => {
  const days = program.scheduleDays.sort().map(d => weekDays[d]).join(',')
  return `${days} ${program.startTime}-${program.endTime}`
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, bookings = [], applications = [], programs = [], setActiveTab, syncing = false }) => {
  const { users } = useFirestore()

  // 🔥 자동 만료 처리: 진행중인 대관만 표시 (종료일이 지난 승인 대관 제외)
  const activeBookings = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    return bookings.filter(b => {
      // 완료/취소는 제외
      if (b.status === 'completed' || b.status === 'cancelled') return false

      // 승인된 대관 중 종료일이 지났으면 제외
      if (b.status === 'approved' && b.endDate < todayStr) return false

      return true
    })
  }, [bookings])

  const myBookings = useMemo(() => activeBookings.filter(b => b.userId === currentUser.id).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()), [activeBookings, currentUser.id])
  const myApplications = useMemo(() => applications.filter(a => a.userId === currentUser.id).sort((a, b) => {
    const aDate = a.appliedAt?.toDate ? a.appliedAt.toDate() : new Date(a.appliedAt || 0)
    const bDate = b.appliedAt?.toDate ? b.appliedAt.toDate() : new Date(b.appliedAt || 0)
    return bDate.getTime() - aDate.getTime()
  }), [applications, currentUser.id])
  const pendingBookings = useMemo(() => activeBookings.filter(b => b.status === 'pending'), [activeBookings])
  const pendingApplications = useMemo(() => applications.filter(a => a.status === 'pending'), [applications])
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month')

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentUser.role === 'admin' ? '관리자 대시보드 / Admin Dashboard' : '마이 대시보드 / My Dashboard'}
            </h1>
            <p className="text-gray-600">
              {currentUser.role === 'admin' ? '체육관 운영 현황을 한눈에 확인하세요 / Check gym operational status at a glance' : '나의 예약과 프로그램 신청 현황입니다 / View your booking and program application status'}
            </p>
          </div>
          {syncing && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">동기화 중...</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {currentUser.role === 'admin' ? (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">대기중인 대관 / Pending Bookings</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingBookings.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">대기중인 프로그램 신청 / Pending Applications</p>
                  <p className="text-3xl font-bold text-purple-600">{pendingApplications.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">운영중인 프로그램 / Active Programs</p>
                  <p className="text-3xl font-bold text-green-600">{programs.filter(p => {
                    const today = new Date()
                    const end = new Date(p.endDate)
                    return end >= today
                  }).length}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">총 이용자 수 / Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">나의 대관 / My Bookings</p>
              <p className="text-3xl font-bold text-blue-600">{myBookings.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">나의 프로그램 신청 / My Applications</p>
              <p className="text-3xl font-bold text-purple-600">{myApplications.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">운영중인 프로그램 / Active Programs</p>
              <p className="text-3xl font-bold text-green-600">{programs.length}</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 대관 신청 / Recent Bookings</h3>
          <div className="space-y-4">
            {(currentUser.role === 'admin' ? activeBookings.slice(0, 3) : myBookings.slice(0, 3)).map(booking => (
              <div key={booking.id} className="p-4 bg-gray-50 rounded-xl transition-colors duration-200 hover:bg-gray-100 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{booking.purpose}</h4>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {booking.organization && `${booking.organization} | `}
                        {formatBookingDate(booking)} {booking.startTime}-{booking.endTime}
                      </p>
                      {currentUser.role === 'admin' && (
                        <p className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          신청자: {booking.userName} ({booking.userEmail})
                        </p>
                      )}
                      <p className="flex items-center gap-2 text-gray-500">
                        <BookOpen className="w-4 h-4" />
                        {booking.category === 'class' ? '수업' : booking.category === 'event' ? '행사' : booking.category === 'personal' ? '개인' : '동아리'} | {booking.numberOfParticipants}명
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {((currentUser.role === 'admin' ? activeBookings : myBookings).length === 0) && (
              <p className="text-center text-gray-500 py-8">대관 신청 내역이 없습니다.</p>
            )}
          </div>
          {(currentUser.role === 'admin' ? activeBookings : myBookings).length > 3 && (
            <button onClick={() => setActiveTab('booking')} className="w-full mt-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
              전체 보기
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {currentUser.role === 'admin' ? '프로그램 신청 현황 / Program Applications' : '내 프로그램 / My Programs'}
          </h3>
          <div className="space-y-4">
            {(currentUser.role === 'admin' ? applications.slice(0, 3) : myApplications.slice(0, 3)).map(app => {
              const program = programs.find(p => p.id === app.programId)
              const programStatus = program ? getProgramStatus(program) : null
              return (
                <div key={app.id} className="p-4 bg-gray-50 rounded-xl transition-colors duration-200 hover:bg-gray-100 border-l-4 border-purple-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{program?.title || app.programTitle || 'Unknown Program'}</h4>
                        {programStatus && programStatus.dDay !== null && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">D-{programStatus.dDay}</span>
                        )}
                        <StatusBadge status={app.status} />
                      </div>
                      {program && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            강사: {program.instructor} | 기간: {program.startDate} ~ {program.endDate}
                          </p>
                          <p className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            일정: {formatProgramSchedule(program)}
                          </p>
                          <p className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            비용: {program.fee ? `${program.fee.toLocaleString()}원` : '무료'} | 정원: {program.enrolled ?? 0} / {program.capacity}명
                          </p>
                        </div>
                      )}
                      {currentUser.role === 'admin' && (
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          신청자: {app.userName} | 신청일: {(app.appliedAt?.toDate ? app.appliedAt.toDate() : new Date(app.appliedAt || 0)).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {((currentUser.role === 'admin' ? applications : myApplications).length === 0) && (
              <p className="text-center text-gray-500 py-8">프로그램 신청 내역이 없습니다.</p>
            )}
          </div>
          {(currentUser.role === 'admin' ? applications : myApplications).length > 3 && (
            <button onClick={() => setActiveTab('program')} className="w-full mt-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors">
              전체 보기
            </button>
          )}
        </div>
      </div>

      <div id="dashboard-calendar-section" className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">전체 일정 캘린더 / Full Schedule Calendar</h3>
        <Suspense fallback={<div className="text-gray-500">캘린더 로딩 중...</div>}>
          <DashboardCalendar
            bookings={currentUser.role === 'admin' ? bookings : myBookings}
            programs={programs}
            view={calendarView}
            setView={setCalendarView}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default Dashboard

