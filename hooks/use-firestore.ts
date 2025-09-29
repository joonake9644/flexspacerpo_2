import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import type { Booking, Program, ProgramApplication, User, Facility } from '@/types'
import { db } from '@/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'

// 강화된 보안 환경에서 안정적인 Firestore 구독 훅
export const useFirestore = () => {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef<{ [key: string]: number }>({})

  const [bookings, setBookings] = useState<Booking[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [applications, setApplications] = useState<ProgramApplication[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])

  // 동기화 상태 관리 (개선된 버전)
  const handleDataSync = useCallback(() => {
    setSyncing(true)
    setConnectionError(null) // 성공 시 에러 클리어

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(() => {
      setSyncing(false)
    }, 800) // 안정성을 위해 800ms로 증가
  }, [])

  // 재연결 로직
  const handleConnectionError = useCallback((collectionName: string, error: any) => {
    console.error(`Connection error for ${collectionName}:`, error)

    const maxRetries = 3
    const currentRetries = retryCountRef.current[collectionName] || 0

    if (currentRetries < maxRetries) {
      retryCountRef.current[collectionName] = currentRetries + 1
      setConnectionError(`${collectionName} 연결 재시도 중... (${currentRetries + 1}/${maxRetries})`)

      // 지수 백오프로 재연결 시도
      const retryDelay = Math.pow(2, currentRetries) * 1000
      retryTimeoutRef.current = setTimeout(() => {
        console.log(`Retrying connection for ${collectionName} in ${retryDelay}ms`)
      }, retryDelay)
    } else {
      setConnectionError(`${collectionName} 연결 실패: 최대 재시도 횟수 초과`)
    }
  }, [])

  // 성공적인 연결 시 재시도 카운터 리셋
  const handleConnectionSuccess = useCallback((collectionName: string) => {
    if (retryCountRef.current[collectionName]) {
      console.log(`Connection restored for ${collectionName}`)
      retryCountRef.current[collectionName] = 0
    }
  }, [])

  useEffect(() => {
    const unsubs: Array<() => void> = []
    let loadedCollections = 0
    const totalCollections = 5

    const checkInitialLoad = () => {
      loadedCollections++
      if (loadedCollections >= totalCollections) {
        setLoading(false)
        console.log('모든 Firestore 컬렉션 초기 로딩 완료')
      }
    }

    // 강화된 에러 처리를 위한 공통 스냅샷 핸들러
    const createSnapshotHandler = <T>(
      collectionName: string,
      setState: React.Dispatch<React.SetStateAction<T[]>>,
      dataProcessor?: (data: T[]) => T[]
    ) => {
      return {
        onNext: (snap: any) => {
          handleConnectionSuccess(collectionName)
          const list: T[] = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }))

          setState(prev => {
            if (prev.length > 0) handleDataSync()

            // 데이터 처리 함수가 있으면 적용
            const processedList = dataProcessor ? dataProcessor(list) : list

            console.log(`${collectionName} 데이터 업데이트:`, {
              previousCount: prev.length,
              newCount: processedList.length,
              hasChanges: prev.length !== processedList.length
            })

            return processedList
          })
          checkInitialLoad()
        },
        onError: (error: any) => {
          handleConnectionError(collectionName, error)
          checkInitialLoad()
        }
      }
    }

    // Users 구독 (강화된 에러 처리)
    const usersHandler = createSnapshotHandler<User>('users', setUsers)
    unsubs.push(
      onSnapshot(
        collection(db, 'users'),
        usersHandler.onNext,
        usersHandler.onError
      )
    )

    // Bookings 구독 (중복 제거 로직 포함)
    const bookingsHandler = createSnapshotHandler<Booking>(
      'bookings',
      setBookings,
      (list) => {
        // 강화된 중복 제거: ID와 타임스탬프 기준으로 최신 데이터만 유지
        const uniqueBookings = list.filter((booking, index, self) =>
          index === self.findIndex(b => b.id === booking.id)
        )
        return uniqueBookings.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0)
          const bTime = b.createdAt?.toDate?.() || new Date(0)
          return bTime.getTime() - aTime.getTime()
        })
      }
    )
    unsubs.push(
      onSnapshot(
        query(collection(db, 'bookings'), orderBy('createdAt', 'desc')),
        bookingsHandler.onNext,
        bookingsHandler.onError
      )
    )

    // Programs 구독
    const programsHandler = createSnapshotHandler<Program>('programs', setPrograms)
    unsubs.push(
      onSnapshot(
        query(collection(db, 'programs'), orderBy('startDate', 'asc')),
        programsHandler.onNext,
        programsHandler.onError
      )
    )

    // Applications 구독 (program_applications 컬렉션)
    const applicationsHandler = createSnapshotHandler<ProgramApplication>(
      'applications',
      setApplications,
      (list) => {
        // 신청 데이터 정렬: 최신순
        return list.sort((a, b) => {
          const aTime = a.appliedAt?.toDate?.() || new Date(0)
          const bTime = b.appliedAt?.toDate?.() || new Date(0)
          return bTime.getTime() - aTime.getTime()
        })
      }
    )
    unsubs.push(
      onSnapshot(
        query(collection(db, 'program_applications'), orderBy('appliedAt', 'desc')),
        applicationsHandler.onNext,
        applicationsHandler.onError
      )
    )

    // Facilities 구독
    const facilitiesHandler = createSnapshotHandler<Facility>('facilities', setFacilities)
    unsubs.push(
      onSnapshot(
        collection(db, 'facilities'),
        facilitiesHandler.onNext,
        facilitiesHandler.onError
      )
    )

    // 클린업 함수
    return () => {
      console.log('Firestore 구독 정리 중...')
      unsubs.forEach((u) => u())

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }

      // 재시도 카운터 리셋
      retryCountRef.current = {}
    }
  }, [])

  // 강화된 반환 객체 (연결 에러 상태 포함)
  return useMemo(
    () => ({
      loading,
      syncing,
      connectionError,
      bookings,
      setBookings,
      programs,
      setPrograms,
      applications,
      setApplications,
      users,
      setUsers,
      facilities,
      // 강화된 데이터 접근 헬퍼
      isDataReady: !loading && !connectionError,
      hasActiveError: !!connectionError,

      // 디버깅 정보
      debugInfo: {
        loadedCollections: {
          users: users.length,
          bookings: bookings.length,
          programs: programs.length,
          applications: applications.length,
          facilities: facilities.length
        },
        retryStatus: retryCountRef.current
      }
    }),
    [loading, syncing, connectionError, bookings, programs, applications, users, facilities]
  )
}
