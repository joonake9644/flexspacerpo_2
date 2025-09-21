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

const weekDays = ['��','��','ȭ','��','��','��','��']

const getProgramStatus = (program: Program) => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(program.startDate); start.setHours(0, 0, 0, 0)
  const end = new Date(program.endDate); end.setHours(0, 0, 0, 0)
  if (today > end) return { text: '����', dDay: null as number | null }
  if (today >= start && today <= end) return { text: '������', dDay: null as number | null }
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000*60*60*24))
  return { text: '������', dDay: diff }
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
          <span>����: {p.instructor}</span>
          <span>�Ⱓ: {p.startDate} ~ {p.endDate}</span>
          <span>����: {formatSchedule(p)}</span>
          <span>���: {p.fee ? `${p.fee.toLocaleString()}��` : '���� / Free'}</span>
          <span>����: {p.enrolled ?? 0} / {p.capacity}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.text==='����' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>{status.text}</span>
        {status.text !== '����' && (
          <button disabled={applying} onClick={()=>onApply(p.id)} className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700">��û�ϱ�</button>
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
        showNotification('���α׷� ��û�� �����Ǿ����ϴ�.', 'success')
      } else {
        showNotification(`��û ����: ${res?.data?.message || '�� �� ���� ����'}`, 'error')
      }
    } catch (e: any) {
      showNotification(`��û ����: ${e?.message || '�� �� ���� ����'}`, 'error')
    } finally {
      setApplying(null)
    }
  }, [showNotification])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">���α׷� / Program</h1>
        <p className="text-gray-600">���ϴ� ���α׷��� ã�� ��û�ϼ���.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="���α׷� �˻�" className="flex-1 outline-none"/>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y">
        {filtered.map(p => (
          <ProgramRow key={p.id} p={p} status={getProgramStatus(p)} applying={!!applying} onApply={handleApply} />
        ))}
        {filtered.length === 0 && <div className="p-6 text-center text-gray-500">���ǿ� �´� ���α׷��� �����ϴ�.</div>}
      </div>
    </div>
  )
}

export default ProgramSection

