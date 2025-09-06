<template>
  <div class="mobile-bottom-nav">
    <div class="nav-container">
      <!-- 分类按钮 -->
      <div class="nav-item" @click="$emit('show-categories')">
        <div class="nav-icon">
          <el-icon><Grid /></el-icon>
        </div>
        <span class="nav-label">分类</span>
      </div>
      
      <!-- 搜索按钮 -->
      <div class="nav-item" @click="showSearchDialog">
        <div class="nav-icon">
          <el-icon><Search /></el-icon>
        </div>
        <span class="nav-label">搜索</span>
      </div>
      
      <!-- 首页按钮 -->
      <div class="nav-item" :class="{ 'active': isHomePage }" @click="goToHome">
        <div class="nav-icon">
          <el-icon><HomeFilled /></el-icon>
        </div>
        <span class="nav-label">首页</span>
      </div>
      
      <!-- 购物车按钮 -->
      <div class="nav-item cart-item" @click="$emit('show-cart')">
        <div class="nav-icon">
          <el-badge :value="cartStore.totalItems" :hidden="cartStore.isEmpty">
            <el-icon><ShoppingCart /></el-icon>
          </el-badge>
        </div>
        <span class="nav-label">购物车</span>
        <div v-if="!cartStore.isEmpty" class="cart-amount">
          {{ formatPrice(cartStore.totalAmount) }}
        </div>
      </div>
      
      <!-- 我的按钮 -->
      <div class="nav-item" @click="showUserMenu">
        <div class="nav-icon">
          <el-icon><User /></el-icon>
        </div>
        <span class="nav-label">我的</span>
      </div>
    </div>
    
    <!-- 快速搜索对话框 -->
    <el-dialog
      v-model="searchDialogVisible"
      title="搜索菜品"
      width="90%"
      :show-close="false"
      class="mobile-search-dialog"
    >
      <div class="search-content">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索菜品名称..."
          size="large"
          clearable
          @input="handleSearchInput"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
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
        
        <!-- 搜索历史 -->
        <div v-if="!searchKeyword && searchHistory.length > 0" class="search-history">
          <div class="history-header">
            <span>搜索历史</span>
            <el-button type="text" size="small" @click="clearSearchHistory">
              清除
            </el-button>
          </div>
          <div class="history-list">
            <div
              v-for="(history, index) in searchHistory"
              :key="index"
              class="history-item"
              @click="selectSearchHistory(history)"
            >
              <el-icon><Clock /></el-icon>
              <span>{{ history }}</span>
            </div>
          </div>
        </div>
        
        <!-- 搜索结果 -->
        <div v-if="searchResults.length > 0" class="search-results">
          <div class="results-header">
            <span>搜索结果 ({{ searchResults.length }})</span>
          </div>
          <div class="results-list">
            <div
              v-for="item in searchResults"
              :key="item.id"
              class="result-item"
              @click="selectSearchResult(item)"
            >
              <img :src="item.imageUrl || defaultImage" :alt="item.name" />
              <div class="item-info">
                <h4>{{ item.name }}</h4>
                <p>{{ formatPrice(item.price) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="searchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </template>
    </el-dialog>
    
    <!-- 用户菜单对话框 -->
    <el-dialog
      v-model="userMenuVisible"
      title="个人中心"
      width="90%"
      class="mobile-user-dialog"
    >
      <div class="user-content">
        <!-- 用户信息 -->
        <div class="user-info">
          <el-avatar :size="60" :src="userAvatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="user-details">
            <h3>{{ authStore.user?.username || '用户' }}</h3>
            <p v-if="authStore.isCustomer">桌号: {{ authStore.user?.tableNumber }}</p>
            <p v-else>{{ authStore.user?.role }}</p>
          </div>
        </div>
        
        <!-- 菜单选项 -->
        <div class="menu-options">
          <div class="menu-item" @click="goToOrders">
            <el-icon><List /></el-icon>
            <span>我的订单</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div v-if="authStore.isEmployee" class="menu-item" @click="goToAdmin">
            <el-icon><Setting /></el-icon>
            <span>管理后台</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div class="menu-item" @click="toggleTheme">
            <el-icon><Moon /></el-icon>
            <span>{{ globalStore.isDark ? '浅色模式' : '深色模式' }}</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div class="menu-item logout" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出登录</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useGlobalStore } from '@/stores/global'
import { useMenuStore } from '@/stores/menu'
import { formatPrice, debounce } from '@/utils'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Grid,
  Search,
  HomeFilled,
  ShoppingCart,
  User,
  Fire,
  Clock,
  List,
  Setting,
  Moon,
  SwitchButton,
  ArrowRight
} from '@element-plus/icons-vue'

