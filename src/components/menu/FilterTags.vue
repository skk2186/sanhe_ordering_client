<template>
  <div class="filter-tags">
    <!-- 当前筛选条件 -->
    <div v-if="hasActiveFilters" class="active-filters">
      <div class="filter-header">
        <span class="filter-title">当前筛选:</span>
        <el-button type="text" size="small" @click="clearAllFilters">
          <el-icon><Close /></el-icon>
          清除全部
        </el-button>
      </div>
      
      <div class="active-filter-tags">
        <!-- 选中的标签 -->
        <el-tag
          v-for="tag in menuStore.selectedTags"
          :key="tag"
          closable
          type="primary"
          effect="dark"
          size="small"
          @close="removeTag(tag)"
          class="filter-tag"
        >
          {{ tag }}
        </el-tag>
        
        <!-- 价格范围 -->
        <el-tag
          v-if="hasPriceFilter"
          closable
          type="warning"
          effect="dark"
          size="small"
          @close="clearPriceFilter"
          class="filter-tag"
        >
          价格: {{ formatPrice(menuStore.priceRange[0]) }} - {{ formatPrice(menuStore.priceRange[1]) }}
        </el-tag>
        
        <!-- 分类筛选 -->
        <el-tag
          v-if="menuStore.currentCategory"
          closable
          type="success"
          effect="dark"
          size="small"
          @close="clearCategoryFilter"
          class="filter-tag"
        >
          {{ menuStore.currentCategory.name }}
        </el-tag>
      </div>
    </div>
    
    <!-- 热门标签 -->
    <div class="popular-tags-section">
      <div class="section-header">
        <h4 class="section-title">
          <el-icon><Star /></el-icon>
          热门标签
        </h4>
        <el-button 
          type="text" 
          size="small" 
          @click="refreshPopularTags"
          :loading="tagsLoading"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      
      <div class="tags-container" v-loading="tagsLoading">
        <el-tag
          v-for="tag in displayPopularTags"
          :key="tag"
          :type="isTagSelected(tag) ? 'primary' : 'info'"
          :effect="isTagSelected(tag) ? 'dark' : 'plain'"
          size="small"
          @click="toggleTag(tag)"
          class="popular-tag"
        >
          {{ tag }}
        </el-tag>
        
        <!-- 展开/收起按钮 -->
        <el-button
          v-if="menuStore.popularTags.length > showTagsLimit"
          type="text"
          size="small"
          @click="toggleShowAllTags"
          class="toggle-tags-btn"
        >
          {{ showAllTags ? '收起' : `查看全部(${menuStore.popularTags.length})` }}
          <el-icon>
            <component :is="showAllTags ? 'ArrowUp' : 'ArrowDown'" />
          </el-icon>
        </el-button>
      </div>
    </div>
    
    <!-- 自定义标签输入 -->
    <div class="custom-tag-section">
      <div class="section-header">
        <h4 class="section-title">
          <el-icon><Plus /></el-icon>
          自定义标签
        </h4>
      </div>
      
      <div class="custom-tag-input">
        <el-input
          v-model="customTagInput"
          placeholder="输入自定义标签..."
          size="small"
          @keyup.enter="addCustomTag"
          @input="handleCustomTagInput"
        >
          <template #append>
            <el-button 
              type="primary" 
              @click="addCustomTag"
              :disabled="!customTagInput.trim()"
            >
              添加
            </el-button>
          </template>
        </el-input>
        
        <!-- 标签建议 */
        <div v-if="tagSuggestions.length > 0" class="tag-suggestions">
          <div
            v-for="suggestion in tagSuggestions"
            :key="suggestion"
            class="suggestion-item"
            @click="selectTagSuggestion(suggestion)"
          >
            {{ suggestion }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 快速筛选 -->
    <div class="quick-filters-section">
      <div class="section-header">
        <h4 class="section-title">
          <el-icon><Lightning /></el-icon>
          快速筛选
        </h4>
      </div>
      
      <div class="quick-filter-buttons">
        <el-button
          v-for="filter in quickFilters"
          :key="filter.key"
          :type="filter.active ? 'primary' : 'default'"
          :plain="!filter.active"
          size="small"
          @click="toggleQuickFilter(filter)"
          class="quick-filter-btn"
        >
          <el-icon>
            <component :is="filter.icon" />
          </el-icon>
          {{ filter.label }}
        </el-button>
      </div>
    </div>
    
    <!-- 筛选统计 -->
    <div v-if="hasActiveFilters" class="filter-stats">
      <div class="stats-info">
        <el-icon><DataAnalysis /></el-icon>
        <span>找到 {{ filteredItemsCount }} 个相关菜品</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { tagsApi } from '@/api/tags'
import { formatPrice, debounce } from '@/utils'
import {
  Close,
  Star,
  Refresh,
  Plus,
  ArrowUp,
  ArrowDown,
  Lightning,
  DataAnalysis,
  TrendCharts,
  Discount
} from '@element-plus/icons-vue'

// 定义事件
const emit = defineEmits(['filter-change'])

// 状态管理
const menuStore = useMenuStore()

// 响应式数据
const tagsLoading = ref(false)
const showAllTags = ref(false)
const showTagsLimit = ref(10)
const customTagInput = ref('')
const tagSuggestions = ref([])

// 快速筛选选项
const quickFilters = ref([
  { key: 'recommended', label: '推荐', icon: 'Star', active: false },
  { key: 'new', label: '新品', icon: 'Plus', active: false },
  { key: 'popular', label: '热门', icon: 'TrendCharts', active: false },
  { key: 'discount', label: '特价', icon: 'Discount', active: false }
])

// 计算属性
const hasActiveFilters = computed(() => 
  menuStore.selectedTags.length > 0 || 
  hasPriceFilter.value || 
  menuStore.currentCategory ||
  quickFilters.value.some(f => f.active)
)

const hasPriceFilter = computed(() => 
  menuStore.priceRange[0] > 0 || menuStore.priceRange[1] < 1000
)

const displayPopularTags = computed(() => {
  if (showAllTags.value) {
    return menuStore.popularTags
  }
  return menuStore.popularTags.slice(0, showTagsLimit.value)
})

const filteredItemsCount = computed(() => {
  if (menuStore.searchResults.length > 0) {
    return menuStore.searchResults.length
  }
  return menuStore.currentCategoryItems.length
})

// 检查标签是否被选中
const isTagSelected = (tag) => {
  return menuStore.selectedTags.includes(tag)
}

// 切换标签选择
const toggleTag = (tag) => {
  if (isTagSelected(tag)) {
    removeTag(tag)
  } else {
    addTag(tag)
  }
}

// 添加标签
const addTag = (tag) => {
  menuStore.addSelectedTag(tag)
  emitFilterChange()
}

// 移除标签
const removeTag = (tag) => {
  menuStore.removeSelectedTag(tag)
  emitFilterChange()
}

// 清除所有筛选
const clearAllFilters = () => {
  menuStore.clearSearchConditions()
  quickFilters.value.forEach(filter => {
    filter.active = false
  })
  emitFilterChange()
}

// 清除价格筛选
const clearPriceFilter = () => {
  menuStore.setPriceRange([0, 1000])
  emitFilterChange()
}

// 清除分类筛选
const clearCategoryFilter = () => {
  menuStore.setCurrentCategory(null)
  emitFilterChange()
}

// 切换显示所有标签
const toggleShowAllTags = () => {
  showAllTags.value = !showAllTags.value
}

// 刷新热门标签
const refreshPopularTags = async () => {
  try {
    tagsLoading.value = true
    await menuStore.fetchPopularTags(50)
  } catch (error) {
    console.error('刷新热门标签失败:', error)
  } finally {
    tagsLoading.value = false
  }
}

// 处理自定义标签输入
const handleCustomTagInput = debounce((value) => {
  if (value.trim().length >= 2) {
    generateTagSuggestions(value.trim())
  } else {
    tagSuggestions.value = []
  }
}, 300)

// 生成标签建议
const generateTagSuggestions = (input) => {
  // 从现有标签中筛选相似的
  const suggestions = menuStore.allTags
    .filter(tag => 
      tag.toLowerCase().includes(input.toLowerCase()) && 
      !menuStore.selectedTags.includes(tag)
    )
    .slice(0, 5)
  
  tagSuggestions.value = suggestions
}

// 添加自定义标签
const addCustomTag = () => {
  const tag = customTagInput.value.trim()
  if (tag && !isTagSelected(tag)) {
    addTag(tag)
    customTagInput.value = ''
    tagSuggestions.value = []
  }
}

// 选择标签建议
const selectTagSuggestion = (suggestion) => {
  customTagInput.value = suggestion
  addCustomTag()
}

// 切换快速筛选
const toggleQuickFilter = (filter) => {
  filter.active = !filter.active
  
  // 根据筛选类型添加对应标签
  const tagMap = {
    recommended: '推荐',
    new: '新品',
    popular: '热门',
    discount: '特价'
  }
  
  const tag = tagMap[filter.key]
  if (filter.active) {
    addTag(tag)
  } else {
    removeTag(tag)
  }
}

// 触发筛选变化事件
const emitFilterChange = () => {
  const filterParams = {
    tags: menuStore.selectedTags,
    priceRange: menuStore.priceRange,
    categoryId: menuStore.currentCategory?.id
  }
  
  emit('filter-change', filterParams)
}

// 监听选中标签变化
watch(() => menuStore.selectedTags, (newTags) => {
  // 同步快速筛选按钮状态
  quickFilters.value.forEach(filter => {
    const tagMap = {
      recommended: '推荐',
      new: '新品',
      popular: '热门',
      discount: '特价'
    }
    const tag = tagMap[filter.key]
    filter.active = newTags.includes(tag)
  })
}, { deep: true })

// 组件挂载
onMounted(async () => {
  // 获取所有标签用于建议
  try {
    await menuStore.fetchAllTags()
  } catch (error) {
    console.error('获取标签列表失败:', error)
  }
})
</script>

<style lang="scss" scoped>
.filter-tags {
  background: white;
  border-radius: $border-radius;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: $box-shadow-sm;
}

.active-filters {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid $border-color-light;
  
  .filter-header {
    @include flex-between;
    margin-bottom: 12px;
    
    .filter-title {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $text-color-primary;
    }
  }
  
  .active-filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .filter-tag {
      cursor: pointer;
      transition: all $transition-base;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: $box-shadow-sm;
      }
    }
  }
}

