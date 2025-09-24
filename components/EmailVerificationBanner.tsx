import React, { useState } from 'react'
import { Mail, X, CheckCircle } from 'lucide-react'
import { useNotification } from '@/hooks/use-notification'

interface EmailVerificationBannerProps {
  onSendVerification: () => Promise<boolean>
  onDismiss: () => void
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  onSendVerification,
  onDismiss
}) => {
  const { showNotification } = useNotification()
  const [sending, setSending] = useState(false)

  const handleSendVerification = async () => {
    setSending(true)
    try {
      await onSendVerification()
      showNotification('인증 이메일을 보냈습니다. 이메일 함을 확인해주세요.', 'success')
    } catch {
      showNotification('인증 이메일 전송에 실패했습니다.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Mail className="w-5 h-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800">이메일 인증이 필요합니다</h3>
          <p className="text-sm text-amber-700 mt-1">
            계정 보안을 위해 이메일 주소를 인증해주세요. 모든 기능을 이용하실 수 있습니다.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSendVerification}
              disabled={sending}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  전송 중...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3" />
                  인증 이메일 보내기
                </>
              )}
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-amber-700 text-sm hover:text-amber-800"
            >
              나중에
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-amber-500 hover:text-amber-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default EmailVerificationBanner