import { useEffect, useState } from 'react'
import {
  doc,
  collection,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { RoomDoc, PlayerDoc, Player } from '../types'
import { createDemoPlayers, createDemoRoom, isE2eMode } from '../testing/e2e'

export interface RoomState {
  room: RoomDoc | null
  players: Player[]
  loading: boolean
}

export function useRoom(joinCode: string): RoomState {
  const [room, setRoom] = useState<RoomDoc | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!joinCode) return

    if (isE2eMode()) {
      setRoom(createDemoRoom(joinCode))
      setPlayers(createDemoPlayers())
      setLoading(false)
      return
    }

    const roomRef = doc(db, 'rooms', joinCode)
    const playersRef = collection(db, 'rooms', joinCode, 'players')

    const unsubRoom = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        setRoom(snap.data() as RoomDoc)
      } else {
        setRoom(null)
      }
      setLoading(false)
    })

    const unsubPlayers = onSnapshot(playersRef, (snap) => {
      const list: Player[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as PlayerDoc),
      }))
      // Sort: host first, then by join time
      list.sort((a, b) => {
        if (a.isHost && !b.isHost) return -1
        if (!a.isHost && b.isHost) return 1
        return 0
      })
      setPlayers(list)
    })

    return () => {
      unsubRoom()
      unsubPlayers()
    }
  }, [joinCode])

  return { room, players, loading }
}
