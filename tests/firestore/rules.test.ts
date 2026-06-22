import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest'

const PROJECT_ID = 'demo-steering-committee'
const ROOM_CODE = 'ABC123'

let testEnv: RulesTestEnvironment

describe('firestore.rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    })

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'rooms', ROOM_CODE), {
        hostId: 'hostUser',
      })
    })
  })

  afterEach(async () => {
    await testEnv.clearFirestore()
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'rooms', ROOM_CODE), {
        hostId: 'hostUser',
      })
    })
  })

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup()
    }
  })

  it('rejects unauthenticated room reads', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'rooms', ROOM_CODE)))
  })

  it('allows authenticated room reads', async () => {
    const db = testEnv.authenticatedContext('playerA').firestore()
    await assertSucceeds(getDoc(doc(db, 'rooms', ROOM_CODE)))
  })

  it('allows host to write another player hand', async () => {
    const db = testEnv.authenticatedContext('hostUser').firestore()
    await assertSucceeds(
      setDoc(doc(db, 'rooms', ROOM_CODE, 'hands', 'playerA'), {
        cards: ['drive_1'],
      }),
    )
  })

  it('rejects non-host writes to another player hand', async () => {
    const db = testEnv.authenticatedContext('playerB').firestore()
    await assertFails(
      setDoc(doc(db, 'rooms', ROOM_CODE, 'hands', 'playerA'), {
        cards: ['drive_1'],
      }),
    )
  })
})
