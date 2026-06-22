// ─── Card Types ───────────────────────────────────────────────────────────────

export type CardType =
  | 'Move1'
  | 'Move2'
  | 'Move3'
  | 'TurnLeft'
  | 'TurnRight'
  | 'UTurn'
  | 'Reverse1'

// ─── Direction & Position ─────────────────────────────────────────────────────

export type Direction = 'N' | 'E' | 'S' | 'W'

export interface RobotPos {
  x: number
  y: number
  facing: Direction
}

// ─── Map / Scenario ───────────────────────────────────────────────────────────

export type WallSide = 'N' | 'E' | 'S' | 'W'

export interface WallSegment {
  x: number
  y: number
  side: WallSide
}

export interface Coord {
  x: number
  y: number
}

export interface Scenario {
  id: string
  name: string
  description: string
  difficulty: 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert'
  gridW: number
  gridH: number
  startPos: RobotPos
  goalPos: Coord
  walls: WallSegment[]
  pits: Coord[]
  startBattery: number
}

// ─── Game Phase ───────────────────────────────────────────────────────────────

export type GamePhase =
  | 'lobby'
  | 'dealing'
  | 'programming'
  | 'executing'
  | 'win'
  | 'lose'

// ─── Execution Log ────────────────────────────────────────────────────────────

export interface ExecutionStep {
  playerId: string
  playerName: string
  cardType: CardType
  fromPos: RobotPos
  toPos: RobotPos
  hitWall: boolean
  fellIntoPit: boolean
  reachedGoal: boolean
}

// ─── Firestore Documents ──────────────────────────────────────────────────────

export interface RoomDoc {
  hostId: string
  phase: GamePhase
  scenarioId: string
  battery: number
  maxBattery: number
  robotPos: RobotPos
  executionLog: ExecutionStep[]
  submittedCount: number
  playerCount: number
  round: number
  createdAt: number
}

export interface PlayerDoc {
  displayName: string
  isHost: boolean
  hasSubmitted: boolean
  joinedAt: number
}

export interface HandDoc {
  cards: CardType[]
}

export interface SubmissionDoc {
  cardIndex: number
}

// ─── Rich client-side types ───────────────────────────────────────────────────

export interface Player {
  id: string
  displayName: string
  isHost: boolean
  hasSubmitted: boolean
}
