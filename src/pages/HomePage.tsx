import { useState } from 'react'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { RoomDoc, PlayerDoc } from '../types'
import { isE2eMode } from '../testing/e2e'

interface Props {
  uid: string
  onEnterRoom: (joinCode: string) => void
}

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function HomePage({ uid, onEnterRoom }: Props) {
  const [displayName, setDisplayName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'create' | 'join'>('create')

  async function handleCreate() {
    const name = displayName.trim()
    if (!name) { setError('Enter your name first'); return }
    setLoading(true)
    setError('')

    try {
      if (isE2eMode()) {
        onEnterRoom(generateJoinCode())
        return
      }

      let code = generateJoinCode()
      // Regenerate if code already exists (unlikely but safe)
      let attempts = 0
      while (attempts < 5) {
        const existing = await getDoc(doc(db, 'rooms', code))
        if (!existing.exists()) break
        code = generateJoinCode()
        attempts++
      }

      const roomData: RoomDoc = {
        hostId: uid,
        phase: 'lobby',
        scenarioId: 'intro_circuit',
        battery: 0,
        maxBattery: 0,
        robotPos: { x: 0, y: 0, facing: 'E' },
        executionLog: [],
        submittedCount: 0,
        playerCount: 1,
        round: 0,
        createdAt: Date.now(),
      }
      await setDoc(doc(db, 'rooms', code), roomData)

      const playerData: PlayerDoc = {
        displayName: name,
        isHost: true,
        hasSubmitted: false,
        joinedAt: Date.now(),
      }
      await setDoc(doc(db, 'rooms', code, 'players', uid), playerData)

      onEnterRoom(code)
    } catch (e) {
      setError('Failed to create room. Check your Firebase config.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    const name = displayName.trim()
    const code = joinCode.trim().toUpperCase()
    if (!name) { setError('Enter your name first'); return }
    if (code.length !== 6) { setError('Join code must be 6 characters'); return }
    setLoading(true)
    setError('')

    try {
      if (isE2eMode()) {
        onEnterRoom(code)
        return
      }

      const roomSnap = await getDoc(doc(db, 'rooms', code))
      if (!roomSnap.exists()) {
        setError('Room not found. Check the code and try again.')
        return
      }
      const room = roomSnap.data() as RoomDoc
      if (room.phase !== 'lobby') {
        setError('That game is already in progress.')
        return
      }
      if (room.playerCount >= 20) {
        setError('Room is full (max 20 players).')
        return
      }

      const playerData: PlayerDoc = {
        displayName: name,
        isHost: false,
        hasSubmitted: false,
        joinedAt: Date.now(),
      }
      await setDoc(doc(db, 'rooms', code, 'players', uid), playerData)
      await updateDoc(doc(db, 'rooms', code), { playerCount: room.playerCount + 1 })

      onEnterRoom(code)
    } catch (e) {
      setError('Failed to join room. Check the code and try again.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-race-dark flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-6xl mb-3">🤖</div>
        <h1 className="text-4xl font-black tracking-tight text-white">
          Steering<span className="text-cyan-400"> Committee</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Cooperative robot programming — up to 20 players
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col gap-5">
        {/* Tabs */}
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          {(['create', 'join'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={[
                'flex-1 py-2 text-sm font-bold uppercase tracking-widest transition-colors',
                tab === t
                  ? 'bg-cyan-500 text-black'
                  : 'bg-transparent text-slate-400 hover:text-white',
              ].join(' ')}
            >
              {t === 'create' ? 'Create Game' : 'Join Game'}
            </button>
          ))}
        </div>

        {/* Name input */}
        <div>
          <label htmlFor="player-name" className="text-xs text-slate-400 uppercase tracking-widest block mb-1">
            Your Name
          </label>
          <input
            id="player-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
            maxLength={20}
            placeholder="Enter your name"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Join code input */}
        {tab === 'join' && (
          <div>
            <label htmlFor="join-code" className="text-xs text-slate-400 uppercase tracking-widest block mb-1">
              Join Code
            </label>
            <input
              id="join-code"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={6}
              placeholder="ABC123"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono text-xl tracking-widest uppercase text-center"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Action button */}
        <button
          onClick={tab === 'create' ? handleCreate : handleJoin}
          disabled={loading}
          className={[
            'w-full py-3 rounded-xl font-black text-base uppercase tracking-widest transition-all',
            !loading
              ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_16px_#06b6d4] cursor-pointer'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed',
          ].join(' ')}
        >
          {loading ? 'Loading…' : tab === 'create' ? 'Create Game' : 'Join Game'}
        </button>
      </div>

      <p className="mt-6 text-xs text-slate-600 text-center max-w-xs">
        No account needed. Games are cooperative — all players win or lose together.
      </p>
    </div>
  )
}
