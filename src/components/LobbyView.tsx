import { useState } from 'react'
import type { Player } from '../types'
import { SCENARIOS } from '../game/scenarios'
import { hostStartGame } from '../hooks/useHostLogic'

interface Props {
  joinCode: string
  players: Player[]
  uid: string
  isHost: boolean
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: 'text-green-400 border-green-800',
  Easy: 'text-emerald-400 border-emerald-800',
  Medium: 'text-yellow-400 border-yellow-800',
  Hard: 'text-orange-400 border-orange-800',
  Expert: 'text-red-400 border-red-800',
}

export default function LobbyView({ joinCode, players, uid, isHost }: Props) {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0].id)
  const [starting, setStarting] = useState(false)

  async function handleStart() {
    if (!isHost || starting) return
    setStarting(true)
    try {
      await hostStartGame(joinCode, selectedScenario, players)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      {/* Join code banner */}
      <div className="text-center">
        <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Join Code</div>
        <div className="text-5xl font-black tracking-[0.3em] text-cyan-400 font-mono">
          {joinCode}
        </div>
        <div className="text-xs text-slate-500 mt-1">Share this code so others can join</div>
      </div>

      {/* Player list */}
      <div>
        <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">
          Players ({players.length} / 20)
        </div>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
                p.id === uid
                  ? 'border-cyan-600 bg-cyan-950 text-cyan-200'
                  : 'border-slate-700 bg-slate-900 text-slate-300',
              ].join(' ')}
            >
              <span
                className={[
                  'w-2 h-2 rounded-full',
                  p.id === uid ? 'bg-cyan-400' : 'bg-slate-500',
                ].join(' ')}
              />
              {p.displayName}
              {p.isHost && (
                <span className="text-[10px] text-yellow-500 font-bold ml-1">HOST</span>
              )}
              {p.id === uid && (
                <span className="text-[10px] text-slate-500 ml-1">(you)</span>
              )}
            </div>
          ))}
          {players.length === 0 && (
            <div className="text-slate-600 text-sm">No players yet…</div>
          )}
        </div>
      </div>

      {/* Scenario picker — only host sees this */}
      {isHost && (
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">
            Select Scenario
          </div>
          <div className="grid grid-cols-1 gap-2">
            {SCENARIOS.map((s) => {
              const diffStyle = DIFFICULTY_COLOR[s.difficulty] ?? 'text-slate-400 border-slate-700'
              const isSelected = selectedScenario === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(s.id)}
                  className={[
                    'text-left px-4 py-3 rounded-xl border-2 transition-all',
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950'
                      : 'border-slate-700 bg-slate-900 hover:border-slate-600',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{s.name}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] border px-1.5 py-0.5 rounded uppercase font-bold ${diffStyle}`}>
                        {s.difficulty}
                      </span>
                      <span className="text-[10px] text-yellow-400">
                        ⚡ {s.startBattery}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {s.gridW}×{s.gridH}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{s.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Non-host waiting message */}
      {!isHost && (
        <div className="text-center text-slate-400 text-sm animate-pulse">
          Waiting for the host to start the game…
        </div>
      )}

      {/* Start button */}
      {isHost && (
        <button
          onClick={handleStart}
          disabled={players.length === 0 || starting}
          className={[
            'w-full py-3 rounded-xl font-black text-lg uppercase tracking-widest transition-all',
            players.length > 0 && !starting
              ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_#06b6d4] cursor-pointer'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed',
          ].join(' ')}
        >
          {starting ? 'Starting…' : 'Start Game'}
        </button>
      )}
    </div>
  )
}
