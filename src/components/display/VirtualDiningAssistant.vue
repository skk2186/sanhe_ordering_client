<template>
  <section
    class="assistant-recommendation-rail"
    :class="[`is-${phase}`, { 'has-recommendations': recommendations.length > 0 && !watchingPromo, 'is-watching-promo': watchingPromo }]"
    :style="recommendationRailStyle"
    aria-live="polite"
  >
    <div v-if="recommendations.length && !watchingPromo" class="recommendation-lane">
      <div class="recommendation-lane__header">
        <strong>{{ t('assistant.recommendations') }}</strong>
        <span v-if="customerTranscript" class="customer-transcript">
          {{ t('assistant.youSaid', { transcript: customerTranscript }) }}
        </span>
        <span v-else>{{ emptyLaneText }}</span>
      </div>

      <div class="recommendation-list" role="list">
        <button
          v-for="(item, index) in recommendations"
          :key="item.id"
          class="recommendation-card"
          :class="{
            'is-sold-out': item.available === false,
            'is-selected': selectedItemId === item.id
          }"
          type="button"
          role="listitem"
          :disabled="item.available === false"
          @click="emit('select-recommendation', item, index)"
        >
          <span class="recommendation-number">{{ index + 1 }}</span>
          <img :src="item.image || '/images/default-dish.jpg'" :alt="item.name || item.storeName" />
          <span class="recommendation-copy">
            <strong>{{ item.name || item.storeName }}</strong>
            <span>¥{{ formatPrice(item.price) }}</span>
          </span>
        </button>
      </div>

    </div>

    <aside class="virtual-assistant">
      <div class="assistant-bubble" role="status">
        <strong>{{ $t('assistant.name') }}</strong>
        <span>{{ statusText }}</span>
      </div>

      <button
        class="assistant-character"
        type="button"
        :aria-label="buttonLabel"
        :title="buttonLabel"
        @click="handleToggle"
      >
        <span class="assistant-halo" aria-hidden="true"></span>
        <img :src="assistantCharacterSrc" alt="" aria-hidden="true" />
        <span v-if="phase === 'listening'" class="sound-level" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </span>
      </button>
    </aside>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import xiaoheIdle from '@/assets/assistant/xiaohe-character-idle.png'
import xiaoheListening from '@/assets/assistant/xiaohe-character-listening.png'
import xiaoheThinking from '@/assets/assistant/xiaohe-character-thinking.png'
import xiaoheError from '@/assets/assistant/xiaohe-character-error.png'
import xiaoheAckAudioUrl from '@/assets/assistant/xiaohe-ack.mp3'
import xiaoheAddedAudioUrl from '@/assets/assistant/xiaohe-added.mp3'
import xiaoheAddFailedAudioUrl from '@/assets/assistant/xiaohe-add-failed.mp3'
import xiaoheBatchRestartedAudioUrl from '@/assets/assistant/xiaohe-batch-restarted.mp3'
import xiaoheCartFullAudioUrl from '@/assets/assistant/xiaohe-cart-full.mp3'
import xiaoheCartSpaceInsufficientAudioUrl from '@/assets/assistant/xiaohe-cart-space-insufficient.mp3'
import xiaoheCommandReadyAudioUrl from '@/assets/assistant/xiaohe-command-ready.mp3'
import xiaoheMicPermissionAudioUrl from '@/assets/assistant/xiaohe-mic-permission.mp3'
import xiaoheNextBatchAudioUrl from '@/assets/assistant/xiaohe-next-batch.mp3'
import xiaoheNoMatchAudioUrl from '@/assets/assistant/xiaohe-no-match.mp3'
import xiaoheOrderFailedAudioUrl from '@/assets/assistant/xiaohe-order-failed.mp3'
import xiaoheOrderEmptyAudioUrl from '@/assets/assistant/xiaohe-order-empty.mp3'
import xiaoheOrderSubmittingAudioUrl from '@/assets/assistant/xiaohe-order-submitting.mp3'
import xiaoheOrderSuccessAudioUrl from '@/assets/assistant/xiaohe-order-success.mp3'
import xiaoheRepeatAudioUrl from '@/assets/assistant/xiaohe-repeat.mp3'
import xiaoheResultsPagedAudioUrl from '@/assets/assistant/xiaohe-results-paged.mp3'
import xiaoheResultsReadyAudioUrl from '@/assets/assistant/xiaohe-results-ready.mp3'
import xiaoheSelectionInvalidAudioUrl from '@/assets/assistant/xiaohe-selection-invalid.mp3'
import xiaoheSessionEndedAudioUrl from '@/assets/assistant/xiaohe-session-ended.mp3'
import xiaoheServiceUnavailableAudioUrl from '@/assets/assistant/xiaohe-service-unavailable.mp3'
import xiaoheSessionTimeoutAudioUrl from '@/assets/assistant/xiaohe-session-timeout.mp3'
import xiaoheSingleBatchAudioUrl from '@/assets/assistant/xiaohe-single-batch.mp3'
import xiaoheActionCancelledAudioUrl from '@/assets/assistant/xiaohe-action-cancelled.mp3'
import xiaoheAddedBothAudioUrl from '@/assets/assistant/xiaohe-added-both.mp3'
import xiaoheAddedLeftAudioUrl from '@/assets/assistant/xiaohe-added-left.mp3'
import xiaoheAddedRightAudioUrl from '@/assets/assistant/xiaohe-added-right.mp3'
import xiaoheCallWaiterConfirmAudioUrl from '@/assets/assistant/xiaohe-call-waiter-confirm.mp3'
import xiaoheCallWaiterSentAudioUrl from '@/assets/assistant/xiaohe-call-waiter-sent.mp3'
import xiaoheComboIntroAudioUrl from '@/assets/assistant/xiaohe-combo-intro.mp3'
import xiaoheFeaturedIntroAudioUrl from '@/assets/assistant/xiaohe-featured-intro.mp3'
import xiaoheOpenHistoryAudioUrl from '@/assets/assistant/xiaohe-open-history.mp3'
import xiaoheOpenLeftMenuAudioUrl from '@/assets/assistant/xiaohe-open-left-menu.mp3'
import xiaoheOpenMenuAudioUrl from '@/assets/assistant/xiaohe-open-menu.mp3'
import xiaoheOpenNavigationAudioUrl from '@/assets/assistant/xiaohe-open-navigation.mp3'
import xiaoheOpenRightMenuAudioUrl from '@/assets/assistant/xiaohe-open-right-menu.mp3'
import xiaoheOpenSettingsAudioUrl from '@/assets/assistant/xiaohe-open-settings.mp3'
import xiaoheOrderConfirmAudioUrl from '@/assets/assistant/xiaohe-order-confirm.mp3'
import xiaohePopularIntroAudioUrl from '@/assets/assistant/xiaohe-popular-intro.mp3'
import xiaoheRecommendationEmptyAudioUrl from '@/assets/assistant/xiaohe-recommendation-empty.mp3'
import xiaoheRecommendationReplacedAudioUrl from '@/assets/assistant/xiaohe-recommendation-replaced.mp3'
import xiaoheStreamFasterAudioUrl from '@/assets/assistant/xiaohe-stream-faster.mp3'
import xiaoheStreamPausedAudioUrl from '@/assets/assistant/xiaohe-stream-paused.mp3'
import xiaoheStreamResumedAudioUrl from '@/assets/assistant/xiaohe-stream-resumed.mp3'
import xiaoheStreamSlowerAudioUrl from '@/assets/assistant/xiaohe-stream-slower.mp3'
import { useVoiceRecognition } from '@/composables/useVoiceRecognition'
import { useI18n } from '@/i18n'
import {
  ASSISTANT_END_SESSION_HOTWORDS,
  ASSISTANT_CONTROL_HOTWORDS,
  ASSISTANT_ORDER_HOTWORDS,
  getAssistantRecommendationListWidth,
  isXiaoheWakePhrase
} from '@/utils/assistantRecommendations'
import { normalizeAssistantVolume } from '@/utils/assistantSound'
import { ASSISTANT_AUDIO, getAssistantErrorAudioKey } from '@/utils/assistantAudio'

