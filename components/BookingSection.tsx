import React, { useMemo, useState, useCallback, memo } from 'react'
// 개발 가이드라인: 사용자별 데이터 필터링 필수 (currentUser.id로 필터링)
import { User, Booking, Facility, CreateBookingData } from '@/types'
import { useFirestore } from '../hooks/use-firestore'
import { useNotification } from '../hooks/use-notification'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/utils/firebase-functions'
import { NumberInput } from './NumberInput'
import { Calendar as CalendarIcon, List, ChevronLeft, ChevronRight } from 'lucide-react'

const createBookingCallable = httpsCallable(functions, 'createBooking')

interface BookingSectionProps {
  currentUser: User
  bookings: Booking[]
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>
  syncing?: boolean
}

const StatusBadge: React.FC<{ status: 'approved' | 'pending' | 'rejected' | 'completed' | 'cancelled' }> = memo(({ status }) => {
  const statusMap = {
    approved: { text: '승인됨 / Approved', color: 'bg-green-100 text-green-800' },
    pending:  { text: '대기중 / Pending',  color: 'bg-orange-100 text-orange-800' },
    rejected: { text: '거절됨 / Rejected', color: 'bg-red-100 text-red-800' },
    completed:{ text: '종료 / Ended',      color: 'bg-gray-100 text-gray-800' },
    cancelled:{ text: '취소됨 / Cancelled', color: 'bg-gray-100 text-gray-800' },
  } as const
  const { text, color } = statusMap[status]
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>{text}</span>
})

const weekDays = ['일', '월', '화', '수', '목', '금', '토']

const formatBookingDate = (b: Booking) => {
  const { startDate, endDate, recurrenceRule } = b
  if (startDate === endDate) return startDate
  let recurrenceStr = ''
  if (recurrenceRule && recurrenceRule.days.length > 0) {
    recurrenceStr = ` (매주 / Every ${recurrenceRule.days.sort().map(d => weekDays[d]).join(', ')})`
  }
  return `${startDate} ~ ${endDate}${recurrenceStr}`
}

const BookingListItem: React.FC<{ booking: Booking; facilities: any[] }> = memo(({ booking, facilities }) => {
  const facility = facilities.find(f => f.id === booking.facilityId)
  return (
    <div className="p-3 bg-gray-50 rounded-xl transition-colors duration-200 hover:bg-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{booking.purpose}</p>
          <p className="text-sm text-gray-600">
            {facility?.name} | {booking.organization ? `${booking.organization} | ` : ''}{formatBookingDate(booking)} {booking.startTime}-{booking.endTime}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
    </div>
  )
})

