<template>
  <div class="menu-categories">
    <!-- 分类导航 -->
    <div class="category-nav">
      <div class="nav-scroll">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category-tab"
          :class="{ active: activeCategory === category.id }"
          @click="selectCategory(category.id)"
        >
          <div class="tab-icon">
            <img :src="category.icon" :alt="category.name" />
          </div>
          <span class="tab-name">{{ category.name }}</span>
        </div>
      </div>
    </div>

    <!-- 菜品网格 -->
    <div class="menu-grid">
      <div 
        v-for="item in filteredMenuItems" 
        :key="item.id"
        class="menu-item-card"
        :class="{ 
          'sold-out': item.soldOut,
          'new-item': item.isNew,
          'selected': selectedItems.includes(item.id)
        }"
        @click="selectMenuItem(item)"
      >
        <!-- 菜品图片 -->
        <div class="item-image">
          <img 
            :src="item.image" 
            :alt="item.name"
            @load="onImageLoad"
            @error="onImageError"
          />
          <div v-if="item.soldOut" class="sold-out-overlay">
              <span>{{ $t('common.soldOut') }}</span>
          </div>
            <div v-if="item.isNew" class="new-badge">{{ $t('menu.new') }}</div>
          <div v-if="item.discount" class="discount-badge">
            {{ item.discount }}折
          </div>
        </div>

        <!-- 菜品信息 -->
        <div class="item-info">
          <h3 class="item-name">{{ item.name }}</h3>
          <p class="item-description">{{ item.description }}</p>
          
          <div class="item-footer">
            <div class="price-section">
              <span class="current-price">¥{{ item.price }}</span>
              <span v-if="item.originalPrice" class="original-price">
                ¥{{ item.originalPrice }}
              </span>
            </div>
            
            <div class="action-section">
              <el-button 
                v-if="!getCartQuantity(item.id)"
                type="primary" 
                size="small"
                class="add-btn"
                :disabled="item.soldOut"
                @click.stop="addToCart(item)"
              >
                <el-icon><Plus /></el-icon>
              </el-button>
              
              <div v-else class="quantity-control" @click.stop>
                <el-button 
                  size="small" 
                  @click="decreaseQuantity(item.id)"
                >
                  <el-icon><Minus /></el-icon>
                </el-button>
                <span class="quantity">{{ getCartQuantity(item.id) }}</span>
                <el-button 
                  size="small" 
                  @click="increaseQuantity(item.id)"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 推荐标签 -->
        <div v-if="item.recommended" class="recommended-tag">
          <el-icon><Star /></el-icon>
              <span>{{ $t('menu.recommend') }}</span>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="load-more">
      <el-button 
        :loading="loading" 
        @click="loadMore"
        size="large"
        type="text"
      >
          {{ loading ? $t('common.loading') : $t('common.loadMore') }}
      </el-button>
    </div>

    <!-- 菜品详情弹窗 -->
    <MenuItemDetail 
      v-model:visible="showDetail"
      :item="selectedItem"
      @add-to-cart="addToCartWithOptions"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useMenuStore } from '@/stores/menu'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/i18n'

const { t } = useI18n()
import {
  Plus,
  Minus,
  Star
} from '@element-plus/icons-vue'
import MenuItemDetail from '@/components/customer/MenuItemDetail.vue'

const cartStore = useCartStore()
const menuStore = useMenuStore()

// 响应式数据
const activeCategory = ref(1)
const selectedItems = ref([])
const showDetail = ref(false)
const selectedItem = ref(null)
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)

// 计算属性
const categories = computed(() => menuStore.categories)
const menuItems = computed(() => menuStore.menuItems)
const filteredMenuItems = computed(() => {
  return menuItems.value.filter(item => 
    item.categoryId === activeCategory.value
  )
})

// 方法
const selectCategory = (categoryId) => {
  activeCategory.value = categoryId
  page.value = 1
  hasMore.value = true
  loadMenuItems()
}

const selectMenuItem = (item) => {
  if (item.soldOut) return
  
  selectedItem.value = item
  showDetail.value = true
}

const addToCart = (item) => {
  cartStore.addItem({
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: 1
  })
  
  // 触发投盘事件
  window.dispatchEvent(new CustomEvent('plateAdded'))
  
  ElMessage.success(t('menu.addedToCart', { name: item.name }))
}

const addToCartWithOptions = (item, options) => {
  cartStore.addItem({
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: options.quantity,
    customizations: options.customizations
  })
  
  // 触发投盘事件
  for (let i = 0; i < options.quantity; i++) {
    window.dispatchEvent(new CustomEvent('plateAdded'))
  }
  
  ElMessage.success(t('menu.addedToCart', { name: item.name }))
  showDetail.value = false
}

const getCartQuantity = (itemId) => {
  return cartStore.getItemQuantity(itemId)
}

const increaseQuantity = (itemId) => {
  cartStore.increaseQuantity(itemId)
  window.dispatchEvent(new CustomEvent('plateAdded'))
}

const decreaseQuantity = (itemId) => {
  cartStore.decreaseQuantity(itemId)
}

const loadMenuItems = async () => {
  loading.value = true
  try {
    await menuStore.loadMenuItems(activeCategory.value, page.value)
  } catch (error) {
    ElMessage.error(t('errors.fetchProducts'))
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  page.value++
  await loadMenuItems()
}

const onImageLoad = (event) => {
  event.target.classList.add('loaded')
}

const onImageError = (event) => {
  event.target.src = '/images/placeholder-dish.jpg'
}

// 生命周期
onMounted(async () => {
  await menuStore.loadCategories()
  await loadMenuItems()
})
</script>

<style lang="scss" scoped>
.menu-categories {
  padding: $spacing-md;
}

.category-nav {
  margin-bottom: $spacing-lg;
  
  .nav-scroll {
    display: flex;
    gap: $spacing-sm;
    overflow-x: auto;
    padding-bottom: $spacing-xs;
    
    &::-webkit-scrollbar {
      height: 2px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: $primary-color;
      border-radius: 1px;
    }
  }
  
  .category-tab {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm;
    border-radius: $border-radius-button;
    cursor: pointer;
    transition: all $transition-fast;
    min-width: 8rem;
    
    &:hover {
      background: rgba($primary-color, 0.1);
    }
    
    &.active {
      background: $primary-color;
      color: $white;
      
      .tab-icon img {
        filter: brightness(0) invert(1);
      }
    }
    
    .tab-icon {
      width: 3.2rem;
      height: 3.2rem;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
    
    .tab-name {
      font-size: $font-size-sm;
      font-weight: 500;
    }
  }
}

.menu-grid {
  display: grid;
  gap: $spacing-md;
  
  // iPad双列布局
  @media (min-width: $breakpoint-md) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  // 手机单列布局
  @include mobile {
    grid-template-columns: 1fr;
  }
}

.menu-item-card {
  background: $white;
  border-radius: $border-radius-card;
  overflow: hidden;
  box-shadow: $shadow-sm;
  transition: all $transition-base;
  cursor: pointer;
  position: relative;
  
  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }
  
  &.selected {
    border: 2px solid $primary-color;
  }
  
  &.sold-out {
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
    }
  }
  
  &.new-item {
    &::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 0;
      height: 0;
      border-left: 2rem solid transparent;
      border-top: 2rem solid $error-color;
      z-index: 1;
    }
  }
  
  .item-image {
    position: relative;
    height: 20rem;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform $transition-base;
      opacity: 0;
      
      &.loaded {
        opacity: 1;
      }
    }
    
    &:hover img {
      transform: scale(1.05);
    }
    
    .sold-out-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      color: $white;
      font-size: $font-size-lg;
      font-weight: 600;
    }
    
    .new-badge {
      position: absolute;
      top: $spacing-xs;
      right: $spacing-xs;
      background: $error-color;
      color: $white;
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-button;
      font-size: $font-size-xs;
      font-weight: 600;
      z-index: 2;
    }
    
    .discount-badge {
      position: absolute;
      top: $spacing-xs;
      left: $spacing-xs;
      background: $warning-color;
      color: $white;
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-button;
      font-size: $font-size-xs;
      font-weight: 600;
    }
  }
  
  .item-info {
    padding: $spacing-md;
    
    .item-name {
      font-size: $font-size-lg;
      font-weight: 600;
      margin-bottom: $spacing-xs;
      color: $text-primary;
      @include text-ellipsis;
    }
    
    .item-description {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-bottom: $spacing-md;
      line-height: 1.4;
      @include text-ellipsis-multi(2);
    }
    
    .item-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
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
          color: $text-disabled;
          text-decoration: line-through;
        }
      }
      
      .action-section {
        .add-btn {
          width: 3.2rem;
          height: 3.2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .quantity-control {
          display: flex;
          align-items: center;
          gap: $spacing-xs;
          
          .el-button {
            width: 2.8rem;
            height: 2.8rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
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
  }
  
  .recommended-tag {
    position: absolute;
    top: $spacing-sm;
    left: $spacing-sm;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: $white;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-button;
    font-size: $font-size-xs;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 2px;
  }
}

.load-more {
  text-align: center;
  margin-top: $spacing-xl;
}

// 响应式适配
@include mobile {
  .menu-categories {
    padding: $spacing-sm;
  }
  
  .category-nav {
    margin-bottom: $spacing-md;
    
    .category-tab {
      min-width: 6rem;
      
      .tab-icon {
        width: 2.4rem;
        height: 2.4rem;
      }
    }
  }
  
  .menu-item-card {
    .item-image {
      height: 16rem;
    }
    
    .item-info {
      padding: $spacing-sm;
      
      .item-name {
        font-size: $font-size-base;
      }
    }
  }
}
</style>