// 固定场景优先播放真人录音；映射缺失、加载失败或非中文界面时再回退到 TTS。
const assistantAudioUrls = Object.freeze({
  [ASSISTANT_AUDIO.WAKE_ACK]: xiaoheAckAudioUrl,
  [ASSISTANT_AUDIO.COMMAND_READY]: xiaoheCommandReadyAudioUrl,
  [ASSISTANT_AUDIO.RESULTS_READY]: xiaoheResultsReadyAudioUrl,
  [ASSISTANT_AUDIO.RESULTS_PAGED]: xiaoheResultsPagedAudioUrl,
  [ASSISTANT_AUDIO.NEXT_BATCH]: xiaoheNextBatchAudioUrl,
  [ASSISTANT_AUDIO.BATCH_RESTARTED]: xiaoheBatchRestartedAudioUrl,
  [ASSISTANT_AUDIO.SINGLE_BATCH]: xiaoheSingleBatchAudioUrl,
  [ASSISTANT_AUDIO.NO_MATCH]: xiaoheNoMatchAudioUrl,
  [ASSISTANT_AUDIO.SELECTION_INVALID]: xiaoheSelectionInvalidAudioUrl,
  [ASSISTANT_AUDIO.ADDED]: xiaoheAddedAudioUrl,
  [ASSISTANT_AUDIO.CART_FULL]: xiaoheCartFullAudioUrl,
  [ASSISTANT_AUDIO.CART_SPACE_INSUFFICIENT]: xiaoheCartSpaceInsufficientAudioUrl,
  [ASSISTANT_AUDIO.ADD_FAILED]: xiaoheAddFailedAudioUrl,
  [ASSISTANT_AUDIO.REPEAT]: xiaoheRepeatAudioUrl,
  [ASSISTANT_AUDIO.MIC_PERMISSION]: xiaoheMicPermissionAudioUrl,
  [ASSISTANT_AUDIO.SERVICE_UNAVAILABLE]: xiaoheServiceUnavailableAudioUrl,
  [ASSISTANT_AUDIO.SESSION_TIMEOUT]: xiaoheSessionTimeoutAudioUrl,
  [ASSISTANT_AUDIO.SESSION_ENDED]: xiaoheSessionEndedAudioUrl,
  [ASSISTANT_AUDIO.ORDER_EMPTY]: xiaoheOrderEmptyAudioUrl,
  [ASSISTANT_AUDIO.ORDER_SUBMITTING]: xiaoheOrderSubmittingAudioUrl,
  [ASSISTANT_AUDIO.ORDER_SUCCESS]: xiaoheOrderSuccessAudioUrl,
  [ASSISTANT_AUDIO.ORDER_FAILED]: xiaoheOrderFailedAudioUrl,
  [ASSISTANT_AUDIO.OPEN_MENU]: xiaoheOpenMenuAudioUrl,
  [ASSISTANT_AUDIO.OPEN_LEFT_MENU]: xiaoheOpenLeftMenuAudioUrl,
  [ASSISTANT_AUDIO.OPEN_RIGHT_MENU]: xiaoheOpenRightMenuAudioUrl,
  [ASSISTANT_AUDIO.OPEN_NAVIGATION]: xiaoheOpenNavigationAudioUrl,
  [ASSISTANT_AUDIO.OPEN_HISTORY]: xiaoheOpenHistoryAudioUrl,
  [ASSISTANT_AUDIO.OPEN_SETTINGS]: xiaoheOpenSettingsAudioUrl,
  [ASSISTANT_AUDIO.CALL_WAITER_CONFIRM]: xiaoheCallWaiterConfirmAudioUrl,
  [ASSISTANT_AUDIO.CALL_WAITER_SENT]: xiaoheCallWaiterSentAudioUrl,
  [ASSISTANT_AUDIO.ORDER_CONFIRM]: xiaoheOrderConfirmAudioUrl,
  [ASSISTANT_AUDIO.ACTION_CANCELLED]: xiaoheActionCancelledAudioUrl,
  [ASSISTANT_AUDIO.STREAM_PAUSED]: xiaoheStreamPausedAudioUrl,
  [ASSISTANT_AUDIO.STREAM_RESUMED]: xiaoheStreamResumedAudioUrl,
  [ASSISTANT_AUDIO.STREAM_SLOWER]: xiaoheStreamSlowerAudioUrl,
  [ASSISTANT_AUDIO.STREAM_FASTER]: xiaoheStreamFasterAudioUrl,
  [ASSISTANT_AUDIO.POPULAR_INTRO]: xiaohePopularIntroAudioUrl,
  [ASSISTANT_AUDIO.FEATURED_INTRO]: xiaoheFeaturedIntroAudioUrl,
  [ASSISTANT_AUDIO.COMBO_INTRO]: xiaoheComboIntroAudioUrl,
  [ASSISTANT_AUDIO.RECOMMENDATION_EMPTY]: xiaoheRecommendationEmptyAudioUrl,
  [ASSISTANT_AUDIO.RECOMMENDATION_REPLACED]: xiaoheRecommendationReplacedAudioUrl,
  [ASSISTANT_AUDIO.ADDED_LEFT]: xiaoheAddedLeftAudioUrl,
  [ASSISTANT_AUDIO.ADDED_RIGHT]: xiaoheAddedRightAudioUrl,
  [ASSISTANT_AUDIO.ADDED_BOTH]: xiaoheAddedBothAudioUrl
})

