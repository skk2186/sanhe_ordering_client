<template>
  <div class="conveyor-display">
    <!-- 顶部投碟进度区域（组件化） -->
    <div class="top-section">
      <TopPlateProgress :progress="plateProgress" :formatted="formattedProgress" />
    </div>

    <!-- 中间传送带区域 -->
    <div class="middle-section">
      <!-- 左侧菜单 -->
      <div class="menu-overlay left-menu" v-if="menuVisibility.left">
        <MenuView side="left" @close="menuVisibility.left = false" @add-to-cart="addSpecificItem" />
      </div>
      
      <!-- 右侧菜单 -->
      <div class="menu-overlay right-menu" v-if="menuVisibility.right">
        <MenuView side="right" @close="menuVisibility.right = false" @add-to-cart="addSpecificItem" />
      </div>
      
      <!-- 传送带（组件化） -->
      <ConveyorBeltContainer
        v-model:beltTrack="beltTrack"
        v-model:beltItems="beltItems"
        :is-dragging="isDragging"
        :is-momentum="isMomentum"
        :display-offset="displayOffset"
        :belt-track-ref="beltTrack"
        :belt-items-ref="beltItems"
        @drag-start="startDrag"
      >
        <ConveyorPlates
          :items="displayItems"
          :item-width="beltConfig.itemWidth"
          @click="(item, event) => handleSushiClick(item, event)"
          @drag-start="handleSushiDragStart"
          @drag-move="handleSushiDragMove"
          @drag-end="handleSushiDragEnd"
        />
      </ConveyorBeltContainer>
    </div>

    <!-- 底部功能区 -->
    <div class="bottom-section">
      <!-- 左侧菜品选择区 -->
      <div class="bottom-left">
        <div class="cart-section">
          <CartPanel
            side="left"
            :items="leftCart"
            :count="getCartCount('left')"
            @place-order="placeOrder"
            @remove="removeItem"
            @increase="increaseQuantity"
            @decrease="decreaseQuantity"
            @select="selectCartSlot"
          />
        </div>
      </div>

      <!-- 中间功能按钮区 -->
      <CenterFunctionPanel
        @open-detail-menu="openDetailMenu"
        @open-navigation="openNavigation"
        @open-order-history="openOrderHistory"
        @open-settings="openSettings"
        @call-waiter="callWaiter"
      />

      <!-- 右侧菜品选择区 -->
      <div class="bottom-right">
        <div class="cart-section">
          <CartPanel
            side="right"
            :items="rightCart"
            :count="getCartCount('right')"
            @place-order="placeOrder"
            @remove="removeItem"
            @increase="increaseQuantity"
            @decrease="decreaseQuantity"
            @select="selectCartSlot"
          />
        </div>
      </div>
    </div>


    <!-- 寿司导航组件 -->
    <SushiNavigation
      :visible="showSushiNavigation"
      :left-cart="leftCart"
      :right-cart="rightCart"
      @close="showSushiNavigation = false"
      @add-to-cart="handleSushiClick"
      @remove-from-cart="removeItem"
      @update-cart="updateCartItem"
      @place-order="placeOrder"
    />
    <!-- 点餐记录弹窗 -->
    <OrderHistoryDialog
      v-model="orderHistoryVisible"
      :items="orderHistoryItems"
      @call-waiter="callWaiter"
      title="点餐记录"
    />

    <!-- 呼叫店员确认弹窗 -->
    <el-dialog
      v-model="callWaiterConfirmVisible"
      title="呼叫店员"
      width="400px"
      :show-close="false"
      center
    >
      <div class="call-waiter-confirm">
        <div class="confirm-icon">🔔</div>
        <div class="confirm-message">
          <h3>确认呼叫店员？</h3>
          <p>店员将会立即前来为您服务</p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelCallWaiter" size="large">取消</el-button>
          <el-button type="primary" @click="confirmCallWaiter" size="large">
            确认呼叫
          </el-button>
        </div>
      </template>
    </el-dialog>


    <SettingDialog v-model="settingVisible"></SettingDialog>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'

import MenuView from '@/views/customer/MenuView.vue'
import SushiNavigation from '@/components/menu/SushiNavigation.vue'
import OrderHistoryDialog from '@/components/order/OrderHistoryDialog.vue'
import ConveyorBeltContainer from '@/components/display/ConveyorBeltContainer.vue'
import ConveyorPlates from '@/components/display/ConveyorPlates.vue'
import TopPlateProgress from '@/components/display/TopPlateProgress.vue'
import CartPanel from '@/components/display/CartPanel.vue'
import CenterFunctionPanel from '@/components/display/CenterFunctionPanel.vue'
import { sushiData } from '@/data/sushiData.js'
import { useCart } from '@/composables/useCart'
import { useOrderProgress } from '@/composables/useOrderProgress'
import { useConveyorBelt } from '@/composables/useConveyorBelt'
import { useVirtualPlates } from '@/composables/useVirtualPlates'
import { useConveyorLifecycle } from '@/composables/useConveyorLifecycle'
import SettingDialog from "@components/display/SettingDialog.vue";

// 使用前12个寿司作为传送带显示
const displaySushiData = sushiData.slice(0, 12)

// 响应式数据（改用组合式函数统一管理购物车与进度）
const { leftCart, rightCart, cartOf, countOf, add, remove, increase, decrease, clear } = useCart()
const { plateProgress, applyOrder, resetLater } = useOrderProgress()
// const currentPlates = ref(2) // 暂未使用
// const selectedSushi = ref(null) // 暂未使用
const menuVisibility = ref({ left: false, right: false });
const showSushiNavigation = ref(false)
const settingVisible = ref(false)


// 传送带相关
const beltTrack = ref(null)
const beltItems = ref(null)
// 由 useConveyorBelt 提供：displayOffset / isDragging / isMomentum / dragState

// 传送带配置
const beltConfig = {
  itemWidth: 300,
  autoSpeed: 1, // 恢复正常滚动速度
  maxVelocity: 15,
  decay: 0.95,
  minVelocity: 0.1,
  dragThreshold: 15,
  maxDragDistance: 50,
  longPressDelay: 600
}

// 初始化传送带（组合式）
const belt = useConveyorBelt({ beltConfig, onUpdate: () => {} })
const { displayOffset, isDragging, isMomentum, dragState, startDrag } = belt

// 动画控制由 useConveyorBelt 内部 rAF 管理

// 虚拟滚动：改用组合式函数封装
const { virtualScrollState, displayItems } = useVirtualPlates({
  data: displaySushiData,
  displayOffset,
  itemWidth: 300,
  gap: 130,
  buffer: 5
})

// const singleLoopWidth = computed(() => {
//   return (beltConfig.itemWidth + 10) * displaySushiData.length // 10px是gap间距
// }) // 暂未使用


// 格式化进度显示
const formattedProgress = computed(() => {
  return `${Math.round(plateProgress.value)}%`;
})

// 传送带核心逻辑由 useConveyorBelt 提供


// 动量滚动
// 动量滚动逻辑改由 useConveyorBelt.startMomentum 提供
// 寿司点击处理 - 直接添加到购物车
const handleSushiClick = (item, event) => {
  console.log('寿司点击:', item.name)

  // 获取点击位置，判断是屏幕左边还是右边
  const screenWidth = window.innerWidth
  const clickX = event?.clientX || screenWidth / 2
  const isLeftSide = clickX < screenWidth / 2

  console.log('点击位置:', clickX, '屏幕宽度:', screenWidth, '是否左侧:', isLeftSide)

  // 根据位置添加到对应的购物车
  if (isLeftSide) {
    addToCart(item, 'left')
  } else {
    addToCart(item, 'right')
  }
}

// SushiPlate组件的拖动事件处理
const handleSushiDragStart = (data) => {
  console.log('寿司拖动开始:', data.item.name)
  // 可以在这里添加拖动开始的逻辑
}

const handleSushiDragMove = () => {
  // 拖动移动事件，通常不需要特殊处理
  // 如果需要处理拖动数据，可以添加参数: (data)
}

const handleSushiDragEnd = (data) => {
  console.log('寿司拖动结束:', data.item.name)
  // 可以在这里添加拖动结束的逻辑，比如特殊的拖动操作
}

// 购物车操作
const addToCart = (item, side) => {
  const result = add(item, side)
  if (result.ok) {
    if (result.increased) {
      ElMessage.success(`${item.name} 数量已增加到 ${cartOf(result.side)[result.index].quantity} 份`)
    } else {
      ElMessage.success(`${item.name} 已添加到${result.side === 'left' ? '左侧' : '右侧'}购物车`)
    }
  } else if (result.reason === 'full') {
    ElMessage.warning(`${side === 'left' ? '左侧' : '右侧'}购物车已满！`)
  } else if (result.reason === 'max_quantity') {
    ElMessage.warning('该商品已达到最大数量（4份）！')
  }
}

// 添加到指定侧的购物车 - 暂未使用
// const addToCartSide = (item, side) => {
//   const cart = side === 'left' ? leftCart : rightCart
//   // 查找空位
//   for (let i = 0; i < 4; i++) {
//     if (!cart[i]) {
//       cart[i] = { ...item, quantity: 1 }
//       // 添加到购物车不增加进度，只有下单才增加
//       ElMessage.success(`${item.name} 已添加到${side === 'left' ? '左侧' : '右侧'}购物车`)
//       return
//     }
//   }
//   // 如果指定侧满了，尝试另一侧
//   const otherSide = side === 'left' ? 'right' : 'left'
//   const otherCart = side === 'left' ? rightCart : leftCart
//   for (let i = 0; i < 4; i++) {
//     if (!otherCart[i]) {
//       otherCart[i] = { ...item, quantity: 1 }
//       ElMessage.success(`${item.name} 已添加到${otherSide === 'left' ? '左侧' : '右侧'}购物车`)
//       return
//     }
//   }
//   ElMessage.warning('购物车已满！请先结账或移除一些商品。')
// }



// 投碟功能 - 暂未使用
// const addPlate = () => {
//   if (currentPlates.value < 5) {
//     currentPlates.value++
//     if (currentPlates.value === 5) {
//       setTimeout(() => {
//         ElMessage.success('🎉 恭喜！您已获得扭蛋机会！')
//         currentPlates.value = 0
//       }, 500)
//     }
//   }
// }

// 功能按钮
const openDetailMenu = (side) => {
  menuVisibility.value[side] = !menuVisibility.value[side];
}

const addSpecificItem = (item, side) => {
  addToCart(item, side);
}

const openSettings = () => {
  settingVisible.value = true
}

const openNavigation = () => {
  showSushiNavigation.value = true
}

// 寿司导航相关方法 - 暂未使用
// const closeSushiNavigation = () => {
//   showSushiNavigation.value = false
// }

// const handleNavigationAddToCart = (item) => {
//   // 默认添加到左侧购物车，如果满了则添加到右侧
//   addToCart(item, 'left')
// }

const openOrderHistory = () => {
  // 只显示已下单的商品历史
  orderHistoryItems.value = orderHistory.value
  orderHistoryVisible.value = true
}

const placeOrder = (side) => {
  const cart = cartOf(side)
  const cartItems = cart.filter(item => item !== null)
  if (cartItems.length === 0) {
    ElMessage.warning('购物车为空，无法下单')
    return
  }

  // 将下单的商品添加到订单历史中，并添加下单时间
  const orderTime = new Date().toLocaleString('zh-CN')
  const newOrderItems = cartItems.map(item => ({
    ...item,
    orderTime,
    orderId: Date.now() + Math.random() // 简单的订单ID生成
  }))

  // 添加到订单历史
  orderHistory.value.push(...newOrderItems)

  const { delta, reachedReward } = applyOrder(cartItems)
  ElMessage.success(`下单成功！进度增加${delta}%`)
  clear(side)
  if (reachedReward) {
    ElMessage.success('🎉 恭喜！您已集满进度，可以获得扭蛋奖励！')
    resetLater(2000)
    ElMessage.info('🔄 进度将自动重置，继续享受美食之旅！')
  }
}

