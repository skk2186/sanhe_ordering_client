<template>
  <div class="conveyor-display">
    <!-- 顶部投碟进度区域（组件化） -->
    <div class="top-section">
      <TopPlateProgress :progress="plateProgress" :formatted="formattedProgress" />
    </div>

    <VirtualDiningAssistant
      v-if="globalStore.voiceAssistantEnabled"
      :hotwords="assistantHotwords"
      :match-count="voiceMatchCount"
      :recommendations="assistantRecommendations"
      :feedback-message="assistantActionMessage"
      :feedback-revision="assistantFeedbackRevision"
      :feedback-audio-key="assistantFeedbackAudioKey"
      :selected-item-id="assistantSelectedItemId"
      :sound-enabled="globalStore.ttsEnabled"
      :volume="globalStore.assistantVolume"
      :continue-listening="assistantContinueListening"
      :action-busy="assistantOrdering"
      @transcript="handleVoiceTranscript"
      @select-recommendation="handleAssistantRecommendationSelect"
    />

    <!-- 中间传送带区域 -->
    <div class="middle-section">
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
      <div v-if="productsLoading || productsError || !displaySushiData.length" class="product-state" role="status">
        <el-icon v-if="productsLoading" class="product-state-icon is-loading"><Loading /></el-icon>
        <template v-else-if="productsError">
          <p>{{ productsError }}</p>
          <el-button circle :aria-label="$t('common.refresh')" :title="$t('common.refresh')" @click="fetchSushiData">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </template>
        <p v-else>{{ $t('menu.noDishes') }}</p>
      </div>
    </div>

    <!-- 底部功能区 -->
    <div class="bottom-section">
      <!-- 左侧菜品选择区 -->
      <div class="bottom-left">
          <CartPanel
            side="left"
            :items="leftCart"
            :count="getCartCount('left')"
            :tips-type="leftCartTipsType"
            :submitting="submittingSide === 'left'"
            @place-order="placeOrder"
            @remove="removeItem"
            @increase="increaseQuantity"
            @decrease="decreaseQuantity"
            @select="selectCartSlot"
            @close-tips="closeCartFullTips('left')"
          />
          <MenuView  v-if="menuVisibility.left" side="left" @close="menuVisibility.left = false" @add-to-cart="addSpecificItem" />
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

        <CartPanel
          side="right"
          :items="rightCart"
          :count="getCartCount('right')"
          :tips-type="rightCartTipsType"
          :submitting="submittingSide === 'right'"
          @place-order="placeOrder"
          @remove="removeItem"
          @increase="increaseQuantity"
          @decrease="decreaseQuantity"
          @select="selectCartSlot"
          @close-tips="closeCartFullTips('right')"
        />

        <MenuView v-if="menuVisibility.right" side="right" @close="menuVisibility.right = false" @add-to-cart="addSpecificItem" />
      </div>
    </div>


    <!-- 寿司导航组件 -->
    <SushiNavigation
      :visible="showSushiNavigation"
      :items="navigationItems"
      :categories="displayCategories"
      :loading="productsLoading"
      :error="productsError"
      :left-cart="leftCart"
      :right-cart="rightCart"
      :left-tips-type="leftCartTipsType"
      :right-tips-type="rightCartTipsType"
      :submitting-side="submittingSide"
      @close="showSushiNavigation = false"
      @retry="fetchSushiData"
      @add-to-cart="handleNavigationAddToCart"
      @remove-from-cart="removeItem"
      @update-cart="updateCartItem"
      @place-order="placeOrder"
      @close-cart-tips="closeCartFullTips"
    />
    <!-- 点餐记录弹窗 -->
    <OrderHistoryDialog
      v-model="orderHistoryVisible"
      :items="orderHistoryItems"
      @call-waiter="callWaiter"
      :title="$t('common.orderHistory')"
    />

    <!-- 呼叫店员确认弹窗 -->
    <el-dialog
      v-model="callWaiterConfirmVisible"
      :title="$t('common.callWaiter')"
      width="400px"
      :show-close="false"
      center
    >
      <div class="call-waiter-confirm">
        <div class="confirm-icon">🔔</div>
        <div class="confirm-message">
          <h3>{{ $t('display.confirmCallWaiter') }}</h3>
          <p>{{ $t('display.waiterComing') }}</p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
        <el-button @click="cancelCallWaiter" size="large">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="confirmCallWaiter" size="large">
            {{ $t('display.confirmCall') }}
          </el-button>
        </div>
      </template>
    </el-dialog>


    <SettingDialog
        v-model="settingVisible"
        @belt-direction-changed="handleBeltDirectionChanged"
        @belt-speed-changed="handleBeltSpeedChanged"
    ></SettingDialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Refresh } from '@element-plus/icons-vue'

