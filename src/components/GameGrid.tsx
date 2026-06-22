import type { RobotPos, Scenario, ExecutionStep } from '../types'

const CELL = 48        // px per grid cell
const WALL_W = 5       // wall thickness
const BORDER = 2       // outer border

interface Props {
  scenario: Scenario
  robotPos: RobotPos
  executionStep?: ExecutionStep | null  // currently animating step
  animating: boolean
}

export default function GameGrid({ scenario, robotPos, animating }: Props) {
  const { gridW, gridH, goalPos, pits, walls, startPos } = scenario

  const svgW = gridW * CELL + BORDER * 2
  const svgH = gridH * CELL + BORDER * 2

  function cx(col: number) { return BORDER + col * CELL }
  function cy(row: number) { return BORDER + row * CELL }

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      className="max-w-full"
      style={{ maxHeight: 'calc(100vh - 280px)' }}
    >
      {/* ── Background ── */}
      <rect x={0} y={0} width={svgW} height={svgH} fill="#0f0f1a" rx={6} />

      {/* ── Outer border ── */}
      <rect
        x={BORDER / 2}
        y={BORDER / 2}
        width={svgW - BORDER}
        height={svgH - BORDER}
        fill="none"
        stroke="#06b6d4"
        strokeWidth={BORDER}
        rx={4}
      />

      {/* ── Grid cells ── */}
      {Array.from({ length: gridH }, (_, row) =>
        Array.from({ length: gridW }, (_, col) => (
          <rect
            key={`cell-${col}-${row}`}
            x={cx(col)}
            y={cy(row)}
            width={CELL}
            height={CELL}
            fill="none"
            stroke="#1e293b"
            strokeWidth={1}
          />
        ))
      )}

      {/* ── Pit cells ── */}
      {pits.map((p, i) => (
        <g key={`pit-${i}`}>
          <rect
            x={cx(p.x) + 2}
            y={cy(p.y) + 2}
            width={CELL - 4}
            height={CELL - 4}
            fill="#1a0a0a"
            rx={3}
          />
          {/* X marks the pit */}
          <line
            x1={cx(p.x) + 8}
            y1={cy(p.y) + 8}
            x2={cx(p.x) + CELL - 8}
            y2={cy(p.y) + CELL - 8}
            stroke="#ef4444"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <line
            x1={cx(p.x) + CELL - 8}
            y1={cy(p.y) + 8}
            x2={cx(p.x) + 8}
            y2={cy(p.y) + CELL - 8}
            stroke="#ef4444"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* ── Start marker ── */}
      <rect
        x={cx(startPos.x) + 2}
        y={cy(startPos.y) + 2}
        width={CELL - 4}
        height={CELL - 4}
        fill="#0c1a0c"
        rx={3}
      />
      <text
        x={cx(startPos.x) + CELL / 2}
        y={cy(startPos.y) + CELL / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={10}
        fill="#4ade80"
        fontFamily="monospace"
      >
        START
      </text>

      {/* ── Goal cell ── */}
      <rect
        x={cx(goalPos.x) + 2}
        y={cy(goalPos.y) + 2}
        width={CELL - 4}
        height={CELL - 4}
        fill="#0c1714"
        rx={3}
      />
      {/* Charging symbol */}
      <text
        x={cx(goalPos.x) + CELL / 2}
        y={cy(goalPos.y) + CELL / 2 + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={20}
      >
        ⚡
      </text>

      {/* ── Walls ── */}
      {walls.map((w, i) => {
        const x1 = cx(w.x)
        const y1 = cy(w.y)
        type WallCoords = { x1: number; y1: number; x2: number; y2: number }
        const coords: Record<string, WallCoords> = {
          N: { x1, y1, x2: x1 + CELL, y2: y1 },
          S: { x1, y1: y1 + CELL, x2: x1 + CELL, y2: y1 + CELL },
          W: { x1, y1, x2: x1, y2: y1 + CELL },
          E: { x1: x1 + CELL, y1, x2: x1 + CELL, y2: y1 + CELL },
        }
        const c = coords[w.side]
        return (
          <line
            key={`wall-${i}`}
            x1={c.x1}
            y1={c.y1}
            x2={c.x2}
            y2={c.y2}
            stroke="#f59e0b"
            strokeWidth={WALL_W}
            strokeLinecap="square"
          />
        )
      })}

      {/* ── Robot ── */}
      <RobotIcon
        x={cx(robotPos.x)}
        y={cy(robotPos.y)}
        facing={robotPos.facing}
        animating={animating}
      />
    </svg>
  )
}

// ─── Robot SVG ────────────────────────────────────────────────────────────────

interface RobotIconProps {
  x: number
  y: number
  facing: RobotPos['facing']
  animating: boolean
}

const FACING_ROTATION: Record<RobotPos['facing'], number> = {
  N: 0,
  E: 90,
  S: 180,
  W: 270,
}

function RobotIcon({ x, y, facing, animating }: RobotIconProps) {
  const cx = x + CELL / 2
  const cy = y + CELL / 2
  const rot = FACING_ROTATION[facing]

  return (
    <g
      transform={`translate(${cx}, ${cy}) rotate(${rot})`}
      style={{ transition: 'transform 0.4s ease' }}
    >
      {/* Glow */}
      {animating && (
        <circle r={20} fill="#06b6d4" opacity={0.15}>
          <animate attributeName="r" values="18;22;18" dur="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.15;0.3;0.15" dur="0.8s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Body */}
      <rect x={-16} y={-20} width={32} height={40} rx={5} fill="#06b6d4" />

      {/* Left wheel */}
      <rect x={-22} y={-14} width={8} height={12} rx={2} fill="#0e7490" />
      {/* Right wheel */}
      <rect x={14} y={-14} width={8} height={12} rx={2} fill="#0e7490" />
      {/* Left rear wheel */}
      <rect x={-22} y={4} width={8} height={12} rx={2} fill="#0e7490" />
      {/* Right rear wheel */}
      <rect x={14} y={4} width={8} height={12} rx={2} fill="#0e7490" />

      {/* Direction arrow */}
      <polygon points="0,-14 8,-2 -8,-2" fill="#fbbf24" />

      {/* Headlights */}
      <circle cx={-10} cy={-18} r={3} fill="#fef08a" opacity={0.9} />
      <circle cx={10} cy={-18} r={3} fill="#fef08a" opacity={0.9} />
    </g>
  )
}
