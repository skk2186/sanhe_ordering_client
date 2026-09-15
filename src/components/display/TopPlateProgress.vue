<template>
  <div
    class="plate-progress"
    :class="{ 'is-midnight-progress': themeKey === 'midnight-station', 'is-complete': numericProgress >= 100 }"
    role="progressbar"
    :aria-label="`距离游戏开始还有 ${formatted}`"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="numericProgress"
    :style="{ '--progress': `${numericProgress}%` }"
  >
    <template v-if="themeKey === 'midnight-station'">
      <span class="progress-fill-art midnight-signal-fill" aria-hidden="true"></span>
      <span class="progress-label">{{ numericProgress >= 100 ? '通行信号' : '站务线路' }}</span>
      <span class="progress-count">{{ formatted }}</span>
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

.progress-label { display: none; }

.is-midnight-progress {
  width: min(100%, 1040px);
  min-height: 92px;
  aspect-ratio: 2172 / 724;
  overflow: visible;
  isolation: auto;
  padding: 0 !important;
  border: 3px solid #9d7841 !important;
  border-radius: 4px;
  background: linear-gradient(180deg, #203833, #0d201d 52%, #152b26) !important;
  box-shadow: inset 0 2px 0 rgba(255, 228, 154, .18), inset 0 -3px 0 rgba(0, 0, 0, .52), 0 6px 15px rgba(0, 0, 0, .42);

  &::before,
  &::after {
    content: '';
    position: absolute;
    z-index: 0;
    top: 50%;
    width: 18px;
    height: 18px;
    border: 3px solid #b98b46;
    border-radius: 50%;
    background: #172a25;
    box-shadow: inset 0 0 0 4px #091513, 0 0 9px rgba(0, 0, 0, .6);
    transform: translateY(-50%);
  }
  &::before { left: 17px; }
  &::after { right: 17px; }

  /* 保留旧站务板的图片结构，亮态只由真实进度裁切，避免将数值画死在素材中。 */
  .midnight-signal-fill {
    z-index: 1;
    top: 46.5%;
    left: 13.5%;
    width: 73%;
    height: 19.5%;
    clip-path: inset(0 calc(100% - var(--progress)) 0 0 round 12px);
    background:
      repeating-linear-gradient(90deg, transparent 0 37px, rgba(9, 20, 20, .78) 38px 46px),
      linear-gradient(90deg, #b96e25, #f4c969 52%, #d99b4a);
    box-shadow: 0 0 12px rgba(232, 171, 72, .58), inset 0 1px 0 rgba(255, 245, 195, .7);
  }

  .progress-label {
    position: absolute;
    z-index: 3;
    left: 16%;
    top: 42%;
    display: block;
    color: #ead6a6;
    font-size: clamp(14px, 1.02vw, 24px);
    font-weight: 800;
    line-height: 1;
    letter-spacing: .12em;
    text-shadow: 0 2px 3px rgba(0, 0, 0, .9);
  }

  .progress-count {
    top: 48%;
    left: auto;
    right: 14.5%;
    color: #fff1c8;
    font-size: clamp(20px, 1.28vw, 30px);
    text-shadow: 0 2px 4px rgba(0, 0, 0, .92);
  }

  &.is-complete {
    .midnight-signal-fill {
      background:
        repeating-linear-gradient(90deg, transparent 0 37px, rgba(8, 28, 18, .78) 38px 46px),
        linear-gradient(90deg, #50755b, #b3c992 52%, #718e70);
      box-shadow: 0 0 13px rgba(143, 189, 127, .58), inset 0 1px 0 rgba(238, 255, 205, .72);
    }

    .progress-label::before { content: '● '; color: #b3c992; }
  }
}

@media (max-width: 600px) {
  .progress-count {
    font-size: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill-art {
    transition: none;
  }
}
</style>
