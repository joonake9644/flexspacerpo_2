import { useEffect, useMemo, useState, useRef } from 'react'
import type { Booking, Program, ProgramApplication, User, Facility } from '@/types'
import { db } from '@/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'

// Firestore 구독 기반 훅 (인터페이스 유지)
export const useFirestore = () => {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [applications, setApplications] = useState<ProgramApplication[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])

  // 동기화 상태 관리
  const handleDataSync = () => {
    setSyncing(true)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    syncTimeoutRef.current = setTimeout(() => {
      setSyncing(false)
    }, 500) // 500ms 후 동기화 완료로 표시
  }

  useEffect(() => {
    const unsubs: Array<() => void> = []
    let loadedCollections = 0
    const totalCollections = 5

    const checkInitialLoad = () => {
      loadedCollections++
      if (loadedCollections >= totalCollections) {
        setLoading(false)
      }
    }

    // users
    unsubs.push(
      onSnapshot(collection(db, 'users'), (snap) => {
        const list: User[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setUsers(prev => {
          if (prev.length > 0) handleDataSync()
          return list
        })
        checkInitialLoad()
      }, (error) => {
        console.error("Error fetching users:", error)
        checkInitialLoad()
      })
    )

    // bookings (최신순)
    unsubs.push(
      onSnapshot(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')), (snap) => {
        const list: Booking[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setBookings(prev => {
          if (prev.length > 0) handleDataSync()
          return list
        })
        checkInitialLoad()
      }, (error) => {
        console.error("Error fetching bookings:", error)
        checkInitialLoad()
      })
    )

    // programs (시작일 오름차순)
    unsubs.push(
      onSnapshot(query(collection(db, 'programs'), orderBy('startDate', 'asc')), (snap) => {
        const list: Program[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setPrograms(prev => {
          if (prev.length > 0) handleDataSync()
          return list
        })
        checkInitialLoad()
      }, (error) => {
        console.error("Error fetching programs:", error)
        checkInitialLoad()
      })
    )

    // applications (최신순)
    unsubs.push(
      onSnapshot(query(collection(db, 'applications'), orderBy('appliedAt', 'desc')), (snap) => {
        const list: ProgramApplication[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setApplications(prev => {
          if (prev.length > 0) handleDataSync()
          return list
        })
        checkInitialLoad()
      }, (error) => {
        console.error("Error fetching applications:", error)
        checkInitialLoad()
      })
    )

    // facilities
    unsubs.push(
      onSnapshot(collection(db, 'facilities'), (snap) => {
        const list: Facility[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setFacilities(prev => {
          if (prev.length > 0) handleDataSync()
          return list
        })
        checkInitialLoad()
      }, (error) => {
        console.error("Error fetching facilities:", error)
        checkInitialLoad()
      })
    )

    return () => {
      unsubs.forEach((u) => u())
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  return useMemo(
    () => ({
      loading,
      syncing,
      bookings,
      setBookings,
      programs,
      setPrograms,
      applications,
      setApplications,
      users,
      setUsers,
      facilities,
    }),
    [loading, syncing, bookings, programs, applications, users, facilities]
  )
}
