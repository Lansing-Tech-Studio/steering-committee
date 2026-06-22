import type { Player } from '../types'

interface Props {
  players: Player[]
  submittedCount: number
  playerCount: number
}

export default function ProgramQueue({ players, submittedCount, playerCount }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-widest mb-1">
        <span>Program Queue</span>
        <span className="text-cyan-400 font-bold">
          {submittedCount} / {playerCount}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <div
            key={p.id}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all',
              p.hasSubmitted
                ? 'border-cyan-600 bg-cyan-950 text-cyan-300'
                : 'border-slate-700 bg-slate-900 text-slate-400',
            ].join(' ')}
            title={p.hasSubmitted ? 'Card locked in' : 'Still thinking…'}
          >
            <span
              className={[
                'w-2 h-2 rounded-full',
                p.hasSubmitted ? 'bg-cyan-400' : 'bg-slate-600',
              ].join(' ')}
            />
            <span className="max-w-[80px] truncate">{p.displayName}</span>
            {p.isHost && <span className="text-[9px] text-yellow-500">HOST</span>}
            {p.hasSubmitted && <span className="text-[9px] text-cyan-500">✓</span>}
          </div>
        ))}
      </div>

      {submittedCount === playerCount && playerCount > 0 && (
        <div className="text-center text-cyan-400 text-xs animate-pulse mt-1">
          All cards locked in — executing…
        </div>
      )}
    </div>
  )
}
