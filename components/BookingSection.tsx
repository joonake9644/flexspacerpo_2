import React, { useMemo, useState, useCallback, memo } from 'react'
// 개발 가이드라인: 사용자별 데이터 필터링 필수 (currentUser.id로 필터링)
import { User, Booking, Facility, CreateBookingData, BookingStatus, BookingCategory } from '@/types'
import { useFirestore } from '../hooks/use-firestore'
import { useNotification } from '../hooks/use-notification'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'
import { NumberInput } from './NumberInput'
import { Calendar as CalendarIcon, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'

const createBookingCallable = httpsCallable(functions, 'createBooking')

// Firebase Function이 없을 때 사용하는 백업 저장 방법
const fallbackCreateBooking = async (payload: CreateBookingData & { userName?: string }, bookingId: string, currentUser: User) => {
  const bookingData = {
    userId: currentUser.id,
    userName: payload.userName || currentUser.name,
    userEmail: currentUser.email,
    purpose: payload.purpose,
    category: payload.category,
    numberOfParticipants: payload.numberOfParticipants,
    facilityId: payload.facilityId,
    startDate: payload.startDate,
    endDate: payload.endDate,
    startTime: payload.startTime,
    endTime: payload.endTime,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, 'bookings', bookingId), bookingData)
  return { bookingId }
}

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
const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

const formatBookingDate = (b: Booking) => {
  const { startDate, endDate, recurrenceRule } = b
  if (startDate === endDate) return startDate
  let recurrenceStr = ''
  if (recurrenceRule && recurrenceRule.days.length > 0) {
    recurrenceStr = ` (매주 / Every ${recurrenceRule.days.sort().map(d => weekDays[d]).join(', ')})`
  }
  return `${startDate} ~ ${endDate}${recurrenceStr}`
}

