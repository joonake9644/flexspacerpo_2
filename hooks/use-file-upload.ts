import { useState, useCallback } from 'react'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/firebase'

interface UseFileUploadReturn {
  uploading: boolean
  uploadFile: (file: File, path: string) => Promise<string>
  deleteFile: (url: string) => Promise<void>
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [uploading, setUploading] = useState(false)

  const uploadFile = useCallback(async (file: File, path: string): Promise<string> => {
    setUploading(true)
    try {
      const storageRef = ref(storage, path)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } finally {
      setUploading(false)
    }
  }, [])

  const deleteFile = useCallback(async (url: string): Promise<void> => {
    try {
      const storageRef = ref(storage, url)
      await deleteObject(storageRef)
    } catch (error) {
      console.error('파일 삭제 실패:', error)
    }
  }, [])

  return {
    uploading,
    uploadFile,
    deleteFile
  }
}