const assistantCharacterUrls = Object.freeze({
  idle: xiaoheIdle,
  listening: xiaoheListening,
  processing: xiaoheThinking,
  error: xiaoheError
})

const props = defineProps({
  hotwords: {
    type: Array,
    default: () => []
  },
  matchCount: {
    type: Number,
    default: null
  },
  recommendations: {
    type: Array,
    default: () => []
  },
  feedbackMessage: {
    type: String,
    default: ''
  },
  selectedItemId: {
    type: [Number, String],
    default: null
  },
  soundEnabled: {
    type: Boolean,
    default: false
  },
  volume: {
    type: Number,
    default: 0.8
  },
  feedbackRevision: {
    type: Number,
    default: 0
  },
  feedbackAudioKey: {
    type: String,
    default: ''
  },
  continueListening: {
    type: Boolean,
    default: false
  },
  actionBusy: {
    type: Boolean,
    default: false
  },
  watchingPromo: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['transcript', 'session-start', 'session-end', 'select-recommendation', 'wake', 'interrupt-promo'])
const { currentLocale, t } = useI18n()

// wakeMonitoring 表示助手总开关，awaitingCommand 区分当前是在等唤醒词还是等点餐指令。
const customerTranscript = ref('')
const wakeMonitoring = ref(false)
const awaitingCommand = ref(false)
const speaking = ref(false)
const wakeAutoStart = import.meta.env.VITE_VOICE_WAKE_AUTO_START === 'true'
const followUpTimeoutMs = 7000
let restartTimer = null

// 录音和 TTS 共用 speaking 状态，并保存各自的结束函数以保证同一时刻只播放一个提示。
const recordedAudio = new Map()
let currentRecordedAudio = null
let currentSpeechFinish = null
let currentRecordedFinish = null
let feedbackPromptRevision = 0
let errorPromptRevision = 0
let handlingErrorPrompt = false
let promptFlowRevision = 0
let activeBargeInPrompt = null

const {
  phase,
  transcript,
  errorCode,
  speechDetected,
  start,
  stop,
  cancel,
  pause,
  suspendNoSpeechTimeout,
  resumeNoSpeechTimeout,
  setBargeInActive,
  streamingKwsActive
} = useVoiceRecognition({
  getHotwords: () => [...new Set([
    '小禾',
    '小禾小禾',
    ...ASSISTANT_ORDER_HOTWORDS,
    ...ASSISTANT_END_SESSION_HOTWORDS,
    ...ASSISTANT_CONTROL_HOTWORDS,
    ...props.hotwords
  ])],
  onFinal: handleVoiceFinal,
  onIdle: handleIdleCapture,
  onWake: handleWakeDetected,
  onSpeechStart: handleSpeechStarted,
  noSpeechTimeoutMs: followUpTimeoutMs
})

// active 是一次识别的瞬时状态；monitoring 还包括后台唤醒监听和正在播报提示。
const active = computed(() => ['connecting', 'listening', 'processing'].includes(phase.value))
const monitoring = computed(() => active.value || wakeMonitoring.value || speaking.value)
const assistantCharacterSrc = computed(() => assistantCharacterUrls[phase.value] || assistantCharacterUrls.idle)
const normalizedVolume = computed(() => normalizeAssistantVolume(props.volume))
const recommendationRailStyle = computed(() => {
  const listWidth = getAssistantRecommendationListWidth(props.recommendations.length)
  return { '--recommendation-list-width': `${listWidth}px` }
})

const clearRestartTimer = () => {
  if (!restartTimer) return
  window.clearTimeout(restartTimer)
  restartTimer = null
}

/** 同时停止真人录音和浏览器 TTS，供关闭助手、抢占播报和组件卸载复用。 */
const stopAssistantSound = () => {
  currentSpeechFinish?.()
  currentRecordedFinish?.()
  globalThis.speechSynthesis?.cancel()
  if (currentRecordedAudio) {
    currentRecordedAudio.pause()
    currentRecordedAudio.currentTime = 0
  }
  currentRecordedAudio = null
  speaking.value = false
}

const invalidatePromptFlow = () => {
  promptFlowRevision += 1
  activeBargeInPrompt = null
  setBargeInActive(false)
}

/** 播放动态文本；录音无法覆盖的菜名、数量和非中文语言由 TTS 负责。 */
const speakText = (text) => {
  if (!text || !props.soundEnabled || !globalThis.speechSynthesis || !globalThis.SpeechSynthesisUtterance) {
    return Promise.resolve()
  }

  currentSpeechFinish?.()
  globalThis.speechSynthesis.cancel()
  speaking.value = true
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = currentLocale.value
    utterance.rate = 1
    utterance.pitch = 1.05
    utterance.volume = normalizedVolume.value
    let settled = false
    // 某些浏览器不会可靠触发 onend/onerror，超时保证状态最终可以恢复。
    const timeout = window.setTimeout(finish, 6000)

    function finish() {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      if (currentSpeechFinish === finish) currentSpeechFinish = null
      speaking.value = false
      resolve()
    }

    currentSpeechFinish = finish
    utterance.onend = finish
    utterance.onerror = finish
    globalThis.speechSynthesis.speak(utterance)
  })
}

