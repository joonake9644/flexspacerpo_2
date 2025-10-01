import React, { useState } from 'react'
import { Users, Mail, Lock, User as UserIcon, Phone } from 'lucide-react'
import { User } from '../types'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/firebase'
import { useNotification } from '@/hooks/use-notification'
import { getFirebaseErrorMessage } from '@/utils'

type LoginMode = 'login' | 'signup' | 'admin_login'

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<[boolean, string | null]>
  onSignup: (newUser: Omit<User, 'id' | 'role'> & { password?: string }) => Promise<[boolean, string | null]>
  onAdminLogin: (email: string, password: string) => Promise<[boolean, string | null]>
  onGoogleLogin: () => Promise<[boolean, string | null]>
}

interface ForgotPasswordModalProps {
  email: string
  setEmail: (value: string) => void
  onSendLink: () => void
  onCancel: () => void
  submitting: boolean
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ email, setEmail, onSendLink, onCancel, submitting }) => (
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
        <button onClick={onSendLink} disabled={submitting} className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl border-2 border-transparent hover:bg-blue-600 hover:border-blue-700 transition-all font-medium">
          {submitting ? '전송 중...' : '재설정 링크 보내기'}
        </button>
      </div>
    </div>
  </div>
)

interface PrivacyAgreementModalProps { onConfirm: () => void; onCancel: () => void; errorText?: string; }

const PrivacyAgreementModal: React.FC<PrivacyAgreementModalProps> = ({ onConfirm, onCancel, errorText }) => (
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
      {errorText && <p className="text-sm text-red-600 mt-4 text-right">{errorText}</p>}
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl border">취소</button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-blue-600 text-white">동의하고 계속하기</button>
      </div>
    </div>
  </div>
)

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSignup, onAdminLogin, onGoogleLogin }) => {
  const { showNotification } = useNotification()
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
    if (!resetEmail) {
      showNotification('이메일을 입력해주세요.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      showNotification('비밀번호 재설정 이메일을 보냈습니다. 이메일 함을 확인해주세요.', 'success');
      setIsForgotPasswordModalOpen(false);
    } catch (error) {
      const message = getFirebaseErrorMessage(error);
      showNotification(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSignup = async () => {
    const rawPhone = phone.replace(/-/g, '')
    setSubmitting(true); setErrorText('')
    try {
      const [ok, message] = await onSignup({ name, email, password, phone: rawPhone })
      if (!ok) {
        setErrorText(message || '회원가입에 실패했습니다. 입력 정보를 확인해주세요.')
      } else {
        setIsAgreementModalOpen(false)
        showNotification(message || '회원가입이 완료되었습니다. 이메일 인증을 확인해주세요.', 'success')
        // 회원가입 성공 후 로그인 모드로 전환
        setMode('login')
        setPassword('')
        setConfirmPassword('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'signup') {
      if (!name.trim()) {
        showNotification('이름을 입력해주세요.', 'error');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showNotification('유효하지 않은 이메일 형식입니다.', 'error');
        return;
      }
      if (password.length < 6) {
        showNotification('비밀번호는 6자 이상이어야 합니다.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showNotification('비밀번호가 일치하지 않습니다.', 'error');
        return;
      }
    }

    // 로그인/관리자 로그인에서 기본 유효성 검사
    if (mode !== 'signup') {
      if (!email.trim()) {
        showNotification('이메일을 입력해주세요.', 'error');
        return;
      }
      if (!password.trim()) {
        showNotification('비밀번호를 입력해주세요.', 'error');
        return;
      }
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        const [ok, error] = await onLogin(email, password)
        if (!ok) {
          const errorMessage = error || '로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.'
          showNotification(errorMessage, 'error')

          // 미가입자 오류인 경우 회원가입 모드로 자동 전환
          if (error && (error.includes('미가입자') || error.includes('회원가입을 먼저'))) {
            setTimeout(() => {
              setMode('signup')
              showNotification('회원가입 페이지로 이동합니다.', 'info')
            }, 2000)
          }
        } else {
          showNotification('로그인에 성공했습니다.', 'success')
        }
      } else if (mode === 'admin_login') {
        const [ok, error] = await onAdminLogin(email, password)
        if (!ok) {
          showNotification(error || '관리자 로그인에 실패했습니다. 자격을 확인해주세요.', 'error')
        } else {
          showNotification('관리자로 로그인되었습니다.', 'success')
        }
      } else { // mode === 'signup'
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-gray-50 to-purple-50 p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8 animate-slide-up">
        <div className="flex items-center mb-6 animate-fade-in-delay">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-2 shadow-md animate-bounce-in"><Users className="w-6 h-6 text-white" /></div>
          <h1 className="text-2xl font-bold text-gray-900">FlexSpace Pro</h1>
        </div>

        <div className="flex gap-2 mb-6 animate-fade-in-delay">
          <button type="button" onClick={()=>setMode('login')} className={`flex-1 py-2 rounded-xl border transition-all duration-300 ${mode==='login'?'bg-blue-50 text-blue-700 border-blue-200 shadow-sm':'bg-white hover:bg-gray-50'}`}>로그인</button>
          <button type="button" onClick={()=>setMode('signup')} className={`flex-1 py-2 rounded-xl border transition-all duration-300 ${mode==='signup'?'bg-purple-50 text-purple-700 border-purple-200 shadow-sm':'bg-white hover:bg-gray-50'}`}>회원가입</button>
          <button type="button" onClick={()=>setMode('admin_login')} className={`flex-1 py-2 rounded-xl border transition-all duration-300 ${mode==='admin_login'?'bg-green-50 text-green-700 border-green-200 shadow-sm':'bg-white hover:bg-gray-50'}`}>관리자</button>
        </div>

        <form onSubmit={handleSubmit} className="animate-fade-in-delay" style={{animationDelay: '0.4s'}}>
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

          <button type="submit" disabled={submitting} className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl border-2 border-transparent hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transition-all duration-300 font-semibold transform hover:scale-[1.02]">
            {mode==='login' && '로그인 / Login'}
            {mode==='signup' && '회원가입 / Sign Up'}
            {mode==='admin_login' && '관리자 로그인 / Admin Login'}
          </button>
        </form>

        {mode !== 'admin_login' && (
          <>
            <div className="my-6 flex items-center animate-fade-in-delay" style={{animationDelay: '0.5s'}}>
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">또는</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setSubmitting(true)
                try {
                  const [ok, error] = await onGoogleLogin()
                  if (!ok) {
                    showNotification(error || 'Google 로그인에 실패했습니다.', 'error')
                  } else {
                    showNotification('Google 로그인에 성공했습니다.', 'success')
                  }
                } finally {
                  setSubmitting(false)
                }
              }}
              disabled={submitting}
              className="w-full py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-300 font-medium flex items-center justify-center gap-3 transform hover:scale-[1.02] animate-fade-in-delay"
              style={{animationDelay: '0.6s'}}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 {mode === 'login' ? '로그인' : '가입하기'}
            </button>
          </>
        )}
      </div>

      {isAgreementModalOpen && <PrivacyAgreementModal onConfirm={handleConfirmSignup} onCancel={()=>setIsAgreementModalOpen(false)} errorText={errorText} />}
      {isForgotPasswordModalOpen && <ForgotPasswordModal email={resetEmail} setEmail={setResetEmail} onSendLink={handleSendReset} onCancel={()=>setIsForgotPasswordModalOpen(false)} submitting={submitting} />}
    </div>
  )
}

export default LoginForm
