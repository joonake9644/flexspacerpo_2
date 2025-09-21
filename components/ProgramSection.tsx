import React, { useMemo, useState, memo, useCallback } from 'react'
import { User, Program, ProgramApplication } from '../types'
import { Search } from 'lucide-react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/utils/firebase-functions'
import { useNotification } from '../hooks/use-notification'

const createProgramApplicationCallable = httpsCallable(functions, 'createProgramApplication')

interface ProgramSectionProps {
  currentUser: User
  programs: Program[]
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>
  applications: ProgramApplication[]
  setApplications: React.Dispatch<React.SetStateAction<ProgramApplication[]>>
}

const weekDays = ['일','월','화','수','목','금','토']

const getProgramStatus = (program: Program) => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(program.startDate); start.setHours(0, 0, 0, 0)
  const end = new Date(program.endDate); end.setHours(0, 0, 0, 0)
  if (today > end) return { text: '종료', dDay: null as number | null }
  if (today >= start && today <= end) return { text: '진행중', dDay: null as number | null }
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000*60*60*24))
  return { text: '모집중', dDay: diff }
}

const formatSchedule = (p: Program) => `${(p.scheduleDays || []).sort().map(d=>weekDays[d]).join(', ')} ${p.startTime}-${p.endTime}`

const ProgramRow = memo(({ p, status, onApply, applying }: { p: Program; status: { text: string; dDay: number | null }; onApply: (id: string)=>void; applying: boolean }) => (
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
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.text==='종료' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>{status.text}</span>
        {status.text !== '종료' && (
          <button disabled={applying} onClick={()=>onApply(p.id)} className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700">신청하기</button>
        )}
      </div>
    </div>
  </div>
))

const ProgramSection: React.FC<ProgramSectionProps> = ({ currentUser, programs, applications, setApplications }) => {
  const { showNotification } = useNotification()
  const [search, setSearch] = useState('')
  const [applying, setApplying] = useState<string|null>(null)

  const filtered = useMemo(() => programs.filter(p => p.title.toLowerCase().includes(search.toLowerCase())), [programs, search])

  const handleApply = useCallback(async (programId: string) => {
    setApplying(programId)
    try {
      const res: any = await createProgramApplicationCallable({ programId })
      if (res?.data?.success) {
        showNotification('프로그램 신청이 접수되었습니다.', 'success')
      } else {
        showNotification(`신청 실패: ${res?.data?.message || '알 수 없는 오류'}`, 'error')
      }
    } catch (e: any) {
      showNotification(`신청 실패: ${e?.message || '알 수 없는 오류'}`, 'error')
    } finally {
      setApplying(null)
    }
  }, [showNotification])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">프로그램 / Program</h1>
        <p className="text-gray-600">원하는 프로그램을 찾아 신청하세요.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="프로그램 검색" className="flex-1 outline-none"/>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y">
        {filtered.map(p => (
          <ProgramRow key={p.id} p={p} status={getProgramStatus(p)} applying={!!applying} onApply={handleApply} />
        ))}
        {filtered.length === 0 && <div className="p-6 text-center text-gray-500">조건에 맞는 프로그램이 없습니다.</div>}
      </div>
    </div>
  )
}

export default ProgramSection

