import React, { useMemo, useState } from 'react'
import { User } from '../types'
import { PlusCircle, Edit, Trash2, ArrowUpDown, Search } from 'lucide-react'

interface UserManagementProps {
  users: User[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const initialFormState = { name: '', email: '', phone: '', password: '', role: 'user' as 'user' | 'admin' }
  const [formState, setFormState] = useState(initialFormState)

  const [searchTerm, setSearchTerm] = useState('')
  const [searchField, setSearchField] = useState<'name' | 'email' | 'phone'>('name')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' })

  const openModalForEdit = (user: User) => { setUserToEdit(user); setFormState({ name: user.name, email: user.email, phone: user.phone || '', password: '', role: user.role }); setIsModalOpen(true) }
  const openModalForNew = () => { setUserToEdit(null); setFormState(initialFormState); setIsModalOpen(true) }
  const closeModal = () => { setIsModalOpen(false); setUserToEdit(null) }
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setFormState(prev => ({ ...prev, [name]: value })) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userToEdit) {
      if (users.some(u => u.email === formState.email && u.id !== userToEdit.id)) { alert('이미 사용 중인 이메일입니다.'); return }
      setUsers(users.map(u => u.id === userToEdit.id ? { ...u, name: formState.name, email: formState.email, phone: formState.phone.replace(/-/g, ''), role: formState.role, ...(formState.password && { password: formState.password }) } : u))
      alert('사용자 정보가 수정되었습니다.')
    } else {
      if (users.some(u => u.email === formState.email)) { alert('이미 등록된 이메일입니다.'); return }
      if (!formState.password) { alert('신규 사용자는 비밀번호가 필요합니다.'); return }
      const newUser: User = { id: `user-${Date.now()}`, name: formState.name, email: formState.email, phone: formState.phone.replace(/-/g, ''), password: formState.password, role: formState.role }
      setUsers(prev => [...prev, newUser])
      alert('새 사용자가 추가되었습니다.')
    }
    closeModal()
  }

  const handleDelete = (user: User) => { if (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) { alert('마지막 관리자 계정은 삭제할 수 없습니다.'); return } setUserToDelete(user) }
  const confirmDelete = () => { if (!userToDelete) return; setUsers(users.filter(u => u.id !== userToDelete.id)); setUserToDelete(null) }

  const handleSort = (key: keyof User) => { let direction: 'asc' | 'desc' = 'asc'; if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }) }

  const sortedAndFilteredUsers = useMemo(() => {
    let filteredUsers = users
      .filter(user => roleFilter === 'all' || user.role === roleFilter)
      .filter(user => { if (!searchTerm) return true; const term = searchTerm.toLowerCase(); const value = (user[searchField] as string)?.toLowerCase() || ''; return value.includes(term) })
    if (sortConfig !== null) {
      filteredUsers.sort((a, b) => {
        const aValue = (a[sortConfig.key] as any) || ''
        const bValue = (b[sortConfig.key] as any) || ''
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return filteredUsers
  }, [users, searchTerm, searchField, roleFilter, sortConfig])

  const SortableHeader: React.FC<{ columnKey: keyof User; title: string }> = ({ columnKey, title }) => (
    <th onClick={() => handleSort(columnKey)} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
      <div className="flex items-center"><span>{title}</span>{sortConfig?.key === columnKey && <ArrowUpDown className="w-4 h-4 ml-2" />}</div>
    </th>
  )

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">회원 관리</h1>
          <p className="text-gray-600">사용자 추가, 수정, 삭제</p>
        </div>
        <button onClick={openModalForNew} className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-all duration-300 font-medium shadow hover:shadow-lg hover:-translate-y-0.5"><PlusCircle className="w-5 h-5" /><span>새 사용자 추가</span></button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <select value={searchField} onChange={(e)=>setSearchField(e.target.value as any)} className="border rounded-lg px-2 py-1 text-sm">
            <option value="name">이름</option>
            <option value="email">이메일</option>
            <option value="phone">전화번호</option>
          </select>
          <input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="검색어 입력" className="flex-1 outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader columnKey="name" title="이름" />
              <SortableHeader columnKey="email" title="이메일" />
              <SortableHeader columnKey="phone" title="전화번호" />
              <SortableHeader columnKey="role" title="권한" />
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{user.role}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => openModalForEdit(user)} className="p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-all hover:scale-110"><Edit className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(user)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition-all hover:scale-110"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">{userToEdit ? '사용자 정보 수정' : '새 사용자 추가'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">이름</label><input type="text" name="name" value={formState.name} onChange={handleFormChange} required className="w-full p-3 border border-gray-200 rounded-xl"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">이메일</label><input type="email" name="email" value={formState.email} onChange={handleFormChange} required className="w-full p-3 border border-gray-200 rounded-xl"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label><input type="tel" name="phone" value={formState.phone} onChange={handleFormChange} className="w-full p-3 border border-gray-200 rounded-xl"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 {userToEdit && '(변경시에만 입력)'}</label><input type="password" name="password" value={formState.password} onChange={handleFormChange} className="w-full p-3 border border-gray-200 rounded-xl"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">권한</label><select name="role" value={formState.role} onChange={handleFormChange} className="w-full p-3 border border-gray-200 rounded-xl bg-white"><option value="user">User</option><option value="admin">Admin</option></select></div>
              <div className="flex space-x-3 mt-6"><button type="button" onClick={closeModal} className="flex-1 py-3 px-4 border rounded-xl hover:bg-gray-50 font-medium transition-colors">취소</button><button type="submit" className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-colors">저장</button></div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">사용자 삭제 확인</h3>
            <p className="text-gray-600 mb-6">정말로 <strong className="text-red-600">{userToDelete.name}</strong> 사용자를 삭제하시겠습니까?</p>
            <div className="flex space-x-3"><button onClick={() => setUserToDelete(null)} className="flex-1 py-3 px-4 border rounded-xl hover:bg-gray-50 font-medium transition-colors">취소</button><button onClick={confirmDelete} className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium transition-colors">삭제</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement

