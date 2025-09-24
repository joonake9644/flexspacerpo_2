import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from '@/types'
import { auth, db } from '@/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getFirebaseErrorMessage } from '@/utils'

// Firebase Auth 기반 구현 (인터페이스 유지)
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [emailVerified, setEmailVerified] = useState(false)
  const [loading, setLoading] = useState(true)

  // 세션 구독
  useEffect(() => {
    setLoading(true)
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          setUser(null)
          setEmailVerified(false)
          return
        }

        setEmailVerified(fbUser.emailVerified)

        // Firestore에서 사용자 정보 가져오기
        const ref = doc(db, 'users', fbUser.uid)
        const snap = await getDoc(ref)

        let role: User['role'] = 'user'
        let name = fbUser.displayName || (fbUser.email?.split('@')[0] ?? 'user')
        let phone: string | undefined = undefined

        if (snap.exists()) {
          // 기존 사용자
          const data = snap.data() as Partial<User>
          role = (data.role as User['role']) || 'user'
          name = data.name || name
          phone = data.phone
        } else {
          // 신규 사용자 - users 컬렉션에 자동 추가
          const userData = {
            name,
            email: fbUser.email ?? '',
            phone: null,
            role: 'user' as User['role'],
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
          await setDoc(ref, userData)
          console.log('새 사용자 정보를 users 컬렉션에 추가:', fbUser.uid)
        }

        setUser({
          id: fbUser.uid,
          name,
          email: fbUser.email ?? '',
          phone,
          role
        })
      } catch (error) {
        console.error('Auth state change error:', error)
        // 최소 정보로 세팅
        if (fbUser) {
          setUser({
            id: fbUser.uid,
            name: fbUser.email?.split('@')[0] ?? 'user',
            email: fbUser.email ?? '',
            role: 'user'
          })
        }
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)

      // 이메일 인증 확인
      if (!result.user.emailVerified) {
        try {
          await sendEmailVerification(result.user, {
            url: `${window.location.origin}/`,
            handleCodeInApp: false
          })
        } catch (emailError) {
          console.warn('이메일 인증 재전송 실패:', emailError)
        }
        await signOut(auth)
        throw new Error('이메일 인증이 필요합니다. 새로운 인증 메일을 발송했습니다. 이메일함을 확인해주세요.')
      }

      return true
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }, [])

  const adminLogin = useCallback(async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)

      // 테스트 계정은 이메일 인증 생략
      const isTestAccount = email === 'admin@flexspace.test' || email === 'flexadmin@test.com' || email === 'joonake@naver.com'
      if (!isTestAccount && !cred.user.emailVerified) {
        try {
          await sendEmailVerification(cred.user, {
            url: `${window.location.origin}/`,
            handleCodeInApp: false
          })
        } catch (emailError) {
          console.warn('관리자 이메일 인증 재전송 실패:', emailError)
        }
        await signOut(auth)
        throw new Error('이메일 인증이 필요합니다. 새로운 인증 메일을 발송했습니다. 이메일함을 확인해주세요.')
      }

      // 역할 확인
      const ref = doc(db, 'users', cred.user.uid)
      const snap = await getDoc(ref)
      const data = snap.exists() ? snap.data() : {}
      const role = (data as any).role as User['role'] | undefined

      console.log('Admin login - User data:', {
        uid: cred.user.uid,
        email: cred.user.email,
        firestoreExists: snap.exists(),
        role: role,
        allData: data
      })

      if (role !== 'admin') {
        await signOut(auth)
        throw new Error(`관리자 권한이 없습니다. 현재 권한: ${role || '없음'}`)
      }

      return true
    } catch (error) {
      console.error('Admin login error:', error)
      throw error
    }
  }, [])

  const signup = useCallback(async (userData: Omit<User, 'id' | 'role'> & { password?: string }) => {
    try {
      const { name, email, phone, password } = userData

      if (!email || !password) {
        throw new Error('이메일과 비밀번호가 필요합니다.')
      }

      if (password.length < 6) {
        throw new Error('비밀번호는 6자 이상이어야 합니다.')
      }

      // 사용자 생성
      const cred = await createUserWithEmailAndPassword(auth, email, password)

      // 프로필 업데이트
      await updateProfile(cred.user, {
        displayName: name || email.split('@')[0]
      })

      // Firestore에 사용자 정보 저장
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

      // 이메일 인증 전송
      try {
        await sendEmailVerification(cred.user, {
          url: `${window.location.origin}/`,
          handleCodeInApp: false
        })
        console.log('이메일 인증 메일 전송 성공:', email)
      } catch (emailError) {
        console.warn('이메일 인증 메일 전송 실패:', emailError)
        // 메일 전송 실패해도 회원가입 자체는 성공으로 처리
      }

      // 가입 후 로그아웃 (이메일 인증 필요)
      await signOut(auth)

      return true
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }, [])

  const googleLogin = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')

      // 계정 선택 프롬프트 강제 표시
      provider.setCustomParameters({
        prompt: 'select_account'
      })

      const result = await signInWithPopup(auth, provider)
      const fbUser = result.user

      console.log('Google login success:', {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        emailVerified: fbUser.emailVerified
      })

      if (!fbUser.email) {
        throw new Error('Google 계정에서 이메일 정보를 가져올 수 없습니다.')
      }

      const ref = doc(db, 'users', fbUser.uid)
      let userData = {
        name: fbUser.displayName || fbUser.email.split('@')[0] || 'user',
        email: fbUser.email,
        phone: fbUser.phoneNumber || null,
        role: 'user' as User['role'],
        isActive: true,
        updatedAt: serverTimestamp(),
      }

      try {
        const snap = await getDoc(ref)

        // 새 사용자인 경우 Firestore에 정보 저장
        if (!snap.exists()) {
          await setDoc(ref, {
            ...userData,
            createdAt: serverTimestamp(),
          })
          console.log('Google 로그인: 새 사용자 정보 저장됨:', fbUser.uid)
        } else {
          // 기존 사용자 정보 업데이트
          await setDoc(ref, userData, { merge: true })
          console.log('Google 로그인: 기존 사용자 정보 업데이트됨:', fbUser.uid)
        }
      } catch (firestoreError) {
        console.warn('Firestore 저장 실패, 하지만 로그인은 계속 진행:', firestoreError)
      }

      return true
    } catch (error: any) {
      console.error('Google login error:', error)

      // 사용자가 팝업을 닫았거나 취소한 경우
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        throw new Error('Google 로그인이 취소되었습니다.')
      }

      // 팝업이 차단된 경우
      if (error.code === 'auth/popup-blocked') {
        throw new Error('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.')
      }

      // 네트워크 오류
      if (error.code === 'auth/network-request-failed') {
        throw new Error('네트워크 연결을 확인해주세요.')
      }

      // 기타 오류
      throw new Error(`Google 로그인 실패: ${error.message || '알 수 없는 오류'}`)
    }
  }, [])

  const sendVerificationEmail = useCallback(async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser)
      return true
    }
    throw new Error('로그인이 필요합니다.')
  }, [])

  const updateUserProfile = useCallback(async (displayName?: string, photoURL?: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName, photoURL })
      const ref = doc(db, 'users', auth.currentUser.uid)
      await setDoc(ref, {
        name: displayName || auth.currentUser.displayName,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      return true
    }
    throw new Error('로그인이 필요합니다.')
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
    setUser(null)
    setEmailVerified(false)
  }, [])

  return useMemo(() => ({
    user,
    login,
    logout,
    signup,
    adminLogin,
    googleLogin,
    sendVerificationEmail,
    updateUserProfile,
    emailVerified,
    loading
  }), [user, login, logout, signup, adminLogin, googleLogin, sendVerificationEmail, updateUserProfile, emailVerified, loading])
}
