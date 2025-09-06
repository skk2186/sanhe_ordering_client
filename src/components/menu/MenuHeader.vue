<template>
  <div class="menu-header">
    <div class="header-content">
      <!-- 左侧Logo和标题 -->
      <div class="header-left">
        <div class="logo">
          <el-icon size="32" color="#ff6b6b">
            <Restaurant />
          </el-icon>
        </div>
        <div class="title-section">
          <h1 class="title">回转寿司</h1>
          <p class="subtitle" v-if="authStore.isCustomer">
            桌号: {{ authStore.user?.tableNumber || '未知' }}
          </p>
          <p class="subtitle" v-else>
            欢迎, {{ authStore.user?.username || '用户' }}
          </p>
        </div>
      </div>
      
      <!-- 中间状态信息 -->
      <div class="header-center">
        <div class="status-info">
          <div class="time-info">
            <el-icon><Clock /></el-icon>
            <span>{{ currentTime }}</span>
          </div>
          <div class="online-status" :class="{ 'offline': !globalStore.isOnline }">
            <el-icon><Connection /></el-icon>
            <span>{{ globalStore.isOnline ? '在线' : '离线' }}</span>
          </div>
        </div>
      </div>
      
      <!-- 右侧操作区域 -->
      <div class="header-right">
        <!-- 购物车摘要 -->
        <div class="cart-summary" @click="toggleCart">
          <el-badge :value="cartStore.totalItems" :hidden="cartStore.isEmpty">
            <el-button type="primary" circle>
              <el-icon><ShoppingCart /></el-icon>
            </el-button>
          </el-badge>
          <div class="cart-info" v-if="!cartStore.isEmpty">
            <span class="amount">{{ formatPrice(cartStore.totalAmount) }}</span>
            <span class="items">{{ cartStore.totalItems }}件商品</span>
          </div>
        </div>
        
        <!-- 用户菜单 -->
        <el-dropdown @command="handleUserCommand" trigger="click">
          <div class="user-avatar">
            <el-avatar :size="40" :src="userAvatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
          </div>
          
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人信息
              </el-dropdown-item>
              
              <el-dropdown-item command="orders" v-if="authStore.isCustomer">
                <el-icon><List /></el-icon>
                我的订单
              </el-dropdown-item>
              
              <el-dropdown-item command="admin" v-if="authStore.isEmployee">
                <el-icon><Setting /></el-icon>
                管理后台
              </el-dropdown-item>
              
              <el-dropdown-item divided command="theme">
                <el-icon><Moon /></el-icon>
                {{ globalStore.isDark ? '浅色模式' : '深色模式' }}
              </el-dropdown-item>
              
              <el-dropdown-item command="logout" class="logout-item">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 移动端简化头部 -->
    <div class="mobile-header" v-if="globalStore.isMobile">
      <div class="mobile-content">
        <div class="mobile-left">
          <el-button 
            type="text" 
            @click="$emit('toggle-sidebar')"
            class="sidebar-toggle"
          >
            <el-icon><Menu /></el-icon>
          </el-button>
          <span class="mobile-title">回转寿司</span>
        </div>
        
        <div class="mobile-right">
          <el-badge :value="cartStore.totalItems" :hidden="cartStore.isEmpty">
            <el-button type="primary" circle size="small" @click="$emit('show-cart')">
              <el-icon><ShoppingCart /></el-icon>
            </el-button>
          </el-badge>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useGlobalStore } from '@/stores/global'
import { formatPrice } from '@/utils'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Restaurant,
  Clock,
  Connection,
  ShoppingCart,
  User,
  ArrowDown,
  List,
  Setting,
  Moon,
  SwitchButton,
  Menu
} from '@element-plus/icons-vue'

// 定义事件
const emit = defineEmits(['toggle-sidebar', 'show-cart', 'toggle-cart'])

// 状态管理
const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const globalStore = useGlobalStore()

// 响应式数据
const currentTime = ref('')
const timeInterval = ref(null)

// 计算属性
const userAvatar = computed(() => {
  return authStore.user?.avatar || ''
})

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 切换购物车
const toggleCart = () => {
  emit('toggle-cart')
}

