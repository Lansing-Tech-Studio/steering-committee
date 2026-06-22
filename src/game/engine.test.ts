import { describe, expect, it } from 'vitest'
import type { Scenario } from '../types'
import { simulateCard, simulateQueue } from './engine'

const scenario: Scenario = {
  id: 'test-track',
  name: 'Test Track',
  description: 'Unit test scenario',
  difficulty: 'Beginner',
  gridW: 4,
  gridH: 4,
  startPos: { x: 0, y: 0, facing: 'E' },
  goalPos: { x: 2, y: 0 },
  walls: [],
  pits: [{ x: 0, y: 2 }],
  startBattery: 10,
}

const wallScenario: Scenario = {
  ...scenario,
  walls: [{ x: 1, y: 0, side: 'W' }],
}

const pitScenario: Scenario = {
  ...scenario,
  pits: [{ x: 0, y: 1 }],
}

describe('engine', () => {
  it('rotates in place for turn cards', () => {
    const result = simulateCard({ x: 1, y: 1, facing: 'N' }, 'TurnLeft', scenario)

    expect(result).toEqual({
      pos: { x: 1, y: 1, facing: 'W' },
      hitWall: false,
      fellIntoPit: false,
      reachedGoal: false,
    })
  })

  it('stops queue simulation when the robot reaches the goal', () => {
    const result = simulateQueue(
      { x: 0, y: 0, facing: 'E' },
      [
        { playerId: 'p1', playerName: 'Ada', cardType: 'Move1' },
        { playerId: 'p2', playerName: 'Grace', cardType: 'Move2' },
      ],
      scenario,
    )

    expect(result.reachedGoal).toBe(true)
    expect(result.fellIntoPit).toBe(false)
    expect(result.finalPos).toEqual({ x: 2, y: 0, facing: 'E' })
    expect(result.log).toHaveLength(2)
    expect(result.log[1].reachedGoal).toBe(true)
  })

  it('blocks movement when the adjacent cell has a matching entry wall', () => {
    const result = simulateCard({ x: 0, y: 0, facing: 'E' }, 'Move1', wallScenario)

    expect(result).toEqual({
      pos: { x: 0, y: 0, facing: 'E' },
      hitWall: true,
      fellIntoPit: false,
      reachedGoal: false,
    })
  })

  it('stops queue simulation immediately after falling into a pit', () => {
    const result = simulateQueue(
      { x: 0, y: 0, facing: 'S' },
      [
        { playerId: 'p1', playerName: 'Ada', cardType: 'Move1' },
        { playerId: 'p2', playerName: 'Grace', cardType: 'Move1' },
      ],
      pitScenario,
    )

    expect(result.reachedGoal).toBe(false)
    expect(result.fellIntoPit).toBe(true)
    expect(result.finalPos).toEqual({ x: 0, y: 1, facing: 'S' })
    expect(result.log).toHaveLength(1)
    expect(result.log[0].fellIntoPit).toBe(true)
  })
})