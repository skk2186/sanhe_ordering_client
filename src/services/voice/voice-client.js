import { PCM_WORKLET_SOURCE } from './pcm-worklet-source.js'

const DEFAULT_MEDIA_CONSTRAINTS = {
  channelCount: 1,
  echoCancellation: true,
  autoGainControl: true,
  noiseSuppression: true
}

export const resolveWebSocketUrl = (configuredUrl) => {
  const value = configuredUrl || '/voice-api/api/v1/ws/transcribe'
  if (/^wss?:\/\//i.test(value)) return value
  if (/^https?:\/\//i.test(value)) return value.replace(/^http/i, 'ws')

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const path = value.startsWith('/') ? value : `/${value}`
  return `${protocol}//${window.location.host}${path}`
}

export class VoiceClient {
  constructor(options) {
    this.options = {
      language: 'zh',
      targetSampleRate: 16000,
      frameDurationMs: 20,
      connectTimeoutMs: 10000,
      finalizeTimeoutMs: 30000,
      ...options
    }
    this.socket = null
    this.stream = null
    this.audioContext = null
    this.sourceNode = null
    this.workletNode = null
    this.workletUrl = null
    this.eventHandlers = new Set()
    this.stateHandlers = new Set()
    this.currentState = 'idle'
  }

  get state() {
    return this.currentState
  }

  onEvent(handler) {
    this.eventHandlers.add(handler)
    return () => this.eventHandlers.delete(handler)
  }

  onStateChange(handler) {
    this.stateHandlers.add(handler)
    return () => this.stateHandlers.delete(handler)
  }

  async start() {
    if (this.currentState !== 'idle') {
      throw new Error(`Cannot start while client is ${this.currentState}`)
    }

    this.setState('connecting')
    try {
      this.socket = await this.connectSocket()
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { ...DEFAULT_MEDIA_CONSTRAINTS, ...this.options.mediaConstraints }
      })
      await this.startAudioGraph()
      this.sendControl({
        type: 'start',
        session_id: this.options.sessionId,
        sample_rate: this.options.targetSampleRate,
        channels: 1,
        encoding: 'pcm_s16le',
        language: this.options.language,
        hotwords: this.options.hotwords || []
      })
      this.setState('recording')
    } catch (error) {
      await this.releaseResources()
      this.setState('idle')
      throw error
    }
  }

  async stop() {
    if (this.currentState === 'idle') return
    this.setState('stopping')

    let stopError = null
    try {
      if (this.socket?.readyState === WebSocket.OPEN) {
        const stopped = this.waitForStopped(this.options.finalizeTimeoutMs)
        this.sendControl({ type: 'stop' })
        await stopped
      }
    } catch (error) {
      stopError = error
    } finally {
      await this.releaseResources()
      this.setState('idle')
    }

    if (stopError) throw stopError
  }

  async connectSocket() {
    const socket = new WebSocket(this.options.url)
    socket.binaryType = 'arraybuffer'
    socket.addEventListener('message', (message) => {
      try {
        const event = JSON.parse(message.data)
        this.eventHandlers.forEach((handler) => handler(event))
      } catch {
        this.eventHandlers.forEach((handler) => handler({
          type: 'error',
          code: 'invalid_server_event',
          message: 'Voice service returned an invalid event'
        }))
      }
    })

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        socket.close()
        reject(new Error('Voice WebSocket connection timed out'))
      }, this.options.connectTimeoutMs)

      socket.addEventListener('open', () => {
        window.clearTimeout(timeout)
        resolve(socket)
      }, { once: true })
      socket.addEventListener('error', () => {
        window.clearTimeout(timeout)
        reject(new Error('Voice WebSocket connection failed'))
      }, { once: true })
    })
  }

  async startAudioGraph() {
    if (!this.stream || !this.socket) throw new Error('Audio graph prerequisites are missing')

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    this.audioContext = new AudioContextClass()
    if (this.audioContext.state === 'suspended') await this.audioContext.resume()

    const blob = new Blob([PCM_WORKLET_SOURCE], { type: 'text/javascript' })
    this.workletUrl = URL.createObjectURL(blob)
    await this.audioContext.audioWorklet.addModule(this.workletUrl)
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream)
    this.workletNode = new AudioWorkletNode(this.audioContext, 'restaurant-pcm-capture', {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: 1,
      processorOptions: {
        targetSampleRate: this.options.targetSampleRate,
        frameSamples: Math.round(
          (this.options.targetSampleRate * this.options.frameDurationMs) / 1000
        )
      }
    })
    this.workletNode.port.onmessage = (message) => {
      if (this.socket?.readyState === WebSocket.OPEN && this.currentState === 'recording') {
        this.socket.send(message.data)
      }
    }
    this.sourceNode.connect(this.workletNode)
  }

  waitForStopped(timeoutMs) {
    return new Promise((resolve, reject) => {
      let unsubscribe = () => {}
      const socket = this.socket
      const cleanup = () => {
        window.clearTimeout(timeout)
        unsubscribe()
        socket?.removeEventListener('close', handleClose)
      }
      const handleClose = () => {
        cleanup()
        const error = new Error('Voice service closed before recognition completed')
        error.code = 'service_unavailable'
        reject(error)
      }
      const timeout = window.setTimeout(() => {
        cleanup()
        const error = new Error('Voice recognition processing timed out')
        error.code = 'processing_timeout'
        reject(error)
      }, timeoutMs)
      unsubscribe = this.onEvent((event) => {
        if (event.type !== 'session.stopped') return
        cleanup()
        resolve()
      })
      socket?.addEventListener('close', handleClose, { once: true })
    })
  }

  sendControl(event) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      throw new Error('Voice WebSocket is not open')
    }
    this.socket.send(JSON.stringify(event))
  }

  async releaseResources() {
    this.workletNode?.disconnect()
    this.sourceNode?.disconnect()
    this.stream?.getTracks().forEach((track) => track.stop())
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close()
    }
    this.socket?.close()
    if (this.workletUrl) URL.revokeObjectURL(this.workletUrl)

    this.socket = null
    this.stream = null
    this.audioContext = null
    this.sourceNode = null
    this.workletNode = null
    this.workletUrl = null
  }

  setState(state) {
    this.currentState = state
    this.stateHandlers.forEach((handler) => handler(state))
  }
}