// 点餐记录弹窗状态
const orderHistoryVisible = ref(false)
const orderHistoryItems = ref([])
// 订单历史存储
const orderHistory = ref([])
// 呼叫店员确认弹窗状态
const callWaiterConfirmVisible = ref(false)

// 结账功能 - 暂未使用
// const checkout = () => {
//   const allItems = [...leftCart.filter(item => item), ...rightCart.filter(item => item)]
//   if (allItems.length === 0) {
//     ElMessage.warning('购物车是空的！')
//     return
//   }
//   const total = allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
//   ElMessage.success(`💰 订单总计：¥${total} - 结账成功！感谢您的惠顾！`)
//   // 清空购物车
//   leftCart.fill(null)
//   rightCart.fill(null)
// }

const callWaiter = () => {
  callWaiterConfirmVisible.value = true
}

const confirmCallWaiter = () => {
  callWaiterConfirmVisible.value = false
  ElMessage.info('🔔 已呼叫店员，请稍候...')
}

const cancelCallWaiter = () => {
  callWaiterConfirmVisible.value = false
}

// 选择购物车位置（预留扩展）
const selectCartSlot = () => {}

// 增加商品数量
const increaseQuantity = (side, index) => {
  const result = increase(side, index)
  if (!result.ok && result.reason === 'max_quantity') {
    ElMessage.warning('每个商品最多只能添加4份')
  }
}

// 减少商品数量
const decreaseQuantity = (side, index) => {
  decrease(side, index)
}

// 更新购物车商品数量 - 供寿司导航组件调用
const updateCartItem = (side, index, action) => {
  if (action === 'increase') {
    const result = increase(side, index)
    if (!result.ok && result.reason === 'max_quantity') {
      ElMessage.warning('该商品已达到最大数量（4份）！')
    }
  } else if (action === 'decrease') {
    decrease(side, index)
  }
}

// 移除商品
const removeItem = (side, index) => {
  remove(side, index)
  ElMessage.success('商品已移除')
}

// 获取购物车商品数量
const getCartCount = (side) => {
  return countOf(side)
}

// 生命周期：改用组合式函数封装
useConveyorLifecycle({ beltTrackRef: beltTrack, virtualScrollState, belt })

// 监听菜品数据变化，自动重新计算
watch(() => displaySushiData.length, () => {
  // 菜品数据变化时，虚拟滚动会自动重新计算
  // 不需要重新创建大量副本，只需要重新渲染可见区域
  console.log('菜品数据已更新，虚拟滚动自动适配')
}, { immediate: true })

onUnmounted(() => {
  if (dragState.longPressTimer) {
    clearTimeout(dragState.longPressTimer)
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/conveyor-belt.scss';

.bottom-left, .bottom-right {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .menu-section {
    width: 100%;
    margin-bottom: 20px;
    // 确保菜单不会覆盖购物车
    z-index: 10;
  }
  
  .cart-section {
    width: 100%;
    // 确保购物车在菜单下方显示
    z-index: 5;
  }
  
  :deep(.menu-view-container) {
    width: 100%;
    max-width: 1200px;
  }
}

.menu-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  
  &.left-menu {
    justify-content: flex-start;
  }
  
  &.right-menu {
    justify-content: flex-end;
  }
}

:deep(.menu-view-container) {
  width: auto;
  max-width: 80%;
  max-height: 80%;
}

// 呼叫店员确认弹窗样式
.call-waiter-confirm {
  text-align: center;
  padding: 20px 0;

  .confirm-icon {
    font-size: 48px;
    margin-bottom: 20px;
    animation: ring 1s ease-in-out infinite;
  }

  .confirm-message {
    h3 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;

  .el-button {
    min-width: 100px;
    font-weight: 500;
  }
}

// 铃铛动画效果
@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
  20%, 40%, 60%, 80% { transform: rotate(10deg); }
}

// 弹窗样式优化
:deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);

  .el-dialog__header {
    padding: 20px 20px 10px;
    border-bottom: 1px solid #f0f0f0;

    .el-dialog__title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
  }

  .el-dialog__body {
    padding: 10px 20px;
  }

  .el-dialog__footer {
    padding: 10px 20px 20px;
    border-top: 1px solid #f0f0f0;
  }
}
</style>
