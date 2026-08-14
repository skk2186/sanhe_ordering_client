import { PCM_WORKLET_SOURCE } from './pcm-worklet-source.js'

const DEFAULT_MEDIA_CONSTRAINTS = {
  channelCount: 1,
  echoCancellation: true,
  autoGainControl: true,
  noiseSuppression: true
}

/** 计算一帧 PCM S16LE 音频的 RMS 音量，供浏览器端静音检测使用。 */
export const calculatePcmLevel = (buffer) => {
  const samples = new Int16Array(buffer)
  if (!samples.length) return 0
  let sum = 0
  for (let index = 0; index < samples.length; index += 1) {
    const normalized = samples[index] / 32768
    sum += normalized * normalized
  }
  return Math.sqrt(sum / samples.length)
}

/**
 * 把环境变量中的 HTTP、WebSocket 或相对地址统一为可连接的 WebSocket URL。
 * 相对地址沿用当前页面协议和主机，因此开发代理和生产反向代理可使用同一配置。
 */
export const resolveWebSocketUrl = (configuredUrl) => {
  const value = configuredUrl || '/voice-api/api/v1/ws/transcribe'
  if (/^wss?:\/\//i.test(value)) return value
  if (/^https?:\/\//i.test(value)) return value.replace(/^http/i, 'ws')

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const path = value.startsWith('/') ? value : `/${value}`
  return `${protocol}//${window.location.host}${path}`
}

/**
 * 浏览器麦克风到语音服务的底层会话客户端。
 *
 * state 描述资源生命周期（idle -> connecting -> recording -> stopping），
 * mode 描述持久连接内的业务阶段（wake、paused、command）。两者分开管理，
 * 使一次 WebSocket 连接可以在唤醒监听和指令识别之间切换而不反复申请麦克风。
 */
export class VoiceClient {
  constructor(options) {
    // 这些默认值与后端 16 kHz/单声道/PCM S16LE 协议保持一致。
    this.options = {
      language: 'zh',
      targetSampleRate: 16000,
      frameDurationMs: 20,
      connectTimeoutMs: 10000,
      finalizeTimeoutMs: 30000,
      persistent: false,
      initialMode: 'legacy',
      autoStopOnSilence: false,
      speechThreshold: 0.018,
      bargeInSpeechThreshold: 0.03,
      minSpeechMs: 160,
      bargeInMinSpeechMs: 220,
      silenceMs: 900,
      preRollMs: 400,
      noSpeechTimeoutMs: 15000,
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
    this.mode = this.options.initialMode

    // 以下字段仅属于一次 VAD 捕获窗口，每次切换 mode 都必须重置。
    this.preRollFrames = []
    this.speechCandidateAt = 0
    this.speechStarted = false
    this.lastSpeechAt = 0
    this.autoStopTriggered = false
    this.noSpeechTimer = null
    this.noSpeechTimeoutSuspended = false
    this.bargeInActive = false
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

  /** 建立连接、申请麦克风，并在服务端确认 session.ready 后开始传输音频。 */
  async start(mode = this.options.initialMode) {
    if (this.currentState !== 'idle') {
      throw new Error(`Cannot start while client is ${this.currentState}`)
    }

    this.setState('connecting')
    this.mode = this.options.persistent ? mode : 'legacy'
    try {
      this.socket = await this.connectSocket()
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { ...DEFAULT_MEDIA_CONSTRAINTS, ...this.options.mediaConstraints }
      })
      const ready = this.waitForEvent('session.ready', this.options.connectTimeoutMs)
      this.sendControl({
        type: 'start',
        session_id: this.options.sessionId,
        sample_rate: this.options.targetSampleRate,
        channels: 1,
        encoding: 'pcm_s16le',
        language: this.options.language,
        hotwords: this.options.hotwords || [],
        mode: this.mode
      })
      await ready
      await this.startAudioGraph()
      this.setState('recording')
      this.resetCaptureState()
    } catch (error) {
      await this.releaseResources()
      this.setState('idle')
      throw error
    }
  }

  /** 请求服务端完成当前识别并关闭会话；无论成功失败都会释放浏览器资源。 */
  async stop() {
    if (this.currentState === 'idle') return
    this.setState('stopping')

    let stopError = null
    try {
      if (this.socket?.readyState === WebSocket.OPEN) {
        const stopped = this.waitForStopped(this.options.finalizeTimeoutMs)
        this.sendControl({ type: this.options.persistent ? 'close' : 'stop' })
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

  /** 直接中止会话，不等待识别结果，适用于用户取消或异常恢复。 */
  async cancel() {
    if (this.currentState === 'idle') return
    this.setState('stopping')
    await this.releaseResources()
    this.setState('idle')
  }

  /** 在持久会话内切换唤醒、暂停或指令模式。 */
  async setMode(mode) {
    if (!this.options.persistent) {
      throw new Error('Voice modes require a persistent session')
    }
    if (!['wake', 'paused', 'command'].includes(mode)) {
      throw new Error(`Unsupported voice mode: ${mode}`)
    }
    if (this.currentState !== 'recording') {
      throw new Error(`Cannot change mode while client is ${this.currentState}`)
    }

    this.mode = mode
    this.resetCaptureState()
    this.sendControl({ type: 'mode.change', mode })
  }

  /** 通知服务端结束本轮指令音频，但保留持久连接供后续继续监听。 */
  async finishCommand() {
    if (!this.options.persistent || this.mode !== 'command') return
    this.mode = 'paused'
    this.clearNoSpeechTimer()
    const completed = this.waitForEvent('command.completed', this.options.finalizeTimeoutMs)
    this.sendControl({ type: 'command.stop' })
    await completed
    this.resetCaptureState()
  }

  /**
   * 播报期间继续运行 VAD，但暂停“始终未开口”倒计时。
   * 顾客一旦开口，speech.started 仍会正常产生，且预录音不会丢失。
   */
  suspendNoSpeechTimeout() {
    this.noSpeechTimeoutSuspended = true
    this.clearNoSpeechTimer()
  }

  /** 播报自然结束后重新给予一整段未开口等待时间。 */
  resumeNoSpeechTimeout() {
    this.noSpeechTimeoutSuspended = false
    this.armNoSpeechTimer()
  }

  /** 播报期间使用更严格的人声门槛，确认顾客开口后自动恢复普通门槛。 */
  setBargeInActive(active) {
    this.bargeInActive = Boolean(active)
  }

  // WebSocket 消息都是 JSON 控制事件；麦克风数据则以 ArrayBuffer 二进制帧发送。
  async connectSocket() {
    const socket = new WebSocket(this.options.url)
    socket.binaryType = 'arraybuffer'
    socket.addEventListener('message', (message) => {
      try {
        const event = JSON.parse(message.data)
        this.emitEvent(event)
      } catch {
        this.emitEvent({
          type: 'error',
          code: 'invalid_server_event',
          message: 'Voice service returned an invalid event'
        })
      }
    })
    socket.addEventListener('close', () => {
      if (!['idle', 'stopping'].includes(this.currentState)) {
        this.emitEvent({
          type: 'error',
          code: 'service_unavailable',
          message: 'Voice WebSocket closed unexpectedly'
        })
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

  /** 创建 AudioWorklet 采集链路，在音频线程中完成降采样和 PCM 分帧。 */
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
        this.handleAudioFrame(message.data)
      }
    }
    this.sourceNode.connect(this.workletNode)

  }

  /**
   * 根据当前 mode 和 VAD 设置处理一帧音频。
   * wake 模式把原始帧持续交给服务端 KWS；command/legacy 模式可由本地 VAD
   * 自动截断静音，从而减少尾部等待并触发一次完整识别。
   */
  handleAudioFrame(buffer, now = Date.now()) {
    if (this.options.persistent) {
      if (this.mode === 'wake') {
        this.socket?.send(buffer)
        return
      }
      if (this.mode !== 'command') return
    }

    if (!this.options.autoStopOnSilence) {
      this.socket?.send(buffer)
      return
    }

    const frameDurationMs = this.options.frameDurationMs
    const preRollFrameLimit = Math.max(1, Math.ceil(this.options.preRollMs / frameDurationMs))
    const level = calculatePcmLevel(buffer)
    const speechThreshold = this.bargeInActive
      ? Math.max(this.options.speechThreshold, this.options.bargeInSpeechThreshold)
      : this.options.speechThreshold
    const minSpeechMs = this.bargeInActive
      ? Math.max(this.options.minSpeechMs, this.options.bargeInMinSpeechMs)
      : this.options.minSpeechMs
    const isSpeech = level >= speechThreshold

    if (!this.speechStarted) {
      // 环形保留开口前的音频，确认说话后再补发，避免吞掉首字。
      this.preRollFrames.push(buffer)
      if (this.preRollFrames.length > preRollFrameLimit) this.preRollFrames.shift()

      if (isSpeech) {
        if (!this.speechCandidateAt) this.speechCandidateAt = now
        // 连续超过最短时长才算讲话，过滤餐厅里的碰撞声和瞬时噪声。
        if (now - this.speechCandidateAt >= minSpeechMs) {
          this.speechStarted = true
          this.bargeInActive = false
          this.lastSpeechAt = now
          if (this.noSpeechTimer) window.clearTimeout(this.noSpeechTimer)
          this.noSpeechTimer = null
          this.preRollFrames.forEach((frame) => this.socket?.send(frame))
          this.preRollFrames = []
          this.emitEvent({ type: 'speech.started', source: 'client_vad', level })
        }
      } else {
        this.speechCandidateAt = 0
      }
      return
    }

    this.socket?.send(buffer)
    if (isSpeech) this.lastSpeechAt = now
    // 只触发一次 capture.complete，后续由上层决定关闭会话还是结束当前 command。
    if (!this.autoStopTriggered && now - this.lastSpeechAt >= this.options.silenceMs) {
      this.autoStopTriggered = true
      this.emitEvent({ type: 'capture.complete', reason: 'silence' })
    }
  }

  emitEvent(event) {
    this.eventHandlers.forEach((handler) => handler(event))
  }

  clearNoSpeechTimer() {
    if (this.noSpeechTimer) window.clearTimeout(this.noSpeechTimer)
    this.noSpeechTimer = null
  }

  armNoSpeechTimer() {
    this.clearNoSpeechTimer()
    const shouldWatchForSpeech = this.options.autoStopOnSilence && (
      !this.options.persistent || this.mode === 'command'
    )
    if (
      !shouldWatchForSpeech
      || this.currentState !== 'recording'
      || this.noSpeechTimeoutSuspended
      || this.speechStarted
      || this.autoStopTriggered
    ) return

    this.noSpeechTimer = window.setTimeout(() => {
      if (
        this.currentState !== 'recording'
        || this.noSpeechTimeoutSuspended
        || this.speechStarted
        || this.autoStopTriggered
      ) return
      this.autoStopTriggered = true
      this.emitEvent({ type: 'capture.idle' })
    }, this.options.noSpeechTimeoutMs)
  }

  /** 重置本轮 VAD，并为需要录音的模式启动“始终未开口”超时。 */
  resetCaptureState() {
    this.clearNoSpeechTimer()
    this.preRollFrames = []
    this.speechCandidateAt = 0
    this.speechStarted = false
    this.lastSpeechAt = 0
    this.autoStopTriggered = false
    this.noSpeechTimeoutSuspended = false
    this.bargeInActive = false
    this.armNoSpeechTimer()
  }

  /** 等待单个协议事件，并把服务端 error 事件转换为可捕获的异常。 */
  waitForEvent(type, timeoutMs) {
    return new Promise((resolve, reject) => {
      let unsubscribe = () => {}
      const cleanup = () => {
        window.clearTimeout(timeout)
        unsubscribe()
      }
      const timeout = window.setTimeout(() => {
        cleanup()
        const error = new Error(`Voice event ${type} timed out`)
        error.code = type === 'command.completed' ? 'processing_timeout' : 'connection_timeout'
        reject(error)
      }, timeoutMs)
      unsubscribe = this.onEvent((event) => {
        if (event.type === 'error') {
          cleanup()
          const error = new Error(event.message || 'Voice service returned an error')
          error.code = event.code || 'service_unavailable'
          reject(error)
          return
        }
        if (event.type !== type) return
        cleanup()
        resolve(event)
      })
    })
  }

  /**
   * 等待最终 session.stopped，同时把 socket 提前断开和处理超时区分为明确错误码。
   */
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

  /** 按依赖顺序释放音频节点、媒体轨道、AudioContext、Socket 和临时模块 URL。 */
  async releaseResources() {
    this.clearNoSpeechTimer()
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
    this.preRollFrames = []
    this.speechCandidateAt = 0
    this.speechStarted = false
    this.lastSpeechAt = 0
    this.autoStopTriggered = false
    this.noSpeechTimer = null
    this.noSpeechTimeoutSuspended = false
    this.bargeInActive = false
    this.mode = this.options.initialMode
  }

  setState(state) {
    this.currentState = state
    this.stateHandlers.forEach((handler) => handler(state))
  }
}
