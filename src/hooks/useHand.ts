import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { CardType, HandDoc } from '../types'
import { isE2eMode } from '../testing/e2e'

const DEMO_HAND: CardType[] = ['Move1', 'TurnRight', 'Move2', 'Move1', 'UTurn']

export function useHand(joinCode: string, uid: string): CardType[] {
  const [cards, setCards] = useState<CardType[]>([])

  useEffect(() => {
    if (!joinCode || !uid) return

    if (isE2eMode()) {
      setCards(DEMO_HAND)
      return
    }

    const handRef = doc(db, 'rooms', joinCode, 'hands', uid)
    const unsub = onSnapshot(handRef, (snap) => {
      if (snap.exists()) {
        setCards((snap.data() as HandDoc).cards)
      } else {
        setCards([])
      }
    })

    return unsub
  }, [joinCode, uid])

  return cards
}
