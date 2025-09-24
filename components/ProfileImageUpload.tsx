import React, { useState, useRef } from 'react'
import { Camera, Upload, X, User } from 'lucide-react'
import { useFileUpload } from '@/hooks/use-file-upload'
import { useNotification } from '@/hooks/use-notification'

interface ProfileImageUploadProps {
  currentImageUrl?: string
  onImageUpdate: (imageUrl: string) => Promise<void>
  userId: string
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageUrl,
  onImageUpdate,
  userId
}) => {
  const { showNotification } = useNotification()
  const { uploading, uploadFile } = useFileUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('파일 크기는 5MB 이하여야 합니다.', 'error')
      return
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      showNotification('이미지 파일만 업로드 가능합니다.', 'error')
      return
    }

    // 미리보기 생성
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    try {
      const timestamp = Date.now()
      const fileName = `${userId}_${timestamp}.${file.name.split('.').pop()}`
      const path = `profile-images/${fileName}`

      const downloadURL = await uploadFile(file, path)
      await onImageUpdate(downloadURL)

      showNotification('프로필 이미지가 업데이트되었습니다.', 'success')
      setPreviewUrl(null)
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      showNotification('이미지 업로드에 실패했습니다.', 'error')
      setPreviewUrl(null)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const cancelPreview = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayImageUrl = previewUrl || currentImageUrl

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden">
          {displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt="프로필 이미지"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <User className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {previewUrl && (
          <button
            onClick={cancelPreview}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        <button
          onClick={triggerFileSelect}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-lg"
        >
          {uploading ? (
            <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={triggerFileSelect}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? '업로드 중...' : '이미지 변경'}
        </button>
        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG 파일 (최대 5MB)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

export default ProfileImageUpload