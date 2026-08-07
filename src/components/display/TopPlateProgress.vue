<template>
  <!-- 不再包含顶层 .top-section 包裹，由父组件提供该容器，确保父级 scoped 样式生效 -->
  <div class="plate-progress">
    <div class="progress-header">
      <div class="progress-title">🏆 {{ $t('display.plateProgress') }}</div>
      <span class="progress-count">{{ formatted }}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: numericProgress + '%' }"></div>
        <div class="progress-text">{{ formatted }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, unref } from 'vue'
const props = defineProps({
  progress: { type: [Number, Object], required: true },
  formatted: { type: String, required: true }
})

// 兼容传入的是 ref 或 纯数值，并做 0-100 范围保护
const numericProgress = computed(() => {
  const val = Number(unref(props.progress) ?? 0)
  return Math.min(100, Math.max(0, isNaN(val) ? 0 : val))
})
</script>

<style lang="scss" scoped>
@use '@/styles/conveyor-belt.scss';
</style>
