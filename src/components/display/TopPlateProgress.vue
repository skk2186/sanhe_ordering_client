<template>
  <div
    class="plate-progress"
    :class="{ 'is-midnight-progress': themeKey === 'midnight-station', 'is-complete': numericProgress >= 100 }"
    role="progressbar"
    :aria-label="`距离游戏开始还有 ${formatted}`"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="numericProgress"
    :style="progressStyle"
  >
    <template v-if="themeKey === 'midnight-station'">
      <img class="midnight-progress-hanger" src="/images/ui/midnight-station/progress-hanger-v1.png" alt="" aria-hidden="true">
      <img class="midnight-progress-facility" src="/images/ui/midnight-station/progress-console-v2.png" alt="" aria-hidden="true">
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

// Normalized anchors are intentionally kept next to the progress logic: the
// generated hanger, console, label and percentage always share one scale.
const MIDNIGHT_PROGRESS_ANCHORS = {
  hanger: { x: 0, y: -58, width: 100, height: 76 },
  label: { x: 22, y: 31, width: 30, height: 18 },
  percent: { x: 72, y: 31, width: 12, height: 18 }
}
const progressStyle = computed(() => ({
  '--progress': `${numericProgress.value}%`,
  '--hanger-x': `${MIDNIGHT_PROGRESS_ANCHORS.hanger.x}%`,
  '--hanger-y': `${MIDNIGHT_PROGRESS_ANCHORS.hanger.y}px`,
  '--hanger-w': `${MIDNIGHT_PROGRESS_ANCHORS.hanger.width}%`,
  '--hanger-h': `${MIDNIGHT_PROGRESS_ANCHORS.hanger.height}px`,
  '--label-x': `${MIDNIGHT_PROGRESS_ANCHORS.label.x}%`,
  '--label-y': `${MIDNIGHT_PROGRESS_ANCHORS.label.y}%`,
  '--percent-x': `${MIDNIGHT_PROGRESS_ANCHORS.percent.x}%`,
  '--percent-y': `${MIDNIGHT_PROGRESS_ANCHORS.percent.y}%`
}))

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
  aspect-ratio: 1040 / 124;
  overflow: visible;
  isolation: auto;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0;
  background: transparent !important;
  box-shadow: none;

  .midnight-progress-facility {
    position: absolute;
    z-index: 1;
    top: -52%;
    left: 0;
    width: 100%;
    height: 204%;
    object-fit: fill;
    pointer-events: none;
    user-select: none;
  }

  .midnight-progress-hanger {
    position: absolute;
    z-index: 0;
    left: var(--hanger-x);
    top: var(--hanger-y);
    width: var(--hanger-w);
    height: var(--hanger-h);
    object-fit: fill;
    pointer-events: none;
    user-select: none;
  }

  /* 设施结构全部来自图片；这里只裁切真实进度的信号灯亮态。 */
  .midnight-signal-fill {
    z-index: 2;
    top: 58%;
    left: 16.8%;
    width: 66.3%;
    height: 21%;
    clip-path: inset(0 calc(100% - var(--progress)) 0 0);
    background:
      repeating-linear-gradient(90deg, transparent 0 30px, rgba(9, 20, 20, .88) 31px 37px),
      linear-gradient(90deg, #b96e25, #f4c969 52%, #d99b4a);
    box-shadow: 0 0 10px rgba(232, 171, 72, .72);
    opacity: .86;
  }

  .progress-label {
    position: absolute;
    z-index: 3;
    left: var(--label-x);
    top: var(--label-y);
    display: block;
    color: #ead6a6;
    font-size: clamp(14px, 1.02vw, 24px);
    font-weight: 800;
    line-height: 1;
    letter-spacing: .12em;
    text-shadow: 0 2px 3px rgba(0, 0, 0, .9);
  }

  .progress-count {
    top: var(--percent-y);
    left: auto;
    left: var(--percent-x);
    right: auto;
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