import MenuView from '@/views/customer/MenuView.vue'
import SushiNavigation from '@/components/menu/SushiNavigation.vue'
import OrderHistoryDialog from '@/components/order/OrderHistoryDialog.vue'
import ConveyorBeltContainer from '@/components/display/ConveyorBeltContainer.vue'
import ConveyorPlates from '@/components/display/ConveyorPlates.vue'
import TopPlateProgress from '@/components/display/TopPlateProgress.vue'
import CartPanel from '@/components/display/CartPanel.vue'
import CenterFunctionPanel from '@/components/display/CenterFunctionPanel.vue'
import { useCart } from '@/composables/useCart'
import { useOrderProgress } from '@/composables/useOrderProgress'
import { useConveyorBelt } from '@/composables/useConveyorBelt'
import { useVirtualPlates } from '@/composables/useVirtualPlates'
import { useConveyorLifecycle } from '@/composables/useConveyorLifecycle'
import SettingDialog from "@components/display/SettingDialog.vue";
import VirtualDiningAssistant from '@/components/display/VirtualDiningAssistant.vue'
import { menuApi } from '@/api/menu.js';
import { orderApi } from '@/api/order.js'
import { useI18n } from '@/i18n'
import { useGlobalStore } from '@/stores/global'
import {
  ASSISTANT_RECOMMENDATION_BATCH_SIZE,
  findAssistantRecommendations,
  getAssistantRecommendationBatch,
  parseAssistantCommand,
  planAssistantCartAdditions
} from '@/utils/assistantRecommendations'
import { ASSISTANT_AUDIO } from '@/utils/assistantAudio'

const { t } = useI18n()
const globalStore = useGlobalStore()

const shopId = Number(import.meta.env.VITE_SHOP_ID || 2)
const deskId = Number(import.meta.env.VITE_DESK_ID || 77)
const deskNumber = import.meta.env.VITE_DESK_NUMBER || 'Y1'
const deskPeople = Number(import.meta.env.VITE_DESK_PEOPLE || 2)


// 从服务器获取的传送带商品数据
const displaySushiData = ref([]);
const displayCategories = ref([])
const productsLoading = ref(false)
const productsError = ref('')
const submittingSide = ref(null)

// 小禾会话状态由父页面保存：组件只负责录音和播报，页面负责商品、购物车与订单业务。
const voiceSearchKeyword = ref('')
const assistantRecommendationBatchIndex = ref(0)
const voiceMatchCount = ref(null)
const assistantActionMessage = ref('')
const assistantFeedbackRevision = ref(0)
const assistantFeedbackAudioKey = ref('')
const assistantSelectedItemId = ref(null)
const assistantContinueListening = ref(false)
const assistantOrdering = ref(false)
let assistantFeedbackTimer = null

// 商品名同时作为 ASR 热词传给服务端；去重和数量上限避免启动报文过大。
const assistantHotwords = computed(() => [...new Set(displaySushiData.value
  .flatMap((item) => [item.name, item.storeName])
  .filter((name) => typeof name === 'string' && name.trim())
  .map((name) => name.trim()))]
  .slice(0, 100))

const findVoiceMatches = (items, transcript) => {
  return findAssistantRecommendations({
    items,
    categories: displayCategories.value,
    transcript
  })
}

const navigationItems = computed(() => displaySushiData.value)

// 推荐池保存完整排序结果，recommendations 只暴露当前最多六项的可见批次。
const assistantRecommendationPool = computed(() => {
  if (!voiceSearchKeyword.value) return []
  return findVoiceMatches(displaySushiData.value, voiceSearchKeyword.value)
})

const assistantRecommendationBatchCount = computed(() => Math.max(
  1,
  Math.ceil(assistantRecommendationPool.value.length / ASSISTANT_RECOMMENDATION_BATCH_SIZE)
))

const assistantRecommendations = computed(() => {
  return getAssistantRecommendationBatch(
    assistantRecommendationPool.value,
    assistantRecommendationBatchIndex.value
  )
})

/**
 * 发布一次业务反馈。revision 让相同文案也能触发子组件重新播报；定时清理只影响
 * 提示状态，不清除推荐池，因此用户在连续会话超时后仍可继续查看当前菜品。
 */
const setAssistantFeedback = (message, audioKey = '') => {
  assistantActionMessage.value = message
  assistantFeedbackAudioKey.value = audioKey
  assistantFeedbackRevision.value += 1
  if (assistantFeedbackTimer) clearTimeout(assistantFeedbackTimer)
  assistantFeedbackTimer = setTimeout(() => {
    assistantActionMessage.value = ''
    assistantFeedbackAudioKey.value = ''
    assistantSelectedItemId.value = null
    assistantFeedbackTimer = null
  }, 3600)
}

/** 关闭助手时清空完整语音上下文，避免下次开启沿用旧批次或旧高亮。 */
const resetVoiceSearch = () => {
  voiceSearchKeyword.value = ''
  assistantRecommendationBatchIndex.value = 0
  voiceMatchCount.value = null
  assistantActionMessage.value = ''
  assistantFeedbackAudioKey.value = ''
  assistantSelectedItemId.value = null
  assistantContinueListening.value = false
}

watch(() => globalStore.voiceAssistantEnabled, (enabled) => {
  if (!enabled) resetVoiceSearch()
})

/**
 * 语音命令的页面级分派入口。
 * 解析器只返回无副作用的命令对象；本函数再结合当前推荐批次、购物车和下单状态
 * 做上下文校验，确保序号不会引用已经换掉的推荐列表。
 */
const handleVoiceTranscript = (text) => {
  const query = String(text || '').trim()
  if (!query || assistantOrdering.value) return

  const command = parseAssistantCommand({
    transcript: query,
    recommendations: assistantRecommendations.value,
    items: displaySushiData.value
  })

  if (command.type === 'order_all') {
    void placeAllAssistantOrders()
    return
  }

  if (command.type === 'end_session') {
    assistantContinueListening.value = false
    setAssistantFeedback(t('assistant.sessionEnded'), ASSISTANT_AUDIO.SESSION_ENDED)
    return
  }

  if (command.type === 'next_batch') {
    if (!assistantRecommendationPool.value.length) {
      assistantContinueListening.value = true
      setAssistantFeedback(t('assistant.recommendationContextMissing'), ASSISTANT_AUDIO.SELECTION_INVALID)
      return
    }

    if (assistantRecommendationBatchCount.value <= 1) {
      assistantContinueListening.value = true
      setAssistantFeedback(t('assistant.recommendationSingleBatch'), ASSISTANT_AUDIO.SINGLE_BATCH)
      return
    }

    const nextIndex = (assistantRecommendationBatchIndex.value + 1)
      % assistantRecommendationBatchCount.value
    assistantRecommendationBatchIndex.value = nextIndex
    assistantSelectedItemId.value = null
    assistantContinueListening.value = true
    setAssistantFeedback(t(nextIndex === 0
      ? 'assistant.recommendationBatchRestarted'
      : 'assistant.recommendationBatchChanged', {
      count: assistantRecommendations.value.length
    }), nextIndex === 0 ? ASSISTANT_AUDIO.BATCH_RESTARTED : ASSISTANT_AUDIO.NEXT_BATCH)
    return
  }

  if (command.type === 'select_many') {
    if (!assistantRecommendations.value.length) {
      assistantContinueListening.value = true
      setAssistantFeedback(t('assistant.recommendationContextMissing'), ASSISTANT_AUDIO.SELECTION_INVALID)
      return
    }

    const missing = command.selections.filter((selection) => !selection.item)
    if (missing.length) {
      assistantContinueListening.value = true
      setAssistantFeedback(t('assistant.recommendationIndexesMissing', {
        numbers: missing.map((selection) => selection.index + 1).join('、')
      }), ASSISTANT_AUDIO.SELECTION_INVALID)
      return
    }

    addAssistantItems(command.selections)
    return
  }

  if (command.type === 'select') {
    if (command.source === 'ordinal' && !assistantRecommendations.value.length) {
      assistantContinueListening.value = true
      setAssistantFeedback(t('assistant.recommendationContextMissing'), ASSISTANT_AUDIO.SELECTION_INVALID)
      return
    }
    if (!command.item) {
      assistantContinueListening.value = true
      setAssistantFeedback(t('assistant.recommendationIndexMissing', {
        number: (command.index ?? 0) + 1
      }), ASSISTANT_AUDIO.SELECTION_INVALID)
      return
    }

    addAssistantItem(command.item, command.quantity)
    return
  }

  const matches = findVoiceMatches(displaySushiData.value, query)
  voiceMatchCount.value = matches.length

  if (!matches.length) {
    assistantContinueListening.value = true
    const message = t('assistant.noMatches', { query })
    setAssistantFeedback(message, ASSISTANT_AUDIO.NO_MATCH)
    ElMessage.info(message)
    return
  }

  voiceSearchKeyword.value = query
  assistantRecommendationBatchIndex.value = 0
  assistantContinueListening.value = true
  setAssistantFeedback(t(matches.length > ASSISTANT_RECOMMENDATION_BATCH_SIZE
    ? 'assistant.recommendationReadyPaged'
    : 'assistant.recommendationReady', {
    count: Math.min(matches.length, ASSISTANT_RECOMMENDATION_BATCH_SIZE),
    total: matches.length
  }), matches.length > ASSISTANT_RECOMMENDATION_BATCH_SIZE
    ? ASSISTANT_AUDIO.RESULTS_PAGED
    : ASSISTANT_AUDIO.RESULTS_READY)

}

