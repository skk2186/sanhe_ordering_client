<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="nativeType"
    @click="handleClick"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
  >
    <!-- 加载状态 -->
    <div v-if="loading" class="btn-loading">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- 图标 -->
    <el-icon v-if="icon && !loading" :class="iconClasses">
      <component :is="icon" />
    </el-icon>
    
    <!-- 按钮内容 -->
    <span v-if="slots.default || text" class="btn-content">
      <slot>{{ text }}</slot>
    </span>
    
    <!-- 右侧图标 -->
    <el-icon v-if="iconRight && !loading" class="btn-icon-right">
      <component :is="iconRight" />
    </el-icon>
  </button>
</template>

<script setup>
import { computed, ref, useSlots } from 'vue'

// Props定义
const props = defineProps({
  // 按钮类型
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'info', 'text'].includes(value)
  },
  // 按钮尺寸
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['mini', 'small', 'medium', 'large', 'xl'].includes(value)
  },
  // 按钮形状
  shape: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'round', 'circle'].includes(value)
  },
  // 按钮变体
  variant: {
    type: String,
    default: 'filled',
    validator: (value) => ['filled', 'outlined', 'text', 'ghost'].includes(value)
  },
  // 按钮文本
  text: {
    type: String,
    default: ''
  },
  // 图标
  icon: {
    type: [String, Object],
    default: null
  },
  // 右侧图标
  iconRight: {
    type: [String, Object],
    default: null
  },
  // 禁用状态
  disabled: {
    type: Boolean,
    default: false
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 原生type属性
  nativeType: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  },
  // 块级按钮
  block: {
    type: Boolean,
    default: false
  },
  // 自定义类名
  customClass: {
    type: String,
    default: ''
  }
})

// Emits定义
const emit = defineEmits(['click'])

// 响应式数据
const isPressed = ref(false)
const slots = useSlots()

// 计算属性
const buttonClasses = computed(() => {
  return [
    'base-button',
    `btn-${props.type}`,
    `btn-${props.size}`,
    `btn-${props.shape}`,
    `btn-${props.variant}`,
    {
      'btn-disabled': props.disabled,
      'btn-loading': props.loading,
      'btn-block': props.block,
      'btn-pressed': isPressed.value,
      'btn-icon-only': !props.text && !slots.default && (props.icon || props.iconRight)
    },
    props.customClass
  ]
})

const iconClasses = computed(() => {
  return [
    'btn-icon',
    {
      'btn-icon-left': props.text || slots.default
    }
  ]
})

// 方法
const handleClick = (event) => {
  if (props.disabled || props.loading) return
  emit('click', event)
}

const handleMouseDown = () => {
  if (props.disabled || props.loading) return
  isPressed.value = true
}

const handleMouseUp = () => {
  isPressed.value = false
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.base-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0;
  margin: 0;
  border: 1px solid transparent;
  border-radius: $border-radius-button;
  font-family: inherit;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  // 防止双击选中文本
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  
  &:focus-visible {
    outline: 2px solid $primary-color;
    outline-offset: 2px;
  }
  
  // 尺寸样式
  &.btn-mini {
    min-height: 24px;
    padding: 4px 8px;
    font-size: 12px;
    line-height: 1.2;
  }
  
  &.btn-small {
    min-height: 32px;
    padding: 6px 12px;
    font-size: 13px;
    line-height: 1.3;
  }
  
  &.btn-medium {
    min-height: 40px;
    padding: 8px 16px;
    font-size: 14px;
    line-height: 1.4;
  }
  
  &.btn-large {
    min-height: 48px;
    padding: 12px 20px;
    font-size: 16px;
    line-height: 1.5;
  }
  
  &.btn-xl {
    min-height: 56px;
    padding: 16px 24px;
    font-size: 18px;
    line-height: 1.5;
  }
  
  // 形状样式
  &.btn-round {
    border-radius: 50px;
  }
  
  &.btn-circle {
    border-radius: 50%;
    padding: 0;
    
    &.btn-mini { width: 24px; }
    &.btn-small { width: 32px; }
    &.btn-medium { width: 40px; }
    &.btn-large { width: 48px; }
    &.btn-xl { width: 56px; }
  }
  
  // 块级按钮
  &.btn-block {
    width: 100%;
  }
  
  // 只有图标的按钮
  &.btn-icon-only {
    gap: 0;
  }
  
  // 按下状态
  &.btn-pressed {
    transform: scale(0.98);
  }
  
  // 禁用状态
  &.btn-disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none !important;
  }
  
  // 加载状态
  &.btn-loading {
    cursor: default;
    pointer-events: none;
    
    .btn-content {
      opacity: 0.6;
    }
  }
}

// 按钮内容
.btn-content {
  display: flex;
  align-items: center;
  transition: opacity 0.2s;
}

// 图标样式
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.btn-icon-left {
    margin-right: 4px;
  }
}

.btn-icon-right {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
}

