// Firebase Custom Claims를 통한 강화된 관리자 인증 시스템
import { functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'

// 관리자 이메일 목록 (보안 규칙과 동일하게 유지)
const ADMIN_EMAILS = [
  'admin@flexspace.test',
  'flexadmin@test.com',
  'joonake@naver.com',
  'uu@naver.com',
  'kan@naver.com',
  'kun6@naver.com'
] as const

export type AdminEmail = typeof ADMIN_EMAILS[number]

// 관리자 이메일 확인
export const isAdminEmail = (email: string): email is AdminEmail => {
  return ADMIN_EMAILS.includes(email as AdminEmail)
}

// Custom Claims 설정 함수 호출
export const setAdminClaims = httpsCallable(functions, 'setAdminClaims')

// 사용자에게 관리자 권한 부여
export const grantAdminRole = async (userUid: string, userEmail: string): Promise<{
  success: boolean
  message: string
  error?: string
}> => {
  try {
    // 관리자 이메일 검증
    if (!isAdminEmail(userEmail)) {
      return {
        success: false,
        message: '관리자 권한을 부여할 수 없는 이메일입니다.',
        error: 'INVALID_ADMIN_EMAIL'
      }
    }

    console.log(`관리자 권한 부여 시도: ${userEmail} (${userUid})`)

    // Firebase Functions를 통해 Custom Claims 설정
    const result = await setAdminClaims({
      uid: userUid,
      email: userEmail,
      role: 'admin',
      admin: true
    })

    console.log('Custom Claims 설정 완료:', result.data)

    return {
      success: true,
      message: `${userEmail}에게 관리자 권한이 부여되었습니다.`
    }

  } catch (error: any) {
    console.error('관리자 권한 부여 실패:', error)

    return {
      success: false,
      message: '관리자 권한 부여 중 오류가 발생했습니다.',
      error: error.message || 'UNKNOWN_ERROR'
    }
  }
}

// 현재 사용자의 관리자 권한 확인
export const checkAdminStatus = async (user: any): Promise<{
  isAdmin: boolean
  source: 'token' | 'email' | 'none'
  claims?: any
}> => {
  try {
    if (!user) {
      return { isAdmin: false, source: 'none' }
    }

    // ID Token에서 Custom Claims 확인
    const idTokenResult = await user.getIdTokenResult()
    const claims = idTokenResult.claims

    console.log('사용자 토큰 claims:', claims)

    // Custom Claims 기반 관리자 확인
    if (claims.role === 'admin' || claims.admin === true) {
      return {
        isAdmin: true,
        source: 'token',
        claims: claims
      }
    }

    // 이메일 기반 백업 확인
    if (isAdminEmail(user.email)) {
      console.log(`이메일 기반 관리자 권한 확인: ${user.email}`)

      // Custom Claims가 없는 경우 설정 시도
      try {
        await grantAdminRole(user.uid, user.email)
        // 토큰 강제 새로고침
        await user.getIdToken(true)

        return {
          isAdmin: true,
          source: 'email'
        }
      } catch (claimsError) {
        console.warn('Custom Claims 설정 실패:', claimsError)
        return {
          isAdmin: true,
          source: 'email'
        }
      }
    }

    return { isAdmin: false, source: 'none' }

  } catch (error) {
    console.error('관리자 상태 확인 실패:', error)

    // 오류 발생 시 이메일 기반으로 최종 확인
    if (user?.email && isAdminEmail(user.email)) {
      return {
        isAdmin: true,
        source: 'email'
      }
    }

    return { isAdmin: false, source: 'none' }
  }
}

// 토큰 강제 새로고침 (권한 변경 후 사용)
export const refreshUserToken = async (user: any): Promise<void> => {
  try {
    if (user) {
      await user.getIdToken(true)
      console.log('사용자 토큰 강제 새로고침 완료')
    }
  } catch (error) {
    console.error('토큰 새로고침 실패:', error)
  }
}

// 관리자 권한 상태 모니터링
export const subscribeToAdminStatus = (
  user: any,
  callback: (status: { isAdmin: boolean; source: string }) => void
) => {
  if (!user) {
    callback({ isAdmin: false, source: 'none' })
    return () => {}
  }

  // 토큰 변경 감지
  const unsubscribe = user.onIdTokenChanged(async (updatedUser: any) => {
    if (updatedUser) {
      const status = await checkAdminStatus(updatedUser)
      callback({
        isAdmin: status.isAdmin,
        source: status.source
      })
    } else {
      callback({ isAdmin: false, source: 'none' })
    }
  })

  return unsubscribe
}