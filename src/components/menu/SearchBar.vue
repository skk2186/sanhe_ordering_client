<template>
  <div class="search-bar">
    <div class="search-input-section">
      <!-- 主搜索框 -->
      <div class="main-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索菜品名称、描述..."
          size="large"
          clearable
          @input="handleSearchInput"
          @keyup.enter="handleSearch"
          @clear="handleClear"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #suffix>
            <el-button
              type="primary"
              :loading="isSearching || menuStore.searchLoading"
              @click="handleSearch"
            >
              搜索
            </el-button>
          </template>
        </el-input>
      </div>
      
      <!-- 高级搜索切换 -->
      <el-button 
        type="text" 
        @click="toggleAdvancedSearch"
        class="advanced-toggle"
      >
        <el-icon>
          <component :is="showAdvanced ? 'ArrowUp' : 'ArrowDown'" />
        </el-icon>
        {{ showAdvanced ? '收起' : '高级搜索' }}
      </el-button>
    </div>
    
    <!-- 高级搜索面板 -->
    <el-collapse-transition>
      <div v-show="showAdvanced" class="advanced-search">
        <div class="search-filters">
          <!-- 价格范围 -->
          <div class="filter-group">
            <label class="filter-label">价格范围</label>
            <div class="price-range">
              <el-input-number
                v-model="priceRange[0]"
                :min="0"
                :max="1000"
                :step="5"
                size="small"
                placeholder="最低价"
                @change="handlePriceChange"
              />
              <span class="range-separator">-</span>
              <el-input-number
                v-model="priceRange[1]"
                :min="0"
                :max="1000"
                :step="5"
                size="small"
                placeholder="最高价"
                @change="handlePriceChange"
              />
            </div>
          </div>
          
          <!-- 分类筛选 -->
          <div class="filter-group">
            <label class="filter-label">分类</label>
            <el-select
              v-model="selectedCategoryId"
              placeholder="选择分类"
              clearable
              size="small"
              @change="handleCategoryChange"
            >
              <el-option
                v-for="category in menuStore.enabledCategories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </div>
 
          <!-- 排序方式
          <div class="filter-group">
            <label class="filter-label">排序</label>
            <el-select
              v-model="sortBy"
              placeholder="排序方式"
              size="small"
              @change="handleSortChange"
            >
              <el-option label="默认排序" value="default" />
              <el-option label="价格从低到高" value="price_asc" />
              <el-option label="价格从高到低" value="price_desc" />
              <el-option label="销量最高" value="sales_desc" />
              <el-option label="最新上架" value="created_desc" />
              <el-option label="评分最高" value="rating_desc" />
            </el-select>
          </div>
        </div>-->


        <!-- 操作按钮 -->
        <div class="search-actions">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleSearch">应用筛选</el-button>
        </div>
      </div>
    </div>
    </el-collapse-transition>

    <!-- 搜索建议 -->
    <div v-if="showSuggestions && searchSuggestions.length > 0" class="search-suggestions">
      <div class="suggestions-header">
        <span>搜索建议</span>
        <el-button type="text" size="small" @click="closeSuggestions">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="suggestions-list">
        <div
          v-for="(suggestion, index) in searchSuggestions"
          :key="index"
          class="suggestion-item"
          @click="selectSuggestion(suggestion)"
        >
          <el-icon><Search /></el-icon>
          <span>{{ suggestion }}</span>
        </div>
      </div>
    </div>

    <!-- 搜索历史 -->
    <div v-if="showHistory && searchHistory.length > 0" class="search-history">
      <div class="history-header">
        <div class="header-left">
          <el-icon><Clock /></el-icon>
          <span>搜索历史</span>
        </div>
        <div class="header-right">
          <el-button type="text" size="small" @click="clearSearchHistory">
            清空历史
          </el-button>
          <el-button type="text" size="small" @click="closeHistory">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
      <div class="history-list">
        <div
          v-for="(item, index) in searchHistory"
          :key="index"
          class="history-item"
          @click="selectHistoryItem(item.keyword)"
        >
          <div class="history-content">
            <el-icon><Search /></el-icon>
            <span class="history-keyword">{{ item.keyword }}</span>
            <span class="history-count">{{ item.count }}次</span>
          </div>
          <el-button
            type="text"
            size="small"
            @click.stop="removeHistoryItem(index)"
            class="remove-btn"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 热门搜索 -->
    <div v-if="!searchKeyword && hotSearches.length > 0" class="hot-searches">
      <div class="hot-header">
        <el-icon><Fire /></el-icon>
        <span>热门搜索</span>
      </div>
      <div class="hot-tags">
        <el-tag
          v-for="(search, index) in hotSearches"
          :key="index"
          type="info"
          effect="plain"
          size="small"
          @click="selectHotSearch(search)"
          class="hot-tag"
        >
          {{ search }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { debounce } from '@/utils'
import {
  Search,
  ArrowUp,
  ArrowDown,
  Close,
  Fire,
  Clock
} from '@element-plus/icons-vue'

// 定义事件
const emit = defineEmits(['search'])

// 状态管理
const menuStore = useMenuStore()

// 响应式数据
const searchKeyword = ref('')
const showAdvanced = ref(false)
const priceRange = ref([0, 500])
const selectedCategoryId = ref(null)
const sortBy = ref('default')
const showSuggestions = ref(false)
const searchSuggestions = ref([])
const hotSearches = ref(['寿司', '刺身', '天妇罗', '拉面', '烤鱼', '牛肉'])

// 新增功能状态
const searchHistory = ref([])
const showHistory = ref(false)
const searchStats = ref({
  totalSearches: 0,
  popularKeywords: [],
  recentSearches: []
})
const isSearching = ref(false)

// 防抖搜索
const debouncedSearch = debounce(() => {
  if (searchKeyword.value.trim()) {
    handleSearch()
  }
}, 500)

// 本地存储键名
const SEARCH_HISTORY_KEY = 'sushi_search_history'
const SEARCH_STATS_KEY = 'sushi_search_stats'

// 加载搜索历史
const loadSearchHistory = () => {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (history) {
      searchHistory.value = JSON.parse(history)
    }
  } catch (error) {
    console.warn('加载搜索历史失败:', error)
  }
}

