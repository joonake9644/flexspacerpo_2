import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from '@/types'
import { auth, db } from '@/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

// Firebase Auth 기반 구현 (인터페이스 유지)
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)

  // 세션 구독
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null)
        return
      }
      try {
        const ref = doc(db, 'users', fbUser.uid)
        const snap = await getDoc(ref)
        const data = snap.exists() ? snap.data() as Partial<User> : {}
        const role = (data.role as User['role']) || 'user'
        const name = data.name || fbUser.displayName || (fbUser.email?.split('@')[0] ?? 'user')
        const phone = data.phone
        setUser({ id: fbUser.uid, name, email: fbUser.email ?? '', phone, role })
      } catch {
        // 최소 정보로 세팅
        setUser({ id: fbUser.uid, name: fbUser.email?.split('@')[0] ?? 'user', email: fbUser.email ?? '', role: 'user' })
      }
    })
    return () => unsub()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
    return true
  }, [])

  const adminLogin = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    // 역할 확인
    const ref = doc(db, 'users', cred.user.uid)
    const snap = await getDoc(ref)
    const role = (snap.exists() ? (snap.data() as any).role : undefined) as User['role'] | undefined
    if (role !== 'admin') {
      await signOut(auth)
      throw new Error('관리자 권한이 없습니다.')
    }
    return true
  }, [])

  const signup = useCallback(async (userData: Omit<User, 'id' | 'role'> & { password?: string }) => {
    const { name, email, phone, password } = userData
    if (!email || !password) throw new Error('이메일과 비밀번호가 필요합니다.')
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const ref = doc(db, 'users', cred.user.uid)
    await setDoc(ref, {
      name: name || (email.split('@')[0] ?? 'user'),
      email,
      phone: phone || null,
      role: 'user',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return true
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
    setUser(null)
  }, [])

  return useMemo(() => ({ user, login, logout, signup, adminLogin }), [user, login, logout, signup, adminLogin])
}
