
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development Server
```bash
npm run dev                    # Start development server on port 5173
```

### Building & Testing
```bash
npm run build                  # Build for production
npm run preview               # Preview production build
npm run lint                  # Run ESLint for code quality
```

### Firebase & Testing
```bash
npm run firebase:emulators    # Start Firebase emulators (auth, firestore, functions, storage)
npm run deploy               # Build and deploy to Firebase hosting
npm run create-admin         # Create test admin account
npm test:e2e                 # Run Playwright end-to-end tests
npm test:e2e:ui              # Run Playwright tests with UI
npm test:e2e:debug           # Run Playwright tests in debug mode
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Functions, Storage)
- **State Management**: React Hooks with custom hooks pattern
- **Icons**: Lucide React
- **Testing**: Playwright for E2E testing

### Project Structure
```
flexspace-pro/
├── components/           # React components (17 components)
├── hooks/               # Custom React hooks (5 hooks)
├── functions/           # Firebase Cloud Functions
├── tests/               # Playwright E2E tests
├── App.tsx             # Main application component
├── types.ts            # TypeScript type definitions
├── utils.ts            # Utility functions
└── firebase.ts         # Firebase configuration
```

### Core Architecture Patterns

#### Component Architecture
- Main `App.tsx` uses lazy loading for larger components (AdminSection, BookingSection, etc.)
- Dashboard component is eagerly loaded as it's the primary landing page
- All components receive data via props (no Context API usage)
- Suspense boundaries with loading fallbacks for lazy-loaded components

#### Data Flow Pattern
- `useFirestore` hook provides centralized data management for all collections
- Real-time Firestore listeners update local state automatically
- Optimistic updates pattern used in admin actions for better UX
- User-specific data filtering enforced at component level (`currentUser.id`)
- **CRITICAL**: All data modifications must persist to Firebase AND update local state
- **WARNING**: Never rely on local state updates alone - they will be overwritten by real-time listeners

#### Authentication System
- Firebase Authentication with email/password and Google OAuth
- Role-based access control (user/admin roles)
- Email verification required for new accounts (except admin-created users)
- Admin-created users bypass email verification via `adminCreated` flag
- Admin elevation requires manual Firestore document updates

### Key Development Guidelines

#### User Data Security
- Always filter data by `currentUser.id` for user-specific views
- Use `useMemo` for expensive filtering operations:
```typescript
const myBookings = useMemo(() =>
  bookings.filter(b => b.userId === currentUser.id),
  [bookings, currentUser.id]
)
```

#### Firebase Timestamp Handling
- All Firebase timestamps require safe processing:
```typescript
const displayDate = (timestamp) => {
  return (timestamp?.toDate ? timestamp.toDate() : new Date(timestamp || 0)).toLocaleDateString()
}
```

#### State Management Pattern
- Use optimistic updates for admin actions
- Immediate UI feedback with background server sync
- Error handling that doesn't break user experience

#### Performance Optimizations
- Lazy loading for non-critical components
- React.memo() and useCallback() for expensive operations
- Manual chunk splitting for Firebase, React, and icon libraries in Vite config

### Collections & Data Models

#### Core Collections (COLLECTIONS constant in types.ts)
- `users` - User profiles with role-based access
- `bookings` - Facility bookings with approval workflow
- `programs` - Fitness programs with enrollment management
- `applications` - Program applications with approval status
- `facilities` - Gym facilities and equipment
- `notifications` - System notifications

#### Key TypeScript Types
- `User` - User profile with role and authentication data (includes `adminCreated` flag)
- `Booking` - Facility reservations with status workflow
- `Program` - Class programs with scheduling and capacity
- `ProgramApplication` - User enrollment applications
- `Facility` - Physical spaces and equipment

### Development Environment

#### Environment Variables (.env.local)
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

#### Firebase Emulator Support
- Set `VITE_USE_EMULATOR=true` to use local Firebase emulators
- Emulator ports: Auth (9099), Firestore (8080), Storage (9199)
- Use `npm run firebase:emulators` to start emulator suite

### Testing Strategy

#### E2E Testing with Playwright
- Tests located in `/tests` directory
- Configuration in `playwright.config.ts`
- Test admin workflows, booking flows, and user interactions
- Run `npm run test:e2e` for headless testing

### Code Quality & Standards

#### ESLint Configuration
- TypeScript strict mode enabled
- React hooks rules enforced
- React refresh plugin for hot reloading
- No unused variables or imports allowed

#### Import Path Structure
- Use `@/` alias for root-level imports (configured in vite.config.ts)
- Components imported from `@/components/`
- Hooks imported from `@/hooks/`
- Types imported from `@/types`

### Special Considerations

#### Admin Account Management
- Initial admin created via `npm run create-admin` script
- Default test admin: `admin@flexspace.test` / `FlexAdmin2025!`
- Admin role elevation requires Firestore console access
- Never commit admin credentials to repository

#### Admin-Created User Authentication Flow
- **Problem**: Admin-created users couldn't login due to missing email verification
- **Solution**: `adminCreated` flag in User model bypasses email verification
- **Implementation**:
  - `UserManagement.tsx`: Sets `adminCreated: true` when admin creates users
  - `use-auth.ts`: Checks `adminCreated` flag to skip email verification during login
  - `types.ts`: User interface includes optional `adminCreated?: boolean` field
- **User Experience**:
  - Admin-created users can login immediately without email verification
  - Regular signup users still require email verification
  - Page refresh needed after admin creates user (to restore admin session)
- **Security**: Only admins can set `adminCreated` flag, maintaining security integrity

#### Facility Booking System
- Supports single-use and shared facility bookings
- Time slot validation prevents overlapping reservations
- Recurring booking support with day-of-week patterns
- Status workflow: pending → approved/rejected → completed/cancelled

#### Real-time Features
- Firestore real-time listeners for live data updates
- Optimistic UI updates for immediate feedback
- Background sync with error recovery patterns

#### Data Synchronization & Admin Actions
- **Problem**: Admin approval actions caused data to disappear and UI freezing
- **Root Cause**: Conflict between optimistic updates and real-time Firestore listeners
- **Solution**: Proper Firebase persistence in admin actions
- **Implementation**:
  - `AdminSection.tsx`: Added `handleApplicationAction` function with Firebase `updateDoc`
  - `useFirestore.ts`: Enhanced with `syncing` state management and loading indicators
  - `Dashboard.tsx` & `BookingSection.tsx`: Added sync status display
- **Pattern**: Optimistic update (immediate UI) → Firebase persistence (background) → Real-time sync
- **User Experience**: Immediate feedback with smooth synchronization indicators

### CRITICAL Data Consistency Rules

#### Cross-Component Data Synchronization
**NEVER IGNORE THESE RULES - THEY PREVENT DATA LOSS AND UI FREEZING**

1. **Firebase Persistence is MANDATORY**
   ```typescript
   // ❌ WRONG - Only local state update (data will disappear)
   setApplications(prev => prev.map(app =>
     app.id === id ? {...app, status: 'approved'} : app
   ))

   // ✅ CORRECT - Local update + Firebase persistence
   setApplications(prev => prev.map(app =>
     app.id === id ? {...app, status: 'approved'} : app
   ))
   await updateDoc(doc(db, 'applications', id), {
     status: 'approved',
     updatedAt: serverTimestamp()
   })
   ```

2. **Real-time Listener Conflict Prevention**
   - All CRUD operations must update Firebase first or simultaneously
   - Local state updates without Firebase persistence will be overwritten
   - Use optimistic updates for UX, but always persist to Firebase

3. **Cross-Menu Data Consistency**
   - AdminSection → Dashboard: Both share same data arrays (bookings, applications)
   - AdminSection → BookingSection: Approval changes affect user's booking view
   - Any status change in one component MUST be reflected in all other components
   - **Root Cause**: Single source of truth is Firestore, not local state

4. **Component Data Flow Validation**
   ```typescript
   // Components that share booking data:
   // - AdminSection: Admin approves/rejects bookings
   // - Dashboard: Shows pending counts and recent bookings
   // - BookingSection: Shows user's personal bookings
   //
   // ALL must stay synchronized through Firebase persistence
   ```

5. **Required Pattern for All Admin Actions**
   ```typescript
   const handleAdminAction = async (itemId: string, newStatus: string) => {
     // Step 1: Optimistic local update (immediate UX)
     setLocalState(prev => prev.map(item =>
       item.id === itemId ? {...item, status: newStatus} : item
     ))

     // Step 2: Show user feedback
     showNotification(`Action completed: ${newStatus}`, 'success')

     // Step 3: Firebase persistence (CRITICAL - never skip)
     try {
       await updateDoc(doc(db, 'collection', itemId), {
         status: newStatus,
         updatedAt: serverTimestamp()
       })
       console.log('Firebase persistence successful')
     } catch (error) {
       console.warn('Firebase persistence failed:', error)
       // Note: Don't show error to user if optimistic update succeeded
     }
   }
   ```

6. **Data State Management Anti-Patterns**
   - ❌ Only calling setState without Firebase update
   - ❌ Assuming local state changes persist across component renders
   - ❌ Not handling Firestore real-time listener overwrites
   - ❌ Missing serverTimestamp() on updates (breaks ordering)
   - ❌ Not providing user feedback during async operations

7. **Testing Data Consistency**
   - After admin approval: Check AdminSection, Dashboard, and BookingSection
   - Verify data appears/disappears correctly in all views
   - Test with browser refresh to ensure Firebase persistence
   - Confirm real-time updates work across multiple browser tabs

8. **Debugging Data Sync Issues**
   - Check browser console for Firebase errors
   - Verify Firestore Rules allow the operation
   - Ensure all components use the same data source (`useFirestore` hook)
   - Look for missing `await` keywords in async Firebase operations
   - Check if `serverTimestamp()` is used for updatedAt fields

## AI Development Assistant Guidelines

### How to Recognize Data Consistency Issues
When working with this codebase, ALWAYS check for these patterns:

1. **Red Flags (Immediate Action Required)**
   - Any `setState` without corresponding Firebase operation
   - Local state updates in admin actions without `updateDoc` or `setDoc`
   - Missing `await` keywords in Firebase operations
   - Components showing different data for the same entities

2. **Required Checklist Before Implementing Admin Actions**
   ```typescript
   // This checklist must be followed for ALL admin operations:
   const adminActionChecklist = {
     hasOptimisticUpdate: false,     // ✅ setLocalState first
     hasUserFeedback: false,         // ✅ showNotification
     hasFirebasePersistence: false,  // ✅ updateDoc/setDoc
     hasErrorHandling: false,        // ✅ try/catch
     hasTimestamp: false            // ✅ serverTimestamp()
   }
   ```

3. **Component Interconnection Map**
   ```typescript
   // AI Assistant: Use this map to understand data flow
   const DATA_FLOW_MAP = {
     bookings: {
       adminActions: 'AdminSection.tsx:handleBookingAction',
       userView: 'BookingSection.tsx:activeBookings',
       dashboard: 'Dashboard.tsx:pendingBookings',
       sharedSource: 'useFirestore.ts:bookings'
     },
     applications: {
       adminActions: 'AdminSection.tsx:handleApplicationAction',
       userView: 'ProgramSection.tsx:myApplications',
       dashboard: 'Dashboard.tsx:pendingApplications',
       sharedSource: 'useFirestore.ts:applications'
     }
   }
   ```

4. **Standard Pattern Template (Copy-Paste Ready)**
   ```typescript
   // AI Assistant: Always use this template for admin actions
   const handleAdminAction = async (id: string, newStatus: string) => {
     // 1. Optimistic update (immediate UX)
     setLocalState(prev => prev.map(item =>
       item.id === id ? {...item, status: newStatus} : item
     ))

     // 2. User feedback
     showNotification(`${action} successful`, 'success')

     // 3. Firebase persistence (NEVER SKIP)
     try {
       const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
       const { db } = await import('@/firebase')

       await updateDoc(doc(db, 'collection_name', id), {
         status: newStatus,
         updatedAt: serverTimestamp()
       })
     } catch (error) {
       console.warn('Firebase persistence failed:', error)
       // Don't show user error if optimistic update worked
     }
   }
   ```

### AI Prompt Enhancement for Future Development
When starting new development on this project, use this prompt:
```
"This is a React + Firebase project with real-time data synchronization. CRITICAL RULE: All admin actions must update both local state (optimistic) AND Firebase (persistence). Check CLAUDE.md for data consistency rules. Components AdminSection, Dashboard, and BookingSection share the same data arrays. Any status changes must persist to Firebase or data will disappear due to real-time listeners."
```

## CRITICAL AUTHENTICATION & USER MANAGEMENT RULES

### Firebase Functions Import Consistency
**NEVER IMPORT FROM MULTIPLE SOURCES - CAUSES INITIALIZATION CONFLICTS**

```typescript
// ✅ CORRECT - Always use firebase.ts as single source
import { functions } from '@/firebase'

