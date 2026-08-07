<template>
  <el-dialog
    v-model="visible"
    :title="$t('cart.selectCoupon')"
    width="90%"
    :max-width="500"
    center
    class="coupon-selector-dialog"
  >
    <div class="coupon-list">
      <div 
        v-for="coupon in availableCoupons" 
        :key="coupon.id"
        class="coupon-item"
        :class="{ disabled: !isCouponAvailable(coupon) }"
        @click="selectCoupon(coupon)"
      >
        <div class="coupon-left">
          <div class="coupon-discount">
            <span v-if="coupon.type === 'amount'" class="discount-amount">
              ¥{{ coupon.discount }}
            </span>
            <span v-else class="discount-rate">
              {{ Math.round((1 - coupon.discount) * 10) }}折
            </span>
          </div>
        </div>
        
        <div class="coupon-content">
          <h4 class="coupon-name">{{ coupon.name }}</h4>
          <p class="coupon-description">{{ coupon.description }}</p>
          <div class="coupon-condition">
            {{ $t('cart.couponNeed', { amount: `¥${coupon.minAmount}` }) }}
          </div>
        </div>
        
        <div class="coupon-action">
          <el-button 
            v-if="isCouponAvailable(coupon)"
            type="primary" 
            size="small"
          >
            {{ $t('cart.confirmUse') }}
          </el-button>
          <span v-else class="unavailable-text">
            {{ $t('cart.couponUnavailable') }}
          </span>
        </div>
      </div>
      
      <div v-if="availableCoupons.length === 0" class="no-coupons">
        <el-icon size="48" color="#ccc">
          <Ticket />
        </el-icon>
        <p>{{ $t('cart.noCoupons') }}</p>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="visible = false">{{ $t('common.cancel') }}</el-button>
      <el-button type="text" @click="selectCoupon(null)">
        {{ $t('cart.notUseCoupon') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { Ticket } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  availableCoupons: {
    type: Array,
    default: () => []
  },
  orderAmount: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['update:visible', 'select'])

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 方法
const isCouponAvailable = (coupon) => {
  return props.orderAmount >= coupon.minAmount
}

const selectCoupon = (coupon) => {
  if (coupon && !isCouponAvailable(coupon)) {
    return
  }
  
  emit('select', coupon)
  visible.value = false
}
</script>

<style lang="scss" scoped>
.coupon-selector-dialog {
  :deep(.el-dialog__header) {
    background: $primary-color;
    color: $white;
    
    .el-dialog__title {
      font-size: $font-size-xl;
      font-weight: 600;
    }
  }
}

.coupon-list {
  max-height: 60vh;
  overflow-y: auto;
  
  .coupon-item {
    display: flex;
    align-items: center;
    padding: $spacing-md;
    margin-bottom: $spacing-sm;
    background: $white;
    border: 1px solid $light-gray;
    border-radius: $border-radius-card;
    cursor: pointer;
    transition: all $transition-fast;
    
    &:hover:not(.disabled) {
      border-color: $primary-color;
      box-shadow: $shadow-sm;
    }
    
    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .coupon-left {
      width: 8rem;
      height: 6rem;
      background: linear-gradient(135deg, $primary-color, lighten($primary-color, 10%));
      border-radius: $border-radius-button;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: $spacing-md;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        right: -0.8rem;
        top: 50%;
        transform: translateY(-50%);
        width: 1.6rem;
        height: 1.6rem;
        background: $white;
        border-radius: 50%;
      }
      
      .discount-amount,
      .discount-rate {
        color: $white;
        font-size: $font-size-xl;
        font-weight: 600;
      }
    }
    
    .coupon-content {
      flex: 1;
      
      .coupon-name {
        font-size: $font-size-base;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: $spacing-xs;
      }
      
      .coupon-description {
        font-size: $font-size-sm;
        color: $text-secondary;
        margin-bottom: $spacing-xs;
      }
      
      .coupon-condition {
        font-size: $font-size-xs;
        color: $text-disabled;
      }
    }
    
    .coupon-action {
      .unavailable-text {
        font-size: $font-size-xs;
        color: $text-disabled;
      }
    }
  }
  
  .no-coupons {
    text-align: center;
    padding: $spacing-xl;
    color: $text-secondary;
    
    p {
      margin-top: $spacing-md;
      font-size: $font-size-base;
    }
  }
}
</style>
