<template>
  <div class="conveyor-shopping-cart">
    <div class="item-group">
      <!-- 右侧：下单按钮在前 -->
      <button v-if="showOrderButton && side === 'right'" class="order-btn" @click="placeOrder">
        <div class="order-text">{{ $t('common.placeOrder') }}</div>
        <div class="order-progress">{{ getCartCount() }}/4</div>
      </button>

      <!-- 购物车圆形显示 -->
      <div
        v-for="(item, index) in cartItems"
        :key="`cart-circle-${index}`"
        class="cart-item"
      >
        <div
          class="item-circle"
          :class="{ 'has-item': item, 'empty-item': !item }"
          @click="selectCartSlot(index)"
        >
          <div v-if="item" class="item-image">
            <img :src="item.image" :alt="item.name" />
          </div>
          <!-- 删除按钮移到圆形右上角 -->
          <button v-if="item" class="circle-close-btn" @click.stop="removeFromCart(index)">×</button>
        </div>
        <!-- 下方信息区域 - 始终显示 -->
        <div class="item-info" :class="{ 'empty-info': !item }">
          <!-- 上方橙色区域显示名称 -->
          <div class="item-name-area" :class="{ 'empty-name': !item }">
            <div class="item-name" v-if="item">{{ item.name }}</div>
          </div>
          <!-- 下方增减按钮区域 -->
          <div class="item-controls" :class="{ 'empty-controls': !item }">
            <button class="minus-btn" :class="{ 'empty-btn': !item }" @click="item && decreaseQuantity(index)">-</button>
            <span class="quantity-display" :class="{ 'empty-quantity': !item }">{{ item ? item.quantity : 0 }}</span>
            <button class="plus-btn" :class="{ 'empty-btn': !item }" @click="item && increaseQuantity(index)">+</button>
          </div>
        </div>
      </div>

      <!-- 左侧：下单按钮在后 -->
      <button v-if="showOrderButton && side === 'left'" class="order-btn" @click="placeOrder">
        <div class="order-text">{{ $t('common.placeOrder') }}</div>
        <div class="order-progress">{{ getCartCount() }}/4</div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// Props
const props = defineProps({
  cartItems: {
    type: Array,
    default: () => new Array(4).fill(null)
  },
  showOrderButton: {
    type: Boolean,
    default: true
  },
  side: {
    type: String,
    default: 'left' // 'left' or 'right'
  }
})

// Emits
const emit = defineEmits(['add-to-cart', 'remove-from-cart', 'update-quantity', 'place-order', 'select-slot'])

// 选择购物车位置
const selectCartSlot = (index) => {
  emit('select-slot', index)
}

// 从购物车移除
const removeFromCart = (index) => {
  if (props.cartItems[index]) {
    // 静默移除，不显示提醒
    emit('remove-from-cart', index)
  }
}

// 增加数量
const increaseQuantity = (index) => {
  if (props.cartItems[index]) {
    emit('update-quantity', index, props.cartItems[index].quantity + 1)
  }
}

// 减少数量
const decreaseQuantity = (index) => {
  if (props.cartItems[index] && props.cartItems[index].quantity > 1) {
    emit('update-quantity', index, props.cartItems[index].quantity - 1)
  }
}

// 下单
const placeOrder = () => {
  emit('place-order')
}

// 获取购物车商品数量
const getCartCount = () => {
  return props.cartItems.filter(item => item !== null).length
}
</script>

<style lang="scss" scoped>


.item-info {
  width: 86px;
  height: 50px;
  margin-top: -8px; /* 负边距让信息区域挡住圆形下方 */
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 2; /* 提高层级，确保挡住圆形 */
  position: relative;
}

.item-name {
  color: white;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.item-controls {
  height: 40%; /* 下方4成 */
  background: linear-gradient(135deg, #FFF3D6 0%, #FFE082 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;

  &.empty-controls {
    background: linear-gradient(135deg, #FFF3D6 0%, #FFE082 100%);
  }
}

.item-controls .minus-btn,
.item-controls .plus-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: linear-gradient(135deg, #FFD54F 0%, #FFC107 100%);
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  color: #553C20;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(.empty-btn) {
    background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
    transform: scale(1.1);
  }

  &:active:not(.empty-btn) {
    transform: scale(0.95);
  }

  &.empty-btn {
    opacity: 0.4;
    cursor: default;
  }
}

.quantity-display {
  font-size: 12px;
  font-weight: bold;
  color: #553C20;
  min-width: 20px;
  text-align: center;

  &.empty-quantity {
    opacity: 0.4;
  }
}

.order-btn {
  background: linear-gradient(135deg, #D4B996 0%, #C8B299 100%);
  border: 2px solid #B59B79;
  border-radius: 8px;
  padding: 15px 20px;
  font-size: 16px;
  font-weight: bold;
  color: #553C20;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  height: 120px; /* 恢复原始高度以容纳两行内容 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: linear-gradient(135deg, #C8B299 0%, #B59B79 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  .order-text {
    font-size: 16px;
    font-weight: bold;
    line-height: 1;
  }

  .order-progress {
    background: rgba(255, 255, 255, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 12px;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: bold;
    color: #553C20;
    min-width: 30px;
    text-align: center;
    backdrop-filter: blur(5px);
  }
}
</style>