// 保存搜索历史
const saveSearchHistory = () => {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory.value))
  } catch (error) {
    console.warn('保存搜索历史失败:', error)
  }
}

// 添加到搜索历史
const addToSearchHistory = (keyword) => {
  if (!keyword.trim()) return

  // 移除重复项
  const filteredHistory = searchHistory.value.filter(item => item.keyword !== keyword)

  // 添加新搜索记录
  const newRecord = {
    keyword,
    timestamp: Date.now(),
    count: 1
  }

  // 查找是否已存在
  const existingIndex = searchHistory.value.findIndex(item => item.keyword === keyword)
  if (existingIndex !== -1) {
    searchHistory.value[existingIndex].count++
    searchHistory.value[existingIndex].timestamp = Date.now()
  } else {
    filteredHistory.unshift(newRecord)
    searchHistory.value = filteredHistory.slice(0, 10) // 只保留最近10条
  }

  saveSearchHistory()
  updateSearchStats(keyword)
}

// 更新搜索统计
const updateSearchStats = (keyword) => {
  searchStats.value.totalSearches++

  // 更新热门关键词
  const existingKeyword = searchStats.value.popularKeywords.find(item => item.keyword === keyword)
  if (existingKeyword) {
    existingKeyword.count++
  } else {
    searchStats.value.popularKeywords.push({ keyword, count: 1 })
  }

  // 按搜索次数排序
  searchStats.value.popularKeywords.sort((a, b) => b.count - a.count)
  searchStats.value.popularKeywords = searchStats.value.popularKeywords.slice(0, 5)

  // 更新最近搜索
  searchStats.value.recentSearches.unshift({
    keyword,
    timestamp: Date.now()
  })
  searchStats.value.recentSearches = searchStats.value.recentSearches.slice(0, 5)

  // 保存统计数据
  try {
    localStorage.setItem(SEARCH_STATS_KEY, JSON.stringify(searchStats.value))
  } catch (error) {
    console.warn('保存搜索统计失败:', error)
  }
}

// 处理搜索输入
const handleSearchInput = (value) => {
  menuStore.setSearchKeyword(value)

  if (value.trim()) {
    // 生成搜索建议
    generateSuggestions(value)
    showSuggestions.value = true
    showHistory.value = false

    // 防抖搜索
    debouncedSearch()
  } else {
    showSuggestions.value = false
    searchSuggestions.value = []

    // 显示搜索历史（如果有）
    if (searchHistory.value.length > 0) {
      showHistory.value = true
    }
  }
}

