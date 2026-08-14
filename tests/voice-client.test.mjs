import assert from 'node:assert/strict'
import test from 'node:test'

import { calculatePcmLevel, VoiceClient } from '../src/services/voice/voice-client.js'


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


test('gates silence and emits capture.complete after speech ends', () => {
  const sent = []
  const events = []
  const client = new VoiceClient({
    url: 'ws://voice.test',
    autoStopOnSilence: true,
    minSpeechMs: 0,
    silenceMs: 100,
    preRollMs: 40
  })
  client.socket = new FakeSocket((data) => sent.push(data))
  client.currentState = 'recording'
  client.onEvent((event) => events.push(event))

  const silent = new Int16Array(320)
  const loud = new Int16Array(320).fill(9000)

  client.handleAudioFrame(silent.buffer, 1000)
  assert.equal(sent.length, 0)
  client.handleAudioFrame(loud.buffer, 1100)
  client.handleAudioFrame(silent.buffer, 1250)

  assert.equal(calculatePcmLevel(loud.buffer) > 0.018, true)
  assert.equal(sent.length >= 1, true)
  assert.equal(events.some((event) => event.type === 'capture.complete'), true)
})


test('cancel releases a wake-listening session without requesting transcription', async () => {
  const sent = []
  const client = new VoiceClient({ url: 'ws://voice.test' })
  client.socket = new FakeSocket((data) => sent.push(data))
  client.currentState = 'recording'

  await client.cancel()

  assert.deepEqual(sent, [])
  assert.equal(client.state, 'idle')
  assert.equal(client.socket, null)
})


test('persistent wake mode streams every frame while paused mode drops frames', () => {
  const sent = []
  const client = new VoiceClient({ url: 'ws://voice.test', persistent: true, initialMode: 'wake' })
  client.socket = new FakeSocket((data) => sent.push(data))
  client.currentState = 'recording'
  client.mode = 'wake'
  const frame = new Int16Array(320).fill(1000).buffer

  client.handleAudioFrame(frame)
  client.mode = 'paused'
  client.handleAudioFrame(frame)

  assert.equal(sent.length, 1)
  assert.equal(sent[0], frame)
})


test('persistent command completion keeps the socket and switches to paused mode', async () => {
  const sent = []
  const client = new VoiceClient({ url: 'ws://voice.test', persistent: true, initialMode: 'command' })
  client.socket = new FakeSocket((data) => {
    sent.push(JSON.parse(data))
    queueMicrotask(() => client.emitEvent({ type: 'command.completed', mode: 'paused' }))
  })
  client.currentState = 'recording'
  client.mode = 'command'

  await client.finishCommand()

  assert.deepEqual(sent, [{ type: 'command.stop' }])
  assert.equal(client.mode, 'paused')
  assert.equal(client.state, 'recording')
  assert.notEqual(client.socket, null)
})


test('command mode uses the configured follow-up no-speech timeout', async () => {
  const events = []
  const client = new VoiceClient({
    url: 'ws://voice.test',
    persistent: true,
    initialMode: 'command',
    autoStopOnSilence: true,
    noSpeechTimeoutMs: 5
  })
  client.currentState = 'recording'
  client.mode = 'command'
  client.onEvent((event) => events.push(event))

  client.resetCaptureState()
  await new Promise((resolve) => setTimeout(resolve, 20))

  assert.equal(events.some((event) => event.type === 'capture.idle'), true)
})


test('suspends the no-speech timeout during playback and restarts a full window afterwards', async () => {
  const events = []
  const client = new VoiceClient({
    url: 'ws://voice.test',
    persistent: true,
    initialMode: 'command',
    autoStopOnSilence: true,
    noSpeechTimeoutMs: 8
  })
  client.currentState = 'recording'
  client.mode = 'command'
  client.onEvent((event) => events.push(event))

  client.resetCaptureState()
  client.suspendNoSpeechTimeout()
  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(events.some((event) => event.type === 'capture.idle'), false)

  client.resumeNoSpeechTimeout()
  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(events.filter((event) => event.type === 'capture.idle').length, 1)
})


test('uses a stricter VAD threshold while assistant playback can be interrupted', () => {
  const events = []
  const client = new VoiceClient({
    url: 'ws://voice.test',
    persistent: true,
    initialMode: 'command',
    autoStopOnSilence: true,
    speechThreshold: 0.018,
    bargeInSpeechThreshold: 0.03,
    minSpeechMs: 0,
    bargeInMinSpeechMs: 0
  })
  client.socket = new FakeSocket()
  client.currentState = 'recording'
  client.mode = 'command'
  client.onEvent((event) => events.push(event))
  const moderatePlaybackLeak = new Int16Array(320).fill(800).buffer

  client.setBargeInActive(true)
  client.handleAudioFrame(moderatePlaybackLeak, 1000)
  assert.equal(events.some((event) => event.type === 'speech.started'), false)

  client.setBargeInActive(false)
  client.handleAudioFrame(moderatePlaybackLeak, 1020)
  assert.equal(events.some((event) => event.type === 'speech.started'), true)
})
