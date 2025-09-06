<template>
  <div class="featured-carousel">
    <div class="carousel-header">
      <h3 class="title">
        <el-icon><Star /></el-icon>
        今日特色推荐
      </h3>
      <div class="carousel-controls">
        <el-button 
          type="text" 
          @click="prevSlide"
          :disabled="currentSlide === 0"
          class="control-btn"
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <span class="slide-indicator">
          {{ currentSlide + 1 }} / {{ totalSlides }}
        </span>
        <el-button 
          type="text" 
          @click="nextSlide"
          :disabled="currentSlide === totalSlides - 1"
          class="control-btn"
        >
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>
    
    <div class="carousel-container" v-loading="loading">
      <div 
        class="carousel-track"
        :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
      >
        <div
          v-for="(slide, index) in slides"
          :key="index"
          class="carousel-slide"
        >
          <div class="featured-items">
            <div
              v-for="item in slide"
              :key="item.id"
              class="featured-item"
              @click="viewItemDetail(item)"
            >
              <!-- 商品图片 -->
              <div class="item-image">
                <img 
                  :src="item.imageUrl || defaultImage" 
                  :alt="item.name"
                  @error="handleImageError"
                />
                <div class="image-overlay">
                  <div class="item-badges">
                    <el-tag 
                      v-if="item.isRecommended" 
                      type="danger" 
                      size="small"
                      effect="dark"
                    >
                      推荐
                    </el-tag>
                    <el-tag 
                      v-if="item.isNew" 
                      type="success" 
                      size="small"
                      effect="dark"
                    >
                      新品
                    </el-tag>
                    <el-tag 
                      v-if="item.isHot" 
                      type="warning" 
                      size="small"
                      effect="dark"
                    >
                      热门
                    </el-tag>
                  </div>
                  <div class="quick-actions">
                    <el-button 
                      type="primary" 
                      circle 
                      size="small"
                      @click.stop="addToCart(item)"
                    >
                      <el-icon><Plus /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
              
              <!-- 商品信息 -->
              <div class="item-info">
                <h4 class="item-name">{{ item.name }}</h4>
                <p class="item-description">{{ item.description }}</p>
                <div class="item-meta">
                  <div class="item-price">
                    <span class="current-price">{{ formatPrice(item.price) }}</span>
                    <span 
                      v-if="item.originalPrice && item.originalPrice > item.price"
                      class="original-price"
                    >
                      {{ formatPrice(item.originalPrice) }}
                    </span>
                  </div>
                  <div class="item-stats">
                    <span class="sales-count">
                      <el-icon><TrendCharts /></el-icon>
                      已售{{ item.salesCount || 0 }}
                    </span>
                    <span v-if="item.rating" class="rating">
                      <el-icon><Star /></el-icon>
                      {{ item.rating.toFixed(1) }}
                    </span>
                  </div>
                </div>
                
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 轮播指示器 -->
    <div class="carousel-indicators">
      <button
        v-for="(slide, index) in slides"
        :key="index"
        class="indicator"
        :class="{ 'active': index === currentSlide }"
        @click="goToSlide(index)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/utils'
import { ElMessage } from 'element-plus'
import {
  Star,
  ArrowLeft,
  ArrowRight,
  Plus,
  TrendCharts
} from '@element-plus/icons-vue'

// 状态管理
const menuStore = useMenuStore()
const cartStore = useCartStore()

// 响应式数据
const loading = ref(false)
const currentSlide = ref(0)
const autoPlayInterval = ref(null)
const itemsPerSlide = ref(4)
const defaultImage = '/images/default-food.jpg'

// 计算属性
const featuredItems = computed(() => {
  // 合并推荐、新品、热门菜品
  const recommended = menuStore.recommendedItems.slice(0, 6)
  const newItems = menuStore.newItems.slice(0, 4)
  const popular = menuStore.availableMenuItems
    .filter(item => item.salesCount > 50)
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 4)
  
  // 去重并限制数量
  const allItems = [...recommended, ...newItems, ...popular]
  const uniqueItems = allItems.filter((item, index, self) => 
    index === self.findIndex(i => i.id === item.id)
  )
  
  return uniqueItems.slice(0, 12)
})

const slides = computed(() => {
  const items = featuredItems.value
  const slides = []
  
  for (let i = 0; i < items.length; i += itemsPerSlide.value) {
    slides.push(items.slice(i, i + itemsPerSlide.value))
  }
  
  return slides
})

const totalSlides = computed(() => slides.value.length)

// 上一张
const prevSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--
  }
}

// 下一张
const nextSlide = () => {
  if (currentSlide.value < totalSlides.value - 1) {
    currentSlide.value++
  } else {
    currentSlide.value = 0 // 循环播放
  }
}

// 跳转到指定幻灯片
const goToSlide = (index) => {
  currentSlide.value = index
}

// 自动播放
const startAutoPlay = () => {
  autoPlayInterval.value = setInterval(() => {
    nextSlide()
  }, 5000) // 5秒切换一次
}

// 停止自动播放
const stopAutoPlay = () => {
  if (autoPlayInterval.value) {
    clearInterval(autoPlayInterval.value)
    autoPlayInterval.value = null
  }
}