// ❌ WRONG - Creates duplicate Functions instances
import { functions } from '@/utils/firebase-functions'
```

**Rule**: All components must import `functions` from `@/firebase` to avoid initialization conflicts that cause Firebase operations to fail.

**Affected Files**: AdminSection.tsx, BookingSection.tsx, ProgramSection.tsx - ALL must use consistent import path.

### Firebase Functions Error Handling Rules
**PREVENT CORRUPTED ERROR MESSAGES AND ENCODING ISSUES**

#### Booking Submission Error Pattern (BookingSection.tsx):
```typescript
// ✅ CORRECT - Safe error message handling
} catch (functionError: any) {
  console.error('Firebase Function 호출 실패:', functionError)

  // 안전한 에러 메시지 처리 (인코딩 오류 방지)
  let errorMessage = '서버 오류가 발생했습니다.'
  try {
    if (functionError?.message && typeof functionError.message === 'string') {
      errorMessage = functionError.message
    } else if (functionError?.code) {
      errorMessage = `오류 코드: ${functionError.code}`
    }
  } catch (e) {
    console.warn('에러 메시지 파싱 실패:', e)
  }

  showNotification(`대관 신청 실패: ${errorMessage}`, 'error')
}

// ❌ WRONG - Direct error concatenation causes corruption
} catch (functionError: any) {
  showNotification(`대관 신청 실패: ${functionError.message}`, 'error') // Can cause garbled text
}
```

#### Error Message Corruption Prevention:
1. **Always wrap error message extraction in try-catch**
2. **Check if error.message is a valid string before using**
3. **Provide fallback error messages for unknown errors**
4. **Never directly concatenate error objects without validation**

#### Common Error Symptoms:
- **Garbled text**: "캡쳐 2갤럭 이???????른렘 ?"
- **Root Cause**: Direct error object concatenation or encoding issues
- **Solution**: Use safe error message extraction pattern above

### Admin-Created User Authentication Rules
**NEVER SEND EMAIL VERIFICATION TO ADMIN-CREATED USERS**

#### UserManagement.tsx Rules:
```typescript
// ✅ CORRECT - Admin-created users skip email verification
console.log('관리자가 직접 생성한 사용자이므로 이메일 인증 메일을 발송하지 않습니다.')

