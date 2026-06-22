import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

function readEnv(name: keyof ImportMetaEnv): string {
  const raw = import.meta.env[name]
  const normalized = String(raw ?? '')
    .trim()
    .replace(/^['\"]|['\"]$/g, '')

  if (!normalized) {
    throw new Error(`Missing Firebase env var: ${name}`)
  }

  return normalized
}

const firebaseConfig = {
  apiKey:            readEnv('VITE_FIREBASE_API_KEY'),
  authDomain:        readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId:         readEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket:     readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             readEnv('VITE_FIREBASE_APP_ID'),
}

const app = initializeApp(firebaseConfig)

export const db   = getFirestore(app)
export const auth = getAuth(app)
