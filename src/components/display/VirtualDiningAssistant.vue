<template>
  <Teleport to="body">
    <aside class="virtual-assistant" :class="`is-${phase}`" aria-live="polite">
      <div class="assistant-bubble" role="status">
        <strong>{{ $t('assistant.name') }}</strong>
        <span v-if="phase === 'result' && transcript" class="assistant-transcript">
          {{ t('assistant.heardTranscript', { transcript }) }}
        </span>
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
        <img :src="xiaocanChef" alt="" aria-hidden="true" />
        <span class="assistant-mic" aria-hidden="true">
          <el-icon v-if="phase === 'connecting'"><Loading /></el-icon>
          <el-icon v-else><Microphone /></el-icon>
        </span>
        <span v-if="phase === 'listening'" class="sound-level" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </span>
      </button>
    </aside>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { Loading, Microphone } from '@element-plus/icons-vue'
import xiaocanChef from '@/assets/assistant/xiaocan-chef.svg'
import { useVoiceRecognition } from '@/composables/useVoiceRecognition'
import { useI18n } from '@/i18n'

const props = defineProps({
  hotwords: {
    type: Array,
    default: () => []
  },
  matchCount: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['transcript', 'session-start'])
const { t } = useI18n()

const {
  phase,
  transcript,
  errorCode,
  speechDetected,
  toggle
} = useVoiceRecognition({
  getHotwords: () => props.hotwords,
  onFinal: (event) => emit('transcript', event.text, event)
})

const active = computed(() => ['connecting', 'listening', 'processing'].includes(phase.value))

const statusText = computed(() => {
  if (phase.value === 'connecting') return t('assistant.connecting')
  if (phase.value === 'listening') {
    return speechDetected.value ? t('assistant.voiceDetected') : t('assistant.microphoneReady')
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

const buttonLabel = computed(() => active.value
  ? t('assistant.stopListening')
  : t('assistant.startListening'))

const handleToggle = async () => {
  if (!active.value) emit('session-start')
  await toggle()
}
</script>

<style lang="scss" scoped>
.virtual-assistant {
  position: fixed;
  top: clamp(16px, 9vh, 92px);
  right: clamp(12px, 2.4vw, 40px);
  z-index: 1950;
  width: min(240px, calc(100vw - 24px));
  display: grid;
  justify-items: end;
  gap: 6px;
  pointer-events: none;
}

.assistant-bubble {
  width: 100%;
  min-height: 48px;
  padding: 9px 11px;
  display: grid;
  gap: 2px;
  color: #243235;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(36, 50, 53, 0.18);
  border-radius: 8px;
  box-shadow: 0 5px 18px rgba(30, 44, 47, 0.16);
  pointer-events: auto;

  strong {
    font-size: 13px;
    color: #1e746f;
  }

  span {
    font-size: 14px;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .assistant-transcript {
    color: #1e746f;
    font-weight: 600;
  }
}

.assistant-character {
  position: relative;
  width: 116px;
  height: 136px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  isolation: isolate;
  justify-self: end;

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
  left: 18px;
  right: 18px;
  bottom: 3px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.62);
  border: 2px solid rgba(30, 116, 111, 0.42);
}

.assistant-mic {
  position: absolute;
  z-index: 4;
  right: 0;
  bottom: 8px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: #fff;
  background: #1e746f;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 3px 10px rgba(31, 61, 63, 0.3);

  .el-icon {
    font-size: 19px;
  }
}

.is-connecting .assistant-mic .el-icon {
  animation: assistant-spin 1s linear infinite;
}

.is-listening {
  .assistant-character img {
    animation: assistant-listen 0.8s ease-in-out infinite alternate;
  }

  .assistant-halo {
    animation: assistant-pulse 1.15s ease-out infinite;
  }

  .assistant-mic {
    background: #d94e49;
  }
}

.is-processing .assistant-character img {
  animation: assistant-think 1.1s ease-in-out infinite;
}

.is-result .assistant-character img {
  animation: assistant-greet 0.7s ease-out 2;
}

.is-error .assistant-mic {
  background: #6a5552;
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

@keyframes assistant-spin {
  to { transform: rotate(360deg); }
}

@keyframes assistant-level {
  to { height: 22px; }
}

@media (max-width: 768px) {
  .virtual-assistant {
    top: 12px;
    right: 10px;
    width: min(204px, calc(100vw - 20px));
  }

  .assistant-character {
    width: 86px;
    height: 102px;
  }

  .assistant-bubble {
    width: 100%;

    span {
      font-size: 13px;
    }
  }

  .assistant-mic {
    width: 32px;
    height: 32px;
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