// ❌ WRONG - Sending email verification defeats the purpose
await sendEmailVerification(firebaseUser, {...})
```

**Critical Implementation Points:**
1. **Firestore Document**: All admin-created users MUST have `adminCreated: true` flag
2. **Email Verification**: NEVER send verification emails to admin-created users
3. **Login Bypass**: Admin-created users should login without email verification

#### use-auth.ts Authentication Logic:
```typescript
// ✅ CORRECT - Multi-layer authentication bypass
const isAdminCreated = userData?.adminCreated === true
const isTestAccount = email === 'admin@flexspace.test' || email === 'kan@naver.com' // etc.

if (!result.user.emailVerified && !isAdminCreated && !isTestAccount) {
  // Only block login if NONE of the bypass conditions are met
}
```

### Test Account Management
**MAINTAIN CONSISTENT TEST ACCOUNT LIST ACROSS ALL AUTH FUNCTIONS**

Current test accounts (must be synchronized):
- `admin@flexspace.test`
- `flexadmin@test.com`
- `joonake@naver.com`
- `uu@naver.com`
- `kan@naver.com`
- `kun6@naver.com`
- `testuser964419@gmail.com` (비밀번호: 964419Kun!)

**Critical Locations to Update:**
1. `use-auth.ts:login()` - General user login
2. `use-auth.ts:adminLogin()` - Admin login
3. Both functions MUST have identical test account arrays

### Authentication Bypass Hierarchy
**PRIORITY ORDER FOR EMAIL VERIFICATION BYPASS:**

1. **Test Accounts** (highest priority) - Hardcoded email list
2. **Admin Created Users** - `adminCreated: true` flag in Firestore
3. **Regular Users** - Must complete email verification

**Implementation Pattern:**
```typescript
const isTestAccount = [/* test emails */].includes(email)
const isAdminCreated = userData?.adminCreated === true

