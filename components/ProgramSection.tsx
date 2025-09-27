import React, { useMemo, useState, memo, useCallback } from 'react'
import { User, Program, ProgramApplication } from '../types'
import { Search, Users, Calendar as CalendarIcon, Clock, UserCheck, BookOpen } from 'lucide-react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'
import { useNotification } from '../hooks/use-notification'

const createProgramApplicationCallable = httpsCallable(functions, 'createProgramApplication')

interface ProgramSectionProps {
  currentUser: User
  programs: Program[]
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>
  applications: ProgramApplication[]
  setApplications: React.Dispatch<React.SetStateAction<ProgramApplication[]>>
}

const weekDays = ['일', '월', '화', '수', '목', '금', '토']

const getProgramStatus = (program: Program) => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(program.startDate); start.setHours(0, 0, 0, 0)
  const end = new Date(program.endDate); end.setHours(0, 0, 0, 0)
  if (today > end) return { text: '종료', dDay: null as number | null }
  if (today >= start && today <= end) return { text: '진행중', dDay: null as number | null }
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return { text: '모집중', dDay: diff }
}

const formatSchedule = (p: Program) => `${(p.scheduleDays || []).sort().map(d => weekDays[d]).join(', ')} ${p.startTime}-${p.endTime}`

const ProgramRow = memo(({ p, status, onApply, applying, isAlreadyApplied, applicationStatus }: {
  p: Program;
  status: { text: string; dDay: number | null };
  onApply: (id: string) => void;
  applying: boolean;
  isAlreadyApplied: boolean;
  applicationStatus?: string;
}) => (
  <div className="p-6">
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{p.title}</h3>
          {status.dDay !== null && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">D-{status.dDay}</span>
          )}
        </div>
        <div className="flex items-center space-x-6 text-sm text-gray-500 flex-wrap">
          <span>강사: {p.instructor}</span>
          <span>기간: {p.startDate} ~ {p.endDate}</span>
          <span>일정: {formatSchedule(p)}</span>
          <span>비용: {p.fee ? `${p.fee.toLocaleString()}원` : '무료 / Free'}</span>
          <span>정원: {p.enrolled ?? 0} / {p.capacity}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.text === '종료' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>{status.text}</span>
        {isAlreadyApplied && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            applicationStatus === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {applicationStatus === 'approved' ? '승인됨' : '신청완료'}
          </span>
        )}
        {status.text !== '종료' && (
          <button
            disabled={applying || isAlreadyApplied}
            onClick={() => onApply(p.id)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              isAlreadyApplied
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isAlreadyApplied ? '신청완료' : (applying ? '신청중...' : '신청하기')}
          </button>
        )}
      </div>
    </div>
  </div>
))

