<template>
  <div
    class="ambient-effects"
    :class="[`theme-${themeKey}`, { 'is-paused': paused || reducedMotion }]"
    aria-hidden="true"
  >
    <span
      v-if="activeEvent"
      :key="activeEvent.id"
      class="ambient-event"
      :class="`ambient-event--${activeEvent.type}`"
      :style="eventStyle"
    ></span>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  paused: { type: Boolean, default: false }
})

const EVENT_LIBRARY = {
  ailaotou: [
    { type: 'steam', duration: 4200, left: 50, top: 56 },
    { type: 'knife-glint', duration: 2800, left: 38, top: 61 },
    { type: 'warmth', duration: 3800, left: 51, top: 47 }
  ],
  zhenxian: [
    { type: 'foam-sweep', duration: 4200, left: 0, top: 38 },
    { type: 'surface-shimmer', duration: 3300, left: 24, top: 53 },
    { type: 'fish-shadow', duration: 3600, left: 8, top: 66 }
  ],
  xiaoxin: [
    { type: 'bubble-cluster', duration: 4800, left: 16, top: 63 },
    { type: 'fish-shadow', duration: 3600, left: 78, top: 49 },
    { type: 'caustic', duration: 4000, left: 40, top: 34 }
  ],
  // Phase 01 keeps the station space quiet. The rail geometry itself is the
  // ambient identity; signal choreography is reserved for a later phase.
  'midnight-station': []
}

const themeKey = ref('zhenxian')
const activeEvent = ref(null)
const reducedMotion = ref(false)
let eventId = 0
let nextTimer = 0
let eventTimer = 0
let themeObserver = null

const eventStyle = computed(() => {
  if (!activeEvent.value) return {}
  return {
    '--event-left': `${activeEvent.value.left}%`,
    '--event-top': `${activeEvent.value.top}%`,
    '--event-duration': `${activeEvent.value.duration}ms`
  }
})

const clearTimers = () => {
  window.clearTimeout(nextTimer)
  window.clearTimeout(eventTimer)
  nextTimer = 0
  eventTimer = 0
}

const clearEvent = () => {
  window.clearTimeout(eventTimer)
  eventTimer = 0
  activeEvent.value = null
}

const scheduleNext = (delay = Math.round(Math.random() * 3000)) => {
  window.clearTimeout(nextTimer)
  if (props.paused || reducedMotion.value) return
  nextTimer = window.setTimeout(playNextEvent, delay)
}

const playNextEvent = () => {
  if (props.paused || reducedMotion.value) return
  const candidates = EVENT_LIBRARY[themeKey.value] || EVENT_LIBRARY.zhenxian
  if (!candidates.length) return
  const event = candidates[Math.floor(Math.random() * candidates.length)]
  activeEvent.value = { ...event, id: ++eventId }
  eventTimer = window.setTimeout(() => {
    clearEvent()
    scheduleNext()
  }, event.duration + 180)
}

const applyTheme = () => {
  themeKey.value = document.documentElement.getAttribute('data-theme') || 'zhenxian'
  clearEvent()
  scheduleNext(1800)
}

watch(() => props.paused, (paused) => {
  clearTimers()
  clearEvent()
  if (!paused) scheduleNext(1400)
})

onMounted(() => {
  reducedMotion.value = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
  applyTheme()
  themeObserver = new MutationObserver(applyTheme)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})

onUnmounted(() => {
  clearTimers()
  themeObserver?.disconnect()
})
</script>

<style lang="scss" scoped>
.ambient-effects {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}

.ambient-event {
  position: absolute;
  left: var(--event-left);
  top: var(--event-top);
  display: block;
  pointer-events: none;
  animation-duration: var(--event-duration);
  animation-timing-function: ease-in-out;
  animation-fill-mode: both;
}

.ambient-effects:not(.is-paused) .ambient-event {
  will-change: transform, opacity;
}

.ambient-effects.is-paused .ambient-event {
  animation-play-state: paused;
}

.theme-ailaotou .ambient-event { color: rgba(255, 245, 220, 0.9); }
.theme-zhenxian .ambient-event,
.theme-xiaoxin .ambient-event { color: rgba(160, 225, 235, 0.88); }

.ambient-event--steam {
  width: 108px;
  height: 155px;
  transform: translate(-50%, -80%);
  opacity: 0;
  animation-name: steam-rise;
}

.ambient-event--steam::before,
.ambient-event--steam::after {
  content: '';
  position: absolute;
  bottom: 0;
  width: 30px;
  height: 126px;
  border-left: 5px solid currentColor;
  border-radius: 50%;
  filter: blur(1px);
}

.ambient-event--steam::before { left: 19px; transform: rotate(-7deg); }
.ambient-event--steam::after { right: 18px; height: 104px; transform: rotate(8deg); }

.ambient-event--knife-glint {
  width: 320px;
  height: 6px;
  transform: translate(-50%, -50%) rotate(-7deg);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 235, 0.95), transparent);
  box-shadow: 0 0 28px rgba(255, 231, 165, 0.9);
  opacity: 0;
  animation-name: glint-sweep;
}