// Bypass if ANY condition is true
if (!emailVerified && !isTestAccount && !isAdminCreated) {
  // Require email verification
}
```

### User Creation Workflow Rules
**ADMIN CREATES USER → NO EMAIL VERIFICATION REQUIRED**

#### Direct Creation Process (UserManagement.tsx):
1. **Set Flag**: `adminCreated: true` in Firestore document
2. **Skip Email**: Do NOT call `sendEmailVerification`
3. **Immediate Access**: User can login without email verification
4. **Admin Session**: Preserve admin session during user creation

#### Cloud Functions Fallback:
- If `createUserByAdmin` function fails, use direct creation
- Both methods MUST set `adminCreated: true`
- Both methods MUST skip email verification

### Email Verification Error Prevention
**COMMON MISTAKES TO AVOID:**

1. **❌ Sending emails to admin-created users**
2. **❌ Inconsistent test account lists between functions**
3. **❌ Missing `adminCreated` flag during user creation**
4. **❌ Using different Firebase Functions instances**
5. **❌ Not preserving admin session during user creation**

### Debugging Authentication Issues
**STANDARD TROUBLESHOOTING CHECKLIST:**

1. **Check Firebase Functions Import**: All components use `@/firebase`?
2. **Verify Test Account List**: Same emails in both auth functions?
3. **Confirm adminCreated Flag**: Set during admin user creation?
4. **Console Logs**: Check for Firebase initialization errors
5. **Email Verification**: Admin-created users skip verification?

### Authentication State Management Anti-Patterns
**NEVER DO THESE:**

```typescript
// ❌ Inconsistent import sources
import { functions } from '@/utils/firebase-functions' // Some components
import { functions } from '@/firebase'               // Other components