// 生成搜索建议
const generateSuggestions = (keyword) => {
  const suggestions = []
  const lowerKeyword = keyword.toLowerCase()

  // 1. 基于菜品名称的建议
  const menuItems = menuStore.availableMenuItems
  const nameMatches = menuItems
    .filter(item => item.name.toLowerCase().includes(lowerKeyword))
    .map(item => item.name)
    .slice(0, 3)

  suggestions.push(...nameMatches)

  // 2. 基于菜品描述的建议
  const descMatches = menuItems
    .filter(item =>
      item.description &&
      item.description.toLowerCase().includes(lowerKeyword) &&
      !nameMatches.includes(item.name)
    )
    .map(item => item.name)
    .slice(0, 2)

  suggestions.push(...descMatches)

  // 3. 基于分类的建议
  const categories = menuStore.enabledCategories
  const categoryMatches = categories
    .filter(cat => cat.name.toLowerCase().includes(lowerKeyword))
    .map(cat => cat.name)
    .slice(0, 2)

  suggestions.push(...categoryMatches)

  // 4. 基于搜索历史的建议
  const historyMatches = searchHistory.value
    .filter(item =>
      item.keyword.toLowerCase().includes(lowerKeyword) &&
      item.keyword !== keyword
    )
    .sort((a, b) => b.count - a.count)
    .map(item => item.keyword)
    .slice(0, 2)

  suggestions.push(...historyMatches)

  // 5. 智能组合建议
  if (suggestions.length < 5) {
    const smartSuggestions = [
      `${keyword}套餐`,
      `特色${keyword}`,
      `招牌${keyword}`,
      `${keyword}拼盘`,
      `${keyword}组合`
    ].filter(item =>
      item !== keyword &&
      !suggestions.includes(item)
    )

    suggestions.push(...smartSuggestions)
  }

  // 去重并限制数量
  searchSuggestions.value = [...new Set(suggestions)]
    .filter(item => item !== keyword)
    .slice(0, 6)
}

// 处理搜索
const handleSearch = async () => {
  const keyword = searchKeyword.value.trim()

  if (!keyword && !selectedCategoryId.value && priceRange.value[0] === 0 && priceRange.value[1] === 500) {
    return
  }

  isSearching.value = true

  const searchParams = {
    keyword,
    categoryId: selectedCategoryId.value,
    minPrice: priceRange.value[0],
    maxPrice: priceRange.value[1],
    sortBy: sortBy.value === 'default' ? undefined : sortBy.value
  }

  // 添加到搜索历史
  if (keyword) {
    addToSearchHistory(keyword)
  }

  // 关闭建议和历史
  showSuggestions.value = false
  showHistory.value = false

  try {
    // 触发搜索事件
    emit('search', searchParams)

    // 模拟搜索延迟
    await new Promise(resolve => setTimeout(resolve, 300))
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请重试')
  } finally {
    isSearching.value = false
  }
}

// 处理清除
const handleClear = () => {
  searchKeyword.value = ''
  menuStore.setSearchKeyword('')
  showSuggestions.value = false
  searchSuggestions.value = []
  
  // 如果有其他筛选条件，保持搜索
  if (selectedCategoryId.value || priceRange.value[0] > 0 || priceRange.value[1] < 500) {
    handleSearch()
  } else {
    // 清除所有搜索结果
    menuStore.clearSearchConditions()
  }
}

// 处理价格变化
const handlePriceChange = () => {
  menuStore.setPriceRange(priceRange.value)
  if (searchKeyword.value.trim() || selectedCategoryId.value) {
    handleSearch()
  }
}

// 处理分类变化
const handleCategoryChange = () => {
  if (searchKeyword.value.trim() || priceRange.value[0] > 0 || priceRange.value[1] < 500) {
    handleSearch()
  }
}

// 处理排序变化
const handleSortChange = () => {
  if (searchKeyword.value.trim() || selectedCategoryId.value || 
      priceRange.value[0] > 0 || priceRange.value[1] < 500) {
    handleSearch()
  }
}

// 重置搜索
const handleReset = () => {
  searchKeyword.value = ''
  priceRange.value = [0, 500]
  selectedCategoryId.value = null
  sortBy.value = 'default'
  
  menuStore.clearSearchConditions()
  showSuggestions.value = false
  searchSuggestions.value = []
}

// 切换高级搜索
const toggleAdvancedSearch = () => {
  showAdvanced.value = !showAdvanced.value
}

// 选择搜索建议
const selectSuggestion = (suggestion) => {
  searchKeyword.value = suggestion
  menuStore.setSearchKeyword(suggestion)
  showSuggestions.value = false
  handleSearch()
}

// 关闭建议
const closeSuggestions = () => {
  showSuggestions.value = false
}

// 处理输入框焦点
const handleInputFocus = () => {
  if (!searchKeyword.value.trim() && searchHistory.value.length > 0) {
    showHistory.value = true
    showSuggestions.value = false
  }
}

// 处理输入框失焦
const handleInputBlur = () => {
  // 延迟关闭，允许点击建议或历史项
  setTimeout(() => {
    showSuggestions.value = false
    showHistory.value = false
  }, 200)
}

// 选择热门搜索
const selectHotSearch = (search) => {
  searchKeyword.value = search
  menuStore.setSearchKeyword(search)
  handleSearch()
}

// 选择历史搜索项
const selectHistoryItem = (keyword) => {
  searchKeyword.value = keyword
  menuStore.setSearchKeyword(keyword)
  showHistory.value = false
  handleSearch()
}

// 关闭搜索历史
const closeHistory = () => {
  showHistory.value = false
}

// 移除单个历史记录
const removeHistoryItem = (index) => {
  searchHistory.value.splice(index, 1)
  saveSearchHistory()

  if (searchHistory.value.length === 0) {
    showHistory.value = false
  }
}

// 清空搜索历史
const clearSearchHistory = () => {
  searchHistory.value = []
  showHistory.value = false
  saveSearchHistory()

  // 重置搜索统计
  searchStats.value = {
    totalSearches: 0,
    popularKeywords: [],
    recentSearches: []
  }

  try {
    localStorage.removeItem(SEARCH_STATS_KEY)
  } catch (error) {
    console.warn('清除搜索统计失败:', error)
  }

  ElMessage.success('搜索历史已清空')
}

// 监听菜单store的搜索关键词变化
watch(() => menuStore.searchKeyword, (newKeyword) => {
  if (newKeyword !== searchKeyword.value) {
    searchKeyword.value = newKeyword
  }
})

// 监听菜单store的价格范围变化
watch(() => menuStore.priceRange, (newRange) => {
  priceRange.value = [...newRange]
}, { immediate: true })

// 组件挂载
onMounted(() => {
  // 初始化搜索状态
  searchKeyword.value = menuStore.searchKeyword
  priceRange.value = [...menuStore.priceRange]

  // 加载搜索历史
  loadSearchHistory()

  // 加载搜索统计
  try {
    const stats = localStorage.getItem(SEARCH_STATS_KEY)
    if (stats) {
      searchStats.value = JSON.parse(stats)
    }
  } catch (error) {
    console.warn('加载搜索统计失败:', error)
  }

  // 更新热门搜索（基于统计数据）
  if (searchStats.value.popularKeywords.length > 0) {
    hotSearches.value = [
      ...searchStats.value.popularKeywords.slice(0, 4).map(item => item.keyword),
      ...hotSearches.value
    ].slice(0, 6)
  }
})
</script>

<style lang="scss" scoped>
.search-bar {
  position: relative;
}

.search-input-section {
  @include flex-between;
  gap: 16px;
  margin-bottom: 16px;
  
  .main-search {
    flex: 1;
    
    :deep(.el-input__wrapper) {
      border-radius: $border-radius-lg;
      box-shadow: $box-shadow-sm;
      
      &:hover {
        box-shadow: $box-shadow;
      }
    }
    
    :deep(.el-input-group__append) {
      border-radius: 0 $border-radius-lg $border-radius-lg 0;
      border-left: none;
      padding: 0;
      
      .el-button {
        border-radius: 0 $border-radius-lg $border-radius-lg 0;
        padding: 0 20px;
      }
    }
  }
  
  .advanced-toggle {
    @include flex-center;
    gap: 4px;
    color: $text-color-secondary;
    
    &:hover {
      color: $color-primary;
    }
  }
}