.section-header {
  @include flex-between;
  margin-bottom: 16px;
  
  .section-title {
    @include flex-center;
    gap: 6px;
    font-size: $font-size-md;
    font-weight: 600;
    color: $text-color-primary;
    margin: 0;
    
    .el-icon {
      font-size: 16px;
      color: $color-primary;
    }
  }
}

.popular-tags-section {
  margin-bottom: 24px;
  
  .tags-container {
    position: relative;
    min-height: 40px;
    
    .popular-tag {
      margin: 0 8px 8px 0;
      cursor: pointer;
      transition: all $transition-base;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: $box-shadow-sm;
      }
    }
    
    .toggle-tags-btn {
      @include flex-center;
      gap: 4px;
      margin-top: 8px;
      color: $color-primary;
    }
  }
}

.custom-tag-section {
  margin-bottom: 24px;
  
  .custom-tag-input {
    position: relative;
    
    .tag-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid $border-color-light;
      border-radius: $border-radius;
      box-shadow: $box-shadow;
      z-index: 1000;
      margin-top: 4px;
      max-height: 150px;
      overflow-y: auto;
      
      .suggestion-item {
        padding: 8px 12px;
        cursor: pointer;
        font-size: $font-size-sm;
        color: $text-color-primary;
        transition: all $transition-base;
        
        &:hover {
          background: $bg-color-light;
          color: $color-primary;
        }
      }
    }
  }
}

.quick-filters-section {
  margin-bottom: 20px;
  
  .quick-filter-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
    
    @include mobile {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .quick-filter-btn {
      @include flex-center;
      gap: 6px;
      transition: all $transition-base;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: $box-shadow-sm;
      }
    }
  }
}

.filter-stats {
  padding-top: 16px;
  border-top: 1px solid $border-color-light;
  
  .stats-info {
    @include flex-center;
    gap: 8px;
    font-size: $font-size-sm;
    color: $text-color-secondary;
    
    .el-icon {
      color: $color-primary;
    }
  }
}

// 深色模式适配
.dark {
  .filter-tags {
    background: rgba(40, 40, 40, 0.95);
    
    .active-filters {
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    .section-title,
    .filter-title {
      color: white;
    }
    
    .filter-stats {
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    .tag-suggestions {
      background: rgba(40, 40, 40, 0.95);
      border-color: rgba(255, 255, 255, 0.1);
      
      .suggestion-item {
        color: white;
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }
}
</style>
