import React, { useMemo, useState, useCallback, memo, lazy, Suspense } from 'react'
// 개발 가이드라인: 옵티미스틱 업데이트 패턴 적용 (즉시 UI 업데이트 → 백그라운드 서버 동기화)
import { Booking, Program, ProgramApplication, User, Facility, BookingCategory } from '@/types'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'
import { PlusCircle, Edit, Trash2, UserCheck, Calendar as CalendarIcon, Users, BookOpen } from 'lucide-react'
import { useNotification } from '@/hooks/use-notification'
const DashboardCalendar = lazy(() => import('./DashboardCalendar'))

interface AdminSectionProps {
  currentUser: User
  bookings: Booking[]
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>
  applications: ProgramApplication[]
  setApplications: React.Dispatch<React.SetStateAction<ProgramApplication[]>>
  programs: Program[]
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>
  users: User[]
  facilities: Facility[]
}

const updateReservationStatus = httpsCallable(functions, 'updateReservationStatus')

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

const getProgramStatus = (p: Program) => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(p.startDate); start.setHours(0, 0, 0, 0)
  const end = new Date(p.endDate); end.setHours(0, 0, 0, 0)
  if (today > end) return { text: '종료', dDay: null as number | null }
  if (today >= start && today <= end) return { text: '진행중', dDay: null as number | null }
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return { text: '모집중', dDay: diff }
}

const PendingBookingItem: React.FC<{ b: Booking; onAction: (id: string, action: 'approve'|'reject') => void }> = memo(({ b, onAction }) => (
  <div className="p-4 bg-gray-50 rounded-xl transition-shadow hover:shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold text-gray-900">{b.purpose}</p>
        <p className="text-sm text-gray-600 mt-1">{b.userName} | {b.startDate} {b.startTime}-{b.endTime}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onAction(b.id,'approve')} className="px-3 py-2 rounded-lg bg-green-100 text-green-700 border border-green-200 text-sm font-medium">승인</button>
        <button onClick={() => onAction(b.id,'reject')} className="px-3 py-2 rounded-lg bg-red-100 text-red-700 border border-red-200 text-sm font-medium">거절</button>
      </div>
    </div>
  </div>
))