/**
 * 原子执行一条或多条语音加购指令。
 * 先用 planAssistantCartAdditions 对两侧购物车做完整容量规划；只有整批都能放下时
 * 才逐项调用既有 addToCart，从而避免“第一件成功、第二件失败”的半完成状态。
 */
const addAssistantItems = (selections) => {
  const normalizedSelections = selections.map((selection) => ({
    ...selection,
    quantity: Math.min(4, Math.max(1, Number(selection.quantity) || 1))
  }))
  const requestedQuantity = normalizedSelections
    .reduce((total, selection) => total + selection.quantity, 0)
  const totalRemaining = (4 - getCartCount('left')) + (4 - getCartCount('right'))
  const additions = planAssistantCartAdditions({
    selections: normalizedSelections,
    carts: { left: cartOf('left'), right: cartOf('right') }
  })

  if (!additions) {
    assistantContinueListening.value = true
    setAssistantFeedback(t(totalRemaining === 0 ? 'assistant.cartFull' : 'assistant.batchNotEnoughSpace', {
      quantity: requestedQuantity,
      remaining: totalRemaining
    }), totalRemaining === 0
      ? ASSISTANT_AUDIO.CART_FULL
      : ASSISTANT_AUDIO.CART_SPACE_INSUFFICIENT)
    return false
  }

  for (const addition of additions) {
    const result = addToCart(addition.item, addition.side)
    if (!result?.ok) {
      assistantContinueListening.value = true
      setAssistantFeedback(t('assistant.addFailed'), ASSISTANT_AUDIO.ADD_FAILED)
      return false
    }
  }

  const lastSelection = normalizedSelections.at(-1)
  assistantSelectedItemId.value = lastSelection.item.id
  assistantContinueListening.value = true
  if (normalizedSelections.length === 1) {
    const [selection] = normalizedSelections
    const sides = [...new Set(additions.map((addition) => addition.side))]
    const sideLabel = sides.length === 1
      ? t(sides[0] === 'left' ? 'assistant.leftSide' : 'assistant.rightSide')
      : t('assistant.bothSides')
    setAssistantFeedback(t(selection.quantity > 1
      ? 'assistant.addedQuantityToCart'
      : 'assistant.addedToCart', {
      name: selection.item.name || selection.item.storeName,
      side: sideLabel,
      quantity: selection.quantity
    }), ASSISTANT_AUDIO.ADDED)
  } else {
    setAssistantFeedback(t('assistant.addedMultipleToCart', {
      count: normalizedSelections.length,
      quantity: requestedQuantity
    }), ASSISTANT_AUDIO.ADDED)
  }
  return true
}

const addAssistantItem = (item, quantity = 1) => addAssistantItems([{ item, quantity }])

const handleAssistantRecommendationSelect = (item) => addAssistantItem(item, 1)

// 从服务器获取商品数据
const fetchSushiData = async () => {
  productsLoading.value = true
  productsError.value = ''
  try {
    const [productsResult, categoriesResult] = await Promise.allSettled([
      menuApi.getProducts({ shopId, pageNo: 1, pageSize: 100 }),
      menuApi.getCategory(shopId)
    ])

    if (productsResult.status !== 'fulfilled') throw productsResult.reason

    const productsResponse = productsResult.value
    if (productsResponse.code === 0 && Array.isArray(productsResponse.data?.list)) {
      displaySushiData.value = productsResponse.data.list
    } else {
      throw new Error(t('errors.fetchProducts'))
    }

    if (categoriesResult.status === 'fulfilled' && categoriesResult.value.code === 0 && Array.isArray(categoriesResult.value.data)) {
      displayCategories.value = categoriesResult.value.data
    } else {
      displayCategories.value = []
      console.warn('获取商品分类失败，全局导航将使用商品分类编号:', categoriesResult.reason || categoriesResult.value)
    }
  } catch (error) {
    console.error('获取商品数据异常:', error);
    displaySushiData.value = []
    displayCategories.value = []
    productsError.value = t('errors.fetchProducts')
  } finally {
    productsLoading.value = false
  }
}

// 响应式数据（改用组合式函数统一管理购物车与进度）
const { leftCart, rightCart, cartOf, countOf, add, remove, increase, decrease, clear } = useCart()
const { plateProgress, applyOrder, resetLater } = useOrderProgress()
// const currentPlates = ref(2) // 暂未使用
// const selectedSushi = ref(null) // 暂未使用
const menuVisibility = ref({ left: false, right: false });
const showSushiNavigation = ref(false)
const settingVisible = ref(false)

// 购物车提示状态管理
const leftCartTipsType = ref('')
const rightCartTipsType = ref('')

// 记录每侧购物车的上一次商品数量，用于判断是否刚刚变满
const leftPrevCount = ref(0)
const rightPrevCount = ref(0)

// 检查购物车是否刚刚变满（从<4变成>=4）
const checkCartFull = () => {
  const leftCount = getCartCount('left')
  const rightCount = getCartCount('right')

  // 左侧：只有从<4变成>=4时才显示out_meal提示
  if (leftCount >= 4 && leftPrevCount.value < 4 && leftCartTipsType.value === '') {
    leftCartTipsType.value = 'out_meal'
  }

  // 右侧：只有从<4变成>=4时才显示out_meal提示
  if (rightCount >= 4 && rightPrevCount.value < 4 && rightCartTipsType.value === '') {
    rightCartTipsType.value = 'out_meal'
  }

  // 更新上一次的数量记录
  leftPrevCount.value = leftCount
  rightPrevCount.value = rightCount
}

// 关闭购物车满的提示
const closeCartFullTips = (side) => {
  if (side === 'left') {
    leftCartTipsType.value = ''
  } else {
    rightCartTipsType.value = ''
  }
}


// 传送带相关
const beltTrack = ref(null)
const beltItems = ref(null)
// 由 useConveyorBelt 提供：displayOffset / isDragging / isMomentum / dragState

// 传送带设置状态
const beltDirection = ref('left') // 'left' 或 'right'
const beltSpeed = ref(1) // 速度

// 传送带配置 - 支持动态方向和速度
const beltConfig = computed(() => ({
  itemWidth: 380,
  autoSpeed: beltSpeed.value * (beltDirection.value === 'left' ? 1 : -1), // 根据方向调整速度符号
  maxVelocity: 15,
  decay: 0.95,
  minVelocity: 0.1,
  dragThreshold: 15,
  maxDragDistance: 50,
  longPressDelay: 600
}))