/**
 * 播放指定语义键对应的中文录音，并返回 completed/cancelled/failed 等状态。
 * 新提示会主动结束旧提示，避免唤醒确认、业务反馈和错误播报互相叠音。
 */
const playRecordedAudio = (audioKey) => {
  if (!props.soundEnabled) return Promise.resolve('disabled')
  if (currentLocale.value !== 'zh-CN') return Promise.resolve('unavailable')
  const audio = recordedAudio.get(audioKey)
  if (!audio) return Promise.resolve('unavailable')

  currentSpeechFinish?.()
  globalThis.speechSynthesis?.cancel()
  currentRecordedFinish?.()
  speaking.value = true
  return new Promise((resolve) => {
    let settled = false
    const timeout = window.setTimeout(() => finish('failed'), 8000)
    const cleanup = () => {
      window.clearTimeout(timeout)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
    const finish = (status) => {
      if (settled) return
      settled = true
      cleanup()
      if (currentRecordedFinish === cancelPlayback) currentRecordedFinish = null
      if (currentRecordedAudio === audio) currentRecordedAudio = null
      if (status !== 'completed') audio.pause()
      speaking.value = false
      resolve(status)
    }
    const cancelPlayback = () => finish('cancelled')
    const handleEnded = () => finish('completed')
    const handleError = () => finish('failed')

    currentRecordedAudio = audio
    currentRecordedFinish = cancelPlayback
    audio.addEventListener('ended', handleEnded, { once: true })
    audio.addEventListener('error', handleError, { once: true })
    audio.pause()
    audio.currentTime = 0
    audio.volume = normalizedVolume.value
    const playback = audio.play()
    if (playback?.catch) playback.catch(() => finish('failed'))
  })
}

/** 真人录音不可用时使用同一条界面文案进行 TTS，确保反馈不会静默丢失。 */
const playAssistantPrompt = async (audioKey, fallbackText = '') => {
  const status = await playRecordedAudio(audioKey)
  if (['unavailable', 'failed'].includes(status) && fallbackText) await speakText(fallbackText)
  return status
}

/**
 * 在流式 command 模式中播放提示。播报期间只暂停未开口倒计时，VAD 和预录音继续工作；
 * 顾客开口会由 handleSpeechStarted 立即停止播报，当前 command 则继续收完整句话。
 */
const playPromptWhileListening = async ({ playback, nextMode = 'command', nextDelay = 300 }) => {
  const revision = ++promptFlowRevision
  activeBargeInPrompt = null
  clearRestartTimer()
  if (!wakeMonitoring.value || props.actionBusy || !streamingKwsActive.value) {
    return { started: false, interrupted: false }
  }

  awaitingCommand.value = true
  const started = await start('command')
  if (!started || revision !== promptFlowRevision || !wakeMonitoring.value || props.actionBusy) {
    return { started: false, interrupted: false }
  }

  suspendNoSpeechTimeout()
  setBargeInActive(true)
  const promptState = { revision, interrupted: false }
  activeBargeInPrompt = promptState

  try {
    await playback()
  } finally {
    if (revision !== promptFlowRevision) return { started: true, interrupted: promptState.interrupted }
    if (activeBargeInPrompt === promptState) activeBargeInPrompt = null
    setBargeInActive(false)
  }

  if (!wakeMonitoring.value || props.actionBusy || promptState.interrupted) {
    return { started: true, interrupted: promptState.interrupted }
  }

  if (nextMode === 'command') {
    resumeNoSpeechTimeout()
  } else {
    awaitingCommand.value = false
    await pause()
    if (wakeMonitoring.value) scheduleListening(nextMode, nextDelay)
  }
  return { started: true, interrupted: false }
}

function handleSpeechStarted() {
  const promptState = activeBargeInPrompt
  if (!promptState) return
  promptState.interrupted = true
  setBargeInActive(false)
  stopAssistantSound()
}

// 唤醒后依次播放“我在”和“请说”；流式模式会同时监听，并允许顾客随时打断。
const playWakeAndCommandPrompt = async () => {
  const acknowledgementStatus = await playAssistantPrompt(
    ASSISTANT_AUDIO.WAKE_ACK,
    t('assistant.wakeAcknowledgement')
  )
  if (acknowledgementStatus === 'cancelled' || !wakeMonitoring.value) return false
  const commandStatus = await playAssistantPrompt(
    ASSISTANT_AUDIO.COMMAND_READY,
    t('assistant.commandListening')
  )
  return commandStatus !== 'cancelled' && wakeMonitoring.value
}

/**
 * 延迟进入 wake 或 command 模式。
 * 统一取消旧定时器并检查 actionBusy，防止下单或播报期间意外重启录音。
 */
const scheduleListening = (mode, delay = 350) => {
  clearRestartTimer()
  if (!wakeMonitoring.value || props.actionBusy) return
  restartTimer = window.setTimeout(async () => {
    restartTimer = null
    if (!wakeMonitoring.value || props.actionBusy) return
    awaitingCommand.value = mode === 'command'
    const started = await start(mode)
    if (!started && wakeMonitoring.value && phase.value !== 'error') {
      scheduleListening(mode, 700)
    }
  }, delay)
}

// 流式 KWS 的服务端事件已经确认唤醒词，因此直接暂停监听并进入指令提示阶段。
async function handleWakeDetected(event) {
  if (!wakeMonitoring.value || awaitingCommand.value) return
  awaitingCommand.value = true
  emit('session-start')
  emit('wake', event)
  await pause()
  const outcome = await playPromptWhileListening({
    playback: playWakeAndCommandPrompt,
    nextMode: 'command'
  })
  if (!outcome.started && wakeMonitoring.value && phase.value !== 'error') {
    scheduleListening('command', 150)
  }
}

// 7 秒内始终没有指令时结束连续会话，然后回到低干扰的唤醒监听模式。
async function handleIdleCapture() {
  if (!wakeMonitoring.value || handlingErrorPrompt) return
  if (awaitingCommand.value) {
    awaitingCommand.value = false
    emit('session-end')
    if (streamingKwsActive.value && !props.actionBusy) {
      const outcome = await playPromptWhileListening({
        playback: () => playAssistantPrompt(
          ASSISTANT_AUDIO.SESSION_TIMEOUT,
          t('assistant.sessionTimeout')
        ),
        nextMode: 'wake',
        nextDelay: 500
      })
      if (outcome.started || outcome.interrupted) return
    } else {
      await playAssistantPrompt(ASSISTANT_AUDIO.SESSION_TIMEOUT, t('assistant.sessionTimeout'))
    }
  }
  if (wakeMonitoring.value) scheduleListening('wake', 500)
}

/**
 * 接收最终识别文本。流式 KWS 直接区分 wake/command；legacy 降级模式需要在
 * 前端先验证唤醒词，只有下一轮文本才作为业务命令发给父页面。
 */
function handleVoiceFinal(event) {
  const text = event.text?.trim() || ''
  if (!wakeMonitoring.value) {
    customerTranscript.value = text
    emit('transcript', text, event)
    return
  }

  if (!awaitingCommand.value && !streamingKwsActive.value) {
    if (isXiaoheWakePhrase(text)) {
      awaitingCommand.value = true
      emit('session-start')
      emit('wake', event)
      void playWakeAndCommandPrompt().then((completed) => {
        if (completed) scheduleListening('command', 250)
      })
    } else {
      scheduleListening('wake', 450)
    }
    return
  }

  customerTranscript.value = text
  awaitingCommand.value = false
  emit('transcript', text, event)
}

const statusText = computed(() => {
  if (props.watchingPromo) return t('assistant.watchingPromo')
  if (props.feedbackMessage && !active.value) return props.feedbackMessage
  if (speaking.value) return t('assistant.speaking')
  if (phase.value === 'connecting') return t('assistant.connecting')
  if (phase.value === 'listening') {
    if (!awaitingCommand.value) {
      return speechDetected.value ? t('assistant.checkingWakePhrase') : t('assistant.waitingWakePhrase')
    }
    return speechDetected.value ? t('assistant.voiceDetected') : t('assistant.commandListening')
  }
  if (phase.value === 'processing') return t('assistant.audioReceived')
  if (phase.value === 'result') {
    if (props.matchCount === 0) return t('assistant.noMatches', { query: transcript.value })
    return t('assistant.matchesFound', { count: props.matchCount ?? 0 })
  }
  if (phase.value === 'error') {
    const key = `assistant.errors.${errorCode.value}`
    const message = t(key)
    return message === key ? t('assistant.errors.service_unavailable') : message
  }
  return t('assistant.greeting')
})

const buttonLabel = computed(() => monitoring.value
  ? t('assistant.stopWakeMonitoring')
  : t('assistant.startWakeMonitoring'))

// 手动开启时先进入 command，用户无需在刚点击按钮后再说一次唤醒词。
const handleToggle = async () => {
  if (props.watchingPromo) {
    emit('interrupt-promo')
    return
  }
  if (monitoring.value) {
    wakeMonitoring.value = false
    awaitingCommand.value = false
    feedbackPromptRevision += 1
    errorPromptRevision += 1
    handlingErrorPrompt = false
    clearRestartTimer()
    invalidatePromptFlow()
    stopAssistantSound()
    await cancel()
    emit('session-end')
    return
  }

  wakeMonitoring.value = true
  awaitingCommand.value = true
  customerTranscript.value = ''
  emit('session-start')
  if (streamingKwsActive.value) {
    const outcome = await playPromptWhileListening({
      playback: playWakeAndCommandPrompt,
      nextMode: 'command'
    })
    if (!outcome.started && wakeMonitoring.value && phase.value !== 'error') {
      scheduleListening('command', 150)
    }
  } else if (await playWakeAndCommandPrompt()) {
    scheduleListening('command', 150)
  }
}

const formatPrice = (value) => {
  const price = Number(value)
  return Number.isFinite(price) ? price.toFixed(2) : '0.00'
}

// 父页面每完成一次业务命令都会递增 revision；即使文案相同也必须重新播报。
watch([() => props.feedbackMessage, () => props.feedbackRevision], async ([message, revision]) => {
  if (!message || !wakeMonitoring.value) return
  const promptRevision = ++feedbackPromptRevision
  const audioKey = props.feedbackAudioKey
  clearRestartTimer()
  errorPromptRevision += 1
  handlingErrorPrompt = false
  awaitingCommand.value = false

  // 最新反馈立即抢占旧录音和 TTS；旧 watcher 被唤醒后会被 revision 检查拦截。
  invalidatePromptFlow()
  stopAssistantSound()
  if (active.value) await pause()
  if (
    !wakeMonitoring.value
    || promptRevision !== feedbackPromptRevision
    || revision !== props.feedbackRevision
  ) return

  const canBargeIn = streamingKwsActive.value && !props.actionBusy
  const outcome = canBargeIn
    ? await playPromptWhileListening({
      playback: () => playAssistantPrompt(audioKey, message),
      nextMode: props.continueListening ? 'command' : 'wake',
      nextDelay: 300
    })
    : null
  if (!canBargeIn || !outcome?.started) await playAssistantPrompt(audioKey, message)
  // 播报期间若产生了更新的反馈，旧任务不能再负责启动下一轮监听。
  if (
    !wakeMonitoring.value
    || promptRevision !== feedbackPromptRevision
    || revision !== props.feedbackRevision
  ) return
  if (!outcome?.started) scheduleListening(props.continueListening ? 'command' : 'wake', 300)
})

// 下单等异步业务执行时暂停麦克风，避免把成功提示或环境对话识别成新命令。
watch(() => props.actionBusy, (busy) => {
  clearRestartTimer()
  if (busy) {
    invalidatePromptFlow()
    awaitingCommand.value = false
    if (active.value) void pause()
    return
  }
  if (wakeMonitoring.value && !props.feedbackMessage && !speaking.value) scheduleListening('wake', 300)
}, { flush: 'sync' })

// 热门视频播放时保留小禾可见并继续接受用户主动语音，但暂停主动播报、推荐和唤醒提示。
watch(() => props.watchingPromo, (watching) => {
  if (!watching) {
    if (wakeMonitoring.value && !props.actionBusy && !speaking.value) scheduleListening('wake', 300)
    return
  }
  clearRestartTimer()
  invalidatePromptFlow()
  stopAssistantSound()
  awaitingCommand.value = false
})

// 错误播报只允许一个在途任务，revision 用于废弃已被新错误取代的异步回调。
watch([phase, errorCode], ([currentPhase, currentErrorCode]) => {
  if (currentPhase !== 'error' || !wakeMonitoring.value || handlingErrorPrompt) return
  invalidatePromptFlow()
  const revision = ++errorPromptRevision
  const audioKey = getAssistantErrorAudioKey(currentErrorCode)
  const messageKey = `assistant.errors.${currentErrorCode}`
  const translatedMessage = t(messageKey)
  const fallbackMessage = translatedMessage === messageKey
    ? t('assistant.errors.service_unavailable')
    : translatedMessage
  const retryable = ['recognition_failed', 'speech_too_short', 'no_speech', 'processing_timeout', 'audio_too_long', 'service_busy']
    .includes(currentErrorCode)

  handlingErrorPrompt = true
  awaitingCommand.value = false
  emit('session-end')
  void playAssistantPrompt(audioKey, fallbackMessage).then(() => {
    if (revision !== errorPromptRevision) return
    handlingErrorPrompt = false
    if (retryable && wakeMonitoring.value) scheduleListening('wake', 500)
    else wakeMonitoring.value = false
  })
}, { flush: 'sync' })

watch(() => props.soundEnabled, (enabled) => {
  if (!enabled) stopAssistantSound()
})

watch(normalizedVolume, (volume) => {
  recordedAudio.forEach((audio) => {
    audio.volume = volume
  })
})

onMounted(async () => {
  Object.values(assistantCharacterUrls).forEach((url) => {
    const image = new Image()
    image.src = url
  })

  // 组件挂载时复用 Audio 实例并预加载，避免首次唤醒临时下载产生明显延迟。
  Object.entries(assistantAudioUrls).forEach(([audioKey, audioUrl]) => {
    const audio = new Audio(audioUrl)
    audio.preload = 'auto'
    audio.volume = normalizedVolume.value
    audio.load()
    recordedAudio.set(audioKey, audio)
  })

  if (!wakeAutoStart || !navigator.permissions?.query) return
  try {
    // 仅在用户此前已授权时自动监听；浏览器首次授权必须由明确的用户手势触发。
    const permission = await navigator.permissions.query({ name: 'microphone' })
    if (permission.state !== 'granted') return
    wakeMonitoring.value = true
    scheduleListening('wake', 500)
  } catch {
    // The first manual tap still starts Xiaohe when permission queries are unavailable.
  }
})

onUnmounted(() => {
  wakeMonitoring.value = false
  feedbackPromptRevision += 1
  errorPromptRevision += 1
  handlingErrorPrompt = false
  clearRestartTimer()
  invalidatePromptFlow()
  stopAssistantSound()
  recordedAudio.clear()
  void stop({ preservePhase: true })
})
</script>

<style lang="scss" scoped>
.assistant-recommendation-rail {
  --assistant-panel-width: 245px;
  --recommendation-card-width: 224px;
  --recommendation-list-width: 0px;
  --rail-gap: 14px;
  --rail-shell-width: 26px;
  position: relative;
  z-index: 40;
  flex: 0 0 168px;
  align-self: flex-end;
  box-sizing: border-box;
  width: calc(var(--assistant-panel-width) + var(--rail-shell-width));
  max-width: calc(100% - 40px);
  min-width: 0;
  margin: 0 20px 6px;
  padding: 10px 12px;
  display: grid;
  grid-template-columns: var(--assistant-panel-width);
  justify-content: end;
  align-items: stretch;
  gap: var(--rail-gap);
  color: #243235;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  box-shadow: none;
}

.assistant-recommendation-rail.has-recommendations {
  flex-basis: 176px;
  width: calc(
    var(--recommendation-list-width)
    + var(--assistant-panel-width)
    + var(--rail-gap)
    + var(--rail-shell-width)
  );
  grid-template-columns: minmax(0, var(--recommendation-list-width)) var(--assistant-panel-width);
  justify-content: stretch;
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(36, 50, 53, 0.16);
  box-shadow: 0 5px 18px rgba(30, 44, 47, 0.13);
  backdrop-filter: blur(12px);
}

.recommendation-lane {
  min-width: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 8px;
}

.recommendation-lane__header {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;

  strong {
    flex: 0 0 auto;
    color: #1e746f;
    font-size: 14px;
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #5e696b;
  }

  .customer-transcript {
    color: #243235;
    font-weight: 600;
  }
}

.recommendation-list {
  min-width: 0;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--recommendation-card-width);
  gap: 10px;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  padding: 0 8px 4px 0;
  scrollbar-width: none;
  scroll-padding-inline: 4px 12px;
  scroll-snap-type: x proximity;
  touch-action: pan-x;
  -webkit-overflow-scrolling: touch;
}

