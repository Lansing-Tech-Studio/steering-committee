import { useEffect, useRef, useState } from 'react'
import {
  doc,
  collection,
  getDocs,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { RoomDoc, Player, SubmissionDoc, HandDoc, CardType } from '../types'
import { dealHand, refillHand } from '../game/cards'
import { simulateQueue, type QueueEntry } from '../game/engine'
import { getScenario } from '../game/scenarios'
import { isE2eMode } from '../testing/e2e'

const STEP_DELAY_MS = 1800  // ms between each card's animation on client

interface Props {
  isHost: boolean
  joinCode: string
  room: RoomDoc | null
  players: Player[]
}

export function useHostLogic({ isHost, joinCode, room, players }: Props) {
  if (isE2eMode()) return

  // Track which rounds we've already processed to avoid double-firing
  const processedRoundRef = useRef<number>(-1)
  const executionInFlightRef = useRef(false)
  const dealingRef = useRef(false)
  const [executionRetryNonce, setExecutionRetryNonce] = useState(0)

  // ── Watch for all submissions received → trigger execution ──────────────────
  useEffect(() => {
    if (!isHost || !room) return
    if (room.phase !== 'programming') return
    if (room.playerCount === 0) return
    if (room.submittedCount < room.playerCount) return
    if (processedRoundRef.current === room.round) return
    if (executionInFlightRef.current) return

    const targetRound = room.round
    executionInFlightRef.current = true

    void runExecution(joinCode, room, players)
      .then(() => {
        // Mark only after a successful run so transient failures can retry.
        processedRoundRef.current = targetRound
      })
      .catch((err) => {
        console.error('[host] runExecution failed; will retry', err)
        setTimeout(() => {
          executionInFlightRef.current = false
          setExecutionRetryNonce((n) => n + 1)
        }, 1000)
      })
      .finally(() => {
        // Keep in-flight lock active during the delayed retry window.
        if (executionInFlightRef.current) {
          executionInFlightRef.current = false
        }
      })
  }, [isHost, joinCode, room, players, executionRetryNonce])

  // ── Watch for 'dealing' phase → deal hands ──────────────────────────────────
  useEffect(() => {
    if (!isHost || !room) return
    if (room.phase !== 'dealing') return
    if (dealingRef.current) return

    dealingRef.current = true
    void runDealing(joinCode, players)
      .catch((err) => {
        console.error('[host] runDealing failed', err)
      })
      .finally(() => {
        dealingRef.current = false
      })
  }, [isHost, joinCode, room, players])
}

// ─── Dealing ─────────────────────────────────────────────────────────────────

async function runDealing(joinCode: string, players: Player[]) {
  // Read existing hands and refill each player's hand to HAND_SIZE
  const batch = writeBatch(db)

  for (const player of players) {
    const handRef = doc(db, 'rooms', joinCode, 'hands', player.id)
    const handSnap = await getDocs(collection(db, 'rooms', joinCode, 'hands'))
    const existing = handSnap.docs.find((d) => d.id === player.id)
    const existingCards: CardType[] = existing ? (existing.data() as HandDoc).cards : []

    // Fill up to HAND_SIZE; if no hand yet, deal fresh
    let cards = existingCards.length > 0 ? [...existingCards] : dealHand()
    while (cards.length < 5) {
      cards = dealHand()
    }

    batch.set(handRef, { cards })
  }

  // Clear all previous submissions
  const submissionsSnap = await getDocs(collection(db, 'rooms', joinCode, 'submissions'))
  for (const d of submissionsSnap.docs) {
    batch.delete(doc(db, 'rooms', joinCode, 'submissions', d.id))
  }

  // Reset hasSubmitted on all players
  for (const player of players) {
    const playerRef = doc(db, 'rooms', joinCode, 'players', player.id)
    batch.update(playerRef, { hasSubmitted: false })
  }

  // Advance to programming phase
  const roomRef = doc(db, 'rooms', joinCode)
  batch.update(roomRef, {
    phase: 'programming',
    submittedCount: 0,
    executionLog: [],
  })

  await batch.commit()
}

// ─── Execution ────────────────────────────────────────────────────────────────

async function runExecution(joinCode: string, room: RoomDoc, players: Player[]) {
  // Read all submissions
  const submissionsSnap = await getDocs(collection(db, 'rooms', joinCode, 'submissions'))
  const handsSnap = await getDocs(collection(db, 'rooms', joinCode, 'hands'))

  const handMap = new Map<string, CardType[]>()
  for (const d of handsSnap.docs) {
    handMap.set(d.id, (d.data() as HandDoc).cards)
  }

  // Build queue entries from submissions
  const queue: QueueEntry[] = []
  const usedCardIndices = new Map<string, number>()

  for (const sub of submissionsSnap.docs) {
    const playerId = sub.id
    const { cardIndex } = sub.data() as SubmissionDoc
    const hand = handMap.get(playerId)
    if (!hand || cardIndex >= hand.length) continue

    const player = players.find((p) => p.id === playerId)
    queue.push({
      playerId,
      playerName: player?.displayName ?? 'Player',
      cardType: hand[cardIndex],
    })
    usedCardIndices.set(playerId, cardIndex)
  }

  // Shuffle the queue (random order is the fun/chaos)
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[queue[i], queue[j]] = [queue[j], queue[i]]
  }

  const scenario = getScenario(room.scenarioId)
  const { log, finalPos, reachedGoal, fellIntoPit } = simulateQueue(
    room.robotPos,
    queue,
    scenario,
  )

  const batteryDrain = queue.length
  const newBattery = Math.max(0, room.battery - batteryDrain)

  // Determine next phase
  let nextPhase: RoomDoc['phase']
  if (reachedGoal) {
    nextPhase = 'win'
  } else if (fellIntoPit || newBattery === 0) {
    nextPhase = 'lose'
  } else {
    nextPhase = 'executing'  // will advance to 'dealing' after animation
  }

  const roomRef = doc(db, 'rooms', joinCode)
  await updateDoc(roomRef, {
    phase: 'executing',
    executionLog: log,
    robotPos: finalPos,
    battery: newBattery,
  })

  // After animation completes on clients, advance to next phase
  const animDuration = queue.length * STEP_DELAY_MS + 1000
  await new Promise((r) => setTimeout(r, animDuration))

  if (nextPhase === 'win' || nextPhase === 'lose') {
    await updateDoc(roomRef, { phase: nextPhase })
    return
  }

  // Update hands: refill each player's played card
  const batch = writeBatch(db)
  for (const [playerId, cardIndex] of usedCardIndices.entries()) {
    const hand = handMap.get(playerId)
    if (!hand) continue
    const newHand = refillHand(hand, cardIndex)
    batch.set(doc(db, 'rooms', joinCode, 'hands', playerId), { cards: newHand })
  }

  // Clear submissions, reset hasSubmitted
  for (const sub of submissionsSnap.docs) {
    batch.delete(doc(db, 'rooms', joinCode, 'submissions', sub.id))
  }
  for (const player of players) {
    batch.update(doc(db, 'rooms', joinCode, 'players', player.id), { hasSubmitted: false })
  }

  batch.update(roomRef, {
    phase: 'programming',
    submittedCount: 0,
    round: room.round + 1,
    executionLog: [],
  })

  await batch.commit()
}

// ─── Exported helpers for host-initiated actions ──────────────────────────────

/** Host starts the game from lobby */
export async function hostStartGame(
  joinCode: string,
  scenarioId: string,
  players: Player[],
) {
  const scenario = getScenario(scenarioId)
  const batch = writeBatch(db)

  // Deal initial hands
  for (const player of players) {
    const handRef = doc(db, 'rooms', joinCode, 'hands', player.id)
    batch.set(handRef, { cards: dealHand() })
  }

  const roomRef = doc(db, 'rooms', joinCode)
  batch.update(roomRef, {
    phase: 'programming',
    scenarioId,
    battery: scenario.startBattery,
    maxBattery: scenario.startBattery,
    robotPos: scenario.startPos,
    executionLog: [],
    submittedCount: 0,
    playerCount: players.length,
    round: 1,
  })

  await batch.commit()
}

/** Host resets the game back to lobby for a rematch */
export async function hostResetToLobby(joinCode: string) {
  const roomRef = doc(db, 'rooms', joinCode)
  await updateDoc(roomRef, {
    phase: 'lobby',
    executionLog: [],
    submittedCount: 0,
    round: 0,
  })
}
