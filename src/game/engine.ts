import type { CardType, Direction, RobotPos, Scenario, ExecutionStep } from '../types'

// ─── Direction math ────────────────────────────────────────────────────────────

const DIRS: Direction[] = ['N', 'E', 'S', 'W']

function turnRight(d: Direction): Direction {
  return DIRS[(DIRS.indexOf(d) + 1) % 4]
}

function turnLeft(d: Direction): Direction {
  return DIRS[(DIRS.indexOf(d) + 3) % 4]
}

function uTurn(d: Direction): Direction {
  return DIRS[(DIRS.indexOf(d) + 2) % 4]
}

function delta(d: Direction): { dx: number; dy: number } {
  switch (d) {
    case 'N': return { dx: 0, dy: -1 }
    case 'E': return { dx: 1, dy: 0 }
    case 'S': return { dx: 0, dy: 1 }
    case 'W': return { dx: -1, dy: 0 }
  }
}

// ─── Wall collision helpers ────────────────────────────────────────────────────

/**
 * Returns true if a wall blocks movement from cell (x,y) in direction d.
 * Checks the wall on the exit side of (x,y) AND the corresponding entry wall
 * on the adjacent cell.
 */
function isWallBlocking(
  x: number,
  y: number,
  d: Direction,
  walls: Scenario['walls'],
): boolean {
  // Wall on the exit face of current cell
  const exitWall = walls.some((w) => w.x === x && w.y === y && w.side === d)
  if (exitWall) return true

  // Complementary wall on the entry face of the adjacent cell
  const { dx, dy } = delta(d)
  const nx = x + dx
  const ny = y + dy
  const opposites: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' }
  const entryWall = walls.some((w) => w.x === nx && w.y === ny && w.side === opposites[d])
  return entryWall
}

function isOutOfBounds(x: number, y: number, scenario: Scenario): boolean {
  return x < 0 || y < 0 || x >= scenario.gridW || y >= scenario.gridH
}

function isPit(x: number, y: number, scenario: Scenario): boolean {
  return scenario.pits.some((p) => p.x === x && p.y === y)
}

function isGoal(x: number, y: number, scenario: Scenario): boolean {
  return scenario.goalPos.x === x && scenario.goalPos.y === y
}

// ─── Single card simulation ────────────────────────────────────────────────────

export interface StepResult {
  pos: RobotPos
  hitWall: boolean
  fellIntoPit: boolean
  reachedGoal: boolean
}

export function simulateCard(
  pos: RobotPos,
  card: CardType,
  scenario: Scenario,
): StepResult {
  let cur = { ...pos }

  // Rotation cards — no movement
  if (card === 'TurnLeft') {
    return { pos: { ...cur, facing: turnLeft(cur.facing) }, hitWall: false, fellIntoPit: false, reachedGoal: false }
  }
  if (card === 'TurnRight') {
    return { pos: { ...cur, facing: turnRight(cur.facing) }, hitWall: false, fellIntoPit: false, reachedGoal: false }
  }
  if (card === 'UTurn') {
    return { pos: { ...cur, facing: uTurn(cur.facing) }, hitWall: false, fellIntoPit: false, reachedGoal: false }
  }

  // Movement cards
  const moveDir = card === 'Reverse1' ? uTurn(cur.facing) : cur.facing
  const steps =
    card === 'Move1' || card === 'Reverse1' ? 1
    : card === 'Move2' ? 2
    : 3

  let hitWall = false
  for (let i = 0; i < steps; i++) {
    if (isWallBlocking(cur.x, cur.y, moveDir, scenario.walls)) {
      hitWall = true
      break
    }
    const { dx, dy } = delta(moveDir)
    const nx = cur.x + dx
    const ny = cur.y + dy
    if (isOutOfBounds(nx, ny, scenario)) {
      hitWall = true
      break
    }
    cur = { x: nx, y: ny, facing: cur.facing }
    if (isPit(cur.x, cur.y, scenario)) {
      return { pos: cur, hitWall: false, fellIntoPit: true, reachedGoal: false }
    }
    if (isGoal(cur.x, cur.y, scenario)) {
      return { pos: cur, hitWall: false, fellIntoPit: false, reachedGoal: true }
    }
  }

  return { pos: cur, hitWall, fellIntoPit: false, reachedGoal: false }
}

// ─── Full queue simulation ─────────────────────────────────────────────────────

export interface QueueEntry {
  playerId: string
  playerName: string
  cardType: CardType
}

export interface SimulationResult {
  log: ExecutionStep[]
  finalPos: RobotPos
  reachedGoal: boolean
  fellIntoPit: boolean
}

export function simulateQueue(
  startPos: RobotPos,
  queue: QueueEntry[],
  scenario: Scenario,
): SimulationResult {
  let pos = { ...startPos }
  const log: ExecutionStep[] = []
  let reachedGoal = false
  let fellIntoPit = false

  for (const entry of queue) {
    const from = { ...pos }
    const result = simulateCard(pos, entry.cardType, scenario)
    pos = result.pos

    log.push({
      playerId: entry.playerId,
      playerName: entry.playerName,
      cardType: entry.cardType,
      fromPos: from,
      toPos: pos,
      hitWall: result.hitWall,
      fellIntoPit: result.fellIntoPit,
      reachedGoal: result.reachedGoal,
    })

    if (result.reachedGoal) {
      reachedGoal = true
      break
    }
    if (result.fellIntoPit) {
      fellIntoPit = true
      break
    }
  }

  return { log, finalPos: pos, reachedGoal, fellIntoPit }
}
