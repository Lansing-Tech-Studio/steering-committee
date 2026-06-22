import { useEffect, useRef, useState } from 'react'
import type { ExecutionStep } from '../types'
import { CARD_META } from '../game/cards'

interface Props {
  executionLog: ExecutionStep[]
  onDone: () => void
}

const STEP_MS = 1800

export default function ExecutionReplay({ executionLog, onDone }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doneRef = useRef(false)

  useEffect(() => {
    doneRef.current = false
    setStepIndex(0)
  }, [executionLog])

  useEffect(() => {
    if (executionLog.length === 0) return
    if (doneRef.current) return

    if (stepIndex < executionLog.length) {
      timerRef.current = setTimeout(() => {
        setStepIndex((s) => s + 1)
      }, STEP_MS)
    } else if (!doneRef.current) {
      doneRef.current = true
      onDone()
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [stepIndex, executionLog, onDone])

  const currentStep = stepIndex < executionLog.length ? executionLog[stepIndex] : null

  return (
    <div className="flex flex-col gap-2">
      {/* Current card callout */}
      {currentStep && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-700 animate-[fadeIn_0.3s_ease]">
          <span className="text-2xl">{CARD_META[currentStep.cardType].icon}</span>
          <div>
            <div className="text-cyan-300 text-sm font-bold">
              {currentStep.playerName}
            </div>
            <div className="text-slate-400 text-xs">
              plays <span className="text-white">{CARD_META[currentStep.cardType].label}</span>
              {currentStep.hitWall && (
                <span className="text-yellow-400 ml-1">— hits a wall!</span>
              )}
              {currentStep.fellIntoPit && (
                <span className="text-red-400 ml-1">— fell into a pit!</span>
              )}
              {currentStep.reachedGoal && (
                <span className="text-green-400 ml-1">— reached the goal!</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress through log */}
      <div className="flex flex-wrap gap-1">
        {executionLog.map((step, i) => {
          const meta = CARD_META[step.cardType]
          const done = i < stepIndex
          const current = i === stepIndex
          return (
            <div
              key={i}
              className={[
                'px-2 py-1 rounded text-[10px] border transition-all',
                done
                  ? 'border-slate-700 bg-slate-800 text-slate-500'
                  : current
                  ? 'border-cyan-500 bg-cyan-950 text-cyan-300 scale-110'
                  : 'border-slate-800 bg-slate-900 text-slate-600',
              ].join(' ')}
              title={`${step.playerName}: ${meta.label}`}
            >
              {meta.icon}
            </div>
          )
        })}
      </div>
    </div>
  )
}
