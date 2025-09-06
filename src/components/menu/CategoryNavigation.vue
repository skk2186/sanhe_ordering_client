<template>
  <div class="category-navigation" :class="{ 'mobile': mobile, 'collapsed': collapsed }">
    <!-- 头部 -->
    <div class="nav-header">
      <div class="header-content">
        <h3 class="title" v-if="!collapsed">菜品分类</h3>
        <el-button 
          v-if="!mobile"
          type="text" 
          @click="toggleCollapse"
          class="collapse-btn"
        >
          <el-icon>
            <component :is="collapsed ? 'Expand' : 'Fold'" />
          </el-icon>
        </el-button>
      </div>
    </div>
    
    <!-- 分类列表 -->
    <div class="category-list" v-loading="menuStore.categoriesLoading">
      <!-- 全部分类 -->
      <div 
        class="category-item all-category"
        :class="{ 'active': !menuStore.currentCategory }"
        @click="selectCategory(null)"
      >
        <div class="category-icon">
          <el-icon><Grid /></el-icon>
        </div>
        <span class="category-name" v-if="!collapsed">全部</span>
        <div class="category-count" v-if="!collapsed">
          {{ menuStore.availableMenuItems.length }}
        </div>
      </div>
      
      <!-- 分类项 -->
      <div
        v-for="category in menuStore.enabledCategories"
        :key="category.id"
        class="category-item"
        :class="{ 'active': isActiveCategory(category) }"
        @click="selectCategory(category)"
      >
        <div class="category-icon">
          <img 
            v-if="category.iconUrl" 
            :src="category.iconUrl" 
            :alt="category.name"
            class="icon-image"
          />
          <el-icon v-else><Bowl /></el-icon>
        </div>
        <span class="category-name" v-if="!collapsed">{{ category.name }}</span>
        <div class="category-count" v-if="!collapsed && category.itemCount !== undefined">
          {{ category.itemCount }}
        </div>
      </div>
    </div>
    
    <!-- 底部操作 -->
    <div class="nav-footer" v-if="!collapsed">
      <!-- 快速筛选 -->
      <div class="quick-filters">
        <h4 class="filter-title">快速筛选</h4>
        <div class="filter-buttons">
          <el-button 
            size="small" 
            type="primary" 
            plain
            @click="filterRecommended"
          >
            <el-icon><Star /></el-icon>
            推荐
          </el-button>
          <el-button 
            size="small" 
            type="success" 
            plain
            @click="filterNew"
          >
            <el-icon><Plus /></el-icon>
            新品
          </el-button>
          <el-button 
            size="small" 
            type="warning" 
            plain
            @click="filterPopular"
          >
            <el-icon><TrendCharts /></el-icon>
            热门
          </el-button>
        </div>
      </div>
      
      <!-- 价格范围 -->
      <div class="price-range-filter">
        <h4 class="filter-title">价格范围</h4>
        <el-slider
          v-model="priceRange"
          range
          :min="0"
          :max="500"
          :step="10"
          :format-tooltip="formatPrice"
          @change="handlePriceRangeChange"
        />
        <div class="price-labels">
          <span>{{ formatPrice(priceRange[0]) }}</span>
          <span>{{ formatPrice(priceRange[1]) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { formatPrice } from '@/utils'
import {
  Grid,
  Bowl,
  Expand,
  Fold,
  Star,
  Plus,
  TrendCharts
} from '@element-plus/icons-vue'

// 定义props
const props = defineProps({
  mobile: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['category-change', 'toggle-sidebar'])

// 状态管理
const menuStore = useMenuStore()

// 响应式数据
const collapsed = ref(false)
const priceRange = ref([0, 500])

// 计算属性
const isActiveCategory = (category) => {
  return menuStore.currentCategory?.id === category.id
}

// 切换折叠状态
const toggleCollapse = () => {
  collapsed.value = !collapsed.value
  emit('toggle-sidebar')
}

// 选择分类
const selectCategory = (category) => {
  menuStore.setCurrentCategory(category)
  emit('category-change', category)
}

// 筛选推荐菜品
const filterRecommended = async () => {
  try {
    await menuStore.fetchRecommendedItems()
    // 触发搜索以显示推荐菜品
    await menuStore.searchMenuItems({
      keyword: '',
      tags: ['推荐']
    })
  } catch (error) {
    console.error('获取推荐菜品失败:', error)
  }
}

// 筛选新品菜品
const filterNew = async () => {
  try {
    await menuStore.fetchNewItems()
    await menuStore.searchMenuItems({
      keyword: '',
      tags: ['新品']
    })
  } catch (error) {
    console.error('获取新品菜品失败:', error)
  }
}

// 筛选热门菜品
const filterPopular = async () => {
  try {
    await menuStore.fetchPopularItems()
    await menuStore.searchMenuItems({
      keyword: '',
      tags: ['热门']
    })
  } catch (error) {
    console.error('获取热门菜品失败:', error)
  }
}

// 处理价格范围变化
const handlePriceRangeChange = (value) => {
  menuStore.setPriceRange(value)
  // 触发搜索
  menuStore.searchMenuItems({
    minPrice: value[0],
    maxPrice: value[1]
  })
}

// 监听菜单store的价格范围变化
watch(() => menuStore.priceRange, (newRange) => {
  priceRange.value = [...newRange]
}, { immediate: true })

// 组件挂载
onMounted(() => {
  // 移动端默认不折叠
  if (props.mobile) {
    collapsed.value = false
  }
})
</script>

<style lang="scss" scoped>
.category-navigation {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  transition: all $transition-base;
  
  &.collapsed {
    .nav-header .title {
      display: none;
    }
    
    .category-item {
      justify-content: center;
      padding: 12px 8px;
      
      .category-name,
      .category-count {
        display: none;
      }
    }
    
    .nav-footer {
      display: none;
    }
  }
  
  &.mobile {
    .nav-header .collapse-btn {
      display: none;
    }
  }
}

.nav-header {
  padding: 20px;
  border-bottom: 1px solid $border-color-light;
  
  .header-content {
    @include flex-between;
    
    .title {
      font-size: $font-size-lg;
      font-weight: 600;
      color: $text-color-primary;
      margin: 0;
    }
    
    .collapse-btn {
      padding: 4px;
      
      .el-icon {
        font-size: 16px;
      }
    }
  }
}

.category-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.category-item {
  @include flex-between;
  padding: 12px 20px;
  cursor: pointer;
  transition: all $transition-base;
  border-left: 3px solid transparent;
  
  &:hover {
    background: $bg-color-light;
  }
  
  &.active {
    background: rgba($sushi-primary, 0.1);
    border-left-color: $sushi-primary;
    
    .category-name {
      color: $sushi-primary;
      font-weight: 600;
    }
    
    .category-icon {
      color: $sushi-primary;
    }
  }
  
  &.all-category {
    font-weight: 500;
    
    .category-icon {
      color: $color-primary;
    }
  }
}

.category-icon {
  @include flex-center;
  width: 32px;
  height: 32px;
  margin-right: 12px;
  color: $text-color-regular;
  
  .icon-image {
    width: 24px;
    height: 24px;
    object-fit: cover;
    border-radius: 4px;
  }
  
  .el-icon {
    font-size: 20px;
  }
}

.category-name {
  flex: 1;
  font-size: $font-size-md;
  color: $text-color-primary;
  @include text-ellipsis;
}

.category-count {
  @include flex-center;
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  background: $bg-color;
  color: $text-color-secondary;
  font-size: $font-size-xs;
  border-radius: 10px;
}

.nav-footer {
  padding: 20px;
  border-top: 1px solid $border-color-light;
  background: $bg-color-light;
}

.quick-filters {
  margin-bottom: 24px;
  
  .filter-title {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $text-color-primary;
    margin: 0 0 12px 0;
  }
  
  .filter-buttons {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    
    .el-button {
      justify-content: flex-start;
      
      .el-icon {
        margin-right: 6px;
      }
    }
  }
}

.price-range-filter {
  .filter-title {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $text-color-primary;
    margin: 0 0 16px 0;
  }
  
  .price-labels {
    @include flex-between;
    margin-top: 8px;
    font-size: $font-size-xs;
    color: $text-color-secondary;
  }
}

// 移动端适配
@include mobile {
  .category-navigation {
    .nav-header {
      padding: 16px;
    }
    
    .category-item {
      padding: 16px 20px;
    }
    
    .nav-footer {
      padding: 16px;
    }
  }
}

// 深色模式适配
.dark {
  .category-navigation {
    background: rgba(40, 40, 40, 0.95);
    
    .nav-header,
    .category-list {
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    .nav-footer {
      background: rgba(30, 30, 30, 0.8);
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    .category-item {
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      &.active {
        background: rgba($sushi-primary, 0.2);
      }
    }
    
    .category-name,
    .filter-title {
      color: white;
    }
    
    .category-count {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
    }
  }
}
</style>