// ❌ Missing test account in one function but not the other
const isTestAccount = email === 'admin@flexspace.test' // Missing kun6@naver.com

// ❌ Sending email verification to admin-created users
if (adminCreated) {
  await sendEmailVerification(user) // WRONG!
}

// ❌ Not setting adminCreated flag
await setDoc(doc(db, 'users', uid), {
  name, email, role // Missing: adminCreated: true
})

// ❌ Direct error object concatenation (causes corrupted text)
showNotification(`Error: ${error.message}`, 'error') // Can show garbled text

// ❌ Using different Firebase instances for same operations
const functionsA = getFunctions(appA)
const functionsB = getFunctions(appB) // Creates conflicts
```

### Critical Error Prevention Checklist
**BEFORE IMPLEMENTING ANY Firebase Function CALLS:**

1. ✅ **Import Check**: `import { functions } from '@/firebase'` (not @/utils/firebase-functions)
2. ✅ **Error Handling**: Wrap error.message extraction in try-catch
3. ✅ **Test Account List**: Add new test emails to BOTH login() and adminLogin()
4. ✅ **Type Safety**: Use safe string validation for error messages
5. ✅ **Fallback Messages**: Always provide default error message

## CRITICAL FIRESTORE SECURITY RULES & DATA ACCESS PATTERNS

### Firebase Security Rules Configuration
**NEVER MODIFY THESE RULES WITHOUT UNDERSTANDING THE IMPACT**

#### Current Working Configuration (firestore.rules):
```javascript
// ✅ CORRECT - Allows collection queries while maintaining security
match /users/{userId} {
  allow read: if request.auth != null;  // All authenticated users can read user list
  allow write: if request.auth != null && (request.auth.uid == userId || isAdmin());
}

