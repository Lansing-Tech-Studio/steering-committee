import { getScenario } from '../game/scenarios'
import type { Player, RoomDoc } from '../types'

export const E2E_UID = 'e2e-user'
export const E2E_NAME = 'E2E Tester'

export function isE2eMode(): boolean {
  return import.meta.env.VITE_E2E_FAKE_SESSION === 'true'
}

export function createDemoRoom(joinCode: string): RoomDoc {
  const scenario = getScenario('intro_circuit')

  return {
    hostId: E2E_UID,
    phase: 'lobby',
    scenarioId: scenario.id,
    battery: scenario.startBattery,
    maxBattery: scenario.startBattery,
    robotPos: scenario.startPos,
    executionLog: [],
    submittedCount: 0,
    playerCount: 1,
    round: 0,
    createdAt: joinCode.length,
  }
}

export function createDemoPlayers(): Player[] {
  return [
    {
      id: E2E_UID,
      displayName: E2E_NAME,
      isHost: true,
      hasSubmitted: false,
    },
  ]
}