// 定义事件
const emit = defineEmits(['show-categories', 'show-cart'])

// 状态管理
const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const authStore = useAuthStore()
const globalStore = useGlobalStore()
const menuStore = useMenuStore()

// 响应式数据
const searchDialogVisible = ref(false)
const userMenuVisible = ref(false)
const searchKeyword = ref('')
const searchResults = ref([])
const searchHistory = ref([])
const hotSearches = ref(['寿司', '刺身', '天妇罗', '拉面', '烤鱼'])
const defaultImage = '/images/default-food.jpg'

// 计算属性
const isHomePage = computed(() => route.path === '/menu')
const userAvatar = computed(() => authStore.user?.avatar || '')

// 防抖搜索
const debouncedSearch = debounce(async () => {
  if (searchKeyword.value.trim()) {
    try {
      const response = await menuStore.searchMenuItems({
        keyword: searchKeyword.value.trim(),
        page: 0,
        size: 10
      })
      searchResults.value = response.data?.content || []
    } catch (error) {
      console.error('搜索失败:', error)
    }
  } else {
    searchResults.value = []
  }
}, 500)

// 显示搜索对话框
const showSearchDialog = () => {
  searchDialogVisible.value = true
  loadSearchHistory()
}

// 处理搜索输入
const handleSearchInput = () => {
  debouncedSearch()
}

// 执行搜索
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    // 保存搜索历史
    saveSearchHistory(searchKeyword.value.trim())
    
    // 关闭对话框
    searchDialogVisible.value = false
    
    // 执行搜索
    menuStore.setSearchKeyword(searchKeyword.value.trim())
    menuStore.searchMenuItems({
      keyword: searchKeyword.value.trim()
    })
    
    // 清空搜索框
    searchKeyword.value = ''
    searchResults.value = []
  }
}

// 选择热门搜索
const selectHotSearch = (search) => {
  searchKeyword.value = search
  handleSearch()
}

// 选择搜索历史
const selectSearchHistory = (history) => {
  searchKeyword.value = history
  handleSearch()
}

// 选择搜索结果
const selectSearchResult = (item) => {
  searchDialogVisible.value = false
  // 这里可以跳转到商品详情或直接添加到购物车
  ElMessage.success(`选择了 ${item.name}`)
}

// 保存搜索历史
const saveSearchHistory = (keyword) => {
  const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
  
  // 移除重复项
  const index = history.indexOf(keyword)
  if (index > -1) {
    history.splice(index, 1)
  }
  
  // 添加到开头
  history.unshift(keyword)
  
  // 限制历史记录数量
  if (history.length > 10) {
    history.pop()
  }
  
  localStorage.setItem('searchHistory', JSON.stringify(history))
  searchHistory.value = history
}

// 加载搜索历史
const loadSearchHistory = () => {
  const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
  searchHistory.value = history
}

// 清除搜索历史
const clearSearchHistory = () => {
  localStorage.removeItem('searchHistory')
  searchHistory.value = []
  ElMessage.success('搜索历史已清除')
}

// 跳转到首页
const goToHome = () => {
  if (route.path !== '/menu') {
    router.push('/menu')
  }
}

// 显示用户菜单
const showUserMenu = () => {
  userMenuVisible.value = true
}

// 跳转到订单页面
const goToOrders = () => {
  userMenuVisible.value = false
  router.push('/orders')
}

// 跳转到管理后台
const goToAdmin = () => {
  userMenuVisible.value = false
  router.push('/admin')
}

// 切换主题
const toggleTheme = () => {
  globalStore.toggleTheme()
  ElMessage.success(`已切换到${globalStore.isDark ? '深色' : '浅色'}模式`)
}

// 处理退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '退出确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    userMenuVisible.value = false
    
    // 清除购物车
    cartStore.reset()
    
    // 执行登出
    await authStore.logout()
    
    // 跳转到登录页
    router.push('/login')
    
  } catch (error) {
    // 用户取消或其他错误
    if (error !== 'cancel') {
      console.error('退出登录失败:', error)
    }
  }
}

// 组件挂载
onMounted(() => {
  loadSearchHistory()
})
</script>

<style lang="scss" scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid $border-color-light;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  height: 60px;
}

.nav-item {
  @include flex-center;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  transition: all $transition-base;
  position: relative;
  
  &:active {
    background: $bg-color-light;
  }
  
  &.active {
    .nav-icon {
      color: $color-primary;
    }
    
    .nav-label {
      color: $color-primary;
    }
  }
  
  &.cart-item {
    .cart-amount {
      position: absolute;
      top: 4px;
      right: 8px;
      font-size: 10px;
      color: $sushi-primary;
      font-weight: 600;
    }
  }
  
  .nav-icon {
    font-size: 20px;
    color: $text-color-regular;
    transition: color $transition-base;
  }
  
  .nav-label {
    font-size: 10px;
    color: $text-color-secondary;
    transition: color $transition-base;
  }
}

// 搜索对话框
.mobile-search-dialog {
  :deep(.el-dialog) {
    margin-top: 10vh;
    border-radius: $border-radius-lg;
  }
  
  :deep(.el-dialog__body) {
    padding: 20px;
  }
}

.search-content {
  .hot-searches,
  .search-history {
    margin-top: 20px;
    
    .hot-header,
    .history-header {
      @include flex-between;
      margin-bottom: 12px;
      
      span {
        @include flex-center;
        gap: 6px;
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
        
        &:hover {
          color: $color-primary;
          border-color: $color-primary;
        }
      }
    }
    
    .history-list {
      .history-item {
        @include flex-center;
        gap: 8px;
        padding: 12px 0;
        border-bottom: 1px solid $border-color-extra-light;
        cursor: pointer;
        
        &:hover {
          background: $bg-color-light;
        }
        
        .el-icon {
          color: $text-color-secondary;
          font-size: 14px;
        }
        
        span {
          flex: 1;
          font-size: $font-size-sm;
          color: $text-color-primary;
        }
      }
    }
  }
  
  .search-results {
    margin-top: 20px;
    
    .results-header {
      margin-bottom: 12px;
      
      span {
        font-size: $font-size-sm;
        font-weight: 500;
        color: $text-color-primary;
      }
    }
    
    .results-list {
      max-height: 300px;
      overflow-y: auto;
      
      .result-item {
        @include flex-center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid $border-color-extra-light;
        cursor: pointer;
        
        &:hover {
          background: $bg-color-light;
        }
        
        img {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: $border-radius;
        }
        
        .item-info {
          flex: 1;
          
          h4 {
            font-size: $font-size-sm;
            font-weight: 600;
            color: $text-color-primary;
            margin: 0 0 4px 0;
          }
          
          p {
            font-size: $font-size-sm;
            color: $sushi-primary;
            font-weight: 600;
            margin: 0;
          }
        }
      }
    }
  }
}

// 用户菜单对话框
.mobile-user-dialog {
  :deep(.el-dialog) {
    margin-top: 10vh;
    border-radius: $border-radius-lg;
  }
}

.user-content {
  .user-info {
    @include flex-center;
    gap: 16px;
    padding: 20px 0;
    border-bottom: 1px solid $border-color-light;
    margin-bottom: 20px;
    
    .user-details {
      flex: 1;
      
      h3 {
        font-size: $font-size-lg;
        font-weight: 600;
        color: $text-color-primary;
        margin: 0 0 8px 0;
      }
      
      p {
        font-size: $font-size-sm;
        color: $text-color-secondary;
        margin: 0;
      }
    }
  }
  
  .menu-options {
    .menu-item {
      @include flex-between;
      padding: 16px 0;
      border-bottom: 1px solid $border-color-extra-light;
      cursor: pointer;
      transition: all $transition-base;
      
      &:hover {
        background: $bg-color-light;
        margin: 0 -20px;
        padding-left: 20px;
        padding-right: 20px;
      }
      
      &.logout {
        color: $color-danger;
        
        .el-icon {
          color: $color-danger;
        }
      }
      
      .el-icon:first-child {
        margin-right: 12px;
        font-size: 18px;
      }
      
      span {
        flex: 1;
        font-size: $font-size-md;
      }
      
      .el-icon:last-child {
        font-size: 14px;
        color: $text-color-secondary;
      }
    }
  }
}

// 深色模式适配
.dark {
  .mobile-bottom-nav {
    background: rgba(40, 40, 40, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .nav-item {
    &:active {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .nav-label {
      color: rgba(255, 255, 255, 0.7);
    }
  }
  
  .user-info {
    border-color: rgba(255, 255, 255, 0.1);
    
    h3 {
      color: white;
    }
  }
  
  .menu-item {
    border-color: rgba(255, 255, 255, 0.05);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    span {
      color: white;
    }
  }
}
</style>
