import assert from 'node:assert/strict'
import test from 'node:test'

import { VoiceClient } from '../src/services/voice/voice-client.js'


class FakeSocket extends EventTarget {
  static OPEN = 1

  constructor(onSend = () => {}) {
    super()
    this.readyState = FakeSocket.OPEN
    this.onSend = onSend
  }

  send(data) {
    this.onSend(data)
  }

  close() {
    this.readyState = 3
    this.dispatchEvent(new Event('close'))
  }
}


globalThis.window = {
  setTimeout,
  clearTimeout,
  location: { protocol: 'http:', host: '127.0.0.1:3000' }
}
globalThis.WebSocket = FakeSocket


test('stop waits for session.stopped before releasing the socket', async () => {
  const client = new VoiceClient({ url: 'ws://voice.test', finalizeTimeoutMs: 100 })
  const sent = []
  client.socket = new FakeSocket((data) => {
    sent.push(JSON.parse(data))
    queueMicrotask(() => {
      client.eventHandlers.forEach((handler) => handler({ type: 'session.stopped' }))
    })
  })
  client.currentState = 'recording'

  await client.stop()

  assert.deepEqual(sent, [{ type: 'stop' }])
  assert.equal(client.state, 'idle')
  assert.equal(client.socket, null)
})


test('stop reports a processing timeout when the backend never finishes', async () => {
  const client = new VoiceClient({ url: 'ws://voice.test', finalizeTimeoutMs: 5 })
  client.socket = new FakeSocket()
  client.currentState = 'recording'

  await assert.rejects(client.stop(), (error) => error.code === 'processing_timeout')
  assert.equal(client.state, 'idle')
  assert.equal(client.socket, null)
})
