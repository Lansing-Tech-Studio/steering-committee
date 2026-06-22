import type { CardType } from '../types'

// ─── Card metadata ─────────────────────────────────────────────────────────────

export interface CardMeta {
  type: CardType
  label: string
  icon: string          // emoji for quick rendering; SVG used in Hand component
  description: string
}

export const CARD_META: Record<CardType, CardMeta> = {
  Move1: {
    type: 'Move1',
    label: 'Drive 1',
    icon: '⬆',
    description: 'Move forward 1 space',
  },
  Move2: {
    type: 'Move2',
    label: 'Drive 2',
    icon: '⬆⬆',
    description: 'Move forward 2 spaces',
  },
  Move3: {
    type: 'Move3',
    label: 'Drive 3',
    icon: '⬆⬆⬆',
    description: 'Move forward 3 spaces',
  },
  TurnLeft: {
    type: 'TurnLeft',
    label: 'Turn Left',
    icon: '↺',
    description: 'Rotate 90° counter-clockwise',
  },
  TurnRight: {
    type: 'TurnRight',
    label: 'Turn Right',
    icon: '↻',
    description: 'Rotate 90° clockwise',
  },
  UTurn: {
    type: 'UTurn',
    label: 'U-Turn',
    icon: '↩',
    description: 'Rotate 180°',
  },
  Reverse1: {
    type: 'Reverse1',
    label: 'Reverse',
    icon: '⬇',
    description: 'Move backward 1 space',
  },
}

// ─── Deck weights (cumulative, must sum to 100) ────────────────────────────────

const DECK_WEIGHTS: { card: CardType; weight: number }[] = [
  { card: 'Move1',     weight: 26 },
  { card: 'Move2',     weight: 18 },
  { card: 'Move3',     weight: 10 },
  { card: 'TurnLeft',  weight: 20 },
  { card: 'TurnRight', weight: 18 },
  { card: 'UTurn',     weight: 4  },
  { card: 'Reverse1',  weight: 4  },
]

function randomCard(): CardType {
  const r = Math.random() * 100
  let cumulative = 0
  for (const { card, weight } of DECK_WEIGHTS) {
    cumulative += weight
    if (r < cumulative) return card
  }
  return 'Move1'
}

export const HAND_SIZE = 5

/** Deal a fresh hand of HAND_SIZE random cards */
export function dealHand(): CardType[] {
  return Array.from({ length: HAND_SIZE }, randomCard)
}

/**
 * Refill a hand back up to HAND_SIZE after a card at `playedIndex` was used.
 * Returns the new hand (played card replaced with a fresh random card).
 */
export function refillHand(hand: CardType[], playedIndex: number): CardType[] {
  const next = [...hand]
  next[playedIndex] = randomCard()
  return next
}
