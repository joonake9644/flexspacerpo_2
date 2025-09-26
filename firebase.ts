import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics'

// Debug environment variables in production
console.log('Firebase Config Debug:', {
  hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
  hasAuthDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
  NODE_ENV: import.meta.env.MODE
})

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBvlPy3BOyrRCokGAHkzuX6IoVZNjWTU-0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'flexspaceprowin.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'flexspaceprowin',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'flexspaceprowin.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '545144229496',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:545144229496:web:a833b961cf4b8a7ce9678d',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-D81Q76VKZQ',
}

// Avoid re-initializing in HMR
let app
try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  console.log('Firebase initialized successfully')
} catch (error) {
  console.error('Firebase initialization failed:', error)
  throw error
}

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

// Emulator wiring (local only)
const useEmu = import.meta.env?.VITE_USE_EMULATOR === 'true'
if (useEmu) {
  const host = (import.meta.env?.VITE_EMULATOR_HOST as string) || '127.0.0.1'
  const authPort = Number((import.meta.env?.VITE_EMULATOR_AUTH_PORT as string) || 9099)
  const firestorePort = Number((import.meta.env?.VITE_EMULATOR_FIRESTORE_PORT as string) || 8080)
  const storagePort = Number((import.meta.env?.VITE_EMULATOR_STORAGE_PORT as string) || 9199)
  try {
    connectAuthEmulator(auth, `http://${host}:${authPort}`, { disableWarnings: true })
  } catch {
    // Emulator connection failed
  }
  try {
    connectFirestoreEmulator(db, host, firestorePort)
  } catch {
    // Emulator connection failed
  }
  try {
    connectStorageEmulator(storage, host, storagePort)
  } catch {
    // Emulator connection failed
  }
  try {
    connectFunctionsEmulator(functions, host, 5001)
  } catch {
    // Emulator connection failed
  }
}

// Analytics is optional and only works in browsers
export const analyticsPromise = analyticsSupported().then((ok) => (ok ? getAnalytics(app) : null)).catch(() => null)

export default app
