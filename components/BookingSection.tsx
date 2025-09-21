import React, { useMemo, useState, useCallback, memo } from 'react'
import { User, Booking, Facility, CreateBookingData } from '@/types'
import { useFirestore } from '../hooks/use-firestore'
import { useNotification } from '../hooks/use-notification'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/utils/firebase-functions'

const createBookingCallable = httpsCallable(functions, 'createBooking')

interface BookingSectionProps {
  currentUser: User
  bookings: Booking[]
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>
}

const StatusBadge: React.FC<{ status: 'approved' | 'pending' | 'rejected' | 'completed' }> = memo(({ status }) => {
  const statusMap = {
    approved: { text: '승인됨 / Approved', color: 'bg-green-100 text-green-800' },
    pending:  { text: '대기중 / Pending',  color: 'bg-orange-100 text-orange-800' },
    rejected: { text: '거절됨 / Rejected', color: 'bg-red-100 text-red-800' },
    completed:{ text: '종료 / Ended',      color: 'bg-gray-100 text-gray-800' },
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

const BookingListItem: React.FC<{ booking: Booking }> = memo(({ booking }) => (
  <div className="p-3 bg-gray-50 rounded-xl transition-colors duration-200 hover:bg-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900">{booking.purpose}</p>
        <p className="text-sm text-gray-600">{booking.organization ? `${booking.organization} | ` : ''}{formatBookingDate(booking)} {booking.startTime}-{booking.endTime}</p>
      </div>
      <StatusBadge status={booking.status} />
    </div>
  </div>
))

const BookingSection: React.FC<BookingSectionProps> = ({ currentUser, bookings }) => {
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
  })
  const [submitting, setSubmitting] = useState(false)

  const activeBookings = useMemo(() => bookings.filter(b => b.status !== 'completed'), [bookings])
  const completedBookings = useMemo(() => bookings.filter(b => b.status === 'completed'), [bookings])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.purpose || !form.category || !form.startDate || !form.endDate || !form.startTime || !form.endTime) {
      showNotification('모든 필수 항목을 입력해주세요.', 'error')
      return
    }
    if (!facilities || facilities.length === 0) {
      showNotification('등록된 시설이 없어 신청할 수 없습니다.', 'error')
      return
    }
    const facility: Facility = facilities[0]
    setSubmitting(true)
    try {
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
      const result: any = await createBookingCallable(payload)
      if (result?.data?.success) {
        showNotification('예약 신청이 완료되었습니다. 관리자 승인 후 확정됩니다.', 'success')
      } else {
        showNotification(`예약 실패: ${result?.data?.message || '알 수 없는 오류'}`, 'error')
      }
    } catch (e: any) {
      const errorMessage = e?.message || '예약 실패: 알 수 없는 오류'
      showNotification(errorMessage, 'error')
    } finally {
      setSubmitting(false)
    }
  }, [form, facilities, showNotification])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">체육관 대관 / Gym Booking</h1>
        <p className="text-gray-600">대관 현황을 확인하고 새로운 대관을 신청하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">진행중인 대관 / Active Bookings</h2>
          <div className="space-y-3">
            {activeBookings.map(b => <BookingListItem key={b.id} booking={b} />)}
            {activeBookings.length === 0 && <p className="text-center text-gray-500 py-10">진행중인 대관 신청이 없습니다.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">완료된 대관 / Completed Bookings</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {completedBookings.map(b => <BookingListItem key={b.id} booking={b} />)}
            {completedBookings.length === 0 && <p className="text-center text-gray-500 py-10">완료된 대관이 없습니다.</p>}
          </div>
        </div>
      </div>

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
              <input type="number" min={1} className="w-full p-3 border border-gray-200 rounded-xl" value={form.numberOfParticipants||1} onChange={e=>setForm({...form, numberOfParticipants: parseInt(e.target.value)||1})} />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={submitting} className="w-full md:w-auto px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">대관 신청</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookingSection
