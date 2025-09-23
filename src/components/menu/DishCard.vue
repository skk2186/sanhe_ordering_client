<template>
  <div
    class="dish-card"
    :class="cardClasses"
    @click="handleCardClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 新品标签 -->
    <div class="new-badge" v-if="item.isNew">
      <span>NEW</span>
    </div>

    <!-- 选中状态图标 -->
    <div class="selected-icon" v-if="isSelected">
      <el-icon><Check /></el-icon>
    </div>

    <!-- 菜品图片 -->
    <div class="dish-image-container">
      <img
        :src="item.imageUrl || '/images/default-dish.jpg'"
        :alt="item.name"
        class="dish-image"
        :class="{ 'sold-out': item.status === 'SOLD_OUT' }"
        @load="handleImageLoad"
        @error="handleImageError"
      >

      <!-- 售罄遮罩 -->
      <div class="sold-out-overlay" v-if="item.status === 'SOLD_OUT'">
        <span class="sold-out-text">售罄</span>
      </div>

      <!-- 悬停时的快速添加按钮 -->
      <div class="quick-add-btn" v-if="showQuickAdd && !isSoldOut" @click.stop="quickAddToCart">
        <el-icon><Plus /></el-icon>
      </div>
    </div>

    <!-- 菜品信息 -->
    <div class="dish-info">
      <h3 class="dish-name">{{ item.name }}</h3>
      <p class="dish-description" v-if="item.description">{{ item.description }}</p>

      <!-- 价格和评分 -->
      <div class="dish-meta">
        <div class="price-section">
          <span class="current-price">¥{{ item.price }}</span>
          <span class="original-price" v-if="item.originalPrice && item.originalPrice > item.price">
            ¥{{ item.originalPrice }}
          </span>
        </div>

        <div class="rating-section" v-if="item.rating">
          <el-rate
            v-model="item.rating"
            disabled
            show-score
            text-color="#ff9900"
            score-template="{value}"
            size="small"
          />
        </div>
      </div>

      <!-- 标签 -->
      <div class="dish-tags" v-if="item.tags && item.tags.length">
        <el-tag
          v-for="tag in item.tags.slice(0, 2)"
          :key="tag.id"
          size="small"
          :type="getTagType(tag.type)"
          effect="plain"
        >
          {{ tag.name }}
        </el-tag>
      </div>

      <!-- 操作按钮区域 -->
      <div class="dish-actions" v-if="!isSoldOut">
        <AddToCartButton
          :quantity="cartQuantity"
          :item="item"
          :loading="isAdding"
          :sold-out="isSoldOut"
          size="small"
          @add-to-cart="addToCart"
          @quantity-change="handleQuantityChange"
        />
      </div>
    </div>

    <!-- 点击波纹效果 -->
    <div class="ripple-effect" ref="rippleRef"></div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'
import AddToCartButton from '@/components/common/AddToCartButton.vue'
// 图标已在 main.js 中全局注册，这里不再进行按需导入

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  layout: {
    type: String,
    default: 'grid', // 'grid' | 'list'
    validator: (value) => ['grid', 'list'].includes(value)
  }
})

const emit = defineEmits(['click', 'add-to-cart'])

const cartStore = useCartStore()

// 响应式数据
const isHovered = ref(false)
const isClicked = ref(false)
const isAdding = ref(false)
const showQuickAdd = ref(false)
const rippleRef = ref()

// 计算属性
const isSoldOut = computed(() => props.item.status === 'SOLD_OUT')
const isSelected = computed(() => cartQuantity.value > 0)
const cartQuantity = computed(() => cartStore.getItemQuantity(props.item.id))

const cardClasses = computed(() => ({
  'dish-card--hovered': isHovered.value,
  'dish-card--clicked': isClicked.value,
  'dish-card--selected': isSelected.value,
  'dish-card--sold-out': isSoldOut.value,
  'dish-card--new': props.item.isNew,
  'dish-card--list': props.layout === 'list'
}))

// 方法
const handleCardClick = (event) => {
  if (isSoldOut.value) return

  // 创建波纹效果
  createRippleEffect(event)

  // 触发点击状态
  isClicked.value = true
  setTimeout(() => {
    isClicked.value = false
  }, 200)

  emit('click', props.item)
}

const handleMouseEnter = () => {
  if (!isSoldOut.value) {
    isHovered.value = true
    showQuickAdd.value = true
  }
}

const handleMouseLeave = () => {
  isHovered.value = false
  showQuickAdd.value = false
}

const createRippleEffect = (event) => {
  const ripple = rippleRef.value
  if (!ripple) return

  const rect = event.currentTarget.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2

  ripple.style.width = ripple.style.height = size + 'px'
  ripple.style.left = x + 'px'
  ripple.style.top = y + 'px'
  ripple.classList.add('ripple-active')

  setTimeout(() => {
    ripple.classList.remove('ripple-active')
  }, 600)
}

const addToCart = async () => {
  if (isAdding.value || isSoldOut.value) return

  isAdding.value = true

  try {
    await cartStore.addItem(props.item, 1)
    ElMessage.success(`${props.item.name} 已加入购物车`)
    emit('add-to-cart', props.item)
  } catch (error) {
    ElMessage.error('添加失败，请重试')
  } finally {
    isAdding.value = false
  }
}

const quickAddToCart = () => {
  addToCart()
}

const increaseQuantity = async () => {
  try {
    await cartStore.addItem(props.item, 1)
  } catch (error) {
    ElMessage.error('添加失败，请重试')
  }
}

const decreaseQuantity = async () => {
  try {
    await cartStore.removeItem(props.item.id, 1)
  } catch (error) {
    ElMessage.error('移除失败，请重试')
  }
}

// 新的数量变化处理方法
const handleQuantityChange = async ({ item, quantity, action }) => {
  try {
    if (action === 'increase') {
      await cartStore.addItem(item, 1)
    } else if (action === 'decrease') {
      await cartStore.removeItem(item.id, 1)
    }
  } catch (error) {
    ElMessage.error(`${action === 'increase' ? '添加' : '移除'}失败，请重试`)
  }
}

const getTagType = (type) => {
  const typeMap = {
    'spicy': 'danger',
    'vegetarian': 'success',
    'popular': 'warning',
    'new': 'primary'
  }
  return typeMap[type] || 'info'
}

const handleImageLoad = () => {
  // 图片加载完成
}

const handleImageError = (event) => {
  // 图片加载失败，使用默认图片
  event.target.src = '/images/default-dish.jpg'
}
</script>

<style lang="scss" scoped>
.dish-card {
  position: relative;
  background: $white;
  border-radius: $border-radius-card;
  box-shadow: $shadow-sm;
  overflow: hidden;
  cursor: pointer;
  transition: all $transition-base;
  user-select: none;

  // 默认状态
  &:hover:not(.dish-card--sold-out) {
    transform: translateY(-4px);
    box-shadow: $shadow-md;
  }

  // 点击状态
  &.dish-card--clicked {
    transform: scale(1.03);
  }

  // 选中状态
  &.dish-card--selected {
    border: 2px solid $primary-color;
    box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
  }

  // 售罄状态
  &.dish-card--sold-out {
    opacity: 0.6;
    cursor: not-allowed;

    &:hover {
      transform: none;
      box-shadow: $shadow-sm;
    }
  }

  // 新品状态
  &.dish-card--new {
    &::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 0;
      height: 0;
      border-left: 20px solid transparent;
      border-top: 20px solid $error-color;
      z-index: 1;
    }
  }

  // 列表布局
  &.dish-card--list {
    display: flex;
    align-items: center;
    padding: $spacing-md;

    .dish-image-container {
      width: 12rem;
      height: 8rem;
      margin-right: $spacing-md;
      flex-shrink: 0;
    }

    .dish-info {
      flex: 1;
      padding: 0;
    }
  }
}

.new-badge {
  position: absolute;
  top: $spacing-sm;
  left: $spacing-sm;
  background: $error-color;
  color: $white;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-small;
  font-size: $font-size-xs;
  font-weight: 600;
  z-index: 2;

  span {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
}

.selected-icon {
  position: absolute;
  top: $spacing-sm;
  right: $spacing-sm;
  width: 2.4rem;
  height: 2.4rem;
  background: $primary-color;
  color: $white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  animation: selectedPulse 0.3s ease-out;
}

.dish-image-container {
  position: relative;
  width: 100%;
  height: 16rem;
  overflow: hidden;

  .dish-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all $transition-base;

    &.sold-out {
      filter: grayscale(100%);
    }
  }

  .sold-out-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;

    .sold-out-text {
      color: $white;
      font-size: $font-size-xl;
      font-weight: 600;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }
  }

  .quick-add-btn {
    position: absolute;
    bottom: $spacing-sm;
    right: $spacing-sm;
    width: 3.2rem;
    height: 3.2rem;
    background: $primary-color;
    color: $white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(0.8);
    transition: all $transition-base;
    box-shadow: $shadow-md;

    &:hover {
      background: rgba($primary-color, 0.9);
      transform: scale(1.1);
    }
  }

  .dish-card--hovered & {
    .dish-image {
      transform: scale(1.05);
    }

    .quick-add-btn {
      opacity: 1;
      transform: scale(1);
    }
  }
}

.dish-info {
  padding: $spacing-md;

  .dish-name {
    font-family: $font-family-title;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 $spacing-xs 0;
    line-height: 1.3;

    // 文本溢出处理
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .dish-description {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin: 0 0 $spacing-sm 0;
    line-height: 1.4;

    // 文本溢出处理
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .dish-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    .price-section {
      display: flex;
      align-items: center;
      gap: $spacing-xs;

      .current-price {
        font-size: $font-size-lg;
        font-weight: 600;
        color: $primary-color;
      }

      .original-price {
        font-size: $font-size-sm;
        color: $text-secondary;
        text-decoration: line-through;
      }
    }

    .rating-section {
      :deep(.el-rate) {
        .el-rate__item {
          margin-right: 2px;
        }

        .el-rate__text {
          font-size: $font-size-xs;
          color: $text-secondary;
        }
      }
    }
  }

  .dish-tags {
    display: flex;
    gap: $spacing-xs;
    margin-bottom: $spacing-sm;
    flex-wrap: wrap;
  }

  .dish-actions {
    display: flex;
    align-items: center;
    justify-content: center;

    .quantity-control {
      display: flex;
      align-items: center;
      gap: $spacing-sm;

      .quantity {
        font-size: $font-size-base;
        font-weight: 600;
        color: $text-primary;
        min-width: 2rem;
        text-align: center;
      }

      .el-button {
        width: 2.8rem;
        height: 2.8rem;
      }
    }

    .el-button {
      &:not(.is-circle) {
        width: 100%;
        height: 3.2rem;
        font-size: $font-size-sm;
      }
    }
  }
}

.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba($primary-color, 0.3);
  transform: scale(0);
  pointer-events: none;

  &.ripple-active {
    animation: ripple 0.6s ease-out;
  }
}



// 动画定义
@keyframes selectedPulse {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
</style>
