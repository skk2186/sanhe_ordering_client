import { computed, onUnmounted, ref } from 'vue'
import { VoiceClient, resolveWebSocketUrl } from '@/services/voice/voice-client'

const createSessionId = () => {
  const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `xiaohe-${suffix}`
}

// 将浏览器媒体错误和底层协议错误收敛为 UI/i18n 可以稳定处理的错误码。
const detectErrorCode = (error) => {
  if (error?.code) return error.code
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') return 'permission_denied'
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') return 'microphone_missing'
  if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') return 'microphone_busy'
  if (String(error?.message).includes('timed out')) return 'connection_timeout'
  return 'service_unavailable'
}

/**
 * 将 VoiceClient 的命令式生命周期封装成 Vue 响应式状态。
 *
 * phase 只面向页面展示：idle、connecting、listening、processing、result、error。
 * 持久 KWS 可用时，同一个 client 会在 wake/paused/command 间切换；服务端不支持
 * KWS 时自动降级为每轮重连的 legacy 识别，调用组件无需维护两套流程。
 */
export const useVoiceRecognition = ({
  getHotwords,
  onFinal,
  onIdle,
  onWake,
  onSpeechStart,
  noSpeechTimeoutMs
} = {}) => {
  const phase = ref('idle')
  const transcript = ref('')
  const rawTranscript = ref('')
  const errorCode = ref('')
  const speechDetected = ref(false)
  const streamingKwsActive = ref(import.meta.env.VITE_VOICE_KWS_ENABLED !== 'false')
  let client = null
  let subscriptions = []
  let handledUtteranceId = ''
  // 多个 UI 事件可能同时要求停止，复用同一 Promise 可防止重复关闭 Socket。
  let stoppingPromise = null

  const supported = computed(() => Boolean(
    typeof window !== 'undefined' &&
    window.WebSocket &&
    navigator.mediaDevices?.getUserMedia &&
    (window.AudioContext || window.webkitAudioContext) &&
    window.AudioWorkletNode
  ))

  const disposeSubscriptions = () => {
    subscriptions.forEach((unsubscribe) => unsubscribe())
    subscriptions = []
  }

  /** 正常结束并等待最终识别结果；preservePhase 用于保留 result/error 提示。 */
  const stop = ({ preservePhase = false } = {}) => {
    if (stoppingPromise) return stoppingPromise

    const activeClient = client
    if (!activeClient) {
      speechDetected.value = false
      if (!preservePhase) phase.value = 'idle'
      return Promise.resolve()
    }

    if (!preservePhase && phase.value !== 'result') phase.value = 'processing'
    const currentStop = (async () => {
      try {
        // Keep the event subscription alive while VoiceClient commits the final utterance.
        await activeClient.stop()
      } catch (error) {
        if (!preservePhase && phase.value !== 'result') {
          errorCode.value = detectErrorCode(error)
          phase.value = 'error'
        }
      } finally {
        if (client === activeClient) client = null
        disposeSubscriptions()
        speechDetected.value = false
        if (!preservePhase && !['result', 'error'].includes(phase.value)) phase.value = 'idle'
      }
    })()
    stoppingPromise = currentStop.finally(() => {
      stoppingPromise = null
    })
    return stoppingPromise
  }

  /** 无需最终识别结果时立即释放会话，例如关闭助手或连接异常。 */
  const cancel = async () => {
    const activeClient = client
    if (!activeClient) {
      phase.value = 'idle'
      return
    }

    try {
      await activeClient.cancel()
    } finally {
      if (client === activeClient) client = null
      disposeSubscriptions()
      speechDetected.value = false
      phase.value = 'idle'
    }
  }

  /** 暂停持久连接的音频处理；legacy 会话没有 paused 模式，只能取消。 */
  const pause = async () => {
    if (!client) {
      phase.value = 'idle'
      return
    }
    if (!streamingKwsActive.value) {
      await cancel()
      return
    }
    try {
      await client.setMode('paused')
      speechDetected.value = false
      phase.value = 'idle'
    } catch (error) {
      errorCode.value = detectErrorCode(error)
      phase.value = 'error'
    }
  }

  /** 结束持久会话中的本轮 command，等待服务端提交最终文本。 */
  const finishCommand = async () => {
    const activeClient = client
    if (!activeClient) return
    phase.value = 'processing'
    try {
      await activeClient.finishCommand()
    } catch (error) {
      errorCode.value = detectErrorCode(error)
      phase.value = 'error'
    } finally {
      speechDetected.value = false
    }
  }

  const suspendNoSpeechTimeout = () => client?.suspendNoSpeechTimeout()

  const resumeNoSpeechTimeout = () => client?.resumeNoSpeechTimeout()

  const setBargeInActive = (active) => client?.setBargeInActive(active)

  /**
   * 把底层协议事件转换为页面 phase 和业务回调。
   * 事件处理保持串行：例如 capture.complete 必须先完成 command.stop，页面才能
   * 收到最终文本；否则下一轮监听可能与上一轮转写交叉。
   */
  const handleEvent = async (event) => {
    if (event.type === 'capture.complete') {
      if (streamingKwsActive.value) await finishCommand()
      else await stop()
      return
    }
    if (event.type === 'capture.idle') {
      if (streamingKwsActive.value) await pause()
      else await cancel()
      onIdle?.()
      return
    }
    if (event.type === 'wake.detected') {
      speechDetected.value = false
      phase.value = 'result'
      onWake?.(event)
      return
    }
    if (event.type === 'mode.changed') {
      speechDetected.value = false
      phase.value = event.mode === 'paused' ? 'idle' : 'listening'
      return
    }
    if (event.type === 'speech.started') {
      speechDetected.value = true
      phase.value = 'listening'
      onSpeechStart?.(event)
      return
    }
    if (event.type === 'speech.ended') {
      phase.value = 'processing'
      return
    }
    if (event.type === 'transcription.started') {
      phase.value = 'processing'
      return
    }
    if (event.type === 'utterance.discarded') {
      const reason = event.code || event.reason
      errorCode.value = reason === 'no_speech' ? 'no_speech' : 'speech_too_short'
      phase.value = 'error'
      if (streamingKwsActive.value) onIdle?.()
      else await stop({ preservePhase: true })
      return
    }
    if (event.type === 'transcript.final') {
      // 服务端在收尾阶段可能重发最终事件，utterance_id 保证业务命令只执行一次。
      if (event.utterance_id && event.utterance_id === handledUtteranceId) return
      handledUtteranceId = event.utterance_id || `${Date.now()}`
      transcript.value = event.text?.trim() || ''
      rawTranscript.value = event.raw_text?.trim() || transcript.value
      if (!transcript.value) {
        errorCode.value = 'no_speech'
        phase.value = 'error'
        await stop({ preservePhase: true })
        return
      }
      phase.value = 'result'
      onFinal?.(event)
      if (!streamingKwsActive.value) await stop({ preservePhase: true })
      return
    }
    if (event.type === 'error') {
      errorCode.value = event.code || 'service_unavailable'
      phase.value = 'error'
      if (streamingKwsActive.value && event.code !== 'kws_unavailable') {
        // connecting 阶段由 start 的 catch 统一清理，避免两条异常路径竞争同一 client。
        const failedClient = client
        if (failedClient?.state !== 'connecting') {
          await cancel()
          onIdle?.()
        }
      } else if (!streamingKwsActive.value) {
        await stop({ preservePhase: true })
      }
      return
    }
    if (event.type === 'session.stopped' && phase.value === 'processing' && !transcript.value) {
      errorCode.value = 'no_speech'
      phase.value = 'error'
    }
  }

  /**
   * 启动指定模式。已有持久 client 时只切换 mode；否则创建完整采集会话。
   * kws_unavailable 是唯一会自动降级的错误，其余错误保留给 UI 明确提示用户。
   */
  const start = async (mode = 'command') => {
    if (!supported.value) {
      errorCode.value = 'unsupported'
      phase.value = 'error'
      return false
    }
    if (client) {
      if (!streamingKwsActive.value) return false
      try {
        if (mode === 'command') {
          transcript.value = ''
          rawTranscript.value = ''
          handledUtteranceId = ''
        }
        errorCode.value = ''
        speechDetected.value = false
        await client.setMode(mode)
        phase.value = 'listening'
        return true
      } catch (error) {
        errorCode.value = detectErrorCode(error)
        phase.value = 'error'
        return false
      }
    }

    errorCode.value = ''
    transcript.value = ''
    rawTranscript.value = ''
    handledUtteranceId = ''
    speechDetected.value = false
    phase.value = 'connecting'

    client = new VoiceClient({
      url: resolveWebSocketUrl(import.meta.env.VITE_VOICE_WS_URL),
      sessionId: createSessionId(),
      language: 'zh',
      finalizeTimeoutMs: Number(import.meta.env.VITE_VOICE_FINALIZE_TIMEOUT_MS) || 30000,
      persistent: streamingKwsActive.value,
      initialMode: mode,
      autoStopOnSilence: true,
      speechThreshold: Number(import.meta.env.VITE_VOICE_SPEECH_THRESHOLD) || 0.018,
      silenceMs: Number(import.meta.env.VITE_VOICE_SILENCE_MS) || 900,
      noSpeechTimeoutMs: Number(noSpeechTimeoutMs)
        || Number(import.meta.env.VITE_VOICE_IDLE_TIMEOUT_MS)
        || 15000,
      hotwords: (getHotwords?.() || []).filter(Boolean).slice(0, 100)
    })
    // 订阅必须在 start 之前建立，才能接到早期 session.ready/error 等事件。
    subscriptions = [
      client.onEvent(handleEvent),
      client.onStateChange((state) => {
        if (state === 'recording' && phase.value === 'connecting') phase.value = 'listening'
      })
    ]

    try {
      await client.start(mode)
      return true
    } catch (error) {
      errorCode.value = detectErrorCode(error)
      // 老版本语音服务没有流式 KWS 时仍允许用户点击后进行单轮识别。
      const useLegacyFallback = streamingKwsActive.value && errorCode.value === 'kws_unavailable'
      streamingKwsActive.value = useLegacyFallback ? false : streamingKwsActive.value
      phase.value = useLegacyFallback ? 'idle' : 'error'
      const failedClient = client
      if (failedClient) await failedClient.cancel()
      client = null
      disposeSubscriptions()
      if (useLegacyFallback) onIdle?.()
      return false
    }
  }

  const toggle = async () => {
    if (['connecting', 'listening', 'processing'].includes(phase.value)) {
      await stop()
      return
    }
    await start()
  }

  // 组件卸载时统一释放麦克风轨道和 WebSocket，防止后台继续录音。
  onUnmounted(() => stop())

  return {
    phase,
    transcript,
    rawTranscript,
    errorCode,
    speechDetected,
    supported,
    start,
    stop,
    cancel,
    pause,
    finishCommand,
    suspendNoSpeechTimeout,
    resumeNoSpeechTimeout,
    setBargeInActive,
    streamingKwsActive,
    toggle
  }
}
