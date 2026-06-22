import { useEffect, useState } from 'react'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import HomePage from './pages/HomePage'
import RoomPage from './pages/RoomPage'
import { E2E_UID, isE2eMode } from './testing/e2e'

type Route =
  | { page: 'home' }
  | { page: 'room'; joinCode: string }

function getInitialRoute(): Route {
  const hash = window.location.hash
  const match = hash.match(/^#\/room\/([A-Z0-9]{6})$/)
  if (match) return { page: 'room', joinCode: match[1] }
  return { page: 'home' }
}

export default function App() {
  const [route, setRoute] = useState<Route>(getInitialRoute)
  const [uid, setUid] = useState<string | null>(null)

  // Anonymous auth on mount
  useEffect(() => {
    if (isE2eMode()) {
      setUid(E2E_UID)
      return
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid)
      } else {
        signInAnonymously(auth)
      }
    })
    return unsub
  }, [])

  // Hash-based routing
  useEffect(() => {
    const handler = () => setRoute(getInitialRoute())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  function navigate(to: Route) {
    if (to.page === 'home') {
      window.location.hash = '/'
    } else {
      window.location.hash = `/room/${to.joinCode}`
    }
    setRoute(to)
  }

  if (!uid) {
    return (
      <div className="min-h-screen bg-race-dark flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">Connecting…</div>
      </div>
    )
  }

  if (route.page === 'room') {
    return (
      <RoomPage
        joinCode={route.joinCode}
        uid={uid}
        onLeave={() => navigate({ page: 'home' })}
      />
    )
  }

  return (
    <HomePage
      uid={uid}
      onEnterRoom={(joinCode) => navigate({ page: 'room', joinCode })}
    />
  )
}
