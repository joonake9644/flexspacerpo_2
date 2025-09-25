// ============================================================================
// DATA CONSISTENCY RULES - CRITICAL FOR AI DEVELOPMENT ASSISTANCE
// ============================================================================
// This file ensures AI assistants understand the data flow patterns
// and prevent data loss/UI freezing issues that occurred previously.

/**
 * CRITICAL: All admin actions must follow this pattern
 * Failure to do so will result in data disappearing and UI freezing
 */
export const ADMIN_ACTION_PATTERN = {
  STEP_1: 'Optimistic local state update (immediate UX)',
  STEP_2: 'User feedback notification',
  STEP_3: 'Firebase persistence (NEVER SKIP THIS)',
  STEP_4: 'Error handling without breaking UX'
} as const

/**
 * Components that share data and must stay synchronized
 */
export const DATA_SHARING_MAP = {
  bookings: {
    components: ['AdminSection', 'Dashboard', 'BookingSection'],
    adminActions: 'AdminSection.tsx:handleBookingAction (line ~137)',
    userView: 'BookingSection.tsx:activeBookings',
    dashboardView: 'Dashboard.tsx:pendingBookings',
    dataSource: 'useFirestore.ts:bookings',
    statusFlow: 'pending → approved/rejected → completed/cancelled'
  },
  applications: {
    components: ['AdminSection', 'Dashboard', 'ProgramSection'],
    adminActions: 'AdminSection.tsx:handleApplicationAction (line ~154)',
    userView: 'ProgramSection.tsx:myApplications',
    dashboardView: 'Dashboard.tsx:pendingApplications',
    dataSource: 'useFirestore.ts:applications',
    statusFlow: 'pending → approved/rejected'
  },
  users: {
    components: ['UserManagement', 'Dashboard', 'AdminSection'],
    adminActions: 'UserManagement.tsx:handleSave',
    specialRule: 'Admin-created users have adminCreated=true flag',
    authBypass: 'use-auth.ts:login checks adminCreated for email verification'
  }
} as const

/**
 * Anti-patterns that MUST be avoided
 */
export const FORBIDDEN_PATTERNS = [
  'setState without Firebase persistence',
  'Local state updates without await updateDoc()',
  'Missing serverTimestamp() on updates',
  'Admin actions without user feedback',
  'Firebase operations without error handling',
  'Assuming local state changes persist across renders'
] as const

/**
 * Required imports for admin actions
 */
export const REQUIRED_FIREBASE_IMPORTS = `
const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
const { db } = await import('@/firebase')
`

/**
 * Template for admin action functions
 */
export const ADMIN_ACTION_TEMPLATE = `
const handleAdminAction = async (itemId: string, newStatus: string) => {
  // 1. Optimistic update (immediate UX)
  setLocalState(prev => prev.map(item =>
    item.id === itemId ? {...item, status: newStatus} : item
  ))

  // 2. User feedback
  showNotification(\`Action completed: \${newStatus}\`, 'success')

  // 3. Firebase persistence (CRITICAL - never skip)
  try {
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
    const { db } = await import('@/firebase')

    await updateDoc(doc(db, 'collection_name', itemId), {
      status: newStatus,
      updatedAt: serverTimestamp()
    })
    console.log('Firebase persistence successful')
  } catch (error) {
    console.warn('Firebase persistence failed:', error)
    // Note: Don't show error to user if optimistic update succeeded
  }
}
`

/**
 * AI Assistant Recognition Keywords
 * When AI sees these terms, it should immediately check data consistency rules
 */
export const AI_TRIGGER_KEYWORDS = [
  'admin approval',
  'status change',
  'booking approval',
  'application approval',
  'setState',
  'setBookings',
  'setApplications',
  'data disappearing',
  'UI freezing',
  'real-time listeners'
] as const

/**
 * Quick validation checklist for AI assistants
 */
export const AI_VALIDATION_CHECKLIST = {
  beforeImplementingAdminAction: [
    '✅ Does it update local state first?',
    '✅ Does it show user notification?',
    '✅ Does it persist to Firebase?',
    '✅ Does it handle errors gracefully?',
    '✅ Does it use serverTimestamp()?'
  ],
  afterImplementation: [
    '✅ Test in AdminSection',
    '✅ Verify Dashboard shows correct counts',
    '✅ Check BookingSection reflects changes',
    '✅ Refresh browser to confirm Firebase persistence',
    '✅ Open multiple tabs to test real-time sync'
  ]
} as const

/**
 * Historical issues resolved (for context)
 */
export const RESOLVED_ISSUES = {
  dataDisappearing: {
    problem: 'Admin approval actions caused data to vanish from UI',
    cause: 'Only local state updates without Firebase persistence',
    solution: 'Added handleApplicationAction with updateDoc calls',
    files: ['AdminSection.tsx:154', 'use-auth.ts:85-88', 'types.ts:21']
  },
  adminUserLogin: {
    problem: 'Admin-created users could not login due to email verification',
    cause: 'Missing adminCreated flag and verification bypass',
    solution: 'Added adminCreated flag and login bypass logic',
    files: ['UserManagement.tsx:173', 'use-auth.ts:85-88', 'types.ts:21']
  },
  uiFreezing: {
    problem: 'Dashboard and BookingSection temporarily froze after admin actions',
    cause: 'Real-time listeners conflicting with optimistic updates',
    solution: 'Added syncing state management and loading indicators',
    files: ['useFirestore.ts:9', 'Dashboard.tsx:80', 'BookingSection.tsx:276']
  }
} as const

/**
 * Emergency AI prompt for critical issues
 */
export const EMERGENCY_AI_PROMPT = `
CRITICAL: Data consistency issue detected in React+Firebase app.
Check CLAUDE.md and data-consistency-rules.ts immediately.
All admin actions MUST update both local state AND Firebase.
Real-time listeners will overwrite local-only changes.
Pattern: setState → showNotification → updateDoc → serverTimestamp
`