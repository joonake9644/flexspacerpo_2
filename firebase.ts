import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
}

// Avoid re-initializing in HMR
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

// Emulator wiring (local only)
const useEmu = (import.meta as any).env?.VITE_USE_EMULATOR === 'true'
if (useEmu) {
  const host = ((import.meta as any).env?.VITE_EMULATOR_HOST as string) || '127.0.0.1'
  const authPort = Number(((import.meta as any).env?.VITE_EMULATOR_AUTH_PORT as string) || 9099)
  const firestorePort = Number(((import.meta as any).env?.VITE_EMULATOR_FIRESTORE_PORT as string) || 8080)
  try {
    connectAuthEmulator(auth, `http://${host}:${authPort}`, { disableWarnings: true })
  } catch {}
  try {
    connectFirestoreEmulator(db, host, firestorePort)
  } catch {}
}

// Analytics is optional and only works in browsers
export const analyticsPromise = analyticsSupported().then((ok) => (ok ? getAnalytics(app) : null)).catch(() => null)

export default app
