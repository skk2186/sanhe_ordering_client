<template>
  <div class="shopping-cart" :class="{ 'mobile': mobile }">
    <!-- 购物车头部 -->
    <div class="cart-header">
      <div class="header-content">
        <h3 class="cart-title">
          <el-icon><ShoppingCart /></el-icon>
          {{ $t('cart.title') }}
          <el-badge 
            v-if="cartStore.totalItems > 0" 
            :value="cartStore.totalItems" 
            class="cart-badge"
          />
        </h3>
        
        <div class="header-actions">
          <el-button 
            v-if="!mobile"
            type="text" 
            size="small"
            @click="$emit('toggle-visibility')"
          >
            <el-icon><Close /></el-icon>
          </el-button>
          
          <el-button 
            v-if="!cartStore.isEmpty"
            type="text" 
            size="small"
            @click="clearCart"
          >
            <el-icon><Delete /></el-icon>
            {{ $t('common.clear') }}
          </el-button>
        </div>
      </div>
      
      <!-- 桌号信息 -->
      <div v-if="cartStore.tableNumber" class="table-info">
        <el-icon><Location /></el-icon>
        <span>{{ $t('cart.table') }}: {{ cartStore.tableNumber }}</span>
      </div>
    </div>
    
    <!-- 购物车内容 -->
    <div class="cart-content">
      <!-- 空购物车 -->
      <div v-if="cartStore.isEmpty" class="empty-cart">
        <el-empty :description="$t('cart.empty')">
          <div class="empty-actions">
            <p class="empty-tip">{{ $t('cart.emptyTip') }}</p>
            <el-button type="primary" @click="$emit('start-shopping')">
              {{ $t('cart.startOrdering') }}
            </el-button>
          </div>
        </el-empty>
      </div>
      
      <!-- 购物车商品列表 -->
      <div v-else class="cart-items">
        <!-- 按分类分组显示 -->
        <div
          v-for="(items, categoryName) in cartStore.itemsGroupedByCategory"
          :key="categoryName"
          class="category-group"
        >
          <div class="category-header">
            <h4 class="category-name">{{ categoryName }}</h4>
            <span class="category-count">{{ $t('cart.kinds', { count: items.length }) }}</span>
          </div>
          
          <div class="category-items">
            <div
              v-for="item in items"
              :key="item.id"
              class="cart-item"
            >
              <!-- 商品图片 -->
              <div class="item-image">
                <img 
                  :src="item.image || defaultImage" 
                  :alt="item.name"
                  @error="handleImageError"
                />
              </div>
              
              <!-- 商品信息 -->
              <div class="item-info">
                <h5 class="item-name">{{ item.name }}</h5>
                <p class="item-description">{{ item.description }}</p>
                <div class="item-price">
                  <span class="unit-price">{{ formatPrice(item.price) }}</span>
                  <span class="total-price">{{ formatPrice(item.price * item.quantity) }}</span>
                </div>
              </div>
              
              <!-- 数量控制 -->
              <div class="quantity-controls">
                <el-button 
                  size="small" 
                  @click="decreaseQuantity(item)"
                  :disabled="item.quantity <= 1"
                >
                  <el-icon><Minus /></el-icon>
                </el-button>
                <span class="quantity">{{ item.quantity }}</span>
                <el-button 
                  size="small" 
                  @click="increaseQuantity(item)"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>
              
              <!-- 删除按钮 -->
              <div class="item-actions">
                <el-button 
                  type="text" 
                  size="small"
                  @click="removeItem(item)"
                  class="remove-btn"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 购物车底部 -->
    <div v-if="!cartStore.isEmpty" class="cart-footer">
      <!-- 订单备注 -->
      <div class="order-note">
        <el-input
          v-model="orderNote"
          type="textarea"
          :placeholder="$t('cart.orderNote')"
          :rows="2"
          maxlength="200"
          show-word-limit
          @input="updateOrderNote"
        />
      </div>
      
      <!-- 优惠券/折扣 -->
      <div class="discount-section">
        <el-button 
          type="text" 
          size="small"
          @click="showCouponDialog"
        >
          <el-icon><Ticket /></el-icon>
          {{ $t('cart.coupon') }}
        </el-button>
      </div>
      
      <!-- 价格汇总 -->
      <div class="price-summary">
        <div class="summary-row">
          <span>{{ $t('cart.productTotal') }}</span>
          <span>{{ formatPrice(cartStore.totalAmount) }}</span>
        </div>
        <div class="summary-row">
          <span>{{ $t('cart.deliveryFee') }}</span>
          <span>{{ $t('cart.free') }}</span>
        </div>
        <div v-if="discountAmount > 0" class="summary-row discount">
          <span>{{ $t('cart.discount') }}</span>
          <span>-{{ formatPrice(discountAmount) }}</span>
        </div>
        <div class="summary-row total">
          <span>{{ $t('cart.total') }}</span>
          <span class="total-amount">{{ formatPrice(finalAmount) }}</span>
        </div>
      </div>
      
      <!-- 结算按钮 -->
      <div class="checkout-section">
        <CheckoutButton
          :item-count="cartStore.totalItems"
          :total-price="cartStore.totalAmount"
          :discount="discountAmount"
          :loading="checkoutLoading"
          @checkout="handleCheckout"
        />
      </div>
    </div>
    
    <!-- 优惠券对话框 -->
    <el-dialog
      v-model="couponDialogVisible"
      :title="$t('cart.selectCoupon')"
      width="400px"
      center
    >
      <div class="coupon-list">
        <div
          v-for="coupon in availableCoupons"
          :key="coupon.id"
          class="coupon-item"
          :class="{ 'selected': selectedCoupon?.id === coupon.id }"
          @click="selectCoupon(coupon)"
        >
          <div class="coupon-info">
            <h4>{{ coupon.name }}</h4>
            <p>{{ coupon.description }}</p>
            <span class="coupon-amount">-{{ formatPrice(coupon.amount) }}</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="couponDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="applyCoupon">
          {{ $t('cart.confirmUse') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/utils'
import { ElMessage, ElMessageBox } from 'element-plus'
import CheckoutButton from '@/components/common/CheckoutButton.vue'
import { useI18n } from '@/i18n'
import {
  ShoppingCart,
  Close,
  Delete,
  Location,
  Minus,
  Plus,
  Ticket,
  CreditCard
} from '@element-plus/icons-vue'

// 定义props
const props = defineProps({
  mobile: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['toggle-visibility', 'checkout', 'start-shopping'])

// 状态管理
const cartStore = useCartStore()
const { t } = useI18n()

// 响应式数据
const orderNote = ref('')
const checkoutLoading = ref(false)
const couponDialogVisible = ref(false)
const selectedCoupon = ref(null)
const discountAmount = ref(0)
const defaultImage = '/images/default-food.jpg'

// 模拟优惠券数据
const availableCoupons = ref([
  { id: 1, name: '新用户优惠', description: '满50减10', amount: 10, minAmount: 50 },
  { id: 2, name: '周末特惠', description: '满100减20', amount: 20, minAmount: 100 },
  { id: 3, name: '会员专享', description: '满200减50', amount: 50, minAmount: 200 }
])

// 计算属性
const finalAmount = computed(() => {
  return Math.max(0, cartStore.totalAmount - discountAmount.value)
})

// 增加商品数量
const increaseQuantity = (item) => {
  cartStore.increaseQuantity(item.id)
}

// 减少商品数量
const decreaseQuantity = (item) => {
  cartStore.decreaseQuantity(item.id)
}

// 移除商品
const removeItem = async (item) => {
  try {
    await ElMessageBox.confirm(
      `${t('cart.removeConfirm')} ${item.name}`,
      t('common.remove'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )
    
    cartStore.removeItem(item.id)
  } catch (error) {
    // 用户取消
  }
}

// 清空购物车
const clearCart = async () => {
  try {
    await ElMessageBox.confirm(
      t('cart.clearConfirm'),
      t('common.clear'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )
    
    cartStore.clearCart()
    selectedCoupon.value = null
    discountAmount.value = 0
  } catch (error) {
    // 用户取消
  }
}

// 更新订单备注
const updateOrderNote = (note) => {
  cartStore.setOrderNote(note)
}

// 显示优惠券对话框
const showCouponDialog = () => {
  couponDialogVisible.value = true
}

// 选择优惠券
const selectCoupon = (coupon) => {
  if (cartStore.totalAmount >= coupon.minAmount) {
    selectedCoupon.value = coupon
  } else {
    ElMessage.warning(t('cart.couponNeed', { amount: formatPrice(coupon.minAmount) }))
  }
}

// 应用优惠券
const applyCoupon = () => {
  if (selectedCoupon.value) {
    discountAmount.value = selectedCoupon.value.amount
    ElMessage.success(t('cart.couponApplied', { name: selectedCoupon.value.name }))
  }
  couponDialogVisible.value = false
}

// 处理结算
const handleCheckout = async (checkoutData) => {
  try {
    checkoutLoading.value = true

    // 验证购物车
    const validation = cartStore.validateCart()
    if (!validation.isValid) {
      ElMessage.error(validation.errors.join(', '))
      return
    }

    // 创建订单数据
    const orderData = {
      ...cartStore.createOrderData(),
      discountAmount: discountAmount.value,
      couponId: selectedCoupon.value?.id,
      finalAmount: finalAmount.value,
      ...checkoutData // 包含来自CheckoutButton的数据
    }

    emit('checkout', orderData)

  } catch (error) {
    console.error('结算失败:', error)
    ElMessage.error(error.message || t('errors.requestFailed'))
  } finally {
    checkoutLoading.value = false
  }
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.src = defaultImage
}

// 监听购物车订单备注变化
watch(() => cartStore.orderNote, (newNote) => {
  orderNote.value = newNote
}, { immediate: true })
</script>

<style lang="scss" scoped>
.shopping-cart {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  
  &.mobile {
    height: auto;
    max-height: 70vh;
  }
}

.cart-header {
  padding: 20px;
  border-bottom: 1px solid $border-color-light;
  
  .header-content {
    @include flex-between;
    margin-bottom: 12px;
    
    .cart-title {
      @include flex-center;
      gap: 8px;
      font-size: $font-size-lg;
      font-weight: 600;
      color: $text-color-primary;
      margin: 0;
      
      .cart-badge {
        margin-left: 8px;
      }
    }
    
    .header-actions {
      @include flex-center;
      gap: 8px;
    }
  }
  
  .table-info {
    @include flex-center;
    gap: 6px;
    font-size: $font-size-sm;
    color: $text-color-secondary;
    
    .el-icon {
      color: $color-primary;
    }
  }
}

.cart-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px;
}

.empty-cart {
  padding: 40px 20px;
  text-align: center;
  
  .empty-actions {
    .empty-tip {
      font-size: $font-size-sm;
      color: $text-color-secondary;
      margin: 16px 0;
    }
  }
}

.category-group {
  margin-bottom: 24px;
  
  .category-header {
    @include flex-between;
    padding: 12px 0;
    border-bottom: 1px solid $border-color-light;
    margin-bottom: 12px;
    
    .category-name {
      font-size: $font-size-md;
      font-weight: 600;
      color: $text-color-primary;
      margin: 0;
    }
    
    .category-count {
      font-size: $font-size-xs;
      color: $text-color-secondary;
    }
  }
}

.cart-item {
  @include flex-center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid $border-color-light;
  
  &:last-child {
    border-bottom: none;
  }
  
  .item-image {
    width: 60px;
    height: 60px;
    border-radius: $border-radius;
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
    min-width: 0;
    
    .item-name {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $text-color-primary;
      margin: 0 0 4px 0;
      @include text-ellipsis;
    }
    
    .item-description {
      font-size: $font-size-xs;
      color: $text-color-secondary;
      margin: 0 0 8px 0;
      @include text-ellipsis;
    }
    
    .item-price {
      @include flex-between;
      
      .unit-price {
        font-size: $font-size-xs;
        color: $text-color-secondary;
      }
      
      .total-price {
        font-size: $font-size-sm;
        font-weight: 600;
        color: $primary-color;
      }
    }
  }
  
  .quantity-controls {
    @include flex-center;
    gap: 8px;
    
    .quantity {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $text-color-primary;
      min-width: 24px;
      text-align: center;
    }
    
    .el-button {
      width: 28px;
      height: 28px;
      padding: 0;
    }
  }
  
  .item-actions {
    .remove-btn {
      color: $color-danger;
      
      &:hover {
        background: rgba($color-danger, 0.1);
      }
    }
  }
}

.cart-footer {
  padding: 20px;
  border-top: 1px solid $border-color-light;
  background: $bg-color-light;
  
  .order-note {
    margin-bottom: 16px;
  }
  
  .discount-section {
    margin-bottom: 16px;
    text-align: center;
  }
  
  .price-summary {
    margin-bottom: 20px;
    
    .summary-row {
      @include flex-between;
      padding: 8px 0;
      font-size: $font-size-sm;
      
      &.discount {
        color: $color-success;
      }
      
      &.total {
        border-top: 1px solid $border-color-light;
        padding-top: 12px;
        margin-top: 8px;
        font-size: $font-size-md;
        font-weight: 600;
        
        .total-amount {
          color: $primary-color;
          font-size: $font-size-lg;
        }
      }
    }
  }
  
  .checkout-btn {
    width: 100%;
    height: 48px;
    font-size: $font-size-md;
    font-weight: 600;
    
    .el-icon {
      margin-right: 8px;
    }
  }
}

// 优惠券对话框
.coupon-list {
  max-height: 300px;
  overflow-y: auto;
  
  .coupon-item {
    padding: 16px;
    border: 1px solid $border-color-light;
    border-radius: $border-radius;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all $transition-base;
    
    &:hover {
      border-color: $color-primary;
      box-shadow: $box-shadow-sm;
    }
    
    &.selected {
      border-color: $color-primary;
      background: rgba($color-primary, 0.1);
    }
    
    .coupon-info {
      h4 {
        font-size: $font-size-md;
        font-weight: 600;
        color: $text-color-primary;
        margin: 0 0 8px 0;
      }
      
      p {
        font-size: $font-size-sm;
        color: $text-color-secondary;
        margin: 0 0 8px 0;
      }
      
      .coupon-amount {
        font-size: $font-size-sm;
        font-weight: 600;
        color: $color-danger;
      }
    }
  }
}

// 深色模式适配
.dark {
  .shopping-cart {
    background: rgba(40, 40, 40, 0.95);
    
    .cart-header,
    .cart-footer {
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    .cart-footer {
      background: rgba(30, 30, 30, 0.8);
    }
    
    .cart-title,
    .category-name,
    .item-name {
      color: white;
    }
    
    .category-header {
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    .cart-item {
      border-color: rgba(255, 255, 255, 0.05);
    }
    
    .summary-row.total {
      border-color: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
