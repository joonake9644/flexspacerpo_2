import React, { useState } from 'react'
import { Users, Mail, Lock, User as UserIcon, Phone } from 'lucide-react'
import { User } from '../types'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/firebase'

type LoginMode = 'login' | 'signup' | 'admin_login'

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<boolean>
  onSignup: (newUser: Omit<User, 'id' | 'role'> & { password?: string }) => Promise<boolean>
  onAdminLogin: (email: string, password: string) => Promise<boolean>
}

interface ForgotPasswordModalProps {
  email: string
  setEmail: (value: string) => void
  onSendLink: () => void
  onCancel: () => void
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ email, setEmail, onSendLink, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title">
    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
      <h3 id="forgot-password-title" className="text-xl font-bold text-gray-900 mb-2">비밀번호 재설정 / Password Reset</h3>
      <p className="text-gray-600 mb-6">가입 시 사용한 이메일 주소를 입력하세요. 재설정 링크를 보내드립니다.</p>
      <div className="relative mb-4">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="email" placeholder="이메일 / Email" aria-label="Email for password reset" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-blue-400" />
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onCancel} className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium">취소</button>
        <button onClick={onSendLink} className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl border-2 border-transparent hover:bg-blue-600 hover:border-blue-700 transition-all font-medium">재설정 링크 보내기</button>
      </div>
    </div>
  </div>
)

interface PrivacyAgreementModalProps { onConfirm: () => void; onCancel: () => void }

