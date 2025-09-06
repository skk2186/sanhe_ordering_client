<template>
  <BaseButton
    :type="buttonType"
    :variant="variant"
    :size="size"
    :shape="shape"
    :loading="loading"
    :disabled="disabled"
    :block="block"
    @click="handleClick"
    :class="[
      'function-button',
      `function-${functionType}`,
      { 'has-badge': badge }
    ]"
  >
    <!-- 图标 -->
    <el-icon v-if="icon" class="function-icon">
      <component :is="icon" />
    </el-icon>
    
    <!-- 表情符号图标 -->
    <span v-else-if="emoji" class="function-emoji">{{ emoji }}</span>
    
    <!-- 按钮文本 -->
    <span class="function-text">{{ text }}</span>
    
    <!-- 徽章 -->
    <span v-if="badge" class="function-badge">{{ badge }}</span>
    
    <!-- 右侧箭头 -->
    <el-icon v-if="showArrow" class="function-arrow">
      <ArrowRight />
    </el-icon>
  </BaseButton>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from './BaseButton.vue'
// 图标已在 main.js 中全局注册，直接使用字符串名称

// Props定义
const props = defineProps({
  // 功能类型
  functionType: {
    type: String,
    default: 'default',
    validator: (value) => [
      'default', 'menu', 'settings', 'navigation', 'order', 'checkout', 
      'call', 'search', 'filter', 'sort', 'help', 'feedback'
    ].includes(value)
  },
  // 按钮文本
  text: {
    type: String,
    required: true
  },
  // 图标
  icon: {
    type: [String, Object],
    default: null
  },
  // 表情符号
  emoji: {
    type: String,
    default: ''
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
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 禁用状态
  disabled: {
    type: Boolean,
    default: false
  },
  // 块级按钮
  block: {
    type: Boolean,
    default: false
  },
  // 徽章数字
  badge: {
    type: [String, Number],
    default: null
  },
  // 显示右箭头
  showArrow: {
    type: Boolean,
    default: false
  }
})

// Emits定义
const emit = defineEmits(['click'])

// 计算属性
const buttonType = computed(() => {
  const typeMap = {
    menu: 'info',
    settings: 'default',
    navigation: 'info',
    order: 'primary',
    checkout: 'success',
    call: 'warning',
    search: 'info',
    filter: 'default',
    sort: 'default',
    help: 'info',
    feedback: 'secondary'
  }
  return typeMap[props.functionType] || 'default'
})

// 方法
const handleClick = (event) => {
  if (props.disabled || props.loading) return
  emit('click', event)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.function-button {
  position: relative;
  gap: 8px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover:not(.btn-disabled):not(.btn-loading) {
    transform: translateY(-1px);
  }
  
  &:active:not(.btn-disabled):not(.btn-loading) {
    transform: translateY(0);
  }
  
  // 功能类型特殊样式
  &.function-menu {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: $white;
    border: none;
    
    &:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
  }
  
  &.function-checkout {
    background: linear-gradient(135deg, $success-color 0%, #45a049 100%);
    color: $white;
    border: none;
    font-weight: 600;
    
    &:hover {
      background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
      box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
    }
  }
  
  &.function-call {
    background: linear-gradient(135deg, $warning-color 0%, #f57c00 100%);
    color: $white;
    border: none;
    
    &:hover {
      background: linear-gradient(135deg, #f57c00 0%, #ef6c00 100%);
      box-shadow: 0 4px 15px rgba(255, 152, 0, 0.4);
    }
  }
  
  &.function-order {
    background: linear-gradient(135deg, $primary-color 0%, #ff6f00 100%);
    color: $white;
    border: none;
    font-weight: 600;
    
    &:hover {
      background: linear-gradient(135deg, #ff6f00 0%, #e65100 100%);
      box-shadow: 0 4px 15px rgba(255, 122, 0, 0.4);
    }
  }
}

.function-icon {
  font-size: 1.2em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.function-emoji {
  font-size: 1.2em;
  line-height: 1;
}

.function-text {
  font-weight: inherit;
  white-space: nowrap;
}

.function-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  background: $error-color;
  color: $white;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  border-radius: 9px;
  border: 2px solid $white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  // 数字超过99显示99+
  &::after {
    content: attr(data-badge);
  }
}

.function-arrow {
  font-size: 0.9em;
  opacity: 0.7;
  transition: transform 0.2s ease;
  
  .function-button:hover & {
    transform: translateX(2px);
    opacity: 1;
  }
}

// 特殊尺寸调整
.function-button.btn-large,
.function-button.btn-xl {
  .function-icon,
  .function-emoji {
    font-size: 1.4em;
  }
  
  .function-text {
    font-size: 1.1em;
  }
}

.function-button.btn-small,
.function-button.btn-mini {
  .function-icon,
  .function-emoji {
    font-size: 1em;
  }
  
  .function-badge {
    min-width: 16px;
    height: 16px;
    font-size: 10px;
    line-height: 16px;
    border-radius: 8px;
    top: -4px;
    right: -4px;
  }
}

// 响应式设计
@include mobile {
  .function-button {
    min-height: 44px; // 确保触摸友好
    
    .function-text {
      font-size: 14px;
    }
  }
}

// 脉冲动画（用于重要按钮）
@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 0 0 rgba($primary-color, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba($primary-color, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba($primary-color, 0);
  }
}

.function-button.pulse {
  animation: pulse-glow 2s infinite;
}

// 摇摆动画（用于呼叫按钮）
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.function-button.shake {
  animation: shake 0.5s ease-in-out;
}
</style>
