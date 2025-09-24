import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, Shield, Save, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useNotification } from '@/hooks/use-notification'
import ProfileImageUpload from './ProfileImageUpload'
import EmailVerificationBanner from './EmailVerificationBanner'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'

interface UserProfileProps {
  onClose: () => void
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user, updateUserProfile, sendVerificationEmail, emailVerified } = useAuth()
  const { showNotification } = useNotification()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showEmailBanner, setShowEmailBanner] = useState(false)

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  })

  useEffect(() => {
    if (user && !emailVerified) {
      setShowEmailBanner(true)
    }
  }, [user, emailVerified])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      await updateUserProfile(formData.name)

      const userRef = doc(db, 'users', user.id)
      await updateDoc(userRef, {
        name: formData.name,
        phone: formData.phone,
        updatedAt: new Date()
      })

      showNotification('프로필이 업데이트되었습니다.', 'success')
      setEditing(false)
    } catch (error) {
      console.error('프로필 업데이트 실패:', error)
      showNotification('프로필 업데이트에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
    })
    setEditing(false)
  }

  const handleImageUpdate = async (imageUrl: string) => {
    if (!user) return
    await updateUserProfile(user.name, imageUrl)
  }

  const handleSendVerification = async () => {
    try {
      await sendVerificationEmail()
      return true
    } catch (error) {
      console.error('인증 이메일 전송 실패:', error)
      throw error
    }
  }

  if (!user) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">내 프로필</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showEmailBanner && !emailVerified && (
          <EmailVerificationBanner
            onSendVerification={handleSendVerification}
            onDismiss={() => setShowEmailBanner(false)}
          />
        )}

        <div className="space-y-6">
          <ProfileImageUpload
            currentImageUrl={user.photoURL}
            onImageUpdate={handleImageUpdate}
            userId={user.id}
          />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              {editing ? (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="이름을 입력하세요"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{user.name}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-900 flex-1">{user.email}</span>
                {emailVerified ? (
                  <CheckCircle className="w-4 h-4 text-green-500" title="인증됨" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" title="인증 필요" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호 (선택)
              </label>
              {editing ? (
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="전화번호를 입력하세요"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{user.phone || '등록되지 않음'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                권한
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className={`text-sm px-2 py-1 rounded-full ${
                  user.role === 'admin'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role === 'admin' ? '관리자' : '일반 사용자'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {editing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      저장
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                프로필 편집
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile