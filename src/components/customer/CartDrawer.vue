<template>
  <el-drawer
    v-model="visible"
    title="购物车"
    direction="rtl"
    size="400px"
    class="cart-drawer"
  >
    <div class="cart-content">
      <!-- 空购物车状态 -->
      <div v-if="items.length === 0" class="empty-cart">
        <div class="empty-icon">
          <el-icon size="64" color="#ccc">
            <ShoppingCartFull />
          </el-icon>
        </div>
        <h3>购物车是空的</h3>
        <p>快去选择您喜欢的美食吧！</p>
        <el-button type="primary" @click="visible = false">
          去点餐
        </el-button>
      </div>

      <!-- 购物车商品列表 -->
      <div v-else class="cart-items">
        <div 
          v-for="item in items" 
          :key="item.id"
          class="cart-item"
        >
          <div class="item-image">
            <img :src="item.image" :alt="item.name" />
          </div>
          
          <div class="item-info">
            <h4 class="item-name">{{ item.name }}</h4>
            
            <!-- 定制信息 -->
            <div v-if="item.customizations" class="customizations">
              <div 
                v-for="(options, customizationId) in item.customizations" 
                :key="customizationId"
                class="customization-item"
              >
                <span class="customization-name">{{ getCustomizationName(customizationId) }}:</span>
                <span class="customization-options">{{ getCustomizationOptions(customizationId, options) }}</span>
              </div>
            </div>
            
            <!-- 特殊要求 -->
            <div v-if="item.specialRequest" class="special-request">
              <span class="request-label">备注:</span>
              <span class="request-text">{{ item.specialRequest }}</span>
            </div>
            
            <div class="item-footer">
              <div class="price-info">
                <span class="unit-price">¥{{ item.price }}</span>
                <span v-if="item.quantity > 1" class="total-price">
                  小计: ¥{{ (item.price * item.quantity).toFixed(2) }}
                </span>
              </div>
              
              <div class="quantity-control">
                <el-button 
                  size="small" 
                  @click="decreaseQuantity(item.id)"
                  :disabled="item.quantity <= 1"
                >
                  <el-icon><Minus /></el-icon>
                </el-button>
                <span class="quantity">{{ item.quantity }}</span>
                <el-button 
                  size="small" 
                  @click="increaseQuantity(item.id)"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
          
          <div class="item-actions">
            <el-button 
              type="text" 
              size="small"
              @click="removeItem(item.id)"
            >
              <el-icon color="#f56c6c"><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部结算区域 -->
    <template #footer v-if="items.length > 0">
      <div class="cart-footer">
        <!-- 优惠券选择 -->
        <div class="coupon-section">
          <el-button 
            type="text" 
            @click="showCouponSelector"
            class="coupon-btn"
          >
            <el-icon><Ticket /></el-icon>
            <span v-if="selectedCoupon">已选择优惠券</span>
            <span v-else>选择优惠券</span>
          </el-button>
        </div>

        <!-- 价格明细 -->
        <div class="price-summary">
          <div class="price-row">
            <span>商品总价</span>
            <span>¥{{ subtotal }}</span>
          </div>
          <div v-if="deliveryFee > 0" class="price-row">
            <span>配送费</span>
            <span>¥{{ deliveryFee }}</span>
          </div>
          <div v-if="discount > 0" class="price-row discount">
            <span>优惠减免</span>
            <span>-¥{{ discount }}</span>
          </div>
          <div class="price-row total">
            <span>实付金额</span>
            <span>¥{{ totalAmount }}</span>
          </div>
        </div>

        <!-- 结算按钮 -->
        <el-button 
          type="primary" 
          size="large"
          class="checkout-btn"
          @click="checkout"
          :disabled="items.length === 0"
        >
          去结算 ({{ totalItems }}件)
        </el-button>
      </div>
    </template>

    <!-- 优惠券选择弹窗 -->
    <CouponSelector 
      v-model:visible="showCouponModal"
      :available-coupons="availableCoupons"
      @select="selectCoupon"
    />
  </el-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ShoppingCartFull,
  Plus,
  Minus,
  Delete,
  Ticket
} from '@element-plus/icons-vue'
import CouponSelector from './CouponSelector.vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:visible', 'update-quantity', 'remove-item'])

const router = useRouter()

// 响应式数据
const selectedCoupon = ref(null)
const showCouponModal = ref(false)
const availableCoupons = ref([
  {
    id: 1,
    name: '新用户专享',
    description: '满100减20',
    discount: 20,
    minAmount: 100,
    type: 'amount'
  },
  {
    id: 2,
    name: '会员专享',
    description: '9折优惠',
    discount: 0.9,
    minAmount: 50,
    type: 'rate'
  }
])

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const totalItems = computed(() => {
  return props.items.reduce((total, item) => total + item.quantity, 0)
})

const subtotal = computed(() => {
  return props.items.reduce((total, item) => {
    return total + (item.price * item.quantity)
  }, 0).toFixed(2)
})

const deliveryFee = computed(() => {
  // 满50免配送费
  return parseFloat(subtotal.value) >= 50 ? 0 : 5
})

const discount = computed(() => {
  if (!selectedCoupon.value) return 0
  
  const coupon = selectedCoupon.value
  const amount = parseFloat(subtotal.value)
  
  if (amount < coupon.minAmount) return 0
  
  if (coupon.type === 'amount') {
    return coupon.discount
  } else if (coupon.type === 'rate') {
    return (amount * (1 - coupon.discount)).toFixed(2)
  }
  
  return 0
})

