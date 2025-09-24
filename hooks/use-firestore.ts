import { useEffect, useMemo, useState } from 'react'
import type { Booking, Program, ProgramApplication, User, Facility } from '@/types'
import { db } from '@/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'

// Firestore 구독 기반 훅 (인터페이스 유지)
export const useFirestore = () => {
  const [loading, setLoading] = useState(true)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [applications, setApplications] = useState<ProgramApplication[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])

  useEffect(() => {
    const unsubs: Array<() => void> = []

    // users
    unsubs.push(
      onSnapshot(collection(db, 'users'), (snap) => {
        const list: User[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setUsers(list)
      }, (error) => {
        console.error("Error fetching users:", error);
      })
    )

    // bookings (최신순)
    unsubs.push(
      onSnapshot(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')), (snap) => {
        const list: Booking[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setBookings(list)
      }, (error) => {
        console.error("Error fetching bookings:", error);
      })
    )

    // programs (시작일 오름차순)
    unsubs.push(
      onSnapshot(query(collection(db, 'programs'), orderBy('startDate', 'asc')), (snap) => {
        const list: Program[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setPrograms(list)
      }, (error) => {
        console.error("Error fetching programs:", error);
      })
    )

    // applications (최신순)
    unsubs.push(
      onSnapshot(query(collection(db, 'applications'), orderBy('appliedAt', 'desc')), (snap) => {
        const list: ProgramApplication[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setApplications(list)
      }, (error) => {
        console.error("Error fetching applications:", error);
      })
    )

    // facilities
    unsubs.push(
      onSnapshot(collection(db, 'facilities'), (snap) => {
        const list: Facility[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setFacilities(list)
      }, (error) => {
        console.error("Error fetching facilities:", error)
      })
    )

    setLoading(false)
    return () => unsubs.forEach((u) => u())
  }, [])

  return useMemo(
    () => ({
      loading,
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
    [loading, bookings, programs, applications, users, facilities]
  )
}