const ProgramSection: React.FC<ProgramSectionProps> = ({ currentUser, programs, applications, setApplications }) => {
  const { showNotification } = useNotification()
  const [search, setSearch] = useState('')
  const [applying, setApplying] = useState<string | null>(null)

  const filtered = useMemo(() => programs.filter(p => p.title.toLowerCase().includes(search.toLowerCase())), [programs, search])

  const handleApply = useCallback(async (programId: string) => {
    // 중복 신청 확인
    const existingApplication = applications.find(app =>
      app.programId === programId &&
      app.userId === currentUser.id &&
      (app.status === 'pending' || app.status === 'approved')
    )

    if (existingApplication) {
      const statusText = existingApplication.status === 'pending' ? '대기중' : '승인됨'
      showNotification(`이미 이 프로그램에 신청하셨습니다. (현재 상태: ${statusText})`, 'warning')
      return
    }

    setApplying(programId)

    // 1. 즉시 로컬 상태 업데이트 (옵티미스틱 업데이트)
    const newApplication: ProgramApplication = {
      id: `temp-${Date.now()}`, // 임시 ID
      userId: currentUser.id,
      programId,
      status: 'pending',
      appliedAt: new Date(),
      userName: currentUser.name,
      userEmail: currentUser.email,
      programTitle: programs.find(p => p.id === programId)?.title || 'Unknown Program',
    }
    setApplications(prev => [newApplication, ...prev])

    // 2. 즉시 성공 피드백 제공
    showNotification('프로그램 신청이 완료되었습니다. 관리자 승인을 기다려주세요.', 'success')

    // 3. 백그라운드에서 Firebase Function 호출
    try {
      const res: any = await createProgramApplicationCallable({ programId })
      if (res?.data?.success) {
        // 임시 ID를 실제 ID로 업데이트
        setApplications(prev => prev.map(app =>
          app.id === newApplication.id
            ? { ...app, id: res.data.applicationId }
            : app
        ))
        console.log('프로그램 신청 Firebase 저장 성공:', res.data.applicationId)
      } else {
        // 실패 시 롤백
        setApplications(prev => prev.filter(app => app.id !== newApplication.id))
        const errorMessage = res?.data?.message || '신청에 실패했습니다. 잠시 후 다시 시도해주세요.'
        showNotification(errorMessage, 'error')
      }
    } catch (e: any) {
      // 실패 시 롤백
      setApplications(prev => prev.filter(app => app.id !== newApplication.id))
      showNotification(`신청 실패: ${e?.message || '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}`, 'error')
    } finally {
      setApplying(null)
    }
  }, [showNotification, currentUser, programs, setApplications, applications])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">프로그램</h1>
        <p className="text-gray-600">다양한 체육 프로그램에 참여해보세요</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">검색</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="프로그램명, 강사명..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <select className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
            <option value="">종목</option>
            <option value="yoga">요가</option>
            <option value="pilates">필라테스</option>
            <option value="fitness">피트니스</option>
            <option value="dance">댄스</option>
            <option value="badminton">배드민턴</option>
            <option value="pickleball">피클볼</option>
          </select>

          <select className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
            <option value="">요일</option>
            <option value="월">월요일</option>
            <option value="화">화요일</option>
            <option value="수">수요일</option>
            <option value="목">목요일</option>
            <option value="금">금요일</option>
            <option value="토">토요일</option>
            <option value="일">일요일</option>
          </select>

          <select className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
            <option value="">시간대</option>
            <option value="morning">오전 (06:00-12:00)</option>
            <option value="afternoon">오후 (12:00-18:00)</option>
            <option value="evening">저녁 (18:00-22:00)</option>
          </select>

          <select className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
            <option value="">레벨</option>
            <option value="beginner">초급</option>
            <option value="intermediate">중급</option>
            <option value="advanced">고급</option>
          </select>
        </div>
      </div>

      {/* Programs Count */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">진행중인 프로그램 ({filtered.length}개)</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg">
            필라테스
          </button>
          <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
            진행 중
          </button>
          <button className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg">
            초급
          </button>
        </div>
      </div>

      {/* Program Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(p => {
          const status = getProgramStatus(p)
          const userApplication = applications.find(app =>
            app.programId === p.id &&
            app.userId === currentUser.id &&
            (app.status === 'pending' || app.status === 'approved')
          )
          const isAlreadyApplied = !!userApplication
          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{p.title}</h3>
                      {status.dDay !== null && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                          D-{status.dDay}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{p.description}</p>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status.text === '종료' ? 'bg-gray-100 text-gray-800' :
                      status.text === '진행중' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {status.text}
                    </span>
                    {isAlreadyApplied && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        userApplication?.status === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {userApplication?.status === 'approved' ? '승인됨' : '신청완료'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>강사: {p.instructor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>기간: {p.startDate} ~ {p.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>일정: {formatSchedule(p)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span>정원: {p.enrolled ?? 0} / {p.capacity}명</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-lg font-bold text-purple-600">
                    {p.fee ? `${p.fee.toLocaleString()}원` : '무료'}
                  </div>
                  {status.text !== '종료' && (
                    <button
                      disabled={applying === p.id || isAlreadyApplied}
                      onClick={() => handleApply(p.id)}
                      className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                        isAlreadyApplied
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50'
                      }`}
                    >
                      {isAlreadyApplied ? '신청완료' : (applying === p.id ? '신청중...' : '신청하기')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
          <p className="text-gray-600">다른 조건으로 검색해보세요.</p>
        </div>
      )}
    </div>
  )
}

export default ProgramSection

