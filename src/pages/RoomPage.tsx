import { useEffect, useState } from 'react'
import { useRoom } from '../hooks/useRoom'
import { useHand } from '../hooks/useHand'
import { useHostLogic, hostResetToLobby } from '../hooks/useHostLogic'
import { getScenario } from '../game/scenarios'
import GameGrid from '../components/GameGrid'
import Hand from '../components/Hand'
import ProgramQueue from '../components/ProgramQueue'
import ExecutionReplay from '../components/ExecutionReplay'
import LobbyView from '../components/LobbyView'
import BatteryBar from '../components/BatteryBar'
import type { ExecutionStep } from '../types'

interface Props {
  joinCode: string
  uid: string
  onLeave: () => void
}

export default function RoomPage({ joinCode, uid, onLeave }: Props) {
  const { room, players, loading } = useRoom(joinCode)
  const hand = useHand(joinCode, uid)
  const isHost = room?.hostId === uid
  const [animDone, setAnimDone] = useState(false)
  const [currentAnimStep, setCurrentAnimStep] = useState<ExecutionStep | null>(null)

  useHostLogic({ isHost, joinCode, room, players })

  // Reset animation state when a new execution log arrives
  useEffect(() => {
    if (room?.phase === 'executing') {
      setAnimDone(false)
      setCurrentAnimStep(null)
    }
  }, [room?.phase, room?.executionLog])

  // Update robot position display during animation
  useEffect(() => {
    if (!room?.executionLog?.length) return
    if (currentAnimStep) return  // already set
  }, [room?.executionLog, currentAnimStep])

  const myPlayer = players.find((p) => p.id === uid)

  if (loading) {
    return (
      <div className="min-h-screen bg-race-dark flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">Loading room…</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-race-dark flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-lg">Room not found.</div>
        <button
          onClick={onLeave}
          className="text-slate-400 hover:text-white underline text-sm"
        >
          Back to home
        </button>
      </div>
    )
  }

  // ── Lobby ──────────────────────────────────────────────────────────────────
  if (room.phase === 'lobby') {
    return (
      <div className="min-h-screen bg-race-dark flex flex-col items-center justify-center px-4 py-8">
        <LobbyView joinCode={joinCode} players={players} uid={uid} isHost={isHost} />
        <button
          onClick={onLeave}
          className="mt-6 text-slate-600 hover:text-slate-400 text-xs underline"
        >
          Leave room
        </button>
      </div>
    )
  }

  // ── Dealing ────────────────────────────────────────────────────────────────
  if (room.phase === 'dealing') {
    return (
      <div className="min-h-screen bg-race-dark flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">Dealing cards…</div>
      </div>
    )
  }

  // ── Win / Lose ─────────────────────────────────────────────────────────────
  if (room.phase === 'win' || room.phase === 'lose') {
    const won = room.phase === 'win'
    return (
      <div className="min-h-screen bg-race-dark flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-7xl">{won ? '🏆' : '💀'}</div>
        <h2
          className={[
            'text-4xl font-black tracking-tight',
            won ? 'text-green-400' : 'text-red-400',
          ].join(' ')}
        >
          {won ? 'Goal Reached!' : 'Out of Power'}
        </h2>
        <p className="text-slate-400 text-center max-w-sm">
          {won
            ? 'The robot made it to the charging station. Great teamwork!'
            : 'The battery ran out before reaching the goal. Better luck next round!'}
        </p>
        {isHost && (
          <button
            onClick={async () => {
              await hostResetToLobby(joinCode)
            }}
            className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl uppercase tracking-widest shadow-[0_0_16px_#06b6d4] transition-all cursor-pointer"
          >
            Play Again
          </button>
        )}
        {!isHost && (
          <div className="text-slate-500 text-sm animate-pulse">
            Waiting for host to start another game…
          </div>
        )}
        <button
          onClick={onLeave}
          className="text-slate-600 hover:text-slate-400 text-xs underline"
        >
          Leave room
        </button>
      </div>
    )
  }

  // ── Programming / Executing ────────────────────────────────────────────────
  let scenario
  try {
    scenario = getScenario(room.scenarioId)
  } catch {
    return (
      <div className="min-h-screen bg-race-dark flex items-center justify-center text-red-400">
        Unknown scenario. Please restart the game.
      </div>
    )
  }

  const isExecuting = room.phase === 'executing'

  return (
    <div className="min-h-screen bg-race-dark flex flex-col">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-sm">Steering Committee</span>
          <span className="text-xs text-slate-500 font-mono">{joinCode}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Round {room.round}</span>
          <span
            className={[
              'text-xs px-2 py-0.5 rounded-full border font-bold uppercase',
              isExecuting
                ? 'border-yellow-600 text-yellow-400'
                : 'border-cyan-700 text-cyan-400',
            ].join(' ')}
          >
            {isExecuting ? 'Executing' : 'Programming'}
          </span>
        </div>
      </div>

      {/* ── Battery bar ── */}
      <div className="px-4 py-2 border-b border-slate-800">
        <BatteryBar battery={room.battery} maxBattery={room.maxBattery} />
      </div>

      {/* ── No-comms rule banner (programming phase only) ── */}
      {room.phase === 'programming' && (
        <div className="px-4 py-2 bg-amber-950 border-b border-amber-800 text-center">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
            🔇 No communication — choose your card in silence
          </span>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 gap-4 p-4 overflow-auto flex-wrap justify-center">
        {/* Grid */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-slate-500 uppercase tracking-widest">
            {scenario.name}
          </div>
          <GameGrid
            scenario={scenario}
            robotPos={room.robotPos}
            animating={isExecuting}
          />
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4 min-w-[280px] max-w-sm flex-1">
          {/* Program queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <ProgramQueue
              players={players}
              submittedCount={room.submittedCount}
              playerCount={room.playerCount}
            />
          </div>

          {/* Execution replay */}
          {isExecuting && room.executionLog.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-3">
                Executing Program
              </div>
              <ExecutionReplay
                executionLog={room.executionLog}
                onDone={() => setAnimDone(true)}
              />
              {animDone && (
                <div className="text-center text-slate-400 text-xs mt-2 animate-pulse">
                  Preparing next round…
                </div>
              )}
            </div>
          )}

          {/* Hand */}
          {room.phase === 'programming' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <Hand
                cards={hand}
                joinCode={joinCode}
                uid={uid}
                hasSubmitted={myPlayer?.hasSubmitted ?? false}
                phase={room.phase}
              />
            </div>
          )}

          {/* Waiting indicator during execution */}
          {isExecuting && (
            <div className="text-center text-slate-500 text-xs">
              {isHost ? 'Running program…' : 'Watching the robot…'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