.recommendation-list::-webkit-scrollbar { display: none; }

.recommendation-card {
  position: relative;
  min-width: 0;
  height: 110px;
  padding: 6px 8px 6px 44px;
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  color: #243235;
  background: #fff;
  border: 1px solid rgba(30, 116, 111, 0.2);
  border-radius: 7px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  scroll-snap-align: start;

  &:hover,
  &:focus-visible {
    border-color: #1e746f;
    box-shadow: 0 4px 12px rgba(30, 116, 111, 0.16);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid #146b66;
    outline-offset: 1px;
  }

  &.is-sold-out {
    cursor: not-allowed;
    opacity: 0.48;
  }

  &.is-selected {
    border-color: #bd3f31;
    box-shadow: 0 0 0 2px rgba(189, 63, 49, 0.18), 0 5px 14px rgba(30, 116, 111, 0.16);
  }

  img {
    width: 80px;
    height: 80px;
    border-radius: 6px;
    object-fit: cover;
    background: #eef1f0;
  }
}

.recommendation-number {
  position: absolute;
  left: 8px;
  top: 50%;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  color: #fff;
  background: #1e746f;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  transform: translateY(-50%);
}

.recommendation-copy {
  min-width: 0;
  display: grid;
  gap: 5px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    display: -webkit-box;
    overflow: hidden;
    line-height: 1.35;
    white-space: normal;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    font-size: 14px;
  }

  span {
    color: #bd3f31;
    font-size: 13px;
    font-weight: 700;
  }
}

.virtual-assistant {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 115px;
  align-items: center;
  gap: 8px;
}

.assistant-bubble {
  width: fit-content;
  max-width: min(100%, 420px);
  min-width: 0;
  min-height: 0;
  height: auto;
  padding: 9px 10px;
  display: grid;
  align-content: center;
  justify-self: end;
  gap: 2px;
  color: #243235;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(36, 50, 53, 0.18);
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(30, 44, 47, 0.12);

  strong {
    font-size: 13px;
    color: #1e746f;
  }

  span {
    font-size: 14px;
    line-height: 1.35;
    white-space: normal;
    overflow-wrap: anywhere;
  }

}

.assistant-character {
  position: relative;
  width: 115px;
  height: 138px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  isolation: isolate;

  img {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform-origin: 50% 92%;
    animation: assistant-breathe 3.2s ease-in-out infinite;
    filter: drop-shadow(0 7px 6px rgba(28, 48, 51, 0.24));
  }

  &:focus-visible {
    outline: 3px solid #146b66;
    outline-offset: 3px;
    border-radius: 50%;
  }
}

.assistant-halo {
  position: absolute;
  z-index: 1;
  left: 12px;
  right: 12px;
  bottom: 3px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.62);
  border: 2px solid rgba(30, 116, 111, 0.42);
}