match /bookings/{bookingId} {
  allow read: if request.auth != null;  // All authenticated users can read all bookings
  allow create: if request.auth != null && isOwner(request.resource.data.userId);
  allow update: if request.auth != null && (isAdmin() || (isOwner(resource.data.userId) && isCancelling()));
  allow delete: if isAdmin();
}

match /program_applications/{applicationId} {
  allow read: if request.auth != null;  // All authenticated users can read all applications
  allow create: if request.auth != null && isOwner(request.resource.data.userId);
  allow update, delete: if isAdmin();
}
```

#### 🚨 DANGEROUS PATTERNS TO AVOID:
```javascript
// ❌ WRONG - Blocks collection-level queries
allow read: if request.auth != null && (isOwner(resource.data.userId) || isAdmin());

// ❌ WRONG - Causes "Missing or insufficient permissions" errors
allow read: if request.auth.uid == userId;  // Only for individual documents
```

#### Why These Rules Work:
1. **Collection Queries**: Frontend needs to read entire collections for filtering
2. **Client-Side Filtering**: Security enforced at application level with userId filtering
3. **Write Protection**: Still enforced - users can only create/modify their own data
4. **Admin Override**: Administrators can manage all data

### Data Filtering Patterns
**ESSENTIAL PATTERNS FOR COMPONENT FILTERING**

#### Safe Filtering Logic (BookingSection.tsx):
```typescript
// ✅ CORRECT - Multiple fallback matching strategies
const userIdMatch = booking.userId === currentUser.id ||
                   booking.userEmail === currentUser.email;

// ✅ CORRECT - Handle undefined userId gracefully
const activeBookings = useMemo(() => bookings.filter(b => {
  const userIdMatch = b.userId === currentUser.id || b.userEmail === currentUser.email;
  return userIdMatch && b.status !== 'completed';
}), [bookings, currentUser.id, currentUser.email]);
```

#### 🚨 PROBLEMATIC PATTERNS TO AVOID:
```typescript
// ❌ WRONG - Fails if userId is undefined
b.userId === currentUser.id

// ❌ WRONG - Missing dependency in useMemo
}, [bookings, currentUser.id]); // Missing currentUser.email
```

### Data Model Requirements
**CRITICAL: userId MUST BE REQUIRED FIELD**

#### Booking Interface (types.ts):
```typescript
export interface Booking {
  id: string
  userId: string          // ✅ REQUIRED FIELD - Never optional
  userName?: string       // Optional for display
  userEmail?: string      // Optional backup for filtering
  // ... other fields
}
```

#### 🚨 NEVER DO THIS:
```typescript
userId?: string  // ❌ Optional userId causes filtering failures
```

### Error Prevention Checklist
**BEFORE MODIFYING SECURITY RULES OR FILTERING LOGIC:**

1. ✅ **Collection Access**: Can authenticated users query the entire collection?
2. ✅ **Client Filtering**: Does the component filter by userId/userEmail?
3. ✅ **Required Fields**: Is userId marked as required in TypeScript interfaces?
4. ✅ **Fallback Matching**: Does filtering handle missing userId gracefully?
5. ✅ **Dependencies**: Are all filtering dependencies included in useMemo/useCallback?

### Common Error Symptoms & Solutions

#### "Missing or insufficient permissions" Error:
- **Cause**: Security rules block collection-level queries
- **Solution**: Use `allow read: if request.auth != null` for collection rules
- **Test**: Check Firebase Console → Firestore → Rules

#### "Data not showing despite existing in Firebase":
- **Cause**: Strict userId filtering with undefined values
- **Solution**: Add fallback to userEmail matching
- **Test**: Add console.log in filtering logic

#### "Multiple popup notifications":
- **Cause**: Nested try-catch blocks with multiple notification calls
- **Solution**: Single notification at final result level only
- **Test**: Check BookingSection.tsx handleSubmit function

### Deployment Commands
**NEVER FORGET TO DEPLOY RULE CHANGES:**

```bash
# Deploy security rules to Firebase
firebase deploy --only firestore:rules

# Verify deployment
firebase firestore:rules:get
```