import React, { useMemo, useState, useEffect } from 'react'
import { User } from '../types'
import { PlusCircle, Edit, Trash2, ArrowUpDown, Search, ShieldCheck } from 'lucide-react'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, updateEmail, reauthenticateWithCredential, EmailAuthProvider, ConfirmationResult } from "firebase/auth";
import { getFirebaseErrorMessage, formatPhoneNumberForInput } from '@/utils';
import { useFirestore } from '@/hooks/use-firestore';

interface UserManagementProps {
  users?: User[]
  setUsers?: React.Dispatch<React.SetStateAction<User[]>>
}

const UserManagement: React.FC<UserManagementProps> = ({ users: propUsers, setUsers: propSetUsers }) => {
  // Firestore에서 실시간 데이터 가져오기
  const { users: firestoreUsers, loading } = useFirestore();

  // 실제 사용할 users 배열 - Firestore 데이터를 우선 사용
  const users = firestoreUsers.length > 0 ? firestoreUsers : (propUsers || []);
  const setUsers = propSetUsers || (() => {});

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const initialFormState = { name: '', email: '', phone: '', password: '', role: 'user' as 'user' | 'admin' }
  const [formState, setFormState] = useState(initialFormState)

  // New state for account management
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [searchField, setSearchField] = useState<'name' | 'email' | 'phone'>('name')
  const [roleFilter, ] = useState<'all' | 'admin' | 'user'>('all')
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' })

  const auth = getAuth();

  useEffect(() => {
    if (isAccountModalOpen) {
      // Ensure the container exists before initializing
      setTimeout(() => {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': () => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
          });
        }
      }, 100);
    }
  }, [isAccountModalOpen, auth]);


  const openModalForEdit = (user: User) => { setUserToEdit(user); setFormState({ name: user.name, email: user.email, phone: user.phone || '', password: '', role: user.role }); setIsModalOpen(true) }
  const openModalForNew = () => { setUserToEdit(null); setFormState(initialFormState); setIsModalOpen(true) }
  const closeModal = () => { setIsModalOpen(false); setUserToEdit(null) }
  
  const openAccountModal = (user: User) => {
    setSelectedUser(user);
    setNewEmail(user.email);
    setPhoneNumber(user.phone || '');
    setCurrentPassword('');
    setVerificationCode('');
    setConfirmationResult(null);
    setIsAccountModalOpen(true);
  }
  const closeAccountModal = () => {
    setIsAccountModalOpen(false);
    setSelectedUser(null);
    // Clean up verifier if it exists
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'phone') {
      // 전화번호는 자동 포맷팅 적용
      setFormState(prev => ({ ...prev, [name]: formatPhoneNumberForInput(value) }))
    } else {
      setFormState(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (userToEdit) {
        // 기존 사용자 수정 - Firestore 실제 업데이트
        if (users.some(u => u.email === formState.email && u.id !== userToEdit.id)) {
          alert('이미 사용 중인 이메일입니다.');
          return
        }

        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
        const { db } = await import('@/firebase')

        // Firestore에서 사용자 정보 업데이트
        const updateData: any = {
          name: formState.name,
          email: formState.email,
          phone: formState.phone.replace(/-/g, '') || null,
          role: formState.role,
          updatedAt: serverTimestamp(),
        }

        await updateDoc(doc(db, 'users', userToEdit.id), updateData)

        // 로컬 상태 업데이트 (만약 prop으로 전달된 경우)
        if (propSetUsers) {
          propSetUsers(prev => prev.map(u => u.id === userToEdit.id ? {
            ...u,
            name: formState.name,
            email: formState.email,
            phone: formState.phone.replace(/-/g, ''),
            role: formState.role,
          } : u))
        }

        alert('사용자 정보가 수정되었습니다.')
      } else {
        // 새 사용자 생성 - Firebase Auth + Firestore에 실제로 생성
        if (users.some(u => u.email === formState.email)) {
          alert('이미 등록된 이메일입니다.');
          return
        }
        if (!formState.password) {
          alert('신규 사용자는 비밀번호가 필요합니다.');
          return
        }

        // Firebase Functions 방식으로 사용자 생성 (관리자 세션 유지)
        const { httpsCallable } = await import('firebase/functions')
        const { functions } = await import('@/firebase')

        try {
          // Cloud Functions를 사용해서 관리자 세션을 유지하면서 사용자 생성
          const createUser = httpsCallable(functions, 'createUserByAdmin')
          const result = await createUser({
            name: formState.name,
            email: formState.email,
            phone: formState.phone.replace(/-/g, '') || null,
            password: formState.password,
            role: formState.role
          })

          if (result.data.success) {
            alert(`새 사용자 '${formState.name}'이 생성되었습니다.\n\n관리자가 생성한 계정이므로 이메일 인증 없이 바로 로그인할 수 있습니다.`)

            // 로컬 상태 업데이트
            if (propSetUsers) {
              const newUser: User = {
                id: result.data.uid,
                name: formState.name,
                email: formState.email,
                phone: formState.phone.replace(/-/g, ''),
                role: formState.role
              }
              propSetUsers(prev => [...prev, newUser])
            }
          } else {
            throw new Error(result.data.error || '사용자 생성에 실패했습니다.')
          }
        } catch (functionsError) {
          console.warn('Cloud Functions 사용자 생성 실패, 직접 생성 방식으로 전환:', functionsError)

          // Cloud Functions 실패 시 직접 생성 (기존 방식)
          const { createUserWithEmailAndPassword, sendEmailVerification, updateProfile, signOut } = await import('firebase/auth')
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
          const { auth, db } = await import('@/firebase')

          // 현재 관리자의 정보를 저장
          const currentAdmin = auth.currentUser
          if (!currentAdmin) {
            throw new Error('관리자 로그인이 필요합니다.')
          }

          const userCredential = await createUserWithEmailAndPassword(auth, formState.email, formState.password)
          const firebaseUser = userCredential.user

          // 프로필 업데이트
          await updateProfile(firebaseUser, {
            displayName: formState.name || formState.email.split('@')[0]
          })

          // Firestore에 사용자 정보 저장 (adminCreated 플래그 추가)
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            name: formState.name,
            email: formState.email,
            phone: formState.phone.replace(/-/g, '') || null,
            role: formState.role,
            isActive: true,
            adminCreated: true, // 관리자가 생성한 사용자 표시 (이메일 인증 우회용)
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })

          // 관리자가 직접 생성한 사용자는 이메일 인증 메일을 보내지 않음
          console.log('관리자가 직접 생성한 사용자이므로 이메일 인증 메일을 발송하지 않습니다.')

          // 새 사용자 로그아웃 (관리자 세션 복구를 위해)
          await signOut(auth)

          alert(`새 사용자 '${formState.name}'이 생성되었습니다.\n\n⚠️ 새 사용자 생성으로 인해 자동 로그아웃되었습니다.\n관리자 계정으로 다시 로그인해주세요.\n\n생성된 사용자는 이메일 인증 없이 바로 로그인할 수 있습니다.`)

          // 로컬 상태 업데이트
          if (propSetUsers) {
            const newUser: User = {
              id: firebaseUser.uid,
              name: formState.name,
              email: formState.email,
              phone: formState.phone.replace(/-/g, ''),
              role: formState.role
            }
            propSetUsers(prev => [...prev, newUser])
          }
        }
      }
      closeModal()
    } catch (error) {
      console.error('User creation/update error:', error)
      const errorMessage = getFirebaseErrorMessage(error)
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (user: User) => {
    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
      alert('마지막 관리자 계정은 삭제할 수 없습니다.');
      return
    }
    setUserToDelete(user)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/firebase');

      // Firestore에서 삭제
      await deleteDoc(doc(db, 'users', userToDelete.id));
      alert('사용자가 삭제되었습니다.');

      // 로컬 상태도 업데이트 (만약 prop으로 전달된 경우)
      if (propSetUsers) {
        propSetUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      }

    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      alert('사용자 삭제에 실패했습니다.');
    }

    setUserToDelete(null);
  }

  const handleSort = (key: keyof User) => { let direction: 'asc' | 'desc' = 'asc'; if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }) }

  // Account Management Logic
  const handleSendSmsCode = async () => {
    if (!phoneNumber) {
      alert('휴대폰 번호를 입력하세요.');
      return;
    }
    setIsVerifying(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      alert('인증 코드를 발송했습니다.');
    } catch (error) {
      console.error("SMS Error:", error);
      alert('SMS 인증 코드 요청에 실패했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifySmsCode = async () => {
    if (!verificationCode) {
      alert('인증 코드를 입력하세요.');
      return;
    }
    if (!confirmationResult) {
      alert('먼저 인증 코드를 요청하세요.');
      return;
    }
    setIsVerifying(true);
    try {
      await confirmationResult.confirm(verificationCode);
      alert('휴대폰 인증이 완료되었습니다.');
      // Here you would update the user's state in your backend/firestore
      // e.g., setUsers(users.map(u => u.id === selectedUser.id ? { ...u, phone: phoneNumber, smsVerified: true } : u))
    } catch (error) {
      console.error("Verification Error:", error);
      alert('인증 코드가 잘못되었습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !currentPassword) {
      alert('새 이메일과 현재 비밀번호를 입력하세요.');
      return;
    }
    if (!auth.currentUser) return;

    setIsVerifying(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updateEmail(auth.currentUser, newEmail);
      alert('이메일 주소가 변경되었습니다. 새 주소로 인증 메일을 확인하세요.');
      // Here you would call a cloud function to update the email in Firestore
      // e.g., setUsers(users.map(u => u.id === selectedUser.id ? { ...u, email: newEmail } : u))
      closeAccountModal();
    } catch (error) {
      console.error("Email Update Error:", error);
      alert('이메일 변경에 실패했습니다. 비밀번호를 확인하세요.');
    } finally {
      setIsVerifying(false);
    }
  };


  const sortedAndFilteredUsers = useMemo(() => {
    const filteredUsers = users
      .filter(user => roleFilter === 'all' || user.role === roleFilter)
      .filter(user => { if (!searchTerm) return true; const term = searchTerm.toLowerCase(); const value = (user[searchField] as string)?.toLowerCase() || ''; return value.includes(term) })
    if (sortConfig !== null) {
      filteredUsers.sort((a, b) => {
        const aValue = (a[sortConfig.key] as string | number) || ''
        const bValue = (b[sortConfig.key] as string | number) || ''
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
      <div id="recaptcha-container"></div>
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
          <select value={searchField} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setSearchField(e.target.value as 'name' | 'email' | 'phone')} className="border rounded-lg px-2 py-1 text-sm">
            <option value="name">이름</option>
            <option value="email">이메일</option>
            <option value="phone">전화번호</option>
          </select>
          <input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="검색어 입력" className="flex-1 outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">사용자 정보를 불러오는 중...</span>
          </div>
        ) : sortedAndFilteredUsers.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">등록된 사용자가 없습니다.</p>
              <p className="text-gray-400 text-sm">새 사용자 추가 버튼을 클릭해서 사용자를 추가해보세요.</p>
            </div>
          </div>
        ) : (
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
                    <button onClick={() => openAccountModal(user)} className="p-2 text-gray-500 hover:text-green-600 rounded-lg transition-all hover:scale-110"><ShieldCheck className="w-4 h-4"/></button>
                    <button onClick={() => openModalForEdit(user)} className="p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-all hover:scale-110"><Edit className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(user)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition-all hover:scale-110"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

      {isAccountModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 space-y-6">
            <h3 className="text-xl font-bold text-gray-900">계정 설정: {selectedUser.name}</h3>
            
            {/* SMS 인증 섹션 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">휴대폰 인증</h4>
              <div className="flex items-center space-x-2">
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(formatPhoneNumberForInput(e.target.value))} placeholder="휴대폰 번호" className="flex-1 p-3 border border-gray-200 rounded-xl"/>
                <button onClick={handleSendSmsCode} disabled={isVerifying} className="py-3 px-4 bg-gray-200 rounded-xl hover:bg-gray-300 font-medium transition-colors disabled:opacity-50">{isVerifying ? '전송중...' : '인증코드 받기'}</button>
              </div>
              {confirmationResult && 
                <div className="flex items-center space-x-2">
                  <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="인증 코드 6자리" className="flex-1 p-3 border border-gray-200 rounded-xl"/>
                  <button onClick={handleVerifySmsCode} disabled={isVerifying} className="py-3 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 font-medium transition-colors disabled:opacity-50">{isVerifying ? '확인중...' : '인증하기'}</button>
                </div>
              }
            </div>

            {/* 이메일 변경 섹션 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">이메일 주소 변경</h4>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="새 이메일 주소" className="w-full p-3 border border-gray-200 rounded-xl"/>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="현재 비밀번호" className="w-full p-3 border border-gray-200 rounded-xl"/>
              <button onClick={handleUpdateEmail} disabled={isVerifying} className="w-full py-3 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-colors disabled:opacity-50">{isVerifying ? '변경중...' : '이메일 변경'}</button>
            </div>

            <div className="flex justify-end pt-4">
              <button type="button" onClick={closeAccountModal} className="py-3 px-6 border rounded-xl hover:bg-gray-50 font-medium transition-colors">닫기</button>
            </div>
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