// 处理用户菜单命令
const handleUserCommand = async (command) => {
  switch (command) {
    case 'profile':
      // 跳转到个人信息页面
      router.push('/profile')
      break
      
    case 'orders':
      // 跳转到订单页面
      router.push('/orders')
      break
      
    case 'admin':
      // 跳转到管理后台
      router.push('/admin')
      break
      
    case 'theme':
      // 切换主题
      globalStore.toggleTheme()
      ElMessage.success(`已切换到${globalStore.isDark ? '深色' : '浅色'}模式`)
      break
      
    case 'logout':
      // 退出登录
      await handleLogout()
      break
      
    default:
      break
  }
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
  // 初始化时间
  updateTime()
  
  // 设置定时器更新时间
  timeInterval.value = setInterval(updateTime, 1000)
})

// 组件卸载
onUnmounted(() => {
  if (timeInterval.value) {
    clearInterval(timeInterval.value)
  }
})
</script>

<style lang="scss" scoped>
.menu-header {
  background: white;
  border-bottom: 1px solid $border-color-light;
  box-shadow: $box-shadow-sm;
  z-index: 100;
}

.header-content {
  @include flex-between;
  padding: 0 24px;
  height: $header-height;
  max-width: 1400px;
  margin: 0 auto;
  
  @include mobile {
    display: none;
  }
}

.header-left {
  @include flex-center;
  gap: 16px;
  
  .logo {
    @include flex-center;
  }
  
  .title-section {
    .title {
      font-size: $font-size-xl;
      font-weight: 600;
      color: $text-color-primary;
      margin: 0;
      line-height: 1.2;
    }
    
    .subtitle {
      font-size: $font-size-sm;
      color: $text-color-secondary;
      margin: 0;
      line-height: 1;
    }
  }
}

.header-center {
  flex: 1;
  @include flex-center;
  
  .status-info {
    @include flex-center;
    gap: 24px;
    
    .time-info,
    .online-status {
      @include flex-center;
      gap: 6px;
      font-size: $font-size-sm;
      color: $text-color-regular;
      
      .el-icon {
        font-size: 16px;
      }
    }
    
    .online-status {
      &.offline {
        color: $color-danger;
      }
    }
  }
}

.header-right {
  @include flex-center;
  gap: 20px;
}

.cart-summary {
  @include flex-center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: $border-radius;
  transition: all $transition-base;
  
  &:hover {
    background: $bg-color-light;
  }
  
  .cart-info {
    @include flex-column;
    align-items: flex-start;
    
    .amount {
      font-size: $font-size-md;
      font-weight: 600;
      color: $sushi-primary;
      line-height: 1.2;
    }
    
    .items {
      font-size: $font-size-xs;
      color: $text-color-secondary;
      line-height: 1;
    }
  }
}

.user-avatar {
  @include flex-center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: $border-radius;
  transition: all $transition-base;
  
  &:hover {
    background: $bg-color-light;
  }
  
  .dropdown-icon {
    font-size: 12px;
    color: $text-color-secondary;
  }
}

// 移动端头部
.mobile-header {
  display: none;
  
  @include mobile {
    display: block;
    padding: 0 16px;
    height: 50px;
  }
  
  .mobile-content {
    @include flex-between;
    height: 100%;
  }
  
  .mobile-left {
    @include flex-center;
    gap: 12px;
    
    .sidebar-toggle {
      padding: 8px;
      
      .el-icon {
        font-size: 20px;
      }
    }
    
    .mobile-title {
      font-size: $font-size-lg;
      font-weight: 600;
      color: $text-color-primary;
    }
  }
  
  .mobile-right {
    @include flex-center;
  }
}

// 下拉菜单样式
:deep(.el-dropdown-menu) {
  .logout-item {
    color: $color-danger;
    
    &:hover {
      background: rgba($color-danger, 0.1);
      color: $color-danger;
    }
  }
}

// 深色模式适配
.dark {
  .menu-header {
    background: rgba(40, 40, 40, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .header-left .title-section .title {
    color: white;
  }
  
  .cart-summary:hover,
  .user-avatar:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