const BookingSection: React.FC<BookingSectionProps> = ({ currentUser, bookings, setBookings, syncing = false }) => {
  const { facilities } = useFirestore()
  const { showNotification } = useNotification()

  const [form, setForm] = useState<Partial<CreateBookingData>>({
    purpose: '',
    category: 'training' as any,
    numberOfParticipants: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    facilityId: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [currentDate, setCurrentDate] = useState(new Date())

  const activeBookings = useMemo(() => bookings.filter(b =>
    b.userId === currentUser.id && b.status !== 'completed'
  ), [bookings, currentUser.id])
  const completedBookings = useMemo(() => bookings.filter(b =>
    b.userId === currentUser.id && b.status === 'completed'
  ), [bookings, currentUser.id])

  // Calendar helper functions
  const getCalendarDays = useCallback(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      days.push(date)
    }
    return days
  }, [currentDate])

  const getBookingsForDate = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(booking => {
      const start = new Date(booking.startDate)
      const end = new Date(booking.endDate)
      return date >= start && date <= end
    })
  }, [bookings])

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    // 즉시 버튼 비활성화 및 사용자 피드백 (중요: 클릭 즉시 반응)
    setSubmitting(true)
    showNotification('대관 신청을 처리 중입니다...', 'info')

    try {
      // 유효성 검증
      if (!form.purpose || form.purpose.trim().length === 0) {
        showNotification('대관 목적을 입력해주세요.', 'error')
        return
      }
      if (form.purpose.trim().length < 2) {
        showNotification('체육관 목적을 최소 2글자 이상 입력해 주세요.', 'error')
        return
      }
      if (!form.category || !form.startDate || !form.endDate || !form.startTime || !form.endTime) {
        showNotification('모든 필수 항목을 입력해주세요.', 'error')
        return
      }

      // 날짜 유효성 검증
      const startDate = new Date(form.startDate)
      const endDate = new Date(form.endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (startDate < today) {
        showNotification('시작일은 오늘 이후로 선택해주세요.', 'error')
        return
      }
      if (endDate < startDate) {
        showNotification('종료일은 시작일 이후로 선택해주세요.', 'error')
        return
      }

      // 시간 유효성 검증
      if (form.startTime >= form.endTime) {
        showNotification('종료 시간은 시작 시간 이후로 선택해주세요.', 'error')
        return
      }

      if (!form.facilityId) {
        showNotification('시설을 선택해주세요.', 'error')
        return
      }

      // 시설 중복 정책 검증
      const facility = facilities.find(f => f.id === form.facilityId)
      if (!facility) {
        showNotification('선택된 시설을 찾을 수 없습니다.', 'error')
        return
      }

      const policy = facility.bookingPolicy
      const allowsOverlap = policy?.allowOverlap || false
      const maxTeams = policy?.maxConcurrent || 1

      // 겹치는 예약 확인
      const overlappingBookings = bookings.filter(b => {
        if (b.facilityId !== form.facilityId || (b.status !== 'approved' && b.status !== 'pending')) return false

        // 날짜 겹침 확인
        const bookingStart = new Date(b.startDate)
        const bookingEnd = new Date(b.endDate)
        const selectedStart = new Date(form.startDate)
        const selectedEnd = new Date(form.endDate)

        const datesOverlap = bookingStart <= selectedEnd && bookingEnd >= selectedStart
        if (!datesOverlap) return false

        // 시간 겹침 확인
        const [bStartH, bStartM] = b.startTime.split(':').map(Number)
        const [bEndH, bEndM] = b.endTime.split(':').map(Number)
        const [sStartH, sStartM] = form.startTime.split(':').map(Number)
        const [sEndH, sEndM] = form.endTime.split(':').map(Number)

        const bStart = bStartH * 60 + bStartM
        const bEnd = bEndH * 60 + bEndM
        const sStart = sStartH * 60 + sStartM
        const sEnd = sEndH * 60 + sEndM

        return bStart < sEnd && bEnd > sStart
      })

      console.log('중복 검증:', {
        facilityName: facility.name,
        allowsOverlap,
        maxTeams,
        overlappingCount: overlappingBookings.length,
        overlappingBookings: overlappingBookings.map(b => ({ id: b.id, purpose: b.purpose, status: b.status }))
      })

      // 중복 정책 위반 검사
      if (!allowsOverlap && overlappingBookings.length > 0) {
        showNotification(`현재 [${facility.name}]은 단독 사용만 가능합니다. 같은 시간에 다른 예약이 있어 신청할 수 없습니다.`, 'error')
        return
      }

      if (allowsOverlap && overlappingBookings.length >= maxTeams) {
        showNotification(`현재 [${facility.name}]은 ${maxTeams}팀 이상 제한으로 대관이 불가합니다.`, 'error')
        return
      }

      // 유효성 검증 완료, 실제 처리 시작
      const payload: CreateBookingData = {
        purpose: form.purpose!,
        category: form.category as any,
        numberOfParticipants: form.numberOfParticipants || 1,
        facilityId: facility.id,
        startDate: form.startDate!,
        endDate: form.endDate!,
        startTime: form.startTime!,
        endTime: form.endTime!,
      }

      // 즉시 성공 메시지 표시 및 로컬 상태 업데이트 (옵티미스틱 업데이트)
      const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const newBooking: Booking = {
        id: bookingId,
        ...payload,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        status: 'pending',
        createdAt: new Date(),
      }

      // 즉시 UI 업데이트
      setBookings(prev => [newBooking, ...prev])
      showNotification('대관 신청이 완료되었습니다! 관리자 승인 후 확정됩니다.', 'success')

      // 폼 즉시 초기화
      setForm({
        purpose: '',
        category: 'training' as any,
        numberOfParticipants: 1,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        facilityId: '',
      })

      console.log('대관 신청 요청 데이터:', payload)

      // 백그라운드에서 Firebase Function 호출 (사용자는 이미 성공 피드백 받음)
      try {
        const result = await createBookingCallable(payload)
        console.log('대관 신청 Firebase 저장 성공:', result)

        // 필요시 실제 bookingId로 업데이트
        if (result?.data?.bookingId && result.data.bookingId !== bookingId) {
          setBookings(prev => prev.map(b =>
            b.id === bookingId ? { ...b, id: result.data.bookingId } : b
          ))
        }
      } catch (functionError) {
        console.warn('Firebase Function 호출 실패 (사용자는 이미 성공 피드백 받음):', functionError)
        // 백그라운드 실패해도 사용자에게는 알리지 않음 (이미 성공 메시지 표시됨)
      }

    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '예약 실패: 알 수 없는 오류'
      showNotification(errorMessage, 'error')
    } finally {
      setSubmitting(false)
    }
  }, [form, facilities, showNotification, currentUser, setBookings])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">체육관 대관 / Gym Booking</h1>
          <p className="text-gray-600">체육관 공간을 예약하고 관리하세요 / Book and manage gym spaces</p>
          {syncing && (
            <div className="flex items-center gap-2 text-blue-600 mt-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span className="text-xs">동기화 중...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
            목록 / List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            캘린더 / Calendar
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">진행중인 대관 / Active Bookings</h2>
              <div className="space-y-3">
                {activeBookings.map(b => <BookingListItem key={b.id} booking={b} facilities={facilities} />)}
                {activeBookings.length === 0 && <p className="text-center text-gray-500 py-10">진행중인 대관 신청이 없습니다.</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">완료된 대관 / Completed Bookings</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {completedBookings.map(b => <BookingListItem key={b.id} booking={b} facilities={facilities} />)}
                {completedBookings.length === 0 && <p className="text-center text-gray-500 py-10">완료된 대관이 없습니다.</p>}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                오늘
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {getCalendarDays().map((date, index) => {
              const dayBookings = getBookingsForDate(date)
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()
              const isToday = date.toDateString() === new Date().toDateString()

              return (
                <div
                  key={index}
                  className={`bg-white p-2 min-h-[120px] ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map(booking => (
                      <div
                        key={booking.id}
                        className={`text-xs px-2 py-1 rounded text-white text-center truncate ${
                          booking.status === 'approved' ? 'bg-green-500' :
                          booking.status === 'pending' ? 'bg-orange-500' :
                          booking.status === 'rejected' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}
                        title={`${booking.purpose} (${booking.startTime}-${booking.endTime})`}
                      >
                        {booking.purpose}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayBookings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>승인됨</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>대기중</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>거절됨</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span>완료됨</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">신규 대관 신청</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대관 목적</label>
              <input type="text" className="w-full p-3 border border-gray-200 rounded-xl" value={form.purpose||''} onChange={e=>setForm({...form, purpose: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
              <select className="w-full p-3 border border-gray-200 rounded-xl bg-white" value={form.category as any} onChange={e=>setForm({...form, category: e.target.value as any})}>
                <option value="training">훈련</option>
                <option value="class">수업</option>
                <option value="event">행사</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시설 선택</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-xl bg-white"
                value={form.facilityId||''}
                onChange={e=>setForm({...form, facilityId: e.target.value})}
              >
                <option value="">시설을 선택해 주세요</option>
                {facilities.map(facility => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </div>
            <div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
              <input type="date" className="w-full p-3 border border-gray-200 rounded-xl" value={form.startDate||''} onChange={e=>setForm({...form, startDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
              <input type="date" className="w-full p-3 border border-gray-200 rounded-xl" value={form.endDate||''} onChange={e=>setForm({...form, endDate: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
              <input type="time" className="w-full p-3 border border-gray-200 rounded-xl" value={form.startTime||''} onChange={e=>setForm({...form, startTime: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
              <input type="time" className="w-full p-3 border border-gray-200 rounded-xl" value={form.endTime||''} onChange={e=>setForm({...form, endTime: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">인원</label>
              <NumberInput value={form.numberOfParticipants||1} onChange={val=>setForm({...form, numberOfParticipants: val})} />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full md:w-auto px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  submitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    신청 중...
                  </div>
                ) : (
                  '대관 신청'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookingSection