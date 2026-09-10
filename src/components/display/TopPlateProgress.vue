<template>
  <div
    class="plate-progress"
    :class="{ 'is-midnight-station': themeKey === 'midnight-station' }"
    role="progressbar"
    :aria-label="`距离游戏开始还有 ${formatted}`"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="numericProgress"
    :style="{ '--progress': `${numericProgress}%` }"
  >
    <template v-if="themeKey === 'midnight-station'">
      <div class="station-progress__track" aria-hidden="true">
        <span class="station-progress__fill"></span>
        <span class="station-progress__marker station-progress__marker--one"></span>
        <span class="station-progress__marker station-progress__marker--two"></span>
        <span class="station-progress__marker station-progress__marker--three"></span>
      </div>
      <span class="station-progress__label">PLATE ROUTE</span>
      <span class="station-progress__count">{{ formatted }}</span>
    </template>
    <template v-else>
      <img class="progress-background" :src="assetUrls.background" alt="" aria-hidden="true">
      <img class="progress-fill-art" :src="assetUrls.fill" alt="" aria-hidden="true">
      <img class="progress-frame" :src="assetUrls.frame" alt="" aria-hidden="true">
      <span class="progress-count">{{ formatted }}</span>
    </template>
  </div>
</template>

<script setup>
import { computed, unref } from 'vue'

const props = defineProps({
  progress: { type: [Number, Object], required: true },
  formatted: { type: String, required: true },
  themeKey: { type: String, default: 'zhenxian' }
})

// 兼容传入的是 ref 或 纯数值，并做 0-100 范围保护
const numericProgress = computed(() => {
  const val = Number(unref(props.progress) ?? 0)
  return Math.min(100, Math.max(0, isNaN(val) ? 0 : val))
})

const assetUrls = computed(() => {
  const themeFolder = props.themeKey === 'xiaoxin' ? 'c' : 'b'
  const base = `/images/ui/${themeFolder}`

  return {
    background: `${base}/bar.png`,
    frame: `${base}/bar1.png`,
    fill: `${base}/bar2.png`
  }
})
</script>

<style lang="scss" scoped>
.plate-progress {
  position: relative;
  width: min(100%, 941px);
  aspect-ratio: 941 / 93;
  overflow: hidden;
  isolation: isolate;
}

.progress-background,
.progress-frame,
.progress-fill-art {
  position: absolute;
  display: block;
  pointer-events: none;
  user-select: none;
}

.progress-background {
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
}

.progress-fill-art {
  z-index: 1;
  top: 45%;
  left: 17%;
  width: 79.81%;
  height: 45%;
  clip-path: inset(0 calc(100% - var(--progress)) 0 0);
  transition: clip-path 500ms cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-frame {
  z-index: 2;
  top: 25%;
  left: 0.32%;
  width: 99.36%;
  height: 70.02%;
}

.progress-count {
  position: absolute;
  z-index: 3;
  top: 24%;
  left: 85%;
  min-width: 3.5ch;
  transform: translateY(-50%);
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  text-align: left;
  text-shadow: 0 2px 3px rgba(43, 19, 9, 0.72);
}

.station-progress__track,
.station-progress__fill,
.station-progress__marker {
  position: absolute;
  display: block;
}

.plate-progress.is-midnight-station {
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: var(--station-radius-panel);
  box-shadow: none;
  backdrop-filter: none;
}

.station-progress__track {
  inset: 42% 8% auto;
  height: 14px;
  overflow: hidden;
  border: 1px solid var(--station-border);
  border-radius: var(--station-radius-small, 4px);
  background: var(--station-background-deep);
}

.station-progress__fill {
  inset: 0 auto 0 0;
  width: var(--progress);
  background: var(--station-primary);
  transition: width var(--station-motion-normal) var(--station-easing-standard);
}

.station-progress__marker {
  top: -1px;
  bottom: -1px;
  width: 1px;
  background: var(--station-accent);
  opacity: 0.8;
}

.station-progress__marker--one { left: 25%; }
.station-progress__marker--two { left: 50%; }
.station-progress__marker--three { left: 75%; }

.station-progress__label {
  position: absolute;
  left: 8%;
  top: 19%;
  color: var(--station-text-secondary);
  font-family: var(--station-font-number);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.station-progress__count {
  position: absolute;
  right: 8%;
  top: 16%;
  color: var(--station-text-primary);
  font-family: var(--station-font-number);
  font-size: clamp(18px, 1.2vw, 24px);
  font-weight: 700;
  line-height: 1;
}

@media (max-width: 600px) {
  .progress-count {
    font-size: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill-art,
  .station-progress__fill {
    transition: none;
  }
}
</style>