.is-listening {
  .assistant-character img {
    animation: assistant-listen 0.8s ease-in-out infinite alternate;
  }

  .assistant-halo {
    animation: assistant-pulse 1.15s ease-out infinite;
  }
}

.is-processing .assistant-character img {
  animation: assistant-think 1.1s ease-in-out infinite;
}

.is-result .assistant-character img {
  animation: assistant-greet 0.7s ease-out 2;
}

.sound-level {
  position: absolute;
  z-index: 5;
  left: 2px;
  bottom: 18px;
  height: 24px;
  display: flex;
  align-items: center;
  gap: 3px;

  i {
    width: 3px;
    height: 8px;
    border-radius: 2px;
    background: #d94e49;
    animation: assistant-level 0.65s ease-in-out infinite alternate;
  }

  i:nth-child(2) { animation-delay: 0.12s; }
  i:nth-child(3) { animation-delay: 0.24s; }
  i:nth-child(4) { animation-delay: 0.36s; }
}

@keyframes assistant-breathe {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.012); }
}

@keyframes assistant-listen {
  from { transform: rotate(-1.5deg) translateY(0); }
  to { transform: rotate(1.5deg) translateY(-3px); }
}

@keyframes assistant-think {
  0%, 100% { transform: rotate(0); }
  50% { transform: rotate(-4deg); }
}

