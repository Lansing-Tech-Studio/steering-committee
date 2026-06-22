import type { Scenario } from '../types'

/**
 * Hand-crafted scenarios.
 *
 * Grid coordinate system: (0,0) = top-left, x grows right, y grows down.
 * Walls are placed on named sides of cells — 'N' = top edge, 'S' = bottom, etc.
 * startBattery is tuned so a team of ~8 players has roughly 3–5 meaningful rounds.
 * For larger teams the battery drains faster, increasing urgency.
 */
export const SCENARIOS: Scenario[] = [
  // ─── 1. Intro Circuit ─────────────────────────────────────────────────────
  {
    id: 'intro_circuit',
    name: 'Intro Circuit',
    description: 'A gentle warm-up. Drive straight east and park in the charging bay.',
    difficulty: 'Beginner',
    gridW: 8,
    gridH: 6,
    startPos: { x: 1, y: 2, facing: 'E' },
    goalPos: { x: 6, y: 2 },
    walls: [
      // Outer boundary walls are implicit (out-of-bounds treated as wall)
      // Central divider — forces a short detour if you overshoot
      { x: 4, y: 1, side: 'S' },
      { x: 4, y: 2, side: 'N' },
    ],
    pits: [],
    startBattery: 40,
  },

  // ─── 2. Left Turn Ahead ───────────────────────────────────────────────────
  {
    id: 'left_turn_ahead',
    name: 'Left Turn Ahead',
    description: 'The charging bay is to the north. You\'ll need to turn before you get there.',
    difficulty: 'Easy',
    gridW: 8,
    gridH: 8,
    startPos: { x: 1, y: 5, facing: 'E' },
    goalPos: { x: 5, y: 1 },
    walls: [
      { x: 5, y: 5, side: 'E' },
      { x: 5, y: 4, side: 'E' },
      { x: 5, y: 3, side: 'E' },
      { x: 6, y: 5, side: 'W' },
      { x: 6, y: 4, side: 'W' },
      { x: 6, y: 3, side: 'W' },
    ],
    pits: [
      { x: 3, y: 1 },
      { x: 3, y: 2 },
    ],
    startBattery: 45,
  },

  // ─── 3. The Gauntlet ──────────────────────────────────────────────────────
  {
    id: 'the_gauntlet',
    name: 'The Gauntlet',
    description: 'A narrow obstacle course. Three turns minimum. No room for error.',
    difficulty: 'Medium',
    gridW: 10,
    gridH: 10,
    startPos: { x: 1, y: 1, facing: 'E' },
    goalPos: { x: 8, y: 8 },
    walls: [
      // Horizontal corridor forcing first right turn
      { x: 3, y: 1, side: 'E' },
      { x: 4, y: 1, side: 'W' },
      // Drop down the right side
      { x: 3, y: 4, side: 'S' },
      { x: 3, y: 5, side: 'N' },
      // Go right again
      { x: 7, y: 4, side: 'E' },
      { x: 8, y: 4, side: 'W' },
      // Force south to goal
      { x: 7, y: 7, side: 'S' },
      { x: 7, y: 8, side: 'N' },
    ],
    pits: [
      { x: 5, y: 1 },
      { x: 5, y: 2 },
      { x: 5, y: 5 },
      { x: 6, y: 5 },
    ],
    startBattery: 55,
  },

  // ─── 4. Pit Row ────────────────────────────────────────────────────────────
  {
    id: 'pit_row',
    name: 'Pit Row',
    description: 'Pits line the direct path. Navigate around them without falling in.',
    difficulty: 'Hard',
    gridW: 10,
    gridH: 10,
    startPos: { x: 0, y: 5, facing: 'E' },
    goalPos: { x: 9, y: 5 },
    walls: [
      { x: 3, y: 3, side: 'S' },
      { x: 3, y: 4, side: 'N' },
      { x: 6, y: 6, side: 'N' },
      { x: 6, y: 5, side: 'S' },
    ],
    pits: [
      { x: 3, y: 5 },
      { x: 4, y: 5 },
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 3, y: 4 },
      { x: 6, y: 6 },
    ],
    startBattery: 50,
  },

  // ─── 5. Championship Circuit ───────────────────────────────────────────────
  {
    id: 'championship_circuit',
    name: 'Championship Circuit',
    description: 'The ultimate test. A sprawling course demanding precision from every team member.',
    difficulty: 'Expert',
    gridW: 12,
    gridH: 12,
    startPos: { x: 1, y: 10, facing: 'N' },
    goalPos: { x: 10, y: 1 },
    walls: [
      // Vertical section going north
      { x: 1, y: 6, side: 'E' },
      { x: 2, y: 6, side: 'W' },
      // Turn east
      { x: 1, y: 3, side: 'N' },
      { x: 1, y: 2, side: 'S' },
      // Blocked east path — must go around
      { x: 5, y: 3, side: 'E' },
      { x: 6, y: 3, side: 'W' },
      // Force north again
      { x: 6, y: 1, side: 'E' },
      { x: 7, y: 1, side: 'W' },
      // Final approach
      { x: 9, y: 3, side: 'N' },
      { x: 9, y: 2, side: 'S' },
    ],
    pits: [
      { x: 3, y: 8 },
      { x: 4, y: 8 },
      { x: 3, y: 6 },
      { x: 5, y: 5 },
      { x: 7, y: 4 },
      { x: 8, y: 4 },
      { x: 9, y: 7 },
      { x: 10, y: 7 },
    ],
    startBattery: 70,
  },
]

export function getScenario(id: string): Scenario {
  const s = SCENARIOS.find((s) => s.id === id)
  if (!s) throw new Error(`Unknown scenario: ${id}`)
  return s
}
