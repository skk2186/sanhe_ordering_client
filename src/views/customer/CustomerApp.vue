<template>
  <div class="customer-app">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="status-left">
        <div class="table-info">
          <el-icon><Shop /></el-icon>
          <span>桌号{{ tableNumber }}</span>
        </div>
        <div class="time">{{ currentTime }}</div>
      </div>
      <div class="status-right">
        <div v-if="memberInfo" class="member-info">
          <el-icon color="#FFD700"><User /></el-icon>
          <span class="member-level">{{ memberInfo.level }}</span>
          <span class="member-points">积分：{{ memberInfo.points }}</span>
        </div>
        <el-button type="text" @click="showHelp">
          <el-icon><QuestionFilled /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <router-view />
    </div>

    <!-- 底部购物车栏 -->
    <div v-if="cartItems.length > 0" class="cart-bar">
      <div class="cart-summary" @click="showCart">
        <div class="cart-icon">
          <el-icon size="24"><ShoppingCart /></el-icon>
          <span class="cart-count">{{ totalItems }}</span>
        </div>
        <div class="cart-info">
          <div class="cart-total">¥{{ totalPrice }}</div>
          <div class="cart-text">查看购物车</div>
        </div>
      </div>
      <el-button
        :disabled="totalItems === 0"
        class="checkout-btn"
        size="large"
        type="primary"
        @click="checkout"
      >
        去结算
      </el-button>
    </div>

    <!-- 投盘进度条 -->
    <div v-if="plateCount > 0" class="plate-progress">
      <div class="progress-bar">
        <div
          :style="{ width: `${(plateCount % 5) * 20}%` }"
          class="progress-fill"
        ></div>
      </div>
      <div class="progress-text">
        已投{{ plateCount }}盘，再投{{ 5 - (plateCount % 5) }}盘获得扭蛋机会
      </div>
    </div>

    <!-- 扭蛋机弹窗 -->
    <GachaMachine
      v-model:visible="showGacha"
      @reward="handleGachaReward"
    />

    <!-- 购物车抽屉 -->
    <CartDrawer
      v-model:visible="showCartDrawer"
      :items="cartItems"
      @update-quantity="updateCartQuantity"
      @remove-item="removeCartItem"
    />

    <!-- 帮助弹窗 -->
    <HelpModal v-model:visible="showHelpModal" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useMemberStore } from '@/stores/member'
import { ElMessage } from 'element-plus'
import {
  Shop,
  User,
  QuestionFilled,
  ShoppingCart
} from '@element-plus/icons-vue'
import GachaMachine from '@/components/customer/GachaMachine.vue'
import CartDrawer from '@/components/customer/CartDrawer.vue'
import HelpModal from '@/components/customer/HelpModal.vue'

const router = useRouter()
const cartStore = useCartStore()
const memberStore = useMemberStore()

// 响应式数据
const currentTime = ref('')
const tableNumber = ref('08')
const plateCount = ref(0)
const showGacha = ref(false)
const showCartDrawer = ref(false)
const showHelpModal = ref(false)

// 计算属性
const cartItems = computed(() => cartStore.items)
const totalItems = computed(() => cartStore.totalItems)
const totalPrice = computed(() => cartStore.totalPrice)
const memberInfo = computed(() => memberStore.memberInfo)

// 时间更新
let timeInterval = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 方法
const showCart = () => {
  showCartDrawer.value = true
}

const showHelp = () => {
  showHelpModal.value = true
}

const checkout = () => {
  if (totalItems.value === 0) {
    ElMessage.warning('购物车为空')
    return
  }
  router.push('/customer/checkout')
}

const updateCartQuantity = (itemId, quantity) => {
  cartStore.updateQuantity(itemId, quantity)
}

const removeCartItem = (itemId) => {
  cartStore.removeItem(itemId)
}

const handleGachaReward = (reward) => {
  ElMessage.success(`恭喜获得：${reward.name}`)
  if (reward.type === 'points') {
    memberStore.addPoints(reward.value)
  }
}

// 监听投盘事件
const handlePlateAdded = () => {
  plateCount.value++
  if (plateCount.value % 5 === 0) {
    // 满5盘触发扭蛋
    setTimeout(() => {
      showGacha.value = true
    }, 1000)
  }
}

// 生命周期
onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)

  // 监听投盘事件
  window.addEventListener('plateAdded', handlePlateAdded)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  window.removeEventListener('plateAdded', handlePlateAdded)
})
</script>

<style lang="scss" scoped>
.customer-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-secondary;
}

.status-bar {
  height: 6rem;
  background: $white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $spacing-md;
  box-shadow: $shadow-sm;
  position: sticky;
  top: 0;
  z-index: 100;

  .status-left {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    .table-info {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      font-weight: 600;
      color: $primary-color;
      font-size: $font-size-lg;
    }

    .time {
      color: $text-secondary;
      font-size: $font-size-sm;
    }
  }

  .status-right {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    .member-info {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      padding: $spacing-xs $spacing-sm;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      border-radius: $border-radius-button;
      color: $white;
      font-size: $font-size-sm;

      .member-level {
        font-weight: 600;
      }
    }
  }
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8rem; // 为底部购物车栏留空间
}

.cart-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 7rem;
  background: $white;
  display: flex;
  align-items: center;
  padding: 0 $spacing-md;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;

  .cart-summary {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    cursor: pointer;

    .cart-icon {
      position: relative;
      color: $primary-color;

      .cart-count {
        position: absolute;
        top: -0.8rem;
        right: -0.8rem;
        background: $error-color;
        color: $white;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: $font-size-xs;
        font-weight: 600;
      }
    }

    .cart-info {
      .cart-total {
        font-size: $font-size-lg;
        font-weight: 600;
        color: $primary-color;
      }

      .cart-text {
        font-size: $font-size-sm;
        color: $text-secondary;
      }
    }
  }

  .checkout-btn {
    min-width: 12rem;
    height: 4.4rem;
    border-radius: $border-radius-button;
    font-size: $font-size-base;
    font-weight: 600;
  }
}

.plate-progress {
  position: fixed;
  top: 6rem;
  left: 0;
  right: 0;
  background: rgba(255, 122, 0, 0.9);
  color: $white;
  padding: $spacing-sm $spacing-md;
  z-index: 99;

  .progress-bar {
    height: 0.4rem;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 0.2rem;
    overflow: hidden;
    margin-bottom: $spacing-xs;

    .progress-fill {
      height: 100%;
      background: $white;
      border-radius: 0.2rem;
      transition: width $transition-base;
    }
  }

  .progress-text {
    font-size: $font-size-sm;
    text-align: center;
  }
}

// 响应式适配
@include mobile {
  .status-bar {
    height: 5rem;
    padding: 0 $spacing-sm;

    .status-left {
      gap: $spacing-sm;

      .table-info {
        font-size: $font-size-base;
      }
    }

    .member-info {
      .member-points {
        display: none;
      }
    }
  }

  .cart-bar {
    height: 6rem;
    padding: 0 $spacing-sm;

    .checkout-btn {
      min-width: 10rem;
      height: 4rem;
    }
  }
}
</style>
