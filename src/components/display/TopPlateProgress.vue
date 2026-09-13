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
      <div class="station-progress__board" aria-hidden="true">
        <div class="station-progress__heading">
          <span class="station-progress__route-mark">
            <svg viewBox="0 0 34 24" focusable="false">
              <path d="M4 7h22l4 5v5H4zM9 17v3m16-3v3M8 10h7m3 0h7" />
              <circle cx="10" cy="18" r="2" /><circle cx="25" cy="18" r="2" />
            </svg>
          </span>
          <span class="station-progress__label">发车准备 · PLATE ROUTE 03</span>
          <span class="station-progress__count">{{ formatted }}</span>
        </div>
        <div class="station-progress__track">
          <span class="station-progress__fill"></span>
          <span class="station-progress__shine"></span>
          <span class="station-progress__marker station-progress__marker--one"><i>1</i></span>
          <span class="station-progress__marker station-progress__marker--two"><i>2</i></span>
          <span class="station-progress__marker station-progress__marker--three"><i>3</i></span>
          <span class="station-progress__vehicle"></span>
        </div>
      </div>
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

.station-progress__board,
.station-progress__track,
.station-progress__fill,
.station-progress__shine,
.station-progress__vehicle,
.station-progress__marker {
  position: absolute;
  display: block;
}

.plate-progress.is-midnight-station {
  aspect-ratio: 941 / 112;
  padding: 0;
  overflow: visible;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: none;
  filter: drop-shadow(0 8px 12px rgba(4, 8, 8, 0.42));
}

.station-progress__board {
  inset: 3px 2%;
  padding: 8px 16px 12px;
  box-sizing: border-box;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.055), transparent 30%),
    linear-gradient(105deg, #17211f, #0b1111 52%, #1d2925);
  border: 1px solid var(--station-accent-line-strong);
  border-radius: 10px 10px 6px 6px;
  box-shadow:
    inset 0 0 0 3px rgba(4, 8, 8, 0.72),
    inset 0 -5px 0 rgba(0, 0, 0, 0.32),
    0 2px 0 #3e4a43;
}

.station-progress__heading {
  height: 25px;
  display: flex;
  align-items: center;
  gap: 9px;
}

.station-progress__route-mark {
  width: 32px;
  height: 23px;
  display: grid;
  place-items: center;
  color: var(--station-accent);
  background: rgba(211, 169, 78, 0.1);
  border: 1px solid rgba(211, 169, 78, 0.45);
  border-radius: 4px;
}
.station-progress__route-mark svg {
  width: 27px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.station-progress__track {
  left: 16px;
  right: 16px;
  bottom: 12px;
  height: 20px;
  overflow: hidden;
  border: 1px solid #66746b;
  border-radius: 5px;
  background:
    repeating-linear-gradient(90deg, transparent 0 6%, rgba(133, 145, 136, 0.22) 6.2% 6.6%, transparent 6.8% 12%),
    linear-gradient(180deg, #070c0c, #17201e 56%, #080d0c);
  box-shadow: inset 0 2px 6px #020504, 0 1px 0 rgba(247, 242, 232, 0.12);
}

.station-progress__fill {
  inset: 3px auto 3px 3px;
  width: var(--progress);
  max-width: calc(100% - 6px);
  border-radius: 3px;
  background: linear-gradient(90deg, #8a302b, #d0643f 58%, #e0ad4f);
  box-shadow: 0 0 12px rgba(224, 173, 79, 0.34), inset 0 1px rgba(255, 232, 164, 0.52);
  transition: width var(--station-motion-normal) var(--station-easing-standard);
}

.station-progress__shine {
  inset: 4px auto 4px 3px;
  width: var(--progress);
  max-width: calc(100% - 6px);
  overflow: hidden;
  border-radius: 3px;
  background: linear-gradient(100deg, transparent 0 72%, rgba(255, 245, 205, 0.72) 84%, transparent 96%);
  background-size: 160px 100%;
}

.station-progress__marker {
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(234, 209, 145, 0.45);
  box-shadow: 0 0 4px rgba(234, 209, 145, 0.28);
}
.station-progress__marker i {
  position: absolute;
  top: 2px;
  left: 4px;
  color: rgba(244, 229, 190, 0.64);
  font-family: var(--station-font-number);
  font-size: 8px;
  font-style: normal;
}

.station-progress__marker--one { left: 25%; }
.station-progress__marker--two { left: 50%; }
.station-progress__marker--three { left: 75%; }

.station-progress__label {
  color: #e7d8b6;
  font-family: var(--station-font-number);
  font-size: clamp(10px, 0.66vw, 13px);
  font-weight: 700;
  letter-spacing: 0.1em;
}

.station-progress__count {
  margin-inline-start: auto;
  min-width: 4ch;
  color: #f5d46c;
  font-family: var(--station-font-number);
  font-size: clamp(15px, 1vw, 20px);
  font-weight: 800;
  line-height: 1;
  text-align: end;
  text-shadow: 0 0 10px rgba(245, 212, 108, 0.42);
  font-variant-numeric: tabular-nums;
}

.station-progress__vehicle {
  left: clamp(7px, var(--progress), calc(100% - 13px));
  top: 50%;
  width: 11px;
  height: 11px;
  border: 2px solid #fff1bd;
  border-radius: 3px;
  background: #bc4634;
  box-shadow: 0 0 0 2px rgba(188, 70, 52, 0.38), 0 0 10px rgba(255, 225, 139, 0.72);
  transform: translate(-50%, -50%);
  transition: left var(--station-motion-normal) var(--station-easing-standard);
}

@media (prefers-reduced-motion: no-preference) {
  .station-progress__shine { animation: station-progress-scan 2.4s linear infinite; }
}

@keyframes station-progress-scan {
  from { background-position: -160px 0; }
  to { background-position: 160px 0; }
}

@media (max-width: 600px) {
  .progress-count {
    font-size: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill-art,
  .station-progress__fill,
  .station-progress__vehicle {
    transition: none;
  }
  .station-progress__shine { animation: none; }
}
</style>
