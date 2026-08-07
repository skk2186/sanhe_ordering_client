<template>
  <div class="menu-home">
    <!-- 简化的顶部导航栏 -->
    <div class="menu-header">
      <h1>{{ $t('menu.menuTitle') }}</h1>
      <div class="header-actions">
        <FunctionButton
          function-type="navigation"
          :text="$t('common.back')"
          emoji="⬅️"
          size="small"
          variant="outlined"
          @click="goBack"
        />
        <FunctionButton
          function-type="order"
          :text="$t('cart.title')"
          emoji="🛒"
          :badge="cartStore.totalItems > 0 ? cartStore.totalItems : null"
          size="small"
          @click="showCart"
        />
      </div>
    </div>

    <!-- 投盘进度条 -->
    <div class="progress-section" v-if="showPlateProgress">
      <PlateProgress
        :current-plates="plateCount"
        :target-plates="5"
        :gacha-used="gachaUsed"
        @gacha-trigger="handleGachaTrigger"
        @progress-complete="handleProgressComplete"
      />
    </div>

    <!-- 主要内容区域 -->
    <div class="menu-content">
      <!-- 菜品展示区域 -->
      <div class="menu-main">
        <!-- 简化的搜索栏 -->
        <div class="search-bar">
          <SearchButton
            v-model="searchKeyword"
            :suggestions="searchSuggestions"
            :placeholder="$t('menu.searchSushi')"
            auto-expand
            @search="handleSearch"
            @clear="handleSearchClear"
          />
        </div>

        <!-- 菜品网格 -->
        <div class="menu-grid-section">
          <div v-if="loading" class="loading-container">
            <el-loading :visible="true" :text="$t('common.loading')" />
          </div>

          <div v-else-if="displayItems.length === 0" class="empty-container">
            <el-empty :description="$t('menu.noDishes')" />
          </div>

          <div v-else class="dish-grid">
            <DishCard
              v-for="item in displayItems"
              :key="item.id"
              :item="item"
              @add-to-cart="handleAddToCart"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 购物车抽屉 -->
    <el-drawer
      v-model="cartVisible"
      :title="$t('cart.title')"
      direction="rtl"
      size="400px"
    >
      <div class="cart-content">
        <div v-if="cartStore.isEmpty" class="empty-cart">
          <el-empty :description="$t('cart.empty')" />
        </div>
        <div v-else>
          <div class="cart-items">
            <div
              v-for="item in cartStore.items"
              :key="item.id"
              class="cart-item"
            >
              <img :src="item.image || '/images/default-dish.jpg'" :alt="item.name" />
              <div class="item-info">
                <h4>{{ item.name }}</h4>
                <p class="price">¥{{ item.price }}</p>
              </div>
              <div class="quantity-controls">
                <el-button size="small" @click="cartStore.decreaseQuantity(item.id)">-</el-button>
                <span>{{ item.quantity }}</span>
                <el-button size="small" @click="cartStore.increaseQuantity(item.id)">+</el-button>
              </div>
            </div>
          </div>
          <div class="cart-summary">
            <div class="total">
              {{ $t('cart.total') }}: ¥{{ cartStore.totalAmount }}
            </div>
            <el-button type="primary" size="large" @click="handleCheckout">
              {{ $t('common.checkout') }}
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/i18n'

// 组件导入
import DishCard from '@/components/menu/DishCard.vue'
import PlateProgress from '@/components/customer/PlateProgress.vue'
import FunctionButton from '@/components/common/FunctionButton.vue'
import SearchButton from '@/components/common/SearchButton.vue'

// 状态管理
const router = useRouter()
const cartStore = useCartStore()
const { t } = useI18n()

// 响应式数据
const cartVisible = ref(false)
const loading = ref(false)
const searchKeyword = ref('')
const searchSuggestions = ref(['三文鱼寿司', '金枪鱼寿司', '鳗鱼寿司', '加州卷', '手握寿司', '刺身拼盘'])

// 投盘进度相关
const plateCount = ref(0)
const gachaUsed = ref(false)
const showPlateProgress = ref(true)

// 模拟菜品数据
const mockMenuItems = ref([
  {
    id: 1,
    name: '三文鱼寿司',
    description: '新鲜三文鱼配优质寿司米',
    price: 25,
    originalPrice: 30,
    imageUrl: '/images/default-dish.jpg',
    rating: 4.8,
    isNew: true,
    status: 'AVAILABLE',
    tags: [
      { id: 1, name: '人气', type: 'popular' },
      { id: 2, name: '新品', type: 'new' }
    ]
  },
  {
    id: 2,
    name: '金枪鱼刺身',
    description: '顶级金枪鱼，口感鲜美',
    price: 45,
    imageUrl: '/images/default-dish.jpg',
    rating: 4.9,
    status: 'AVAILABLE',
    tags: [
      { id: 3, name: '招牌', type: 'popular' }
    ]
  },
  {
    id: 3,
    name: '天妇罗拼盘',
    description: '酥脆天妇罗，多种口味',
    price: 35,
    imageUrl: '/images/default-dish.jpg',
    rating: 4.6,
    status: 'AVAILABLE',
    tags: [
      { id: 4, name: '热菜', type: 'hot' }
    ]
  }
])

// 计算属性
const displayItems = computed(() => {
  if (!searchKeyword.value) {
    return mockMenuItems.value
  }
  return mockMenuItems.value.filter(item =>
    item.name.includes(searchKeyword.value) ||
    item.description.includes(searchKeyword.value)
  )
})

// 返回上一页
const goBack = () => {
  router.push('/demo')
}

// 显示购物车
const showCart = () => {
  cartVisible.value = true
}

// 处理搜索
const handleSearch = (query) => {
  searchKeyword.value = query
  // 搜索逻辑已在计算属性中处理
}

// 处理搜索清空
const handleSearchClear = () => {
  searchKeyword.value = ''
}

// 添加到购物车
const handleAddToCart = (menuItem, quantity = 1) => {
  cartStore.addItem(menuItem, quantity)

  // 检查是否为寿司类菜品，增加投盘计数
  if (menuItem.category?.name?.includes('寿司') || menuItem.tags?.some(tag => tag.name === '寿司')) {
    plateCount.value += quantity

    // 保存到本地存储
    localStorage.setItem('plateCount', plateCount.value.toString())
  }
}

const handleGachaTrigger = () => {
  ElMessage.success(t('display.gachaOpened'))
}

const handleProgressComplete = () => {
  ElMessage.success(t('display.gachaEarned'))
}

// 结账
const handleCheckout = () => {
  if (cartStore.isEmpty) {
    ElMessage.warning(t('cart.emptyWarning'))
    return
  }

  ElMessage.success(t('cart.checkoutDeveloping'))
  cartVisible.value = false
}

// 组件挂载
onMounted(async () => {
  try {
    // 初始化购物车
    cartStore.initCart()

    // 初始化投盘进度
    const savedPlateCount = localStorage.getItem('plateCount')
    const savedGachaUsed = localStorage.getItem('gachaUsed')

    if (savedPlateCount) {
      plateCount.value = parseInt(savedPlateCount, 10) || 0
    }

    if (savedGachaUsed) {
      gachaUsed.value = savedGachaUsed === 'true'
    }

    console.log('🍣 菜品页面初始化完成')
  } catch (error) {
    console.error('❌ 菜品页面初始化失败:', error)
    ElMessage.error(t('errors.loadFailed'))
  }
})
</script>

<style lang="scss" scoped>
.menu-home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg-secondary;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  background: $white;
  border-bottom: 1px solid $border-color-light;
  box-shadow: $shadow-sm;

  h1 {
    margin: 0;
    color: $primary-color;
    font-family: $font-family-title;
  }

  .header-actions {
    display: flex;
    gap: $spacing-md;
  }
}

.progress-section {
  padding: $spacing-md $spacing-lg;
  background: rgba($white, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba($border-color-light, 0.5);
}

.menu-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.menu-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-bar {
  padding: $spacing-lg;
  background: $white;
  border-bottom: 1px solid $border-color-light;
}

.menu-grid-section {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $spacing-lg;
}

.cart-content {
  padding: $spacing-lg;
}

.empty-cart {
  text-align: center;
  padding: $spacing-2xl;
}

.cart-items {
  margin-bottom: $spacing-lg;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  border-bottom: 1px solid $border-color-light;

  img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: $border-radius-small;
  }

  .item-info {
    flex: 1;

    h4 {
      margin: 0 0 $spacing-xs 0;
      font-size: $font-size-base;
    }

    .price {
      margin: 0;
      color: $primary-color;
      font-weight: 600;
    }
  }

  .quantity-controls {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    span {
      min-width: 2rem;
      text-align: center;
      font-weight: 600;
    }
  }
}

.cart-summary {
  border-top: 1px solid $border-color-light;
  padding-top: $spacing-lg;

  .total {
    font-size: $font-size-lg;
    font-weight: 600;
    text-align: center;
    margin-bottom: $spacing-md;
    color: $primary-color;
  }
}

@media (max-width: $breakpoint-md) {
  .dish-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: $spacing-md;
  }
}

@media (max-width: $breakpoint-sm) {
  .dish-grid {
    grid-template-columns: 1fr;
    gap: $spacing-md;
  }

  .menu-header {
    padding: $spacing-md;

    .header-actions {
      flex-direction: column;
      gap: $spacing-sm;
    }
  }
}
</style>
