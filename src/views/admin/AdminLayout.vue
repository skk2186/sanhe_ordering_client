<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <div class="admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <el-icon size="32" color="#ff6b6b">
            <Shop />
          </el-icon>
          <span v-if="!sidebarCollapsed" class="logo-text">{{ $t('admin.sushiAdmin') }}</span>
        </div>
      </div>
      
      <el-menu
        :default-active="$route.path"
        class="sidebar-menu"
        :collapse="sidebarCollapsed"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>{{ $t('admin.dashboard') }}</span>
        </el-menu-item>
        
        <el-menu-item index="/admin/categories">
          <el-icon><Menu /></el-icon>
          <span>{{ $t('admin.categories') }}</span>
        </el-menu-item>
        
        <el-menu-item index="/admin/menu-items">
          <el-icon><Food /></el-icon>
          <span>{{ $t('admin.menuItems') }}</span>
        </el-menu-item>
        
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>{{ $t('admin.users') }}</span>
        </el-menu-item>
      </el-menu>
    </div>
    
    <!-- 主内容区 -->
    <div class="admin-main">
      <!-- 顶部导航 -->
      <div class="admin-header">
        <div class="header-left">
          <el-button
            type="text"
            @click="toggleSidebar"
          >
            <el-icon size="20">
              <Fold v-if="!sidebarCollapsed" />
              <Expand v-else />
            </el-icon>
          </el-button>
          
          <el-breadcrumb separator="/">
            <el-breadcrumb-item to="/admin">{{ $t('common.admin') }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.titleKey ? $t($route.meta.titleKey) : '' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar size="small" :src="userAvatar">
                {{ authStore.user?.name?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ authStore.user?.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">{{ $t('common.profile') }}</el-dropdown-item>
                <el-dropdown-item command="settings">{{ $t('common.systemSettings') }}</el-dropdown-item>
                <el-dropdown-item divided command="logout">{{ $t('common.logout') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 页面内容 -->
      <div class="admin-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGlobalStore } from '@/stores/global'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from '@/i18n'
import {
  Shop,
  DataBoard,
  Menu,
  Food,
  User,
  Fold,
  Expand,
  ArrowDown
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const globalStore = useGlobalStore()
const { t } = useI18n()

const sidebarCollapsed = computed(() => globalStore.sidebarCollapsed)
const userAvatar = computed(() => authStore.user?.avatar || '')

const toggleSidebar = () => {
  globalStore.toggleSidebar()
  globalStore.saveSidebar()
}

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info(t('admin.profileDeveloping'))
      break
    case 'settings':
      ElMessage.info(t('admin.settingsDeveloping'))
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(t('admin.logoutConfirm'), t('common.prompt'), {
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        })
        await authStore.logout()
        router.push('/login')
      } catch (error) {
        // 用户取消
      }
      break
  }
}
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
}

.admin-sidebar {
  width: 250px;
  background: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: width 0.3s;
  
  &.collapsed {
    width: 64px;
  }
  
  .sidebar-header {
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid #f0f0f0;
    
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .logo-text {
        font-size: 18px;
        font-weight: bold;
        color: #333;
      }
    }
  }
  
  .sidebar-menu {
    border: none;
    
    :deep(.el-menu-item) {
      height: 50px;
      line-height: 50px;
      
      &:hover {
        background-color: #f5f5f5;
      }
      
      &.is-active {
        background-color: #ff6b6b;
        color: white;
        
        .el-icon {
          color: white;
        }
      }
    }
  }
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-header {
  height: 60px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 6px;
      transition: background-color 0.3s;
      
      &:hover {
        background-color: #f5f5f5;
      }
      
      .username {
        font-size: 14px;
        color: #333;
      }
    }
  }
}

.admin-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>
