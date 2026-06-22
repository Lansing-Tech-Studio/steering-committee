import { afterEach, describe, expect, it, vi } from 'vitest'
import { dealHand, refillHand } from './cards'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('cards', () => {
  it('deals a full hand of five cards', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const hand = dealHand()

    expect(hand).toHaveLength(5)
    expect(hand).toEqual(['Move1', 'Move1', 'Move1', 'Move1', 'Move1'])
  })

  it('refills only the played slot', () => {
    const randomValues = [0, 0.27, 0.4]
    vi.spyOn(Math, 'random').mockImplementation(() => randomValues.shift() ?? 0)

    const next = refillHand(['Move1', 'Move2', 'Move3', 'TurnLeft', 'TurnRight'], 2)

    expect(next).toEqual(['Move1', 'Move2', 'Move1', 'TurnLeft', 'TurnRight'])
  })
})