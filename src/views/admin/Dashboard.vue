<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div class="header-left">
      <h1>{{ $t('admin.dashboard') }}</h1>
      <p>{{ $t('admin.welcomeBack', { name: authStore.user?.name || $t('common.user') }) }}</p>
      </div>
      <div class="header-right">
        <el-button
          type="primary"
          :loading="loading"
          @click="refreshData"
          :icon="Refresh"
        >
        {{ $t('admin.refreshData') }}
        </el-button>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#ff6b6b">
            <Shop />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dashboardData.todayOrders }}</div>
          <div class="stat-label">{{ $t('admin.todayOrders') }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#4ecdc4">
            <Money />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formattedRevenue }}</div>
          <div class="stat-label">{{ $t('admin.todayRevenue') }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#ffe66d">
            <User />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dashboardData.onlineCustomers }}</div>
          <div class="stat-label">{{ $t('admin.onlineCustomers') }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#95e1d3">
            <Food />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dashboardData.totalMenuItems }}</div>
          <div class="stat-label">{{ $t('admin.totalDishes') }}</div>
        </div>
      </div>
    </div>
    
    <!-- 快捷操作 -->
    <div class="quick-actions">
      <h2>{{ $t('admin.quickActions') }}</h2>
      <div class="action-grid">
        <el-button type="primary" size="large" @click="$router.push('/admin/menu-items')">
          <el-icon><Plus /></el-icon>
          {{ $t('admin.addMenuItem') }}
        </el-button>
        <el-button type="success" size="large" @click="$router.push('/admin/categories')">
          <el-icon><Menu /></el-icon>
          {{ $t('admin.categories') }}
        </el-button>
        <el-button type="warning" size="large" @click="$router.push('/admin/users')">
          <el-icon><User /></el-icon>
          {{ $t('admin.users') }}
        </el-button>
      </div>
    </div>
    
    <!-- 最近活动 -->
    <div class="recent-activity">
      <h2>{{ $t('admin.recentActivity') }}</h2>
      <el-timeline v-if="dashboardData.recentActivities.length > 0">
        <el-timeline-item
          v-for="activity in dashboardData.recentActivities"
          :key="activity.id"
          :timestamp="formatTime(activity.timestamp)"
          :color="activity.color"
        >
          {{ activity.message }}
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else :description="$t('admin.noActivity')" />
    </div>

    <!-- 热门菜品 -->
    <div class="popular-items">
      <h2>{{ $t('admin.popularDishes') }}</h2>
      <div class="items-grid">
        <div
          v-for="item in dashboardData.popularItems"
          :key="item.name"
          class="item-card"
        >
          <div class="item-info">
            <h3>{{ item.name }}</h3>
              <p>{{ $t('admin.salesCount', { count: item.sales }) }}</p>
          </div>
          <div class="item-revenue">
            ¥{{ item.revenue }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/i18n'

const { t } = useI18n()
import {
  Shop,
  Money,
  User,
  Food,
  Plus,
  Menu,
  Refresh
} from '@element-plus/icons-vue'

const authStore = useAuthStore()
const menuStore = useMenuStore()

// 响应式数据
const loading = ref(false)
const dashboardData = ref({
  todayOrders: 0,
  todayRevenue: 0,
  onlineCustomers: 0,
  totalMenuItems: 0,
  recentActivities: [],
  salesTrend: [],
  popularItems: []
})

// 计算属性
const formattedRevenue = computed(() => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(dashboardData.value.todayRevenue)
})

// 获取仪表盘数据
const fetchDashboardData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟数据
    dashboardData.value = {
      todayOrders: Math.floor(Math.random() * 200) + 100,
      todayRevenue: Math.floor(Math.random() * 20000) + 10000,
      onlineCustomers: Math.floor(Math.random() * 50) + 30,
      totalMenuItems: menuStore.availableMenuItems.length || 245,
      recentActivities: [
        {
          id: 1,
          type: 'order',
          message: '桌号8完成订单，金额：¥156',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          color: '#4ecdc4'
        },
        {
          id: 2,
          type: 'menu',
          message: '新增菜品：特色金枪鱼寿司',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          color: '#ff6b6b'
        },
        {
          id: 3,
          type: 'system',
          message: '系统自动备份数据完成',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          color: '#ffe66d'
        },
        {
          id: 4,
          type: 'user',
          message: '员工李四登录系统',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          color: '#95e1d3'
        }
      ],
      salesTrend: generateSalesTrend(),
      popularItems: [
        { name: '三文鱼寿司', sales: 45, revenue: 2250 },
        { name: '金枪鱼刺身', sales: 38, revenue: 1900 },
        { name: '天妇罗拼盘', sales: 32, revenue: 1600 },
        { name: '招牌拉面', sales: 28, revenue: 1120 },
        { name: '烤鳗鱼寿司', sales: 25, revenue: 1375 }
      ]
    }
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    ElMessage.error(t('errors.fetchData'))
  } finally {
    loading.value = false
  }
}

// 生成销售趋势数据
const generateSalesTrend = () => {
  const trend = []
  const now = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    trend.push({
      date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      orders: Math.floor(Math.random() * 100) + 50,
      revenue: Math.floor(Math.random() * 10000) + 5000
    })
  }

  return trend
}

// 刷新数据
const refreshData = () => {
  fetchDashboardData()
}

// 格式化时间
const formatTime = (timestamp) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  }).format(timestamp)
}

// 组件挂载时获取数据
onMounted(() => {
  fetchDashboardData()

  // 设置定时刷新（每5分钟）
  const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)

  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>

<style lang="scss" scoped>
.dashboard {
  .dashboard-header {
    @include flex-between;
    margin-bottom: 30px;

    .header-left {
      h1 {
        font-size: 28px;
        color: #333;
        margin: 0 0 8px 0;
      }

      p {
        color: #666;
        margin: 0;
      }
    }

    .header-right {
      @include flex-center;
      gap: 12px;
    }
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
    
    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 16px;
      
      .stat-content {
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-bottom: 4px;
        }
        
        .stat-label {
          color: #666;
          font-size: 14px;
        }
      }
    }
  }
  
  .quick-actions {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
    
    h2 {
      margin: 0 0 20px 0;
      color: #333;
    }
    
    .action-grid {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
  }
  
  .recent-activity,
  .popular-items {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;

    h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 20px;
    }
  }

  .popular-items {
    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;

      .item-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .item-info {
          h3 {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin: 0 0 4px 0;
          }

          p {
            font-size: 14px;
            color: #666;
            margin: 0;
          }
        }

        .item-revenue {
          font-size: 18px;
          font-weight: 600;
          color: #28a745;
        }
      }
    }
  }
}
</style>
