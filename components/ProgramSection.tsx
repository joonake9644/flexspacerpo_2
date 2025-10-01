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

// 프로그램 카드 컴포넌트 (재사용 가능)
const ProgramCard = memo(({
  program,
  status,
  onApply,
  applying,
  isAlreadyApplied,
  userApplication
}: {
  program: Program;
  status: { text: string; dDay: number | null };
  onApply: (id: string) => void;
  applying: boolean;
  isAlreadyApplied: boolean;
  userApplication?: ProgramApplication;
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{program.title}</h3>
            {status.dDay !== null && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                D-{status.dDay}
              </span>
            )}
          </div>
          <p className="text-gray-600 mb-3">{program.description}</p>
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
          <span>강사: {program.instructor}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          <span>기간: {program.startDate} ~ {program.endDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>일정: {formatSchedule(program)}</span>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4" />
          <span>정원: {program.enrolled ?? 0} / {program.capacity}명</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-lg font-bold text-purple-600">
          {program.fee ? `${program.fee.toLocaleString()}원` : '무료'}
        </div>
        {status.text !== '종료' && (
          <button
            disabled={applying || isAlreadyApplied}
            onClick={() => onApply(program.id)}
            className={`px-6 py-2 rounded-xl font-medium transition-colors ${
              isAlreadyApplied
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50'
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

  // 진행중/모집중 프로그램 필터링 (종료일이 오늘 이후)
  const activePrograms = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return programs.filter(p => {
      const endDate = new Date(p.endDate)
      endDate.setHours(0, 0, 0, 0)
      const isActive = endDate >= today
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
      return isActive && matchesSearch
    })
  }, [programs, search])

  // 종료된 프로그램 필터링 (종료일이 오늘 이전)
  const completedPrograms = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return programs.filter(p => {
      const endDate = new Date(p.endDate)
      endDate.setHours(0, 0, 0, 0)
      const isCompleted = endDate < today
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
      return isCompleted && matchesSearch
    })
  }, [programs, search])

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

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">프로그램 검색</h3>
        <div className="relative max-w-md">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="프로그램명, 강사명으로 검색..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Program Sections - 진행중 / 종료 분리 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 진행중/모집중 프로그램 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            진행중 프로그램 ({activePrograms.length}개)
          </h2>
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {activePrograms.map(p => {
              const status = getProgramStatus(p)
              const userApplication = applications.find(app =>
                app.programId === p.id &&
                app.userId === currentUser.id &&
                (app.status === 'pending' || app.status === 'approved')
              )
              const isAlreadyApplied = !!userApplication
              return (
                <ProgramCard
                  key={p.id}
                  program={p}
                  status={status}
                  onApply={handleApply}
                  applying={applying === p.id}
                  isAlreadyApplied={isAlreadyApplied}
                  userApplication={userApplication}
                />
              )
            })}
            {activePrograms.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">진행중인 프로그램이 없습니다</h3>
                <p className="text-gray-600">새로운 프로그램을 기다려주세요.</p>
              </div>
            )}
          </div>
        </div>

        {/* 종료된 프로그램 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            종료된 프로그램 ({completedPrograms.length}개)
          </h2>
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {completedPrograms.map(p => {
              const status = getProgramStatus(p)
              const userApplication = applications.find(app =>
                app.programId === p.id &&
                app.userId === currentUser.id &&
                (app.status === 'pending' || app.status === 'approved')
              )
              const isAlreadyApplied = !!userApplication
              return (
                <ProgramCard
                  key={p.id}
                  program={p}
                  status={status}
                  onApply={handleApply}
                  applying={applying === p.id}
                  isAlreadyApplied={isAlreadyApplied}
                  userApplication={userApplication}
                />
              )
            })}
            {completedPrograms.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">종료된 프로그램이 없습니다</h3>
                <p className="text-gray-600">종료된 프로그램이 여기 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgramSection

