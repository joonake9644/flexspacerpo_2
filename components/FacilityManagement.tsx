import React, { useState } from 'react'
import { Facility } from '../types'
import { useFirestore } from '../hooks/use-firestore'
import { PlusCircle, Edit, Trash2 } from 'lucide-react'
import { doc, addDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore'
import { db } from '@/firebase'

const FacilityManagement: React.FC = () => {
  const { facilities } = useFirestore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [facilityToEdit, setFacilityToEdit] = useState<Facility | null>(null)

  const initialFormState: Omit<Facility, 'id'> = {
    name: '', description: '', type: 'gym', capacity: 1, bufferMinutes: 0,
    amenities: [], location: '', isActive: true,
  }
  const [formState, setFormState] = useState(initialFormState)

  const openModalForNew = () => { setFacilityToEdit(null); setFormState(initialFormState); setIsModalOpen(true) }
  const openModalForEdit = (facility: Facility) => { setFacilityToEdit(facility); setFormState(facility); setIsModalOpen(true) }
  const closeModal = () => { setIsModalOpen(false); setFacilityToEdit(null) }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const isNumber = type === 'number'
    setFormState(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formState.name || formState.capacity <= 0) { alert('시설 이름과 수용 인원을 확인해주세요.'); return }
    try {
      if (facilityToEdit) {
        const facilityRef = doc(db, 'facilities', facilityToEdit.id)
        await updateDoc(facilityRef, formState)
        alert('시설 정보가 성공적으로 수정되었습니다.')
      } else {
        await addDoc(collection(db, 'facilities'), formState)
        alert('새 시설이 추가되었습니다.')
      }
      closeModal()
    } catch (error) {
      console.error('Error saving facility: ', error)
      alert('처리 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (facilityId: string) => {
    if (!window.confirm('정말로 이 시설을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    try {
      await deleteDoc(doc(db, 'facilities', facilityId))
      alert('시설이 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting facility: ', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">시설 관리</h1>
          <p className="text-gray-600">체육관 시설을 추가, 수정, 삭제합니다.</p>
        </div>
        <button onClick={openModalForNew} className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-all duration-300 font-medium shadow hover:shadow-lg hover:-translate-y-0.5">
          <PlusCircle className="w-5 h-5" />
          <span>새 시설 추가</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">종류</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수용 인원</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">버퍼(분)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {facilities.map(facility => (
              <tr key={facility.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{facility.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{facility.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{facility.capacity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{facility.bufferMinutes}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => openModalForEdit(facility)} className="p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-all hover:scale-110"><Edit className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(facility.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition-all hover:scale-110"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">{facilityToEdit ? '시설 정보 수정' : '새 시설 추가'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시설 이름</label>
                <input type="text" name="name" value={formState.name} onChange={handleFormChange} required className="w-full p-3 border border-gray-200 rounded-xl"/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">수용 인원</label>
                  <input type="number" name="capacity" value={formState.capacity} onChange={handleFormChange} required min={1} className="w-full p-3 border border-gray-200 rounded-xl"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">버퍼 시간 (분)</label>
                  <input type="number" name="bufferMinutes" value={formState.bufferMinutes} onChange={handleFormChange} required min={0} className="w-full p-3 border border-gray-200 rounded-xl"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시설 종류</label>
                <select name="type" value={formState.type} onChange={handleFormChange} className="w-full p-3 border border-gray-200 rounded-xl bg-white">
                  <option value="gym">체육관</option>
                  <option value="court">코트</option>
                  <option value="field">운동장</option>
                  <option value="pool">수영장</option>
                  <option value="room">다목적실</option>
                </select>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={closeModal} className="flex-1 py-3 px-4 border rounded-xl hover:bg-gray-50 font-medium transition-colors">취소</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-colors">{facilityToEdit ? '수정하기' : '추가하기'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacilityManagement
