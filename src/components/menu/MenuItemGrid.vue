<template>
  <div class="menu-item-grid">
    <!-- 网格头部 -->
    <div class="grid-header">
      <div class="header-left">
        <h3 class="section-title">
          {{ displaySectionTitle }}
          <span class="item-count">({{ items.length }})</span>
        </h3>
        <p v-if="sectionDescription" class="section-description">
          {{ sectionDescription }}
        </p>
      </div>
      
      <div class="header-right">
        <!-- 视图切换 -->
        <div class="view-toggle">
          <el-button-group>
            <el-button 
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              size="small"
              @click="setViewMode('grid')"
            >
              <el-icon><Grid /></el-icon>
            </el-button>
            <el-button 
              :type="viewMode === 'list' ? 'primary' : 'default'"
              size="small"
              @click="setViewMode('list')"
            >
              <el-icon><List /></el-icon>
            </el-button>
          </el-button-group>
        </div>
        
        <!-- 排序选择 -->
        <el-select
          v-model="sortBy"
          :placeholder="$t('menu.sort')"
          size="small"
          style="width: 140px"
          @change="handleSortChange"
        >
          <el-option :label="$t('menu.sortDefault')" value="default" />
          <el-option :label="$t('menu.priceAsc')" value="price_asc" />
          <el-option :label="$t('menu.priceDesc')" value="price_desc" />
          <el-option :label="$t('menu.salesDesc')" value="sales_desc" />
          <el-option :label="$t('menu.ratingDesc')" value="rating_desc" />
        </el-select>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="items.length === 0" class="empty-container">
      <el-empty :description="$t('menu.noDishes')">
        <el-button type="primary" @click="$emit('refresh')">
          {{ $t('common.refresh') }}
        </el-button>
      </el-empty>
    </div>
    
    <!-- 菜品网格 -->
    <div 
      v-else
      class="items-container"
      :class="{ 'list-view': viewMode === 'list' }"
    >
      <div
        v-for="item in sortedItems"
        :key="item.id"
        class="menu-item-card"
        :class="{ 'unavailable': item.status !== 'AVAILABLE' }"
        @click="viewItemDetail(item)"
      >
        <!-- 商品图片 -->
        <div class="item-image">
          <img 
            :src="item.imageUrl || defaultImage" 
            :alt="item.name"
            @error="handleImageError"
          />
          
          <!-- 状态遮罩 -->
          <div v-if="item.status !== 'AVAILABLE'" class="status-overlay">
            <span class="status-text">{{ getStatusText(item.status) }}</span>
          </div>
          
          <!-- 徽章 -->
          <div class="item-badges">
            <el-tag 
              v-if="item.isRecommended" 
              type="danger" 
              size="small"
              effect="dark"
            >
              {{ $t('menu.recommend') }}
            </el-tag>
            <el-tag 
              v-if="item.isNew" 
              type="success" 
              size="small"
              effect="dark"
            >
              {{ $t('menu.new') }}
            </el-tag>
            <el-tag 
              v-if="item.discount" 
              type="warning" 
              size="small"
              effect="dark"
            >
              {{ item.discount }}折
            </el-tag>
          </div>
          
          <!-- 快速操作 -->
          <div class="quick-actions">
            <el-button 
              type="info" 
              circle 
              size="small"
              @click.stop="toggleFavorite(item)"
            >
              <el-icon>
                <component :is="item.isFavorite ? 'StarFilled' : 'Star'" />
              </el-icon>
            </el-button>
            <el-button 
              type="primary" 
              circle 
              size="small"
              :disabled="item.status !== 'AVAILABLE'"
              @click.stop="showAddToCartDialog(item)"
            >
              <el-icon><ShoppingCartFull /></el-icon>
            </el-button>
          </div>
        </div>
        
        <!-- 商品信息 -->
        <div class="item-content">
          <div class="item-header">
            <h4 class="item-name">{{ item.name }}</h4>
            <div class="item-price">
              <span class="current-price">{{ formatPrice(item.price) }}</span>
              <span 
                v-if="item.originalPrice && item.originalPrice > item.price"
                class="original-price"
              >
                {{ formatPrice(item.originalPrice) }}
              </span>
            </div>
          </div>
          
          <p class="item-description">{{ item.description }}</p>
          
          <!-- 标签 -->
          <div v-if="item.tags && item.tags.length > 0" class="item-tags">
            <el-tag
              v-for="tag in item.tags.slice(0, 3)"
              :key="tag"
              size="small"
              type="info"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
            <span v-if="item.tags.length > 3" class="more-tags">
              +{{ item.tags.length - 3 }}
            </span>
          </div>
          
          <!-- 统计信息 -->
          <div class="item-stats">
            <span class="sales-count">
              <el-icon><TrendCharts /></el-icon>
              {{ $t('menu.soldCount', { count: item.salesCount || 0 }) }}
            </span>
            <span v-if="item.rating" class="rating">
              <el-icon><Star /></el-icon>
              {{ item.rating.toFixed(1) }}
            </span>
            <span class="category">
              <el-icon><Collection /></el-icon>
              {{ item.categoryName }}
            </span>
          </div>
          
          <!-- 购物车数量控制 -->
          <div class="cart-controls">
            <div v-if="getCartQuantity(item.id) > 0" class="quantity-controls">
              <el-button 
                size="small" 
                @click.stop="decreaseQuantity(item)"
              >
                <el-icon><Minus /></el-icon>
              </el-button>
              <span class="quantity">{{ getCartQuantity(item.id) }}</span>
              <el-button 
                size="small" 
                @click.stop="increaseQuantity(item)"
              >
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
            <el-button 
              v-else
              type="primary" 
              size="small"
              :disabled="item.status !== 'AVAILABLE'"
              @click.stop="emitAddToCart(item)"
            >
              <el-icon><Plus /></el-icon>
              {{ $t('common.addToCart') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加到购物车对话框 -->
    <el-dialog
      v-model="addToCartDialogVisible"
      :title="$t('common.addToCart')"
      width="400px"
      center
    >
      <div v-if="selectedItem" class="add-to-cart-content">
        <div class="item-preview">
          <img :src="selectedItem.imageUrl || defaultImage" :alt="selectedItem.name" />
          <div class="item-info">
            <h4>{{ selectedItem.name }}</h4>
            <p>{{ formatPrice(selectedItem.price) }}</p>
          </div>
        </div>
        
        <div class="quantity-selector">
          <label>{{ $t('menu.quantity') }}:</label>
          <el-input-number
            v-model="addQuantity"
            :min="1"
            :max="99"
            size="large"
          />
        </div>
        
        <div class="total-price">
          {{ $t('cart.total') }}: {{ formatPrice(selectedItem.price * addQuantity) }}
        </div>
      </div>
      
      <template #footer>
        <el-button @click="addToCartDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="confirmAddToCart">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/utils'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/i18n'
import {
  Grid,
  List,
  Star,
  StarFilled,
  ShoppingCartFull,
  TrendCharts,
  Collection,
  Plus,
  Minus
} from '@element-plus/icons-vue'

// 定义props
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  sectionTitle: {
    type: String,
    default: '菜品列表'
  },
  sectionDescription: {
    type: String,
    default: ''
  }
})

// 定义事件
const emit = defineEmits(['add-to-cart', 'view-detail', 'refresh', 'sort-change'])

// 状态管理
const cartStore = useCartStore()
const { t } = useI18n()
const displaySectionTitle = computed(() => props.sectionTitle === '菜品列表' ? t('menu.dishList') : props.sectionTitle)

// 响应式数据
const viewMode = ref('grid')
const sortBy = ref('default')
const addToCartDialogVisible = ref(false)
const selectedItem = ref(null)
const addQuantity = ref(1)
const defaultImage = '/images/default-food.jpg'

// 计算属性
const sortedItems = computed(() => {
  const items = [...props.items]
  
  switch (sortBy.value) {
    case 'price_asc':
      return items.sort((a, b) => a.price - b.price)
    case 'price_desc':
      return items.sort((a, b) => b.price - a.price)
    case 'sales_desc':
      return items.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    case 'rating_desc':
      return items.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    default:
      return items
  }
})

// 设置视图模式
const setViewMode = (mode) => {
  viewMode.value = mode
}

// 处理排序变化
const handleSortChange = () => {
  emit('sort-change', sortBy.value)
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'UNAVAILABLE': t('menu.unavailable'),
    'DISCONTINUED': t('menu.discontinued'),
    'COMING_SOON': t('menu.comingSoon')
  }
  return statusMap[status] || t('menu.notAvailable')
}

// 获取购物车中的数量
const getCartQuantity = (itemId) => {
  return cartStore.getItemQuantity(itemId)
}

// 查看商品详情
const viewItemDetail = (item) => {
  emit('view-detail', item)
}

// 切换收藏
const toggleFavorite = (item) => {
  // 这里可以调用收藏API
  item.isFavorite = !item.isFavorite
  ElMessage.success(item.isFavorite ? t('menu.favoriteAdded') : t('menu.favoriteRemoved'))
}

// 显示添加到购物车对话框
const showAddToCartDialog = (item) => {
  selectedItem.value = item
  addQuantity.value = 1
  addToCartDialogVisible.value = true
}

// 添加到购物车
const addToCart = (item, quantity = 1) => {
  cartStore.addItem(item, quantity)
  // emit('add-to-cart', item, quantity) // 旧的事件，暂时保留
}

const emitAddToCart = (item) => {
  emit('add-to-cart', item);
};

// 确认添加到购物车
const confirmAddToCart = () => {
  if (selectedItem.value) {
    addToCart(selectedItem.value, addQuantity.value)
    addToCartDialogVisible.value = false
  }
}

// 增加数量
const increaseQuantity = (item) => {
  cartStore.increaseQuantity(item.id)
}

// 减少数量
const decreaseQuantity = (item) => {
  cartStore.decreaseQuantity(item.id)
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.src = defaultImage
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;
.menu-item-grid {
  background: white;
  border-radius: $border-radius;
  padding: 24px;
  box-shadow: $box-shadow-sm;
}

.grid-header {
  @include flex-between;
  margin-bottom: 24px;
  
  @include mobile {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-left {
    .section-title {
      font-size: $font-size-lg;
      font-weight: 600;
      color: $text-color-primary;
      margin: 0 0 8px 0;
      
      .item-count {
        font-size: $font-size-sm;
        color: $text-color-secondary;
        font-weight: normal;
      }
    }
    
    .section-description {
      font-size: $font-size-sm;
      color: $text-color-secondary;
      margin: 0;
    }
  }
  
  .header-right {
    @include flex-center;
    gap: 16px;
    
    @include mobile {
      width: 100%;
      justify-content: space-between;
    }
  }
}

.loading-container,
.empty-container {
  min-height: 300px;
  @include flex-center;
}

.items-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  
  @include mobile {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  &.list-view {
    grid-template-columns: 1fr;
    
    .menu-item-card {
      display: flex;
      
      .item-image {
        width: 200px;
        height: 150px;
        flex-shrink: 0;
      }
      
      .item-content {
        flex: 1;
        padding: 16px 20px;
      }
    }
  }
}

.menu-item-card {
  background: white;
  border-radius: $border-radius;
  overflow: hidden;
  cursor: pointer;
  transition: all $transition-base;
  border: 1px solid $border-color-light;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $box-shadow-lg;
    
    .quick-actions {
      opacity: 1;
    }
  }
  
  &.unavailable {
    opacity: 0.6;
    
    .item-image img {
      filter: grayscale(100%);
    }
  }
}

.item-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform $transition-base;
  }
  
  .status-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    @include flex-center;
    
    .status-text {
      color: white;
      font-size: $font-size-md;
      font-weight: 600;
    }
  }
  
  .item-badges {
    position: absolute;
    top: 12px;
    left: 12px;
    @include flex-center;
    gap: 6px;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .quick-actions {
    position: absolute;
    top: 12px;
    right: 12px;
    @include flex-center;
    gap: 8px;
    flex-direction: column;
    opacity: 0;
    transition: opacity $transition-base;
  }
}

.item-content {
  padding: 16px;
  
  .item-header {
    @include flex-between;
    margin-bottom: 8px;
    
    .item-name {
      font-size: $font-size-md;
      font-weight: 600;
      color: $text-color-primary;
      margin: 0;
      @include text-ellipsis;
      flex: 1;
      margin-right: 12px;
    }
    
    .item-price {
      text-align: right;
      
      .current-price {
        font-size: $font-size-lg;
        font-weight: 600;
        color: $sushi-primary;
      }
      
      .original-price {
        display: block;
        font-size: $font-size-sm;
        color: $text-color-secondary;
        text-decoration: line-through;
      }
    }
  }
  
  .item-description {
    font-size: $font-size-sm;
    color: $text-color-secondary;
    margin: 0 0 12px 0;
    line-height: 1.4;
    @include text-ellipsis-multi(2);
  }
  
  .item-tags {
    @include flex-center;
    gap: 6px;
    margin-bottom: 12px;
    flex-wrap: wrap;
    
    .more-tags {
      font-size: $font-size-xs;
      color: $text-color-secondary;
    }
  }
  
  .item-stats {
    @include flex-center;
    gap: 12px;
    margin-bottom: 16px;
    font-size: $font-size-xs;
    color: $text-color-secondary;
    flex-wrap: wrap;
    
    .sales-count,
    .rating,
    .category {
      @include flex-center;
      gap: 4px;
    }
  }
  
  .cart-controls {
    .quantity-controls {
      @include flex-center;
      gap: 12px;
      
      .quantity {
        font-size: $font-size-md;
        font-weight: 600;
        color: $text-color-primary;
        min-width: 30px;
        text-align: center;
      }
    }
  }
}

// 添加到购物车对话框
.add-to-cart-content {
  .item-preview {
    @include flex-center;
    gap: 16px;
    margin-bottom: 24px;
    
    img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: $border-radius;
    }
    
    .item-info {
      flex: 1;
      
      h4 {
        font-size: $font-size-md;
        font-weight: 600;
        color: $text-color-primary;
        margin: 0 0 8px 0;
      }
      
      p {
        font-size: $font-size-lg;
        font-weight: 600;
        color: $sushi-primary;
        margin: 0;
      }
    }
  }
  
  .quantity-selector {
    @include flex-between;
    margin-bottom: 20px;
    
    label {
      font-size: $font-size-md;
      font-weight: 500;
      color: $text-color-primary;
    }
  }
  
  .total-price {
    text-align: center;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $sushi-primary;
    padding: 16px;
    background: $bg-color-light;
    border-radius: $border-radius;
  }
}

// 深色模式适配
.dark {
  .menu-item-grid {
    background: rgba(40, 40, 40, 0.95);
    
    .section-title {
      color: white;
    }
    
    .menu-item-card {
      background: rgba(50, 50, 50, 0.8);
      border-color: rgba(255, 255, 255, 0.1);
      
      .item-name {
        color: white;
      }
    }
    
    .add-to-cart-content {
      .item-info h4 {
        color: white;
      }
      
      .quantity-selector label {
        color: white;
      }
      
      .total-price {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }
}
</style>
