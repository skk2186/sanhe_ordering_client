<template>
  <div class="loading-container" :class="containerClass">
    <div class="loading-spinner" :style="spinnerStyle"></div>
    <span v-if="text" class="loading-text">{{ displayText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '@/i18n'

const props = defineProps({
  // 加载文本，默认为'加载中...'
  text: {
    type: String,
    default: '加载中...'
  },
  // 容器额外的CSS类名
  containerClass: {
    type: String,
    default: ''
  },
  // 加载动画颜色
  color: {
    type: String,
    default: '#f3a633'
  },
  // 加载动画大小（px）
  size: {
    type: Number,
    default: 30
  },
  // 是否显示文本
  showText: {
    type: Boolean,
    default: true
  }
});

const { t } = useI18n()
const displayText = computed(() => props.text === '加载中...' ? t('common.loading') : props.text)

// 计算spinner的样式
const spinnerStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderTopColor: props.color
}));
</script>

<style lang="scss" scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  
  &.grid-placeholder {
    grid-column: 1 / -1;
    height: 100%;
  }
}

.loading-spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 10px;
}

.loading-text {
  font-size: 16px;
  color: #666;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
