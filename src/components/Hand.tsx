import { useState } from 'react'
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../firebase'
import type { CardType } from '../types'
import { CARD_META } from '../game/cards'

interface Props {
  cards: CardType[]
  joinCode: string
  uid: string
  hasSubmitted: boolean
  phase: string
}

export default function Hand({ cards, joinCode, uid, hasSubmitted, phase }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canPlay = phase === 'programming' && !hasSubmitted

  async function handleSubmit() {
    if (selected === null || !canPlay || submitting) return
    setSubmitting(true)
    try {
      await setDoc(doc(db, 'rooms', joinCode, 'submissions', uid), {
        cardIndex: selected,
      })
      await updateDoc(doc(db, 'rooms', joinCode, 'players', uid), {
        hasSubmitted: true,
      })
      await updateDoc(doc(db, 'rooms', joinCode), {
        submittedCount: increment(1),
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!canPlay && !hasSubmitted) return null

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-xs text-slate-400 uppercase tracking-widest">
        {hasSubmitted ? 'Card submitted — waiting for others…' : 'Your hand — pick one card'}
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {cards.map((card, i) => {
          const meta = CARD_META[card]
          const isSelected = selected === i

          return (
            <button
              key={i}
              onClick={() => !hasSubmitted && setSelected(i)}
              disabled={hasSubmitted}
              className={[
                'relative w-20 h-28 rounded-xl border-2 flex flex-col items-center justify-center gap-1',
                'transition-all duration-150 select-none',
                hasSubmitted
                  ? 'opacity-50 cursor-default border-slate-700 bg-slate-900'
                  : isSelected
                  ? 'border-cyan-400 bg-cyan-950 shadow-[0_0_12px_#06b6d4aa] scale-105 cursor-pointer'
                  : 'border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800 cursor-pointer',
              ].join(' ')}
            >
              {/* Card back overlay when submitted */}
              {hasSubmitted && (
                <div className="absolute inset-0 rounded-xl bg-slate-800 flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
              )}
              <span className="text-2xl">{meta.icon}</span>
              <span className="text-[10px] text-center text-slate-300 font-medium leading-tight px-1">
                {meta.label}
              </span>
            </button>
          )
        })}
      </div>

      {!hasSubmitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null || submitting}
          className={[
            'px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-widest transition-all',
            selected !== null && !submitting
              ? 'bg-cyan-500 hover:bg-cyan-400 text-black cursor-pointer shadow-[0_0_12px_#06b6d4]'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed',
          ].join(' ')}
        >
          {submitting ? 'Locking in…' : 'Lock In Card'}
        </button>
      )}
    </div>
  )
}