const totalAmount = computed(() => {
  const total = parseFloat(subtotal.value) + deliveryFee.value - parseFloat(discount.value)
  return Math.max(0, total).toFixed(2)
})

// 方法
const increaseQuantity = (itemId) => {
  emit('update-quantity', itemId, 'increase')
}

const decreaseQuantity = (itemId) => {
  emit('update-quantity', itemId, 'decrease')
}

const removeItem = async (itemId) => {
  try {
    await ElMessageBox.confirm('确定要移除这个商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    emit('remove-item', itemId)
    ElMessage.success('商品已移除')
  } catch (error) {
    // 用户取消
  }
}

const showCouponSelector = () => {
  showCouponModal.value = true
}

const selectCoupon = (coupon) => {
  selectedCoupon.value = coupon
  showCouponModal.value = false
  ElMessage.success(`已选择优惠券：${coupon.name}`)
}

const checkout = () => {
  if (props.items.length === 0) {
    ElMessage.warning('购物车为空')
    return
  }
  
  // 构建订单数据
  const orderData = {
    items: props.items,
    coupon: selectedCoupon.value,
    subtotal: subtotal.value,
    deliveryFee: deliveryFee.value,
    discount: discount.value,
    totalAmount: totalAmount.value
  }
  
  // 跳转到结算页面
  router.push({
    name: 'Checkout',
    params: { orderData: JSON.stringify(orderData) }
  })
  
  visible.value = false
}

const getCustomizationName = (customizationId) => {
  // 这里应该从菜品数据中获取定制选项名称
  // 暂时返回ID
  return `选项${customizationId}`
}

const getCustomizationOptions = (customizationId, options) => {
  // 这里应该从菜品数据中获取选项名称
  // 暂时返回选项值
  if (Array.isArray(options)) {
    return options.join(', ')
  }
  return options
}
</script>

<style lang="scss" scoped>
.cart-drawer {
  :deep(.el-drawer__header) {
    background: $primary-color;
    color: $white;
    padding: $spacing-md $spacing-lg;
    margin-bottom: 0;
    
    .el-drawer__title {
      font-size: $font-size-xl;
      font-weight: 600;
    }
  }
  
  :deep(.el-drawer__body) {
    padding: 0;
    display: flex;
    flex-direction: column;
  }
}

.cart-content {
  flex: 1;
  overflow-y: auto;
  
  .empty-cart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: $spacing-xl;
    text-align: center;
    
    .empty-icon {
      margin-bottom: $spacing-lg;
    }
    
    h3 {
      font-size: $font-size-xl;
      color: $text-primary;
      margin-bottom: $spacing-sm;
    }
    
    p {
      color: $text-secondary;
      margin-bottom: $spacing-lg;
    }
  }
  
  .cart-items {
    padding: $spacing-md;
    
    .cart-item {
      display: flex;
      gap: $spacing-sm;
      padding: $spacing-md;
      background: $white;
      border-radius: $border-radius-card;
      margin-bottom: $spacing-sm;
      box-shadow: $shadow-sm;
      
      .item-image {
        width: 6rem;
        height: 6rem;
        border-radius: $border-radius-button;
        overflow: hidden;
        flex-shrink: 0;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      
      .item-info {
        flex: 1;
        
        .item-name {
          font-size: $font-size-base;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: $spacing-xs;
          @include text-ellipsis;
        }
        
        .customizations {
          margin-bottom: $spacing-xs;
          
          .customization-item {
            font-size: $font-size-sm;
            color: $text-secondary;
            margin-bottom: 2px;
            
            .customization-name {
              font-weight: 500;
            }
            
            .customization-options {
              margin-left: $spacing-xs;
            }
          }
        }
        
        .special-request {
          font-size: $font-size-sm;
          color: $text-secondary;
          margin-bottom: $spacing-xs;
          
          .request-label {
            font-weight: 500;
          }
          
          .request-text {
            margin-left: $spacing-xs;
          }
        }
        
        .item-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          
          .price-info {
            .unit-price {
              font-size: $font-size-base;
              font-weight: 600;
              color: $primary-color;
            }
            
            .total-price {
              font-size: $font-size-sm;
              color: $text-secondary;
              margin-left: $spacing-xs;
            }
          }
          
          .quantity-control {
            display: flex;
            align-items: center;
            gap: $spacing-xs;
            
            .el-button {
              width: 2.4rem;
              height: 2.4rem;
              border-radius: 50%;
            }
            
            .quantity {
              min-width: 2rem;
              text-align: center;
              font-weight: 600;
              color: $primary-color;
            }
          }
        }
      }
      
      .item-actions {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        
        .el-button {
          padding: $spacing-xs;
        }
      }
    }
  }
}

.cart-footer {
  padding: $spacing-lg;
  background: $white;
  border-top: 1px solid $light-gray;
  
  .coupon-section {
    margin-bottom: $spacing-md;
    
    .coupon-btn {
      width: 100%;
      height: 4rem;
      border: 1px dashed $primary-color;
      color: $primary-color;
      border-radius: $border-radius-button;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-xs;
      
      &:hover {
        background: rgba($primary-color, 0.05);
      }
    }
  }
  
  .price-summary {
    margin-bottom: $spacing-lg;
    
    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-xs;
      font-size: $font-size-sm;
      
      &.discount {
        color: $success-color;
      }
      
      &.total {
        font-size: $font-size-base;
        font-weight: 600;
        color: $primary-color;
        padding-top: $spacing-xs;
        border-top: 1px solid $light-gray;
      }
    }
  }
  
  .checkout-btn {
    width: 100%;
    height: 4.8rem;
    font-size: $font-size-lg;
    font-weight: 600;
  }
}
</style>