import { computed, onUnmounted, ref } from 'vue'
import { VoiceClient, resolveWebSocketUrl } from '@/services/voice/voice-client'

const createSessionId = () => {
  const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `xiaocan-${suffix}`
}

const detectErrorCode = (error) => {
  if (error?.code) return error.code
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') return 'permission_denied'
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') return 'microphone_missing'
  if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') return 'microphone_busy'
  if (String(error?.message).includes('timed out')) return 'connection_timeout'
  return 'service_unavailable'
}

export const useVoiceRecognition = ({ getHotwords, onFinal } = {}) => {
  const phase = ref('idle')
  const transcript = ref('')
  const rawTranscript = ref('')
  const errorCode = ref('')
  const speechDetected = ref(false)
  let client = null
  let subscriptions = []
  let handledUtteranceId = ''
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

  const handleEvent = async (event) => {
    if (event.type === 'speech.started') {
      speechDetected.value = true
      phase.value = 'listening'
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
      await stop({ preservePhase: true })
      return
    }
    if (event.type === 'transcript.final') {
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
      await stop({ preservePhase: true })
      return
    }
    if (event.type === 'error') {
      errorCode.value = event.code || 'service_unavailable'
      phase.value = 'error'
      await stop({ preservePhase: true })
      return
    }
    if (event.type === 'session.stopped' && phase.value === 'processing' && !transcript.value) {
      errorCode.value = 'no_speech'
      phase.value = 'error'
    }
  }

  const start = async () => {
    if (!supported.value) {
      errorCode.value = 'unsupported'
      phase.value = 'error'
      return false
    }
    if (client) return false

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
      hotwords: (getHotwords?.() || []).filter(Boolean).slice(0, 100)
    })
    subscriptions = [
      client.onEvent(handleEvent),
      client.onStateChange((state) => {
        if (state === 'recording' && phase.value === 'connecting') phase.value = 'listening'
      })
    ]

    try {
      await client.start()
      return true
    } catch (error) {
      errorCode.value = detectErrorCode(error)
      phase.value = 'error'
      client = null
      disposeSubscriptions()
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
    toggle
  }
}