// 初始化传送带（组合式） - 使用响应式配置
const belt = useConveyorBelt({
  beltConfig: beltConfig.value,
  onUpdate: () => {}
})
const { displayOffset, isDragging, isMomentum, dragState, startDrag, updateConfig } = belt

// 动画控制由 useConveyorBelt 内部 rAF 管理

// 虚拟滚动：改用组合式函数封装，增大缓冲区以确保能看到所有菜品
const { virtualScrollState, displayItems } = useVirtualPlates({
  data: displaySushiData,
  displayOffset,
  itemWidth: 300,
  gap: 130,
  buffer: 15  // 增大缓冲区确保能展示更多菜品
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
  if (!item.available) {
    ElMessage.warning(t('common.soldOut'))
    return
  }
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

const handleNavigationAddToCart = (item, side) => {
  if (!item.available) {
    ElMessage.warning(t('common.soldOut'))
    return
  }
  addToCart(item, side === 'left' ? 'left' : 'right')
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
  // 取消所有购物车操作的提醒，保持界面简洁
  if (result.ok) {
    // 静默添加成功
    // 检查购物车是否刚刚变满
    checkCartFull()
  } else if (result.reason === 'full') {
    // 只有在尝试添加但失败时，才显示out_meal提示
    if (side === 'left') {
      leftCartTipsType.value = 'out_meal'
    } else {
      rightCartTipsType.value = 'out_meal'
    }
  } else if (result.reason === 'max_quantity') {
    // 静默处理数量超限
  }
  return result
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
  orderHistoryItems.value = [...orderHistory.value]
  orderHistoryVisible.value = true
}

const placeOrder = async (side, options = {}) => {
  const { notify = true, allowWhileAssistantOrdering = false } = options
  if (submittingSide.value || (assistantOrdering.value && !allowWhileAssistantOrdering)) {
    return { status: 'busy' }
  }

  const cart = cartOf(side)
  const cartItems = cart.filter(item => item !== null)
  if (cartItems.length === 0) {
    // 静默处理空购物车，不显示提醒
    return { status: 'empty' }
  }

  const invalidItem = cartItems.find(item => !Number.isFinite(Number(item.id)) || !item.sku)
  if (invalidItem) {
    if (notify) {
      ElMessage.error(t('cart.incompleteItem', {
        name: invalidItem.name || invalidItem.storeName || t('common.unknown')
      }))
    }
    return { status: 'invalid', item: invalidItem }
  }

  const orderItems = cartItems.map(item => ({
    ...item,
    quantity: Number(item.quantity) || 1
  }))
  submittingSide.value = side

  try {
    const shopResponse = await orderApi.getShop({ shopId, deskId })
    const activeOrderId = shopResponse.data?.deskOrderId || ''
    if (shopResponse.data?.isEmpty) {
      await orderApi.openDesk({ shopId, deskId, people: deskPeople })
    }

    await orderApi.syncCart({
      shopId,
      deskId,
      content: orderItems.map(item => ({
        id: Number(item.id),
        cate_id: Number(item.categoryId ?? item.cateId),
        name: item.name || item.storeName,
        price: Number(item.price),
        number: item.quantity,
        image: item.image || '',
        valueStr: item.sku
      }))
    })

    const response = await orderApi.create({
      shopId: String(shopId),
      deskId,
      deskNumber,
      deskPeople,
      orderType: 'desk',
      productId: orderItems.map(item => String(item.id)),
      spec: orderItems.map(item => item.sku),
      number: orderItems.map(item => String(item.quantity)),
      payType: 'offline',
      remark: '',
      couponId: '',
      orderId: activeOrderId,
      gettime: 0,
      uidType: 'user',
      isAdmin: false
    })

    const backendOrderId = response.data?.orderId || ''

    const orderTime = new Date().toLocaleString('zh-CN')
    const newOrderItems = orderItems.map(item => ({
      ...item,
      name: item.name || item.storeName || item.productName || t('common.unknown'),
      category: item.category || item.categoryName || '',
      price: Number(item.price) || 0,
      orderTime,
      orderId: backendOrderId
    }))

    orderHistory.value.push(...newOrderItems)

    const { reachedReward } = applyOrder(orderItems)

    clear(side)

  // 更新计数器，购物车已清空
    if (side === 'left') {
      leftPrevCount.value = 0
    } else {
      rightPrevCount.value = 0
    }

  // 显示感谢点餐图片 (覆盖可能存在的out_meal提示)
    if (side === 'left') {
      leftCartTipsType.value = 'order_meal'
    } else {
      rightCartTipsType.value = 'order_meal'
    }

  // 3秒后恢复原状态
    setTimeout(() => {
      if (side === 'left') {
        leftCartTipsType.value = ''
      } else {
        rightCartTipsType.value = ''
      }
    }, 3000)

  // 静默处理扭蛋奖励（不显示提醒）
    if (reachedReward) {
      resetLater(2000)
    }

    if (notify) ElMessage.success(t('display.orderSubmitted', { orderId: backendOrderId }))
    return { status: 'success', orderId: backendOrderId }
  } catch (error) {
    console.error('提交订单失败:', error)
    if (notify) ElMessage.error(t('display.orderFailed'))
    return { status: 'failed', error }
  } finally {
    submittingSide.value = null
  }
}

/**
 * 按左、右顺序提交所有非空购物车。
 * 后端接口一次只接受一侧购物车，因此这里串行调用 placeOrder，避免共享桌台订单
 * 初始化和 submittingSide 状态产生竞争；任一侧失败都会保留失败提示供用户重试。
 */
const placeAllAssistantOrders = async () => {
  if (assistantOrdering.value) return
  if (submittingSide.value) {
    assistantContinueListening.value = true
    setAssistantFeedback(t('assistant.orderSubmitting'), ASSISTANT_AUDIO.ORDER_SUBMITTING)
    return
  }

  const sides = ['left', 'right'].filter((side) => cartOf(side).some((item) => item !== null))
  assistantSelectedItemId.value = null

  if (!sides.length) {
    assistantContinueListening.value = true
    setAssistantFeedback(t('assistant.orderEmpty'), ASSISTANT_AUDIO.ORDER_EMPTY)
    return
  }

  assistantOrdering.value = true
  assistantContinueListening.value = false
  setAssistantFeedback(t('assistant.orderSubmitting'), ASSISTANT_AUDIO.ORDER_SUBMITTING)

  const results = []
  try {
    for (const side of sides) {
      results.push(await placeOrder(side, {
        notify: false,
        allowWhileAssistantOrdering: true
      }))
    }
  } finally {
    assistantOrdering.value = false
  }

  const allSucceeded = results.every((result) => result.status === 'success')
  assistantContinueListening.value = !allSucceeded
  setAssistantFeedback(
    t(allSucceeded ? 'assistant.orderSuccess' : 'assistant.orderFailed'),
    allSucceeded ? ASSISTANT_AUDIO.ORDER_SUCCESS : ASSISTANT_AUDIO.ORDER_FAILED
  )
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
  ElMessage.info(t('display.waiterCalled'))
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
    // 尝试增加数量但已达上限，显示out_meal提示
    if (side === 'left') {
      leftCartTipsType.value = 'out_meal'
    } else {
      rightCartTipsType.value = 'out_meal'
    }
  } else if (result.ok) {
    // 成功增加数量，检查是否刚刚达到满载
    checkCartFull()
  }
}

// 减少商品数量
const decreaseQuantity = (side, index) => {
  decrease(side, index)

  // 检查购物车状态，如果不再满4个就清除out_meal提示
  setTimeout(() => {
    const leftCount = getCartCount('left')
    const rightCount = getCartCount('right')

    if (leftCount < 4 && leftCartTipsType.value === 'out_meal') {
      leftCartTipsType.value = ''
    }
    if (rightCount < 4 && rightCartTipsType.value === 'out_meal') {
      rightCartTipsType.value = ''
    }

    // 更新计数器
    leftPrevCount.value = leftCount
    rightPrevCount.value = rightCount
  }, 0) // 使用setTimeout确保DOM更新后再检查
}

// 更新购物车商品数量 - 供寿司导航组件调用
const updateCartItem = (side, index, action) => {
  if (action === 'increase') {
    const result = increase(side, index)
    if (!result.ok && result.reason === 'max_quantity') {
      // 尝试增加数量但已达上限，显示out_meal提示
      if (side === 'left') {
        leftCartTipsType.value = 'out_meal'
      } else {
        rightCartTipsType.value = 'out_meal'
      }
    } else if (result.ok) {
      // 成功增加数量，检查是否刚刚达到满载
      checkCartFull()
    }
  } else if (action === 'decrease') {
    decrease(side, index)
    // 减少数量后，更新计数器并检查是否需要清除提示
    setTimeout(() => {
      const leftCount = getCartCount('left')
      const rightCount = getCartCount('right')

      if (leftCount < 4 && leftCartTipsType.value === 'out_meal') {
        leftCartTipsType.value = ''
      }
      if (rightCount < 4 && rightCartTipsType.value === 'out_meal') {
        rightCartTipsType.value = ''
      }

      // 更新计数器
      leftPrevCount.value = leftCount
      rightPrevCount.value = rightCount
    }, 0)
  }
}

// 移除商品
const removeItem = (side, index) => {
  remove(side, index)

  // 移除商品后，更新计数器并检查是否需要清除提示
  setTimeout(() => {
    const leftCount = getCartCount('left')
    const rightCount = getCartCount('right')

    if (leftCount < 4 && leftCartTipsType.value === 'out_meal') {
      leftCartTipsType.value = ''
    }
    if (rightCount < 4 && rightCartTipsType.value === 'out_meal') {
      rightCartTipsType.value = ''
    }

    // 更新计数器
    leftPrevCount.value = leftCount
    rightPrevCount.value = rightCount
  }, 0)
}

// 获取购物车商品数量（按总数量计算）
const getCartCount = (side) => {
  return countOf(side)  // 恢复原来的总数量计算逻辑
}

// 传送带设置处理函数
const handleBeltDirectionChanged = (direction) => {
  beltDirection.value = direction
  // 更新传送带配置
  if (updateConfig) {
    updateConfig(beltConfig.value)
  }
}

const handleBeltSpeedChanged = (speed) => {
  beltSpeed.value = speed
  // 更新传送带配置
  if (updateConfig) {
    updateConfig(beltConfig.value)
    // 速度变化不需要重启，只需要更新配置
  }
}

// 初始化传送带设置
const initBeltSettings = () => {
  // 从本地存储加载传送带方向设置
  const savedDirection = localStorage.getItem('beltDirection')
  if (savedDirection && ['left', 'right'].includes(savedDirection)) {
    beltDirection.value = savedDirection
  }

  // 从本地存储加载传送带速度设置
  const savedSpeed = localStorage.getItem('beltSpeed')
  if (savedSpeed) {
    const speed = parseFloat(savedSpeed)
    if (speed >= 0.2 && speed <= 3) {
      beltSpeed.value = speed
    }
  }

  // 立即应用设置到传送带配置
  if (updateConfig) {
    updateConfig(beltConfig.value)
  }
}

// 生命周期：改用组合式函数封装
useConveyorLifecycle({ beltTrackRef: beltTrack, virtualScrollState, belt })

// 组件挂载时初始化设置
onMounted(async () => {
  initBeltSettings()

  // 初始化计数器
  leftPrevCount.value = getCartCount('left')
  rightPrevCount.value = getCartCount('right')

  // 从服务器获取传送带商品数据
  await fetchSushiData();
})

// 监听传送带配置变化
watch(beltConfig, (newConfig) => {
  if (updateConfig) {
    updateConfig(newConfig)
  }
}, { deep: true })

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
  if (assistantFeedbackTimer) clearTimeout(assistantFeedbackTimer)
})
</script>

<style lang="scss" scoped>
@use '@/styles/conveyor-belt.scss';

.product-state {
  position: absolute;
  inset: 18px 24px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #4a433b;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(74, 67, 59, 0.18);
  border-radius: 8px;

  p {
    margin: 0;
    font-size: 16px;
  }
}

.product-state-icon {
  font-size: 34px;
}

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