// 加载动画
.btn-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 按钮类型样式 - Filled变体
.btn-filled {
  // Primary按钮
  &.btn-primary {
    background: $primary-color;
    color: $white;
    border-color: $primary-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($primary-color, 0.9);
      border-color: rgba($primary-color, 0.9);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba($primary-color, 0.3);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($primary-color, 0.8);
      transform: translateY(0);
    }
  }

  // Secondary按钮
  &.btn-secondary {
    background: $secondary-color;
    color: $white;
    border-color: $secondary-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($secondary-color, 0.9);
      border-color: rgba($secondary-color, 0.9);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba($secondary-color, 0.3);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($secondary-color, 0.8);
      transform: translateY(0);
    }
  }

  // Success按钮
  &.btn-success {
    background: $success-color;
    color: $white;
    border-color: $success-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($success-color, 0.9);
      border-color: rgba($success-color, 0.9);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba($success-color, 0.3);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($success-color, 0.8);
      transform: translateY(0);
    }
  }

  // Warning按钮
  &.btn-warning {
    background: $warning-color;
    color: $white;
    border-color: $warning-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($warning-color, 0.9);
      border-color: rgba($warning-color, 0.9);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba($warning-color, 0.3);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($warning-color, 0.8);
      transform: translateY(0);
    }
  }

  // Danger按钮
  &.btn-danger {
    background: $error-color;
    color: $white;
    border-color: $error-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($error-color, 0.9);
      border-color: rgba($error-color, 0.9);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba($error-color, 0.3);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($error-color, 0.8);
      transform: translateY(0);
    }
  }

  // Info按钮
  &.btn-info {
    background: $info-color;
    color: $white;
    border-color: $info-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($info-color, 0.9);
      border-color: rgba($info-color, 0.9);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba($info-color, 0.3);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($info-color, 0.8);
      transform: translateY(0);
    }
  }

  // Default按钮
  &.btn-default {
    background: $white;
    color: $text-primary;
    border-color: $medium-gray;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: $light-gray;
      border-color: rgba($medium-gray, 0.8);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($light-gray, 0.8);
      transform: translateY(0);
    }
  }
}

// 按钮类型样式 - Outlined变体
.btn-outlined {
  background: transparent;

  // Primary按钮
  &.btn-primary {
    color: $primary-color;
    border-color: $primary-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($primary-color, 0.1);
      color: $primary-color;
      border-color: $primary-color;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba($primary-color, 0.2);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($primary-color, 0.15);
      transform: translateY(0);
    }
  }

  // Secondary按钮
  &.btn-secondary {
    color: $secondary-color;
    border-color: $secondary-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($secondary-color, 0.1);
      color: $secondary-color;
      border-color: $secondary-color;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba($secondary-color, 0.2);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($secondary-color, 0.15);
      transform: translateY(0);
    }
  }

  // Success按钮
  &.btn-success {
    color: $success-color;
    border-color: $success-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($success-color, 0.1);
      color: $success-color;
      border-color: $success-color;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba($success-color, 0.2);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($success-color, 0.15);
      transform: translateY(0);
    }
  }

  // Warning按钮
  &.btn-warning {
    color: $warning-color;
    border-color: $warning-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($warning-color, 0.1);
      color: $warning-color;
      border-color: $warning-color;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba($warning-color, 0.2);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($warning-color, 0.15);
      transform: translateY(0);
    }
  }

  // Danger按钮
  &.btn-danger {
    color: $error-color;
    border-color: $error-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($error-color, 0.1);
      color: $error-color;
      border-color: $error-color;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba($error-color, 0.2);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($error-color, 0.15);
      transform: translateY(0);
    }
  }

  // Info按钮
  &.btn-info {
    color: $info-color;
    border-color: $info-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($info-color, 0.1);
      color: $info-color;
      border-color: $info-color;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba($info-color, 0.2);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($info-color, 0.15);
      transform: translateY(0);
    }
  }

  // Default按钮
  &.btn-default {
    color: $text-primary;
    border-color: $medium-gray;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($text-primary, 0.05);
      color: $text-primary;
      border-color: $text-primary;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($text-primary, 0.1);
      transform: translateY(0);
    }
  }
}

// 按钮类型样式 - Text变体
.btn-text {
  background: transparent;
  border-color: transparent;

  // Primary按钮
  &.btn-primary {
    color: $primary-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($primary-color, 0.1);
      color: $primary-color;
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($primary-color, 0.15);
    }
  }

  // Secondary按钮
  &.btn-secondary {
    color: $secondary-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($secondary-color, 0.1);
      color: $secondary-color;
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($secondary-color, 0.15);
    }
  }

  // Success按钮
  &.btn-success {
    color: $success-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($success-color, 0.1);
      color: $success-color;
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($success-color, 0.15);
    }
  }

  // Warning按钮
  &.btn-warning {
    color: $warning-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($warning-color, 0.1);
      color: $warning-color;
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($warning-color, 0.15);
    }
  }

  // Danger按钮
  &.btn-danger {
    color: $error-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($error-color, 0.1);
      color: $error-color;
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($error-color, 0.15);
    }
  }

  // Info按钮
  &.btn-info {
    color: $info-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($info-color, 0.1);
      color: $info-color;
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($info-color, 0.15);
    }
  }

  // Default按钮
  &.btn-default {
    color: $text-primary;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($text-primary, 0.05);
      color: $text-primary;
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($text-primary, 0.1);
    }
  }
}

// 按钮类型样式 - Ghost变体
.btn-ghost {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-color: rgba(255, 255, 255, 0.2);

  // Primary按钮
  &.btn-primary {
    color: $primary-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($primary-color, 0.15);
      border-color: rgba($primary-color, 0.3);
      color: $primary-color;
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($primary-color, 0.2);
    }
  }

  // Secondary按钮
  &.btn-secondary {
    color: $secondary-color;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba($secondary-color, 0.15);
      border-color: rgba($secondary-color, 0.3);
      color: $secondary-color;
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba($secondary-color, 0.2);
    }
  }

  // Default按钮
  &.btn-default {
    color: $white;

    &:hover:not(.btn-disabled):not(.btn-loading) {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
      color: $white;
    }

    &:active:not(.btn-disabled):not(.btn-loading) {
      background: rgba(255, 255, 255, 0.25);
    }
  }
}
</style>
