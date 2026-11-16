<template>
  <div
    class="plate-progress"
    role="progressbar"
    :aria-label="`距离游戏开始还有 ${formatted}`"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="numericProgress"
    :class="{ 'is-forest': themeKey === 'zhenxian' }"
    :style="{ '--progress': `${numericProgress}%` }"
  >
    <template v-if="themeKey === 'zhenxian'">
      <img class="forest-progress-art" src="/images/ui/b/forest-progress.png" alt="" aria-hidden="true">
      <span class="forest-progress-track" aria-hidden="true">
        <span class="forest-progress-fill"></span>
      </span>
    </template>
    <template v-else>
      <img class="progress-background" :src="assetUrls.background" alt="" aria-hidden="true">
      <img class="progress-fill-art" :src="assetUrls.fill" alt="" aria-hidden="true">
      <img class="progress-frame" :src="assetUrls.frame" alt="" aria-hidden="true">
    </template>
    <span class="progress-count">{{ formatted }}</span>
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
  const base = `/images/ui/${props.themeKey === 'xiaoxin' ? 'c' : 'b'}`

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

.plate-progress.is-forest {
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  backdrop-filter: none;
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

.forest-progress-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
}

.forest-progress-track {
  position: absolute;
  top: 51.2%;
  left: 24.6%;
  width: 61.2%;
  height: 13.2%;
  overflow: hidden;
  border-radius: 999px;
  background: #5c3524;
  box-shadow: inset 0 2px 4px rgba(38, 20, 13, .56);
}

.forest-progress-fill {
  display: block;
  width: var(--progress);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #83ab2f 0%, #c9cc39 55%, #ffd85a 100%);
  box-shadow: inset 0 2px 2px rgba(255, 255, 255, .35);
  transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1);
}

.plate-progress.is-forest .progress-count {
  top: 60%;
  left: 87%;
  color: #fff4d4;
  text-shadow: 0 2px 3px #3b2218;
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
