<template>
  <div class="add-to-cart-container">
    <!-- 数量控制器 -->
    <div v-if="quantity > 0" class="quantity-controller">
      <BaseButton
        type="danger"
        variant="outlined"
        size="small"
        shape="circle"
        icon="Minus"
        @click="decreaseQuantity"
        :disabled="loading"
        class="quantity-btn decrease-btn"
      />
      
      <div class="quantity-display">
        <span class="quantity-number">{{ quantity }}</span>
      </div>
      
      <BaseButton
        type="primary"
        variant="filled"
        size="small"
        shape="circle"
        icon="Plus"
        @click="increaseQuantity"
        :disabled="loading || (maxQuantity && quantity >= maxQuantity)"
        class="quantity-btn increase-btn"
      />
    </div>
    
    <!-- 添加到购物车按钮 -->
    <BaseButton
      v-else
      type="primary"
      variant="filled"
      :size="size"
      :loading="loading"
      :disabled="disabled || soldOut"
      @click="addToCart"
      class="add-cart-btn"
      :class="{ 'sold-out': soldOut }"
    >
      <template v-if="soldOut">
        <el-icon><CircleCloseFilled /></el-icon>
        {{ $t('common.soldOut') }}
      </template>
      <template v-else>
        <el-icon><ShoppingCart /></el-icon>
        {{ displayAddText }}
      </template>
    </BaseButton>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from './BaseButton.vue'
import { useI18n } from '@/i18n'
// 图标已在 main.js 中全局注册，直接使用字符串名称

// Props定义
const props = defineProps({
  // 当前数量
  quantity: {
    type: Number,
    default: 0
  },
  // 最大数量限制
  maxQuantity: {
    type: Number,
    default: null
  },
  // 按钮尺寸
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['mini', 'small', 'medium', 'large', 'xl'].includes(value)
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
  // 售完状态
  soldOut: {
    type: Boolean,
    default: false
  },
  // 添加按钮文本
  addText: {
    type: String,
    default: '加入购物车'
  },
  // 商品信息
  item: {
    type: Object,
    default: () => ({})
  }
})

// Emits定义
const emit = defineEmits(['add-to-cart', 'increase', 'decrease', 'quantity-change'])
const { t } = useI18n()
const displayAddText = computed(() => props.addText === '加入购物车' ? t('common.addToCart') : props.addText)

// 方法
const addToCart = () => {
  if (props.disabled || props.loading || props.soldOut) return
  emit('add-to-cart', props.item)
}

const increaseQuantity = () => {
  if (props.loading || (props.maxQuantity && props.quantity >= props.maxQuantity)) return
  const newQuantity = props.quantity + 1
  emit('increase', { item: props.item, quantity: newQuantity })
  emit('quantity-change', { item: props.item, quantity: newQuantity, action: 'increase' })
}

const decreaseQuantity = () => {
  if (props.loading || props.quantity <= 0) return
  const newQuantity = props.quantity - 1
  emit('decrease', { item: props.item, quantity: newQuantity })
  emit('quantity-change', { item: props.item, quantity: newQuantity, action: 'decrease' })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.add-to-cart-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.quantity-controller {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px;
  background: rgba($primary-color, 0.05);
  border-radius: 24px;
  border: 1px solid rgba($primary-color, 0.2);
  
  .quantity-btn {
    width: 32px;
    height: 32px;
    min-height: 32px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      transform: scale(1.1);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  .decrease-btn {
    &:hover {
      background: rgba($error-color, 0.1);
      border-color: $error-color;
      color: $error-color;
    }
  }
  
  .increase-btn {
    &:hover {
      background: rgba($primary-color, 0.9);
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba($primary-color, 0.3);
    }
  }
}

.quantity-display {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  background: $white;
  border-radius: 16px;
  border: 1px solid rgba($primary-color, 0.2);
  
  .quantity-number {
    font-size: 14px;
    font-weight: 600;
    color: $primary-color;
    line-height: 1;
  }
}

.add-cart-btn {
  min-width: 120px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover:not(.sold-out) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba($primary-color, 0.4);
  }
  
  &:active:not(.sold-out) {
    transform: translateY(0);
  }
  
  &.sold-out {
    background: $medium-gray !important;
    border-color: $medium-gray !important;
    color: $white !important;
    cursor: not-allowed;
    
    &:hover {
      transform: none !important;
      box-shadow: none !important;
    }
  }
}

// 响应式设计
@include mobile {
  .quantity-controller {
    gap: 8px;
    
    .quantity-btn {
      width: 28px;
      height: 28px;
      min-height: 28px;
    }
  }
  
  .quantity-display {
    min-width: 28px;
    height: 28px;
    border-radius: 14px;
    
    .quantity-number {
      font-size: 12px;
    }
  }
  
  .add-cart-btn {
    min-width: 100px;
    font-size: 13px;
  }
}

// 动画效果
@keyframes addToCartSuccess {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.add-cart-success {
  animation: addToCartSuccess 0.3s ease-in-out;
}

// 脉冲效果
@keyframes pulse {
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

.pulse-effect {
  animation: pulse 1s ease-in-out;
}
</style>
