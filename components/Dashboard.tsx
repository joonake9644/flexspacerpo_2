import React, { useMemo, useState, lazy, Suspense } from 'react'
import { User, Booking, ProgramApplication, Program, ActiveTab } from '../types'
import { Calendar as CalendarIcon, Users, BookOpen, UserCheck } from 'lucide-react'
const DashboardCalendar = lazy(() => import('./DashboardCalendar'))

interface DashboardProps {
  currentUser: User
  bookings: Booking[]
  applications: ProgramApplication[]
  programs: Program[]
  setActiveTab: (tab: ActiveTab) => void
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

const StatusBadge: React.FC<{ status: 'approved' | 'pending' | 'rejected' | 'completed' }> = ({ status }) => {
  const statusMap = {
    approved: { text: '승인됨 / Approved', color: 'bg-green-100 text-green-800' },
    pending: { text: '대기중 / Pending', color: 'bg-orange-100 text-orange-800' },
    rejected: { text: '거절됨 / Rejected', color: 'bg-red-100 text-red-800' },
    completed: { text: '종료 / Ended', color: 'bg-gray-100 text-gray-800' },
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

const Dashboard: React.FC<DashboardProps> = ({ currentUser, bookings, applications, programs, setActiveTab }) => {
  const myBookings = useMemo(() => bookings.filter(b => b.userId === currentUser.id).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()), [bookings, currentUser.id])
  const myApplications = useMemo(() => applications.filter(a => a.userId === currentUser.id).sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()), [applications, currentUser.id])
  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pending'), [bookings])
  const pendingApplications = useMemo(() => applications.filter(a => a.status === 'pending'), [applications])
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month')

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {currentUser.role === 'admin' ? '관리자 대시보드 / Admin Dashboard' : '마이 대시보드 / My Dashboard'}
        </h1>
        <p className="text-gray-600">
          {currentUser.role === 'admin' ? '체육관 운영 현황을 한눈에 확인하세요 / Check gym operational status at a glance' : '나의 예약과 프로그램 신청 현황입니다 / View your booking and program application status'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {currentUser.role === 'admin' ? (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 mb-1">대기중인 대관 / Pending Bookings</p>
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center"><CalendarIcon className="w-6 h-6 text-orange-600" /></div>
              </div>
              <p className="text-3xl font-bold text-orange-600">{pendingBookings.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 mb-1">대기중인 프로그램 신청 / Pending Applications</p>
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center"><UserCheck className="w-6 h-6 text-purple-600" /></div>
              </div>
              <p className="text-3xl font-bold text-purple-600">{pendingApplications.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 mb-1">운영중인 프로그램 / Active Programs</p>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center"><BookOpen className="w-6 h-6 text-green-600" /></div>
              </div>
              <p className="text-3xl font-bold text-green-600">{programs.length}</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-3">최근 대관 / Recent Bookings</h3>
          <div className="space-y-3">
            {(currentUser.role === 'admin' ? bookings.slice(0, 5) : myBookings.slice(0, 5)).map(booking => (
              <div key={booking.id} className="p-3 bg-gray-50 rounded-xl transition-colors duration-200 hover:bg-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{booking.purpose}</p>
                    <p className="text-sm text-gray-600">{booking.organization ? `${booking.organization} | ` : ''}{formatBookingDate(booking)} {booking.startTime}-{booking.endTime}</p>
                    {currentUser.role === 'admin' && <p className="text-sm text-gray-500">신청자 / Applicant: {booking.userName}</p>}
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              </div>
            ))}
            {currentUser.role !== 'admin' && myBookings.length === 0 && (
              <p className="text-center text-gray-500 py-6">대관 신청 내역이 없습니다. / No booking history.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">{currentUser.role === 'admin' ? '프로그램 신청 현황 / Program Applications' : '내 프로그램 / My Programs'}</h3>
            {currentUser.role === 'user' && myApplications.length > 5 && (
              <button onClick={() => setActiveTab('program')} className="text-sm font-medium text-purple-600 hover:underline">전체 보기 / View All</button>
            )}
          </div>
          <div className="space-y-3">
            {(currentUser.role === 'admin' ? applications.slice(0, 5) : myApplications.slice(0, 5)).map(app => {
              const program = programs.find(p => p.id === app.programId)
              const programStatus = program ? getProgramStatus(program) : null
              return (
                <div key={app.id} className="p-3 bg-gray-50 rounded-xl transition-colors duration-200 hover:bg-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <p className="font-medium text-gray-900">{app.programTitle}</p>
                        {programStatus && programStatus.dDay !== null && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">D-{programStatus.dDay}</span>
                        )}
                      </div>
                      {program && (
                        <div className="text-sm text-gray-600 mt-1 space-y-1">
                          <p>강사 / Instructor: {program.instructor} | 기간 / Period: {program.startDate} ~ {program.endDate}</p>
                          <p>일정 / Schedule: {formatProgramSchedule(program)} | 비용 / Fee: {program.fee ? `${program.fee.toLocaleString()}원` : '무료 / Free'}</p>
                          <p>정원 / Capacity: {program.enrolled ?? 0} / {program.capacity}</p>
                        </div>
                      )}
                      {currentUser.role === 'admin' && <p className="text-sm text-gray-500 mt-1">신청자 / Applicant: {app.userName} | 신청일 / Applied At: {app.appliedAt}</p>}
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                </div>
              )
            })}
            {currentUser.role !== 'admin' && myApplications.length === 0 && (
              <p className="text-center text-gray-500 py-6">프로그램 신청 내역이 없습니다. / No program application history.</p>
            )}
          </div>
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