const ProgramListItem: React.FC<{ p: Program; onEdit: (p: Program)=>void; onDelete: (p: Program)=>void }> = memo(({ p, onEdit, onDelete }) => {
  const status = getProgramStatus(p)
  return (
    <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <p className="font-semibold text-gray-900">{p.title}</p>
          {status.dDay !== null && <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">D-{status.dDay}</span>}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {p.instructor} | {p.startDate} ~ {p.endDate} | {(p.startDate !== p.endDate ? (p.scheduleDays || []).slice().sort().map(d => WEEKDAYS_KO[d]).join(',') : '단일')} | {p.startTime} - {p.endTime} | {p.fee ? `${p.fee.toLocaleString()}원` : '무료'}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEdit(p)} className="p-2 text-gray-500 hover:text-blue-600 rounded-lg"><Edit className="w-4 h-4"/></button>
        <button onClick={() => onDelete(p)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4"/></button>
      </div>
    </div>
  )
})

export default function AdminSection({ currentUser, bookings, setBookings, applications, setApplications, programs, setPrograms, users, facilities }: AdminSectionProps) {
  const { showNotification } = useNotification()

  // 프로그램 데이터 디버깅
  console.log('🔍 AdminSection 프로그램 데이터 확인:', {
    programsCount: programs.length,
    programs: programs,
    activePrograms: programs.filter(p => {
      const today = new Date()
      const end = new Date(p.endDate)
      return end >= today
    }).length
  })

  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false)
  const [programToEdit, setProgramToEdit] = useState<Program | null>(null)
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month')

  const emptyProgram: Omit<Program, 'id'> = {
    title: '', description: '', instructor: '', capacity: 10,
    scheduleDays: [], startTime: '09:00', endTime: '10:00',
    startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0],
    level: 'beginner', category: 'yoga', fee: 0,
  }
  const [programForm, setProgramForm] = useState(emptyProgram)

  const isMultiDay = useMemo(() => programForm.startDate !== programForm.endDate, [programForm.startDate, programForm.endDate])

  const timeOptions = useMemo(() => {
    const arr: string[] = []
    for (let h=0; h<24; h++) for (let m=0; m<60; m+=10) arr.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    return arr
  }, [])

  const handleSaveProgram = useCallback(async () => {
    const payload: Program = {
      ...(programToEdit ?? { id: `program-${Date.now()}` }),
      ...programForm,
    } as Program

    // 즉시 로컬 상태 업데이트 (옵티미스틱 업데이트)
    if (programToEdit) {
      setPrograms(prev => prev.map(p => p.id === payload.id ? payload : p))
      showNotification('프로그램이 수정되었습니다.', 'success')
    } else {
      setPrograms(prev => [payload, ...prev])
      showNotification('새 프로그램이 개설되었습니다.', 'success')
    }

    // Firebase에 백그라운드로 저장
    try {
      const { doc, setDoc, updateDoc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('@/firebase')

      const now = new Date()
      if (programToEdit) {
        await updateDoc(doc(db, 'programs', payload.id), {
          ...payload,
          updatedAt: now
        })
        console.log('프로그램 수정 완료:', payload.id)
      } else {
        await setDoc(doc(db, 'programs', payload.id), {
          ...payload,
          createdAt: now,
          updatedAt: now
        })
        console.log('새 프로그램 생성 완료:', payload.id)
      }
    } catch (error) {
      console.warn('Firebase 저장 실패 (로컬 상태는 이미 업데이트됨):', error)
    }

    setIsProgramModalOpen(false)
    setProgramToEdit(null)
  }, [programForm, programToEdit, setPrograms, showNotification])

  const handleBookingAction = useCallback(async (bookingId: string, action: 'approve'|'reject') => {
    console.log('=== 대관 승인/거절 시작 ===', { bookingId, action })

    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const originalBookings = bookings

    try {
      // 1. 즉시 로컬 상태 업데이트 (옵티미스틱 업데이트)
      console.log('1. 로컬 상태 업데이트 실행')
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b))

      // 2. 즉시 사용자 피드백 표시
      showNotification(`대관이 ${action === 'approve' ? '승인' : '거절'}되었습니다.`, 'success')

      // 3. Firebase 저장 (CLAUDE.md 권장 패턴 적용)
      console.log('3. Firebase 저장 시작')
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('@/firebase')

      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        [action === 'approve' ? 'approvedAt' : 'rejectedAt']: serverTimestamp()
      }

      console.log('3-1. 업데이트할 데이터:', updateData)
      console.log('3-2. 대상 문서:', `bookings/${bookingId}`)

      await updateDoc(doc(db, 'bookings', bookingId), updateData)
      console.log('✅ Firebase 저장 성공 - 실시간 동기화 보장됨')

    } catch (error) {
      // 4. Firebase 실패시에도 사용자에게는 에러 표시하지 않음 (이미 성공 메시지 표시)
      console.error('❌ Firebase 저장 실패 (로컬 상태는 이미 업데이트됨):', error)
      // 백그라운드 실패는 로그만 남기고, 사용자 경험은 유지
    }
  }, [bookings, setBookings, showNotification])

  const handleApplicationAction = useCallback(async (applicationId: string, status: 'approved' | 'rejected') => {
    const originalApplications = applications

    try {
      // 1. 즉시 로컬 상태 업데이트 (옵티미스틱 업데이트)
      setApplications(prev => prev.map(app => app.id === applicationId ? { ...app, status } : app))

      // 2. Firebase에 직접 저장 (실시간 동기화 보장)
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('@/firebase')

      // 클라이언트 타임스탬프 사용 (serverTimestamp 문제 해결)
      const now = new Date()
      await updateDoc(doc(db, 'program_applications', applicationId), {
        status,
        updatedAt: now,
        [status === 'approved' ? 'approvedAt' : 'rejectedAt']: now
      })

      console.log('프로그램 신청 상태 Firebase 저장 성공:', applicationId, status)

      // 3. Firebase 저장 성공 후에만 성공 메시지 표시
      showNotification(`프로그램 신청이 ${status === 'approved' ? '승인' : '거절'}되었습니다.`, 'success')

    } catch (error) {
      // 4. 실패시 롤백
      console.error('프로그램 신청 상태 업데이트 실패:', error)
      setApplications(originalApplications)
      showNotification('프로그램 신청 상태 변경에 실패했습니다. 다시 시도해주세요.', 'error')
    }
  }, [applications, setApplications, showNotification])

  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pending'), [bookings])
  const pendingApplications = useMemo(() => applications.filter(a => a.status === 'pending'), [applications])
  const activePrograms = useMemo(() => programs.filter(p => {
    const today = new Date()
    const end = new Date(p.endDate)
    return end >= today
  }), [programs])
  const totalUsers = useMemo(() => users.length, [users])

  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    category: 'class' as BookingCategory,
    purpose: '',
    facilityId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00'
  })


  const handleCreateStudent = useCallback(async () => {
    // 유효성 검증
    if (!newStudentForm.name || newStudentForm.name.trim().length === 0) {
      showNotification('신청자 이름을 입력해주세요.', 'error')
      return
    }
    if (!newStudentForm.purpose || newStudentForm.purpose.trim().length === 0) {
      showNotification('대관 목적을 입력해주세요.', 'error')
      return
    }
    if (!newStudentForm.facilityId) {
      showNotification('시설을 선택해주세요.', 'error')
      return
    }

    // 날짜 유효성 검증
    const startDate = new Date(newStudentForm.startDate + 'T00:00:00')
    const endDate = new Date(newStudentForm.endDate + 'T00:00:00')

    if (endDate < startDate) {
      showNotification('종료일은 시작일 이후로 선택해주세요.', 'error')
      return
    }

    // 시간 유효성 검증
    if (newStudentForm.startTime >= newStudentForm.endTime) {
      showNotification('종료 시간은 시작 시간 이후로 선택해주세요.', 'error')
      return
    }

    // 시설 중복 정책 검증 (BookingSection과 동일한 로직 적용)
    const facility = facilities.find(f => f.id === newStudentForm.facilityId)
    if (!facility) {
      showNotification('선택된 시설을 찾을 수 없습니다.', 'error')
      return
    }

    const policy = facility.bookingPolicy
    const allowsOverlap = policy?.allowOverlap || false
    const maxTeams = policy?.maxConcurrent || 1

    // 겹치는 예약 확인
    const overlappingBookings = bookings.filter(b => {
      if (b.facilityId !== newStudentForm.facilityId || b.status !== 'approved') return false

      // 날짜 겹침 확인
      const bookingStart = new Date(b.startDate)
      const bookingEnd = new Date(b.endDate)
      const selectedStart = new Date(newStudentForm.startDate)
      const selectedEnd = new Date(newStudentForm.endDate)

      const datesOverlap = bookingStart <= selectedEnd && bookingEnd >= selectedStart
      if (!datesOverlap) return false

      // 시간 겹침 확인
      const [bStartH, bStartM] = b.startTime.split(':').map(Number)
      const [bEndH, bEndM] = b.endTime.split(':').map(Number)
      const [sStartH, sStartM] = newStudentForm.startTime.split(':').map(Number)
      const [sEndH, sEndM] = newStudentForm.endTime.split(':').map(Number)

      const bStart = bStartH * 60 + bStartM
      const bEnd = bEndH * 60 + bEndM
      const sStart = sStartH * 60 + sStartM
      const sEnd = sEndH * 60 + sEndM

      return bStart < sEnd && bEnd > sStart
    })

    // 중복 정책 위반 검사
    if (!allowsOverlap && overlappingBookings.length > 0) {
      showNotification('이 시설은 단독 사용만 가능합니다. 같은 시간에 다른 예약이 있어 등록할 수 없습니다.', 'error')
      return
    }

    if (allowsOverlap && overlappingBookings.length >= maxTeams) {
      showNotification(`이 시설은 최대 ${maxTeams}팀까지 동시 사용 가능합니다. 현재 ${overlappingBookings.length}팀이 예약되어 있어 추가 등록이 불가합니다.`, 'error')
      return
    }

    const newBookingId = `booking-${Date.now()}`
    const newBooking: Booking = {
      id: newBookingId,
      userId: currentUser.id,
      userName: newStudentForm.name,
      userEmail: currentUser.email,
      facilityId: newStudentForm.facilityId,
      startDate: newStudentForm.startDate,
      endDate: newStudentForm.endDate,
      startTime: newStudentForm.startTime,
      endTime: newStudentForm.endTime,
      purpose: newStudentForm.purpose,
      category: newStudentForm.category as BookingCategory,
      status: 'approved',
      numberOfParticipants: 1,
      createdAt: new Date()
    }

    // 즉시 로컬 상태 업데이트
    setBookings(prev => [newBooking, ...prev])
    showNotification('대관이 승인되어 등록되었습니다.', 'success')

    // Firebase에 직접 저장
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('@/firebase')

      await setDoc(doc(db, 'bookings', newBookingId), {
        ...newBooking,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        approvedAt: serverTimestamp()
      })
      console.log('대관 신청 Firebase 저장 성공:', newBookingId)
    } catch (error) {
      console.warn('Firebase 저장 실패 (로컬 상태는 이미 업데이트됨):', error)
    }

    // 폼 초기화 완료
    setNewStudentForm({
      name: '',
      category: 'class' as BookingCategory,
      purpose: '',
      facilityId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00'
    })
  }, [newStudentForm, currentUser, setBookings, showNotification, facilities, bookings])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">운영 관리</h1>
        <p className="text-gray-600">대관 및 프로그램 신청을 관리하고, 체육관 직접 등록을 할 수 있습니다</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">대기중인 대관</p>
              <p className="text-2xl font-bold text-orange-600">{pendingBookings.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">대기중인 프로그램 신청</p>
              <p className="text-2xl font-bold text-purple-600">{pendingApplications.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">운영중인 프로그램</p>
              <p className="text-2xl font-bold text-green-600">{activePrograms.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 이용자 수</p>
              <p className="text-2xl font-bold text-blue-600">{totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Student Registration */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600"/>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">수강생/팀 직접 등록</h3>
          </div>
          <span className="text-sm text-gray-600">아래 폼을 사용하여 대관을 등록하세요</span>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">신청자 이름</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              placeholder="예: 관리자 등록"
              value={newStudentForm.name}
              onChange={e => setNewStudentForm({...newStudentForm, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대관 목적</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              placeholder="대관 목적을 입력하세요"
              value={newStudentForm.purpose}
              onChange={e => setNewStudentForm({...newStudentForm, purpose: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
            <select
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              value={newStudentForm.category}
              onChange={e => setNewStudentForm({...newStudentForm, category: e.target.value})}
            >
              <option value="class">수업</option>
              <option value="event">행사</option>
              <option value="club">동아리</option>
              <option value="personal">개인</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시설 선택</label>
            <select
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              value={newStudentForm.facilityId}
              onChange={e => setNewStudentForm({...newStudentForm, facilityId: e.target.value})}
            >
              <option value="">시설을 선택해 주세요</option>
              {facilities.map(facility => {
                const policy = facility.bookingPolicy
                const policyText = policy?.allowOverlap
                  ? `(공유사용, 최대 ${policy.maxConcurrent || 1}팀)`
                  : '(단독사용)'
                return (
                  <option key={facility.id} value={facility.id}>
                    {facility.name} {policyText}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              value={newStudentForm.startDate}
              onChange={e => setNewStudentForm({...newStudentForm, startDate: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              value={newStudentForm.endDate}
              onChange={e => setNewStudentForm({...newStudentForm, endDate: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
            <select
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              value={newStudentForm.startTime}
              onChange={e => setNewStudentForm({...newStudentForm, startTime: e.target.value})}
            >
              <option value="09:00">09:00</option>
              <option value="10:00">10:00</option>
              <option value="11:00">11:00</option>
              <option value="14:00">14:00</option>
              <option value="15:00">15:00</option>
              <option value="16:00">16:00</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
            <select
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              value={newStudentForm.endTime}
              onChange={e => setNewStudentForm({...newStudentForm, endTime: e.target.value})}
            >
              <option value="10:00">10:00</option>
              <option value="11:00">11:00</option>
              <option value="12:00">12:00</option>
              <option value="15:00">15:00</option>
              <option value="16:00">16:00</option>
              <option value="17:00">17:00</option>
            </select>
          </div>
        </form>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
          <button
            onClick={handleCreateStudent}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            등록하기
          </button>
        </div>
      </div>

      {/* Pending Applications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-orange-600"/>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">사용자 대관 신청 대기 ({pendingBookings.length})</h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {pendingBookings.length>0 ? pendingBookings.map(b => (
              <PendingBookingItem key={b.id} b={b} onAction={handleBookingAction} />
            )) : <p className="text-gray-500 text-center py-4">대기중인 신청이 없습니다.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-purple-600"/>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">대기중인 프로그램 신청 ({pendingApplications.length})</h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {pendingApplications.length>0 ? pendingApplications.map(a => {
              const program = programs.find(p => p.id === a.programId)
              return (
                <div key={a.id} className="p-4 bg-gray-50 rounded-xl transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{program?.title || a.programTitle}</p>
                      <p className="text-sm text-gray-600 mt-1">신청자: {a.userName} | 신청일: {a.appliedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApplicationAction(a.id, 'approved')}
                        className="px-3 py-2 rounded-lg bg-green-100 text-green-700 border border-green-200 text-sm font-medium"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleApplicationAction(a.id, 'rejected')}
                        className="px-3 py-2 rounded-lg bg-red-100 text-red-700 border border-red-200 text-sm font-medium"
                      >
                        거절
                      </button>
                    </div>
                  </div>
                </div>
              )
            }) : <p className="text-gray-500 text-center py-4">대기중인 신청이 없습니다.</p>}
          </div>
        </div>
      </div>

      {/* Program Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-purple-600"/>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">프로그램 관리</h3>
          </div>
          <button
            onClick={() => { setProgramToEdit(null); setProgramForm(emptyProgram); setIsProgramModalOpen(true) }}
            className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-50"
          >
            <PlusCircle className="w-4 h-4"/> 새 프로그램 추가
          </button>
        </div>
        <div className="space-y-3">
          {programs.map(p => (
            <ProgramListItem key={p.id} p={p} onEdit={(pp)=>{ setProgramToEdit(pp); setProgramForm(pp); setIsProgramModalOpen(true) }} onDelete={(pp)=> setPrograms(prev=>prev.filter(x=>x.id!==pp.id))} />
          ))}
          {programs.length === 0 && <p className="text-center text-gray-500 py-6">등록된 프로그램이 없습니다.</p>}
        </div>
      </div>

      {/* Full Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-indigo-600"/>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">전체 대관 캘린더</h3>
        </div>

        <Suspense fallback={<div className="text-center py-8 text-gray-500">캘린더 로딩 중...</div>}>
          <DashboardCalendar
            bookings={bookings}
            programs={programs}
            view={calendarView}
            setView={setCalendarView}
          />
        </Suspense>
      </div>

      {isProgramModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{programToEdit ? '프로그램 수정' : '새 프로그램 개설'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input type="text" className="w-full p-3 border border-gray-200 rounded-xl" value={programForm.title} onChange={e=>setProgramForm({...programForm, title: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">강사</label>
                  <input type="text" className="w-full p-3 border border-gray-200 rounded-xl" value={programForm.instructor} onChange={e=>setProgramForm({...programForm, instructor: e.target.value})}/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea className="w-full p-3 border border-gray-200 rounded-xl" rows={3} value={programForm.description} onChange={e=>setProgramForm({...programForm, description: e.target.value})}></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <input type="date" className="w-full p-3 border border-gray-200 rounded-xl" value={programForm.startDate} onChange={e=>setProgramForm({...programForm, startDate: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                  <input type="date" className="w-full p-3 border border-gray-200 rounded-xl" value={programForm.endDate} onChange={e=>setProgramForm({...programForm, endDate: e.target.value})}/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">반복 요일</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS_KO.map((d, idx) => (
                    <button key={d} type="button"
                      onClick={()=> setProgramForm(prev=> ({...prev, scheduleDays: prev.scheduleDays.includes(idx) ? prev.scheduleDays.filter(x=>x!==idx) : [...prev.scheduleDays, idx]}))}
                      className={`p-2 rounded-lg border text-sm font-medium ${programForm.scheduleDays.includes(idx) ? 'bg-purple-500 text-white border-purple-500' : 'bg-white hover:bg-gray-100 border-gray-300'} ${!isMultiDay ? 'opacity-50 pointer-events-none' : ''}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
                  <select className="w-full p-3 border border-gray-200 rounded-xl bg-white" value={programForm.startTime} onChange={e=>setProgramForm({...programForm, startTime: e.target.value})}>
                    {timeOptions.map(t=> <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
                  <select className="w-full p-3 border border-gray-200 rounded-xl bg-white" value={programForm.endTime} onChange={e=>setProgramForm({...programForm, endTime: e.target.value})}>
                    {timeOptions.map(t=> <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">정원</label>
                  <input type="number" className="w-full p-3 border border-gray-200 rounded-xl" value={programForm.capacity} onChange={e=>setProgramForm({...programForm, capacity: parseInt(e.target.value)||0})}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">금액</label>
                  <input type="number" className="w-full p-3 border border-gray-200 rounded-xl" value={programForm.fee || 0} onChange={e=>setProgramForm({...programForm, fee: parseInt(e.target.value)||0})}/>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="px-4 py-2 rounded-xl border" onClick={()=>{ setIsProgramModalOpen(false); setProgramToEdit(null) }}>취소</button>
              <button className="px-4 py-2 rounded-xl bg-purple-600 text-white" onClick={handleSaveProgram}>{programToEdit ? '수정하기' : '개설하기'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