const BookingListItem: React.FC<{ booking: Booking; facilities: Facility[] }> = memo(({ booking, facilities }) => {
  const facility = facilities.find(f => f.id === booking.facilityId)
  return (
    <div className="p-3 bg-gray-50 rounded-xl transition-colors duration-200 hover:bg-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{booking.purpose}</p>
          <p className="text-sm text-gray-600">
            {booking.userName || '사용자'} | {facility?.name} | {booking.organization ? `${booking.organization} | ` : ''}{formatBookingDate(booking)} {booking.startTime}-{booking.endTime}
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

  const [form, setForm] = useState<Partial<CreateBookingData & { recurrenceRule?: { days: number[] }; userName?: string }>>({
    purpose: '',
    category: 'personal' as any,
    numberOfParticipants: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    facilityId: '',
    recurrenceRule: { days: [] },
    userName: currentUser.name || '', // 기본값으로 현재 사용자 이름 설정
  })
  const [submitting, setSubmitting] = useState(false)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [currentDate, setCurrentDate] = useState(new Date())

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<BookingCategory | 'all'>('all')
  const [facilityFilter, setFacilityFilter] = useState<string>('all')

  // AdminSection과 동일한 다중일 감지 로직
  const isMultiDay = useMemo(() => form.startDate !== form.endDate, [form.startDate, form.endDate])

  const activeBookings = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // 안전한 사용자 ID 비교 (userId 또는 userEmail로 매칭)
    const userFiltered = bookings.filter(b => {
      const userIdMatch = b.userId === currentUser.id ||
                         b.userEmail === currentUser.email
      if (!userIdMatch) return false

      // 완료/취소는 제외
      if (b.status === 'completed' || b.status === 'cancelled') return false

      // 🔥 자동 만료 처리: 승인된 대관 중 종료일이 지났으면 진행중에서 제외
      if (b.status === 'approved' && b.endDate < todayStr) {
        return false
      }

      return true
    })

    // 검색 및 필터 적용
    return userFiltered.filter(b => {
      // 텍스트 검색 (대관 목적)
      if (searchTerm && !b.purpose.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // 상태 필터
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false
      }

      // 분류 필터
      if (categoryFilter !== 'all' && b.category !== categoryFilter) {
        return false
      }

      // 시설 필터
      if (facilityFilter !== 'all' && b.facilityId !== facilityFilter) {
        return false
      }

      return true
    })
  }, [bookings, currentUser.id, currentUser.email, searchTerm, statusFilter, categoryFilter, facilityFilter])

  const completedBookings = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // 안전한 사용자 ID 비교 + 완료된 대관만
    const userFiltered = bookings.filter(b => {
      const userIdMatch = b.userId === currentUser.id ||
                         b.userEmail === currentUser.email
      if (!userIdMatch) return false

      // 명시적으로 완료된 대관
      if (b.status === 'completed') return true

      // 🔥 자동 만료 처리: 승인된 대관 중 종료일이 지났으면 완료된 대관으로 분류
      if (b.status === 'approved' && b.endDate < todayStr) {
        return true
      }

      return false
    })

    // 검색 및 필터 적용
    return userFiltered.filter(b => {
      // 텍스트 검색 (대관 목적)
      if (searchTerm && !b.purpose.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // 분류 필터 (완료된 대관에는 상태 필터 불필요)
      if (categoryFilter !== 'all' && b.category !== categoryFilter) {
        return false
      }

      // 시설 필터
      if (facilityFilter !== 'all' && b.facilityId !== facilityFilter) {
        return false
      }

      return true
    })
  }, [bookings, currentUser.id, currentUser.email, searchTerm, categoryFilter, facilityFilter])

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
    const filteredBookings = bookings.filter(booking => {
      // 사용자 자신의 대관만 표시 (안전한 비교)
      const userIdMatch = booking.userId === currentUser.id ||
                         booking.userEmail === currentUser.email
      if (!userIdMatch) return false

      // Dashboard와 동일한 날짜 범위 처리 방식
      const bookingStart = new Date(booking.startDate + 'T00:00:00')
      const bookingEnd = new Date(booking.endDate + 'T00:00:00')
      const targetDate = new Date(dateStr + 'T00:00:00')

      // 날짜 범위 내에 있는지 확인
      if (targetDate >= bookingStart && targetDate <= bookingEnd) {
        // 다중일 대관인 경우 (startDate !== endDate)
        const isMultiDay = booking.startDate !== booking.endDate

        if (isMultiDay) {
          // 다중일 대관은 반드시 반복 요일이 설정되어야 함
          if (booking.recurrenceRule && booking.recurrenceRule.days && booking.recurrenceRule.days.length > 0) {
            return booking.recurrenceRule.days.includes(targetDate.getDay())
          }
          // 다중일 대관인데 반복 요일이 없으면 표시하지 않음
          return false
        } else {
          // 단일일 대관은 그대로 표시
          return true
        }
      }

      return false
    })

    return filteredBookings
  }, [bookings, currentUser.id, currentUser.email])

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    // 강화된 중복 실행 방지
    if (submitting) {
      console.log('이미 처리 중인 요청이 있습니다.')
      return
    }

    setSubmitting(true)

    // 추가 안전장치: 1초 내 중복 클릭 방지
    const now = Date.now()
    const lastSubmit = window.lastBookingSubmit || 0
    if (now - lastSubmit < 1000) {
      console.log('너무 빠른 연속 클릭 차단')
      setSubmitting(false)
      return
    }
    window.lastBookingSubmit = now

    try {
      // 유효성 검증
      if (!form.userName?.trim()) {
        showNotification('신청자 이름을 입력해주세요.', 'error')
        return
      }
      if (!form.purpose?.trim()) {
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

      // 반복 일정 유효성 검증
      if (isMultiDay && (!form.recurrenceRule?.days || form.recurrenceRule.days.length === 0)) {
        showNotification('다중일 대관의 경우 반복 요일을 선택해주세요.', 'error')
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

        const bookingStart = new Date(b.startDate)
        const bookingEnd = new Date(b.endDate)
        const selectedStart = new Date(form.startDate)
        const selectedEnd = new Date(form.endDate)

        const datesOverlap = bookingStart <= selectedEnd && bookingEnd >= selectedStart
        if (!datesOverlap) return false

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

      // 중복 정책 위반 검사
      if (!allowsOverlap && overlappingBookings.length > 0) {
        showNotification(`현재 [${facility.name}]은 단독 사용만 가능합니다. 같은 시간에 다른 예약이 있어 신청할 수 없습니다.`, 'error')
        return
      }

      if (allowsOverlap && overlappingBookings.length >= maxTeams) {
        showNotification(`현재 [${facility.name}]은 ${maxTeams}팀 이상 제한으로 대관이 불가합니다.`, 'error')
        return
      }

      // 실제 저장 처리 (recurrenceRule 포함)
      const payload: CreateBookingData & { recurrenceRule?: { days: number[] } } = {
        purpose: form.purpose,
        category: form.category as any,
        numberOfParticipants: form.numberOfParticipants || 1,
        facilityId: facility.id,
        startDate: form.startDate,
        endDate: form.endDate,
        startTime: form.startTime,
        endTime: form.endTime,
        // 다중일이고 반복요일이 선택된 경우에만 포함
        ...(isMultiDay && form.recurrenceRule?.days && form.recurrenceRule.days.length > 0
          ? { recurrenceRule: form.recurrenceRule }
          : {}),
      }

      const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      let success = false
      let savedBooking: Booking | null = null

      // 간단한 중복 방지: 전역 타임스탬프만 사용
      const now = Date.now()
      const lastSubmitKey = `${currentUser.id}-${payload.startDate}-${payload.startTime}`
      const lastSubmitTime = window.lastBookingSubmits?.[lastSubmitKey] || 0

      if (now - lastSubmitTime < 3000) { // 3초 내 중복 차단
        showNotification('잠시만 기다려주세요.', 'warning')
        return
      }

      // 타임스탬프 업데이트
      if (!window.lastBookingSubmits) window.lastBookingSubmits = {}
      window.lastBookingSubmits[lastSubmitKey] = now


      // 조용한 처리: 중간 과정 알림 없이 최종 결과만 표시
      try {
        // 먼저 Firebase Functions 시도 (3초 타임아웃)
        const functionPromise = createBookingCallable(payload)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('타임아웃')), 3000)
        )

        const result = await Promise.race([functionPromise, timeoutPromise]) as any

        // Functions 성공
        success = true
        savedBooking = {
          id: result?.data?.bookingId || bookingId,
          userId: currentUser.id,
          userName: form.userName || currentUser.name,
          userEmail: currentUser.email,
          ...payload,
          status: 'pending',
          createdAt: new Date(),
        }

      } catch (functionError) {
        // Functions 실패 시 백업 저장 (조용히 처리)
        try {
          await fallbackCreateBooking(payload, bookingId, currentUser)
          success = true
          savedBooking = {
            id: bookingId,
            userId: currentUser.id,
            userName: form.userName || currentUser.name,
            userEmail: currentUser.email,
            ...payload,
            status: 'pending',
            createdAt: new Date(),
          }
        } catch (fallbackError) {
          success = false
        }
      }

      // 최종 결과만 표시
      if (success) {
        // 폼 초기화
        setForm({
          purpose: '',
          category: 'personal' as any,
          numberOfParticipants: 1,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '10:00',
          facilityId: '',
          recurrenceRule: { days: [] },
          userName: currentUser.name || '', // 초기화할 때도 기본값 설정
        })

        // 최종 성공 알림만
        showNotification('대관 신청이 완료되었습니다!', 'success')
      } else {
        // 최종 실패 알림만
        showNotification('대관 신청에 실패했습니다.', 'error')
      }

    } catch (e: unknown) {
      console.error('대관 신청 최종 오류:', e)
      showNotification('대관 신청 중 문제가 발생했습니다. 다시 시도해주세요.', 'error')
    } finally {
      setSubmitting(false)
    }
  }, [form, facilities, showNotification, currentUser])

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

      {/* 검색 및 필터 UI */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">검색 및 필터</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 텍스트 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대관 목적 검색</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded-lg"
              placeholder="대관 목적을 입력하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              className="w-full p-2 border border-gray-200 rounded-lg bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
            >
              <option value="all">전체</option>
              <option value="pending">대기중</option>
              <option value="approved">승인됨</option>
              <option value="rejected">거절됨</option>
              <option value="cancelled">취소됨</option>
            </select>
          </div>

          {/* 분류 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
            <select
              className="w-full p-2 border border-gray-200 rounded-lg bg-white"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as BookingCategory | 'all')}
            >
              <option value="all">전체</option>
              <option value="personal">개인</option>
              <option value="club">동아리</option>
              <option value="event">행사</option>
              <option value="class">수업</option>
            </select>
          </div>

          {/* 시설 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시설</label>
            <select
              className="w-full p-2 border border-gray-200 rounded-lg bg-white"
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
            >
              <option value="all">전체</option>
              {facilities.map(facility => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 필터 리셋 버튼 */}
        <div className="flex justify-end mt-3">
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setCategoryFilter('all')
              setFacilityFilter('all')
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            필터 초기화
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">진행중인 대관 / Active Bookings</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {activeBookings.map(b => <BookingListItem key={b.id} booking={b} facilities={facilities} />)}
                {activeBookings.length === 0 && <p className="text-center text-gray-500 py-10">진행중인 대관 신청이 없습니다.</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">완료된 대관 / Completed Bookings</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
                        title={`${booking.userName || '사용자'} - ${booking.purpose} (${booking.startTime}-${booking.endTime})`}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">신청자 이름</label>
              <input type="text" className="w-full p-3 border border-gray-200 rounded-xl" placeholder="신청자 이름을 입력하세요" value={form.userName||''} onChange={e=>setForm({...form, userName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대관 목적</label>
              <input type="text" className="w-full p-3 border border-gray-200 rounded-xl" value={form.purpose||''} onChange={e=>setForm({...form, purpose: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
              <select className="w-full p-3 border border-gray-200 rounded-xl bg-white" value={form.category as any} onChange={e=>setForm({...form, category: e.target.value as any})}>
                <option value="personal">개인</option>
                <option value="club">동아리</option>
                <option value="event">행사</option>
                <option value="class">수업</option>
              </select>
            </div>
            <div></div>
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

          {/* 반복 요일 선택 (AdminSection과 동일한 UI) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">반복 요일 (다중일 선택시)</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS_KO.map((d, idx) => (
                <button key={d} type="button"
                  onClick={() => setForm(prev => ({
                    ...prev,
                    recurrenceRule: {
                      days: prev.recurrenceRule?.days?.includes(idx)
                        ? prev.recurrenceRule.days.filter(x => x !== idx)
                        : [...(prev.recurrenceRule?.days || []), idx]
                    }
                  }))}
                  className={`p-2 rounded-lg border text-sm font-medium ${
                    form.recurrenceRule?.days?.includes(idx)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white hover:bg-gray-100 border-gray-300'
                  } ${!isMultiDay ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {d}
                </button>
              ))}
            </div>
            {!isMultiDay && (
              <p className="text-xs text-gray-500 mt-1">* 시작일과 종료일이 다를 때 활성화됩니다</p>
            )}
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
                className={`w-full md:w-auto px-6 py-3 rounded-xl font-medium transition-all duration-200 transform ${
                  submitting
                    ? 'bg-gray-400 cursor-not-allowed scale-95'
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white shadow-lg hover:shadow-xl'
                }`}
                style={{ pointerEvents: submitting ? 'none' : 'auto' }}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>처리 중...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    📅 대관 신청
                  </span>
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