@keyframes assistant-greet {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes assistant-pulse {
  from { transform: scale(0.8); opacity: 0.8; }
  to { transform: scale(1.35); opacity: 0; }
}

@keyframes assistant-level {
  to { height: 22px; }
}

@media (max-width: 768px) {
  .assistant-recommendation-rail {
    --assistant-panel-width: 164px;
    --rail-gap: 8px;
    --rail-shell-width: 18px;
    flex-basis: 140px;
    max-width: calc(100% - 20px);
    margin: 0 10px 4px;
    padding: 8px;
    grid-template-columns: var(--assistant-panel-width);
  }

  .assistant-recommendation-rail.has-recommendations {
    flex-basis: 150px;
    grid-template-columns: minmax(0, var(--recommendation-list-width)) var(--assistant-panel-width);
  }

  .recommendation-card {
    height: 96px;
    padding-left: 36px;
    grid-template-columns: 64px minmax(0, 1fr);

    img {
      width: 64px;
      height: 64px;
    }
  }

  .recommendation-number {
    left: 6px;
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .recommendation-lane__header span {
    display: none;
  }

  .virtual-assistant {
    grid-template-columns: minmax(0, 1fr) 72px;
    gap: 4px;
  }

  .assistant-character {
    width: 72px;
    height: 88px;
  }

  .assistant-bubble {
    min-height: 0;
    max-width: min(100%, 280px);
    padding: 6px 8px;

    span {
      font-size: 11px;
    }
  }

}

@media (prefers-reduced-motion: reduce) {
  .virtual-assistant *,
  .virtual-assistant *::before,
  .virtual-assistant *::after {
    animation: none !important;
  }
}
</style>