// 查看商品详情
const viewItemDetail = (item) => {
  // 这里可以打开商品详情弹窗或跳转到详情页
  ElMessage.info(`查看 ${item.name} 详情`)
}

// 添加到购物车
const addToCart = (item) => {
  cartStore.addItem(item, 1)
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.src = defaultImage
}

// 响应式处理
const updateItemsPerSlide = () => {
  const width = window.innerWidth
  if (width < 768) {
    itemsPerSlide.value = 1
  } else if (width < 1024) {
    itemsPerSlide.value = 2
  } else if (width < 1200) {
    itemsPerSlide.value = 3
  } else {
    itemsPerSlide.value = 4
  }
}

// 加载特色菜品数据
const loadFeaturedItems = async () => {
  try {
    loading.value = true
    
    await Promise.all([
      menuStore.fetchRecommendedItems(),
      menuStore.fetchNewItems(),
      menuStore.fetchPopularItems(10)
    ])
    
  } catch (error) {
    console.error('加载特色菜品失败:', error)
  } finally {
    loading.value = false
  }
}

// 组件挂载
onMounted(async () => {
  // 加载数据
  await loadFeaturedItems()
  
  // 响应式处理
  updateItemsPerSlide()
  window.addEventListener('resize', updateItemsPerSlide)
  
  // 开始自动播放
  if (totalSlides.value > 1) {
    startAutoPlay()
  }
})

// 组件卸载
onUnmounted(() => {
  stopAutoPlay()
  window.removeEventListener('resize', updateItemsPerSlide)
})
</script>

<style lang="scss" scoped>
.featured-carousel {
  background: white;
  border-radius: $border-radius;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: $box-shadow-sm;
  overflow: hidden;
}

.carousel-header {
  @include flex-between;
  margin-bottom: 20px;
  
  .title {
    @include flex-center;
    gap: 8px;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $text-color-primary;
    margin: 0;
    
    .el-icon {
      color: $color-warning;
      font-size: 20px;
    }
  }
  
  .carousel-controls {
    @include flex-center;
    gap: 12px;
    
    .control-btn {
      padding: 8px;
      
      .el-icon {
        font-size: 16px;
      }
      
      &:disabled {
        opacity: 0.5;
      }
    }
    
    .slide-indicator {
      font-size: $font-size-sm;
      color: $text-color-secondary;
      min-width: 60px;
      text-align: center;
    }
  }
}

.carousel-container {
  position: relative;
  overflow: hidden;
  border-radius: $border-radius;
}

.carousel-track {
  display: flex;
  transition: transform 0.5s ease;
}

.carousel-slide {
  min-width: 100%;
  flex-shrink: 0;
}

.featured-items {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  
  @include mobile {
    grid-template-columns: 1fr;
  }
  
  @include tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.featured-item {
  background: white;
  border-radius: $border-radius;
  overflow: hidden;
  cursor: pointer;
  transition: all $transition-base;
  border: 1px solid $border-color-light;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: $box-shadow-lg;
    
    .image-overlay {
      opacity: 1;
    }
  }
}

.item-image {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform $transition-base;
  }
  
  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity $transition-base;
    @include flex-between;
    flex-direction: column;
    padding: 12px;
  }
  
  .item-badges {
    @include flex-center;
    gap: 6px;
    align-self: flex-start;
  }
  
  .quick-actions {
    align-self: flex-end;
  }
}

.item-info {
  padding: 16px;
  
  .item-name {
    font-size: $font-size-md;
    font-weight: 600;
    color: $text-color-primary;
    margin: 0 0 8px 0;
    @include text-ellipsis;
  }
  
  .item-description {
    font-size: $font-size-sm;
    color: $text-color-secondary;
    margin: 0 0 12px 0;
    line-height: 1.4;
    @include text-ellipsis-multiline(2);
  }
  
  .item-meta {
    @include flex-between;
    margin-bottom: 12px;
  }
  
  .item-price {
    .current-price {
      font-size: $font-size-lg;
      font-weight: 600;
      color: $sushi-primary;
    }
    
    .original-price {
      font-size: $font-size-sm;
      color: $text-color-secondary;
      text-decoration: line-through;
      margin-left: 8px;
    }
  }
  
  .item-stats {
    @include flex-center;
    gap: 12px;
    font-size: $font-size-xs;
    color: $text-color-secondary;
    
    .sales-count,
    .rating {
      @include flex-center;
      gap: 4px;
    }
  }
  
  .item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

.carousel-indicators {
  @include flex-center;
  gap: 8px;
  margin-top: 20px;
  
  .indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: none;
    background: $border-color;
    cursor: pointer;
    transition: all $transition-base;
    
    &.active {
      background: $color-primary;
      transform: scale(1.2);
    }
    
    &:hover {
      background: $color-primary;
    }
  }
}

// 深色模式适配
.dark {
  .featured-carousel {
    background: rgba(40, 40, 40, 0.95);
    
    .title {
      color: white;
    }
    
    .featured-item {
      background: rgba(50, 50, 50, 0.8);
      border-color: rgba(255, 255, 255, 0.1);
      
      .item-name {
        color: white;
      }
    }
  }
}
</style>