const PrivacyAgreementModal: React.FC<PrivacyAgreementModalProps> = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="agreement-title">
    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
      <h3 id="agreement-title" className="text-xl font-bold text-gray-900 mb-4">개인정보 수집 및 이용 동의</h3>
      <p className="text-sm text-gray-600 mb-6">FlexSpace Pro 서비스 제공을 위해 아래와 같이 개인정보를 수집 및 이용합니다.</p>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">구분</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">수집 항목</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">수집 및 이용 목적</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">보유 및 이용 기간</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-3 font-medium text-gray-900">필수</td>
              <td className="px-4 py-3">이름, 이메일</td>
              <td className="px-4 py-3">회원 식별 및 관리, 서비스 제공 및 공지사항 전달</td>
              <td className="px-4 py-3">회원 탈퇴 시까지</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-900">선택</td>
              <td className="px-4 py-3">전화번호</td>
              <td className="px-4 py-3">체육관 대관 시 긴급 연락 및 알림</td>
              <td className="px-4 py-3">회원 탈퇴 시까지</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-4">※ 선택 항목을 동의하지 않아도 회원가입 및 기본 서비스 이용이 가능합니다. 단, 해당 정보가 필요한 일부 서비스(예: 대관 알림) 이용에 제한이 있을 수 있습니다.</p>
      <p className="text-xs text-gray-600 mt-2 font-medium">필수 항목에 동의하지 않으면 회원가입이 제한됩니다.</p>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl border">취소</button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-blue-600 text-white">동의하고 계속하기</button>
      </div>
    </div>
  </div>
)

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSignup, onAdminLogin }) => {
  const [mode, setMode] = useState<LoginMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false)
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorText, setErrorText] = useState('')

  const handleSendReset = async () => {
    if (!resetEmail) return
    await sendPasswordResetEmail(auth, resetEmail)
    setIsForgotPasswordModalOpen(false)
  }

  const handleConfirmSignup = async () => {
    const rawPhone = phone.replace(/-/g, '')
    setSubmitting(true); setErrorText('')
    try {
      const ok = await onSignup({ name, email, password, phone: rawPhone })
      if (!ok) setErrorText('회원가입에 실패했습니다. 입력 정보를 확인해주세요.')
      else setIsAgreementModalOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorText('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        const ok = await onLogin(email, password)
        if (!ok) setErrorText('로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.')
      } else if (mode === 'admin_login') {
        const ok = await onAdminLogin(email, password)
        if (!ok) setErrorText('관리자 로그인에 실패했습니다. 자격을 확인해주세요.')
      } else {
        if (password !== confirmPassword) { setErrorText('비밀번호가 일치하지 않습니다.'); return }
        setIsAgreementModalOpen(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const formatPhone = (v: string) => {
    const raw = v.replace(/[^0-9]/g, '')
    if (raw.length <= 3) return raw
    if (raw.length <= 7) return `${raw.slice(0,3)}-${raw.slice(3)}`
    return `${raw.slice(0,3)}-${raw.slice(3,7)}-${raw.slice(7,11)}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-2"><Users className="w-6 h-6 text-white"/></div>
          <h1 className="text-2xl font-bold text-gray-900">FlexSpace Pro</h1>
        </div>

        <div className="flex gap-2 mb-6">
          <button type="button" onClick={()=>setMode('login')} className={`flex-1 py-2 rounded-xl border ${mode==='login'?'bg-blue-50 text-blue-700 border-blue-200':'bg-white'}`}>로그인</button>
          <button type="button" onClick={()=>setMode('signup')} className={`flex-1 py-2 rounded-xl border ${mode==='signup'?'bg-purple-50 text-purple-700 border-purple-200':'bg-white'}`}>회원가입</button>
          <button type="button" onClick={()=>setMode('admin_login')} className={`flex-1 py-2 rounded-xl border ${mode==='admin_login'?'bg-green-50 text-green-700 border-green-200':'bg-white'}`}>관리자</button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <div className="relative mb-4">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="이름 / Name" value={name} onChange={(e)=>setName(e.target.value)} required className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-blue-400" />
              </div>
              <div className="relative mb-4">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" placeholder="이메일 / Email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-blue-400" />
              </div>
              <div className="relative mb-4">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="tel" placeholder="전화번호 (선택) / Phone (Optional)" value={phone} onChange={(e)=>setPhone(formatPhone(e.target.value))} maxLength={13} className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-blue-400" />
              </div>
              <div className="relative mb-4">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" placeholder="비밀번호 / Password" value={password} onChange={(e)=>setPassword(e.target.value)} required className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-blue-400" />
              </div>
              <div className="relative mb-6">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" placeholder="비밀번호 확인 / Confirm Password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-blue-400" />
              </div>
            </>
          )}

          {mode !== 'signup' && (
            <>
              <div className="relative mb-4">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" placeholder="이메일 / Email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-blue-400" />
              </div>
              <div className="relative mb-2">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" placeholder="비밀번호 / Password" value={password} onChange={(e)=>setPassword(e.target.value)} required className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-blue-400" />
              </div>
              {mode === 'login' && (
                <div className="text-right mb-4">
                  <button type="button" className="text-sm text-blue-600 hover:underline" onClick={()=>{ setIsForgotPasswordModalOpen(true); setResetEmail(email) }}>비밀번호 재설정</button>
                </div>
              )}
            </>
          )}

          {errorText && <p className="text-sm text-red-600 mb-3">{errorText}</p>}

          <button type="submit" disabled={submitting} className="w-full py-3 px-4 bg-blue-500 text-white rounded-xl border-2 border-transparent hover:bg-blue-600 hover:border-blue-700 transition-all font-semibold">
            {mode==='login' && '로그인 / Login'}
            {mode==='signup' && '회원가입 / Sign Up'}
            {mode==='admin_login' && '관리자 로그인 / Admin Login'}
          </button>
        </form>
      </div>

      {isAgreementModalOpen && <PrivacyAgreementModal onConfirm={handleConfirmSignup} onCancel={()=>setIsAgreementModalOpen(false)} />}
      {isForgotPasswordModalOpen && <ForgotPasswordModal email={resetEmail} setEmail={setResetEmail} onSendLink={handleSendReset} onCancel={()=>setIsForgotPasswordModalOpen(false)} />}
    </div>
  )
}

export default LoginForm