.ambient-event--warmth {
  width: 300px;
  height: 130px;
  transform: translate(-50%, -50%);
  background: linear-gradient(90deg, transparent, rgba(255, 190, 98, 0.4), transparent);
  filter: blur(4px);
  opacity: 0;
  animation-name: warmth-pulse;
}

.ambient-event--foam-sweep {
  left: 0;
  width: 140vw;
  height: 32px;
  transform: translate(-30%, -50%);
  border-top: 6px solid currentColor;
  border-radius: 50%;
  opacity: 0;
  animation-name: foam-sweep;
}

.ambient-event--foam-sweep::after {
  content: '';
  position: absolute;
  top: -18px;
  left: 0;
  width: 100%;
  height: 24px;
  background: radial-gradient(ellipse at center, currentColor 0 17%, transparent 19%) 0 0 / 88px 24px repeat-x;
  opacity: 0.82;
}

.ambient-event--surface-shimmer {
  width: 420px;
  height: 110px;
  transform: translate(-50%, -50%) rotate(-4deg);
  background: linear-gradient(105deg, transparent 16%, rgba(255, 255, 255, 0.9) 46%, transparent 74%);
  filter: blur(1px) drop-shadow(0 0 12px rgba(255, 255, 255, 0.5));
  opacity: 0;
  animation-name: shimmer-drift;
}

.ambient-event--fish-shadow {
  width: 128px;
  height: 46px;
  transform: translate(-50%, -50%);
  background: currentColor;
  border-radius: 60% 46% 46% 60%;
  opacity: 0;
  filter: drop-shadow(0 4px 5px rgba(4, 85, 116, 0.35));
  clip-path: polygon(0 50%, 18% 15%, 30% 36%, 72% 22%, 100% 50%, 72% 78%, 30% 64%, 18% 85%);
  animation-name: fish-drift;
}

.ambient-event--bubble-cluster {
  width: 150px;
  height: 220px;
  transform: translate(-50%, -55%);
  background:
    radial-gradient(circle at 24% 85%, transparent 0 8px, currentColor 9px 12px, transparent 13px),
    radial-gradient(circle at 60% 62%, transparent 0 13px, currentColor 14px 17px, transparent 18px),
    radial-gradient(circle at 40% 36%, transparent 0 6px, currentColor 7px 10px, transparent 11px),
    radial-gradient(circle at 75% 16%, transparent 0 10px, currentColor 11px 14px, transparent 15px);
  opacity: 0;
  animation-name: bubble-rise;
}

.ambient-event--caustic {
  width: 420px;
  height: 220px;
  transform: translate(-50%, -50%) rotate(-5deg);
  background: repeating-linear-gradient(112deg, transparent 0 26px, rgba(230, 255, 255, 0.25) 30px 37px, transparent 42px 64px);
  filter: blur(1px) drop-shadow(0 0 10px rgba(220, 255, 255, 0.24));
  opacity: 0;
  animation-name: caustic-drift;
}

@keyframes steam-rise {
  0% { opacity: 0; transform: translate(-50%, -58%) scale(0.76); }
  22% { opacity: 0.92; }
  72% { opacity: 0.6; }
  100% { opacity: 0; transform: translate(-48%, -115%) scale(1.12); }
}

@keyframes glint-sweep {
  0%, 100% { opacity: 0; transform: translate(-100%, -50%) rotate(-7deg); }
  35% { opacity: 1; }
  60% { opacity: 0; transform: translate(45%, -50%) rotate(-7deg); }
}

@keyframes warmth-pulse {
  0%, 100% { opacity: 0; transform: translate(-50%, -50%) scaleX(0.6); }
  42% { opacity: 1; }
  68% { opacity: 0.22; }
}

@keyframes foam-sweep {
  0% { opacity: 0; transform: translate(-45%, -50%); }
  22% { opacity: 0.82; }
  78% { opacity: 0.68; }
  100% { opacity: 0; transform: translate(12%, -50%); }
}

@keyframes shimmer-drift {
  0% { opacity: 0; transform: translate(-120%, -50%) rotate(-4deg); }
  35% { opacity: 0.82; }
  100% { opacity: 0; transform: translate(120%, -50%) rotate(-4deg); }
}

@keyframes fish-drift {
  0% { opacity: 0; transform: translate(-150%, -50%) scale(0.78); }
  24% { opacity: 0.5; }
  74% { opacity: 0.4; }
  100% { opacity: 0; transform: translate(150%, -50%) scale(1.08); }
}

@keyframes bubble-rise {
  0% { opacity: 0; transform: translate(-50%, 18%) scale(0.78); }
  22% { opacity: 0.88; }
  100% { opacity: 0; transform: translate(-44%, -75%) scale(1.1); }
}

@keyframes caustic-drift {
  0%, 100% { opacity: 0; transform: translate(-75%, -50%) rotate(-5deg); }
  38% { opacity: 0.7; }
  70% { opacity: 0.48; }
}

@media (prefers-reduced-motion: reduce) {
  .ambient-event { display: none; }
}
</style>
