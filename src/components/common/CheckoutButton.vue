<template>
  <div class="checkout-button-container">
    <BaseButton
      type="success"
      variant="filled"
      :size="size"
      :loading="loading"
      :disabled="disabled || isEmpty"
      @click="handleCheckout"
      class="checkout-button"
      :class="{ 
        'checkout-empty': isEmpty,
        'checkout-ready': !isEmpty && !loading,
        'checkout-processing': loading
      }"
      block
    >
      <!-- 加载状态 -->
      <template v-if="loading">
        <el-icon class="checkout-icon loading">
          <Loading />
        </el-icon>
        <span class="checkout-text">处理中...</span>
      </template>
      
      <!-- 空购物车状态 -->
      <template v-else-if="isEmpty">
        <el-icon class="checkout-icon empty">
          <ShoppingCart />
        </el-icon>
        <span class="checkout-text">购物车为空</span>
      </template>
      
      <!-- 正常结账状态 -->
      <template v-else>
        <el-icon class="checkout-icon">
          <Money />
        </el-icon>
        <div class="checkout-content">
          <span class="checkout-text">立即结账</span>
          <div class="checkout-details">
            <span class="item-count">{{ itemCount }}件商品</span>
            <span class="total-price">¥{{ formattedTotal }}</span>
          </div>
        </div>
        <el-icon class="checkout-arrow">
          <ArrowRight />
        </el-icon>
      </template>
    </BaseButton>
    
    <!-- 优惠信息 -->
    <div v-if="discount > 0 && !isEmpty" class="discount-info">
      <el-icon><Discount /></el-icon>
      <span>已优惠 ¥{{ formattedDiscount }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from './BaseButton.vue'
// 图标已在 main.js 中全局注册，直接使用字符串名称

// Props定义
const props = defineProps({
  // 商品总数
  itemCount: {
    type: Number,
    default: 0
  },
  // 总价格
  totalPrice: {
    type: Number,
    default: 0
  },
  // 优惠金额
  discount: {
    type: Number,
    default: 0
  },
  // 按钮尺寸
  size: {
    type: String,
    default: 'large',
    validator: (value) => ['small', 'medium', 'large', 'xl'].includes(value)
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
  // 货币符号
  currency: {
    type: String,
    default: '¥'
  }
})

// Emits定义
const emit = defineEmits(['checkout'])

// 计算属性
const isEmpty = computed(() => props.itemCount === 0)

const formattedTotal = computed(() => {
  return (props.totalPrice - props.discount).toFixed(2)
})

const formattedDiscount = computed(() => {
  return props.discount.toFixed(2)
})

// 方法
const handleCheckout = () => {
  if (props.disabled || props.loading || isEmpty.value) return
  emit('checkout', {
    itemCount: props.itemCount,
    totalPrice: props.totalPrice,
    discount: props.discount,
    finalPrice: props.totalPrice - props.discount
  })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.checkout-button-container {
  position: relative;
  width: 100%;
}

.checkout-button {
  position: relative;
  min-height: 56px;
  padding: 16px 20px;
  background: linear-gradient(135deg, $success-color 0%, #45a049 100%);
  border: none;
  border-radius: 16px;
  color: $white;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 4px 20px rgba($success-color, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover:not(.btn-disabled):not(.checkout-empty) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba($success-color, 0.4);
    
    &::before {
      left: 100%;
    }
    
    .checkout-arrow {
      transform: translateX(4px);
    }
  }
  
  &:active:not(.btn-disabled):not(.checkout-empty) {
    transform: translateY(0);
  }
  
  // 空购物车状态
  &.checkout-empty {
    background: $medium-gray;
    color: $text-disabled;
    cursor: not-allowed;
    box-shadow: none;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
  
  // 准备结账状态
  &.checkout-ready {
    background: linear-gradient(135deg, $success-color 0%, #45a049 100%);
    
    &:hover {
      background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
    }
  }
  
  // 处理中状态
  &.checkout-processing {
    background: linear-gradient(135deg, $info-color 0%, #1976d2 100%);
    cursor: wait;
    
    .loading {
      animation: spin 1s linear infinite;
    }
  }
}

.checkout-icon {
  font-size: 20px;
  
  &.empty {
    opacity: 0.6;
  }
  
  &.loading {
    font-size: 18px;
  }
}

.checkout-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.checkout-text {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
}

.checkout-details {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  opacity: 0.9;
  
  .item-count {
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
  }
  
  .total-price {
    font-weight: 700;
    font-size: 14px;
  }
}

.checkout-arrow {
  font-size: 18px;
  transition: transform 0.2s ease;
}

.discount-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 8px;
  padding: 4px 12px;
  background: rgba($warning-color, 0.1);
  color: $warning-color;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  
  .el-icon {
    font-size: 14px;
  }
}

// 响应式设计
@include mobile {
  .checkout-button {
    min-height: 52px;
    padding: 14px 18px;
    font-size: 15px;
    border-radius: 14px;
  }
  
  .checkout-text {
    font-size: 15px;
  }
  
  .checkout-details {
    font-size: 12px;
    gap: 10px;
    
    .total-price {
      font-size: 13px;
    }
  }
  
  .checkout-icon {
    font-size: 18px;
  }
  
  .checkout-arrow {
    font-size: 16px;
  }
}

// 动画效果
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes success-pulse {
  0% {
    box-shadow: 0 4px 20px rgba($success-color, 0.3);
  }
  50% {
    box-shadow: 0 4px 30px rgba($success-color, 0.5);
  }
  100% {
    box-shadow: 0 4px 20px rgba($success-color, 0.3);
  }
}

.checkout-success {
  animation: success-pulse 1s ease-in-out;
}

// 特殊尺寸
.checkout-button.btn-medium {
  min-height: 48px;
  padding: 12px 16px;
  font-size: 14px;
  
  .checkout-icon {
    font-size: 18px;
  }
  
  .checkout-text {
    font-size: 14px;
  }
  
  .checkout-details {
    font-size: 11px;
    
    .total-price {
      font-size: 12px;
    }
  }
}

.checkout-button.btn-xl {
  min-height: 64px;
  padding: 20px 24px;
  font-size: 18px;
  
  .checkout-icon {
    font-size: 24px;
  }
  
  .checkout-text {
    font-size: 18px;
  }
  
  .checkout-details {
    font-size: 14px;
    
    .total-price {
      font-size: 16px;
    }
  }
}
</style>