.advanced-search {
  padding: 20px;
  background: $bg-color-light;
  border-radius: $border-radius;
  border: 1px solid $border-color-light;
  margin-bottom: 16px;
}

.search-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  
  @include mobile {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.filter-group {
  .filter-label {
    display: block;
    font-size: $font-size-sm;
    font-weight: 500;
    color: $text-color-primary;
    margin-bottom: 8px;
  }
  
  .price-range {
    @include flex-center;
    gap: 8px;
    
    .range-separator {
      color: $text-color-secondary;
      font-weight: 500;
    }
  }
}

.search-actions {
  @include flex-center;
  gap: 12px;
  justify-content: flex-end;
  
  @include mobile {
    justify-content: stretch;
    
    .el-button {
      flex: 1;
    }
  }
}

.search-suggestions,
.search-history {
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

  .suggestions-header,
  .history-header {
    @include flex-between;
    padding: 12px 16px;
    border-bottom: 1px solid $border-color-light;
    background: $bg-color-light;

    .header-left {
      @include flex-center;
      gap: 6px;

      .el-icon {
        color: $text-color-secondary;
        font-size: 14px;
      }

      span {
        font-size: $font-size-sm;
        font-weight: 500;
        color: $text-color-secondary;
      }
    }

    .header-right {
      @include flex-center;
      gap: 8px;
    }

    span {
      font-size: $font-size-sm;
      font-weight: 500;
      color: $text-color-secondary;
    }
  }

  .suggestions-list,
  .history-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .suggestion-item {
    @include flex-center;
    gap: 8px;
    padding: 12px 16px;
    cursor: pointer;
    transition: all $transition-base;

    &:hover {
      background: $bg-color-light;
    }

    .el-icon {
      color: $text-color-secondary;
      font-size: 14px;
    }

    span {
      font-size: $font-size-sm;
      color: $text-color-primary;
    }
  }
}

.search-history {
  .history-item {
    @include flex-between;
    padding: 12px 16px;
    cursor: pointer;
    transition: all $transition-base;

    &:hover {
      background: $bg-color-light;

      .remove-btn {
        opacity: 1;
      }
    }

    .history-content {
      @include flex-center;
      gap: 8px;
      flex: 1;

      .el-icon {
        color: $text-color-secondary;
        font-size: 14px;
      }

      .history-keyword {
        font-size: $font-size-sm;
        color: $text-color-primary;
        flex: 1;
      }

      .history-count {
        font-size: $font-size-xs;
        color: $text-color-secondary;
        background: $bg-color-light;
        padding: 2px 6px;
        border-radius: $border-radius-sm;
      }
    }

    .remove-btn {
      opacity: 0;
      transition: opacity $transition-base;
      color: $text-color-secondary;

      &:hover {
        color: $color-danger;
      }
    }
  }
}

.hot-searches {
  margin-top: 16px;
  
  .hot-header {
    @include flex-center;
    gap: 6px;
    margin-bottom: 12px;
    
    .el-icon {
      color: $color-warning;
      font-size: 16px;
    }
    
    span {
      font-size: $font-size-sm;
      font-weight: 500;
      color: $text-color-primary;
    }
  }
  
  .hot-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .hot-tag {
      cursor: pointer;
      transition: all $transition-base;
      
      &:hover {
        color: $color-primary;
        border-color: $color-primary;
        background: rgba($color-primary, 0.1);
      }
    }
  }
}

// 深色模式适配
.dark {
  .advanced-search {
    background: rgba(40, 40, 40, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .search-suggestions,
  .search-history {
    background: rgba(40, 40, 40, 0.95);
    border-color: rgba(255, 255, 255, 0.1);

    .suggestions-header,
    .history-header {
      background: rgba(30, 30, 30, 0.8);
      border-color: rgba(255, 255, 255, 0.1);

      .header-left {
        .el-icon {
          color: rgba(255, 255, 255, 0.7);
        }

        span {
          color: rgba(255, 255, 255, 0.7);
        }
      }

      span {
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .suggestion-item,
    .history-item {
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      span,
      .history-keyword {
        color: white;
      }

      .history-count {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
      }
    }
  }
  
  .filter-label {
    color: white;
  }
}
</style>
