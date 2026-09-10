<template>
  <div
    class="conveyor-display"
    :class="{
      'is-scene-changing': sceneTransitionBusy,
      'is-scene-revealing': sceneTransitionPhase === 'revealing',
      'is-midnight-station': activeSceneKey === 'midnight-station'
    }"
  >
    <!-- 顶部工作区：单条主题横幅三区（品牌 / 投碟进度 / 小禾），背景透明透出页面背景。 -->
    <div class="top-section">
      <div class="top-scene-banner">
        <div class="brand-lockup">
          <span class="brand-kicker">AI DINING TABLE</span>
          <strong>{{ $t('menu.brand') }}</strong>
          <span class="brand-table">TABLE {{ deskNumber }} · {{ deskPeople }} SEATS</span>
        </div>

        <div class="top-progress">
          <TopPlateProgress
            :progress="plateProgress"
            :formatted="formattedProgress"
            :theme-key="activeSceneKey"
          />
        </div>

        <div v-if="globalStore.voiceAssistantEnabled" class="assistant-slot">
          <VirtualDiningAssistant
            :hotwords="assistantHotwords"
            :match-count="voiceMatchCount"
            :recommendations="assistantRecommendations"
            :feedback-message="assistantActionMessage"
            :feedback-revision="assistantFeedbackRevision"
            :feedback-audio-key="assistantFeedbackAudioKey"
            :selected-item-id="assistantSelectedItemId"
            :theme-key="activeSceneKey"
            :sound-enabled="globalStore.ttsEnabled"
            :volume="globalStore.assistantVolume"
            :continue-listening="assistantContinueListening"
            :action-busy="assistantOrdering"
            :watching-promo="featuredPromoVisible"
            @transcript="handleVoiceTranscript"
            @select-recommendation="handleAssistantRecommendationSelect"
            @interrupt-promo="closeFeaturedPromo"
          />
        </div>
      </div>
    </div>

    <!-- 主题舞台：浏览、左右加购和语音推荐继续使用原有业务链路。 -->
    <div class="middle-section">
      <ScenicDishStage
        :scene-key="activeSceneKey"
        :entry-revision="sceneRevision"
        :items="displaySushiData"
        :categories="displayCategories"
        :recommendations="assistantRecommendations"
        :selected-item-id="assistantSelectedItemId"
        :direction="beltDirection"
        :speed="beltSpeed"
        :paused="assistantStreamPaused || gameModePaused"
        @dish-click="handleSushiClick"
        @paused-change="assistantStreamPaused = $event"
        @featured-promo="handleFeaturedPromo"
      />
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

      <!-- 招牌菜介绍吊屏：只覆盖舞台区，播完一次自动收回 -->
    <FeaturedDishScreen
      :item="featuredPromoItem"
      :visible="featuredPromoVisible"
      :theme-key="activeSceneKey"
      @close="closeFeaturedPromo"
    />

      <StationCartTransfer
        v-if="activeSceneKey === 'midnight-station'"
        ref="stationCartTransferRef"
        :theme-key="activeSceneKey"
      />
    </div>

    <!-- 底部功能区 -->
    <div class="bottom-section">
      <!-- 左侧菜品选择区 -->
      <div class="bottom-left">
          <CartPanel
            side="left"
            :theme-key="activeSceneKey"
            :items="leftCart"
            :count="getCartCount('left')"
            :tips-type="leftCartTipsType"
            :submitting="submittingSide === 'left'"
            :order-feedback="orderFeedback.left"
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
        :theme-key="activeSceneKey"
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
          :theme-key="activeSceneKey"
          :items="rightCart"
          :count="getCartCount('right')"
          :tips-type="rightCartTipsType"
          :submitting="submittingSide === 'right'"
          :order-feedback="orderFeedback.right"
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
      :theme-key="activeSceneKey"
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
      :theme-key="activeSceneKey"
      @call-waiter="callWaiter"
      :title="$t('common.orderHistory')"
    />

    <!-- 呼叫店员确认弹窗 -->
    <el-dialog
      v-model="callWaiterConfirmVisible"
      class="call-waiter-dialog"
      :class="{ 'is-midnight-station': activeSceneKey === 'midnight-station' }"
      :title="$t('common.callWaiter')"
      width="400px"
      :show-close="false"
      center
    >
      <div class="call-waiter-confirm">
        <el-icon class="confirm-icon" aria-hidden="true"><Bell /></el-icon>
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
        :default-theme-key="activeSceneKey"
        :theme-changing="sceneTransitionBusy"
        @theme-changed="handleThemeChange"
        @belt-direction-changed="handleBeltDirectionChanged"
        @belt-speed-changed="handleBeltSpeedChanged"
    ></SettingDialog>

    <SceneTransitionOverlay
      :phase="sceneTransitionPhase"
      :scene-key="pendingSceneKey || activeSceneKey"
    />

    <GameInvitationFlow
      ref="gameFlowRef"
      @blocking-change="gameModePaused = $event"
    />

  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, Loading, Refresh } from '@element-plus/icons-vue'

import MenuView from '@/views/customer/MenuView.vue'
import SushiNavigation from '@/components/menu/SushiNavigation.vue'
import OrderHistoryDialog from '@/components/order/OrderHistoryDialog.vue'
import ScenicDishStage from '@/components/display/ScenicDishStage.vue'
import SceneTransitionOverlay from '@/components/display/SceneTransitionOverlay.vue'
import FeaturedDishScreen from '@/components/display/FeaturedDishScreen.vue'
import StationCartTransfer from '@/components/display/midnight/StationCartTransfer.vue'
import GameInvitationFlow from '@/components/display/GameInvitationFlow.vue'
import TopPlateProgress from '@/components/display/TopPlateProgress.vue'
import CartPanel from '@/components/display/CartPanel.vue'
import CenterFunctionPanel from '@/components/display/CenterFunctionPanel.vue'
import { useCart } from '@/composables/useCart'
import { useOrderProgress } from '@/composables/useOrderProgress'
import SettingDialog from "@components/display/SettingDialog.vue";
import VirtualDiningAssistant from '@/components/display/VirtualDiningAssistant.vue'
import { menuApi } from '@/api/menu.js';
import { orderApi } from '@/api/order.js'
import { useI18n } from '@/i18n'
import { useGlobalStore } from '@/stores/global'
import {
  ASSISTANT_RECOMMENDATION_BATCH_SIZE,
  findAssistantRecommendations,
  findAssistantPresetRecommendations,
  getAssistantRecommendationBatch,
  parseAssistantCommand,
  planAssistantCartAdditions
} from '@/utils/assistantRecommendations'
import { ASSISTANT_AUDIO } from '@/utils/assistantAudio'
import { findPromoForItem } from '@/config/promoContent'

const { t } = useI18n()
const globalStore = useGlobalStore()

const SCENES = {
  zhenxian: {
    background: '/images/ui/b/background.png',
    assets: [
      '/images/ui/b/background.png',
      '/images/ui/b/bar.png',
      '/images/ui/b/bar1.png',
      '/images/ui/b/bar2.png',
      '/images/ui/b/shinchan-boat-guidenew-transparent.png',
      '/images/ui/b/shell-dish-tray.png',
      '/images/ui/b/transition/shinchan-red-redrawn.png',
      '/images/ui/b/transition/shinchan-shark-redrawn.png',
      '/images/ui/b/transition/shinchan-group-redrawn.png',
      '/images/ui/b/transition/shinchan-beach-redrawn.png'
    ]
  },
  xiaoxin: {
    background: '/images/ui/c/background.png',
    assets: [
      '/images/ui/c/background.png',
      '/images/ui/c/bar.png',
      '/images/ui/c/bar1.png',
      '/images/ui/c/bar2.png',
      '/images/ui/c/sea-turtle-coral-tray-two.png',
      '/images/ui/c/turtle-layered/trayCropnew-transparent.png',
      '/images/ui/c/turtle-layered/shellCrop.png',
      '/images/ui/c/turtle-layered/bodyCrop.png',
      '/images/ui/c/turtle-layered/headStaticCrop.png',
      '/images/ui/c/turtle-layered/finFrontLeftCrop.png',
      '/images/ui/c/turtle-layered/finFrontRightCrop.png',
      '/images/ui/c/turtle-layered/finRearLeftCrop.png',
      '/images/ui/c/turtle-layered/finRearRightCrop.png',
      '/images/ui/c/turtle-layered/splashGenerated.png',
      '/images/ui/b/shell-dish-tray.png',
      '/images/ui/c/transition/ocean-animals.png'
    ]
  },
  'midnight-station': {
    // Phase 01 intentionally uses a CSS/SVG-ready scene with no placeholder
    // raster background. Later art can be added without changing the theme
    // contract or the scene switch flow.
    background: '',
    assets: []
  }
}
const FALLBACK_SCENE_KEY = 'zhenxian'
const getInitialSceneKey = () => {
  const savedTheme = localStorage.getItem('selectedThemeKey')
  return SCENES[savedTheme] ? savedTheme : FALLBACK_SCENE_KEY
}
const activeSceneKey = ref(getInitialSceneKey())
const pendingSceneKey = ref('')
const sceneTransitionPhase = ref('idle')
const sceneRevision = ref(0)
const sceneTransitionBusy = computed(() => sceneTransitionPhase.value !== 'idle')
let sceneTransitionRun = 0

const applySceneTheme = (sceneKey) => {
  const scene = SCENES[sceneKey] || SCENES[FALLBACK_SCENE_KEY]
  document.documentElement.style.setProperty('--theme-key', sceneKey)
  document.documentElement.style.setProperty('--theme-bg', scene.background ? `url(${scene.background})` : 'none')
  document.documentElement.setAttribute('data-theme', sceneKey)
  localStorage.setItem('selectedThemeKey', sceneKey)
}

applySceneTheme(activeSceneKey.value)

const waitForSceneFrame = (duration) => new Promise((resolve) => {
  window.setTimeout(resolve, duration)
})

const preloadImage = (src) => new Promise((resolve) => {
  if (!src) {
    resolve()
    return
  }
  const image = new Image()
  const finish = () => resolve()
  image.onload = finish
  image.onerror = finish
  image.src = src
  if (image.complete) finish()
})

const preloadScene = async (sceneKey) => {
  const scene = SCENES[sceneKey]
  if (!scene) return
  const dishAssets = displaySushiData.value
    .slice(0, 8)
    .map(item => item?.image || item?.imageUrl)
    .filter(Boolean)
  const loading = Promise.allSettled([...new Set([...scene.assets, ...dishAssets])].map(preloadImage))
  await Promise.race([loading, waitForSceneFrame(2400)])
}

const handleThemeChange = async (theme) => {
  const nextSceneKey = theme?.key
  if (!SCENES[nextSceneKey] || sceneTransitionBusy.value) return
  settingVisible.value = false
  // 场景转场前先收回吊屏，避免全屏幕布动画与吊屏动画叠在一起。
  closeFeaturedPromo()
  if (nextSceneKey === activeSceneKey.value) return

  const run = ++sceneTransitionRun
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
  pendingSceneKey.value = nextSceneKey
  sceneTransitionPhase.value = 'covering'
  await waitForSceneFrame(reducedMotion ? 20 : 1700)
  if (run !== sceneTransitionRun) return

  sceneTransitionPhase.value = 'covered'
  await preloadScene(nextSceneKey)
  if (run !== sceneTransitionRun) return

  activeSceneKey.value = nextSceneKey
  applySceneTheme(nextSceneKey)
  sceneRevision.value += 1
  await nextTick()

  sceneTransitionPhase.value = 'revealing'
  await waitForSceneFrame(reducedMotion ? 40 : 1050)
  if (run !== sceneTransitionRun) return
  sceneTransitionPhase.value = 'idle'
  pendingSceneKey.value = ''
}

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
const lastAssistantOrderedItem = ref(null)
const pendingAssistantAction = ref(null)
const assistantRecommendationMode = ref('query')
const assistantStreamPaused = ref(false)
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
  if (assistantRecommendationMode.value !== 'query') {
    return findAssistantPresetRecommendations({
      items: displaySushiData.value,
      mode: assistantRecommendationMode.value
    })
  }
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
  lastAssistantOrderedItem.value = null
  pendingAssistantAction.value = null
  assistantRecommendationMode.value = 'query'
  if (callWaiterConfirmVisible.value) callWaiterConfirmVisible.value = false
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
  // A user voice command has priority over the passive promo video.
  if (featuredPromoVisible.value) closeFeaturedPromo()

  const command = parseAssistantCommand({
    transcript: query,
    recommendations: assistantRecommendations.value,
    items: displaySushiData.value
  })

  if (command.type === 'confirm_action') {
    const pendingAction = pendingAssistantAction.value
    if (!pendingAction) {
      assistantContinueListening.value = true
      setAssistantFeedback(t('assistant.noPendingAction'), ASSISTANT_AUDIO.SELECTION_INVALID)
      return
    }
    pendingAssistantAction.value = null
    if (pendingAction.type === 'order_all') {
      void placeAllAssistantOrders()
    } else if (pendingAction.type === 'call_waiter') {
      confirmCallWaiter({ assistant: true })
    }
    return
  }

  if (command.type === 'cancel_action' || (command.type === 'end_session' && pendingAssistantAction.value)) {
    const hadPendingAction = Boolean(pendingAssistantAction.value)
    pendingAssistantAction.value = null
    callWaiterConfirmVisible.value = false
    assistantContinueListening.value = true
    setAssistantFeedback(
      t(hadPendingAction ? 'assistant.actionCancelled' : 'assistant.noPendingAction'),
      hadPendingAction ? ASSISTANT_AUDIO.ACTION_CANCELLED : ASSISTANT_AUDIO.SELECTION_INVALID
    )
    return
  }

  if (command.type === 'order_all') {
    const hasItems = ['left', 'right'].some((side) => cartOf(side).some((item) => item !== null))
    if (!hasItems) {
      assistantContinueListening.value = true
      setAssistantFeedback(t('assistant.orderEmpty'), ASSISTANT_AUDIO.ORDER_EMPTY)
      return
    }
    pendingAssistantAction.value = { type: 'order_all' }
    assistantContinueListening.value = true
    setAssistantFeedback(t('assistant.orderConfirm'), ASSISTANT_AUDIO.ORDER_CONFIRM)
    return
  }

  if (command.type === 'request_waiter') {
    pendingAssistantAction.value = { type: 'call_waiter' }
    callWaiter()
    assistantContinueListening.value = true
    setAssistantFeedback(t('assistant.callWaiterConfirm'), ASSISTANT_AUDIO.CALL_WAITER_CONFIRM)
    return
  }

  if (command.type === 'open_menu' || command.type === 'open_navigation') {
    openNavigation()
    assistantContinueListening.value = true
    setAssistantFeedback(
      t(command.type === 'open_menu' ? 'assistant.menuOpened' : 'assistant.navigationOpened'),
      command.type === 'open_menu' ? ASSISTANT_AUDIO.OPEN_MENU : ASSISTANT_AUDIO.OPEN_NAVIGATION
    )
    return
  }

  if (command.type === 'open_side_menu') {
    menuVisibility.value[command.side] = true
    assistantContinueListening.value = true
    setAssistantFeedback(
      t(command.side === 'left' ? 'assistant.leftMenuOpened' : 'assistant.rightMenuOpened'),
      command.side === 'left' ? ASSISTANT_AUDIO.OPEN_LEFT_MENU : ASSISTANT_AUDIO.OPEN_RIGHT_MENU
    )
    return
  }

  if (command.type === 'open_history') {
    openOrderHistory()
    assistantContinueListening.value = true
    setAssistantFeedback(t('assistant.historyOpened'), ASSISTANT_AUDIO.OPEN_HISTORY)
    return
  }

  if (command.type === 'open_settings') {
    openSettings()
    assistantContinueListening.value = true
    setAssistantFeedback(t('assistant.settingsOpened'), ASSISTANT_AUDIO.OPEN_SETTINGS)
    return
  }

  if (command.type === 'stream_pause' || command.type === 'stream_resume') {
    assistantStreamPaused.value = command.type === 'stream_pause'
    assistantContinueListening.value = true
    setAssistantFeedback(
      t(command.type === 'stream_pause' ? 'assistant.streamPaused' : 'assistant.streamResumed'),
      command.type === 'stream_pause' ? ASSISTANT_AUDIO.STREAM_PAUSED : ASSISTANT_AUDIO.STREAM_RESUMED
    )
    return
  }

  if (command.type === 'stream_slower' || command.type === 'stream_faster') {
    const delta = command.type === 'stream_slower' ? -0.25 : 0.25
    beltSpeed.value = Math.min(3, Math.max(0.2, Number((beltSpeed.value + delta).toFixed(2))))
    localStorage.setItem('beltSpeed', beltSpeed.value.toString())
    assistantContinueListening.value = true
    setAssistantFeedback(
      t(command.type === 'stream_slower' ? 'assistant.streamSlower' : 'assistant.streamFaster'),
      command.type === 'stream_slower' ? ASSISTANT_AUDIO.STREAM_SLOWER : ASSISTANT_AUDIO.STREAM_FASTER
    )
    return
  }

  if (['recommend_popular', 'recommend_featured', 'recommend_combo'].includes(command.type)) {
    const modeByCommand = {
      recommend_popular: 'popular',
      recommend_featured: 'featured',
      recommend_combo: 'combo'
    }
    const feedbackByMode = {
      popular: ['assistant.popularIntro', ASSISTANT_AUDIO.POPULAR_INTRO],
      featured: ['assistant.featuredIntro', ASSISTANT_AUDIO.FEATURED_INTRO],
      combo: ['assistant.comboIntro', ASSISTANT_AUDIO.COMBO_INTRO]
    }
    const mode = modeByCommand[command.type]
    assistantRecommendationMode.value = mode
    voiceSearchKeyword.value = query
    assistantRecommendationBatchIndex.value = 0
    voiceMatchCount.value = assistantRecommendationPool.value.length
    assistantSelectedItemId.value = null
    assistantContinueListening.value = true
    if (!assistantRecommendationPool.value.length) {
      setAssistantFeedback(t('assistant.recommendationPresetEmpty'), ASSISTANT_AUDIO.RECOMMENDATION_EMPTY)
      return
    }
    const [messageKey, audioKey] = feedbackByMode[mode]
    setAssistantFeedback(t(messageKey, {
      count: Math.min(assistantRecommendationPool.value.length, ASSISTANT_RECOMMENDATION_BATCH_SIZE)
    }), audioKey)
    return
  }

  if (command.type === 'repeat_last') {
    if (!lastAssistantOrderedItem.value) {
      assistantContinueListening.value = true
      setAssistantFeedback(t('assistant.repeatContextMissing'), ASSISTANT_AUDIO.SELECTION_INVALID)
      return
    }

    addAssistantItem(lastAssistantOrderedItem.value, command.quantity)
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
    }), assistantRecommendationMode.value === 'query'
      ? (nextIndex === 0 ? ASSISTANT_AUDIO.BATCH_RESTARTED : ASSISTANT_AUDIO.NEXT_BATCH)
      : ASSISTANT_AUDIO.RECOMMENDATION_REPLACED)
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
  assistantRecommendationMode.value = 'query'
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
  lastAssistantOrderedItem.value = lastSelection.item
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
    }), sides.length > 1
      ? ASSISTANT_AUDIO.ADDED_BOTH
      : (sides[0] === 'left' ? ASSISTANT_AUDIO.ADDED_LEFT : ASSISTANT_AUDIO.ADDED_RIGHT))
  } else {
    const sides = [...new Set(additions.map((addition) => addition.side))]
    setAssistantFeedback(t('assistant.addedMultipleToCart', {
      count: normalizedSelections.length,
      quantity: requestedQuantity
    }), sides.length > 1
      ? ASSISTANT_AUDIO.ADDED_BOTH
      : (sides[0] === 'left' ? ASSISTANT_AUDIO.ADDED_LEFT : ASSISTANT_AUDIO.ADDED_RIGHT))
  }
  return true
}

const addAssistantItem = (item, quantity = 1) => addAssistantItems([{ item, quantity }])

const handleAssistantRecommendationSelect = (item) => {
  if (featuredPromoVisible.value) closeFeaturedPromo()
  addAssistantItem(item, 1)
}

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
const { plateProgress, applyOrder, reset: resetPlateProgress } = useOrderProgress()
// const currentPlates = ref(2) // 暂未使用
// const selectedSushi = ref(null) // 暂未使用
const menuVisibility = ref({ left: false, right: false });
const showSushiNavigation = ref(false)
const settingVisible = ref(false)
const gameFlowRef = ref(null)
const stationCartTransferRef = ref(null)
const gameModePaused = ref(false)

// 购物车提示状态管理
const leftCartTipsType = ref('')
const rightCartTipsType = ref('')
const orderFeedback = ref({ left: '', right: '' })
const orderFeedbackTimers = { left: 0, right: 0 }

const setOrderFeedback = (side, status) => {
  window.clearTimeout(orderFeedbackTimers[side])
  orderFeedback.value = { ...orderFeedback.value, [side]: status }
  if (!status) return
  orderFeedbackTimers[side] = window.setTimeout(() => {
    orderFeedback.value = { ...orderFeedback.value, [side]: '' }
  }, 760)
}

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


// 传送带设置状态
const beltDirection = ref('left') // 'left' 或 'right'
const beltSpeed = ref(1) // 速度


// 格式化进度显示
const formattedProgress = computed(() => {
  return `${Math.round(plateProgress.value)}%`;
})

// 寿司点击处理 - 直接添加到购物车
const handleSushiClick = (item, event) => {
  if (featuredPromoVisible.value) closeFeaturedPromo()
  if (item?.available === false || item?.status === 'OFF_SHELF') {
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
    addToCart(item, 'left', { sourceElement: event?.currentTarget?.closest?.('.tide-dish') || event?.target?.closest?.('.tide-dish') })
  } else {
    addToCart(item, 'right', { sourceElement: event?.currentTarget?.closest?.('.tide-dish') || event?.target?.closest?.('.tide-dish') })
  }
}

const handleNavigationAddToCart = (item, side) => {
  if (!item.available) {
    ElMessage.warning(t('common.soldOut'))
    return
  }
  addToCart(item, side === 'left' ? 'left' : 'right')
}

// 购物车操作
const addToCart = (item, side, uiMeta = {}) => {
  const result = add(item, side)
  // 取消所有购物车操作的提醒，保持界面简洁
  if (result.ok) {
    if (activeSceneKey.value === 'midnight-station') {
      stationCartTransferRef.value?.play({
        item,
        side: result.side || side,
        index: result.index,
        sourceElement: uiMeta.sourceElement || null,
        sourcePoint: uiMeta.sourcePoint || null
      })
    }
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

  // 投盘进度满一轮后发放一次游戏资格，再立即清零，下一轮可继续累计。
    if (reachedReward) {
      closeFeaturedPromo()
      gameFlowRef.value?.grantCredit()
      resetPlateProgress()
    }

    setOrderFeedback(side, 'success')
    if (notify) ElMessage.success(t('display.orderSubmitted', { orderId: backendOrderId }))
    return { status: 'success', orderId: backendOrderId }
  } catch (error) {
    console.error('提交订单失败:', error)
    setOrderFeedback(side, 'error')
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

// 招牌菜介绍吊屏：特殊事件第二位触发物点击后垂下，视频单次播放结束自动收回。
// 状态声明放在所有弹窗状态之后，watch 依赖才不会踩到 TDZ。
const featuredPromoItem = ref(null)
const featuredPromoVisible = ref(false)
let pendingFeaturedPromoItem = null

const openFeaturedPromo = (item) => {
  if (!item || !findPromoForItem(item)) return
  featuredPromoItem.value = item
  featuredPromoVisible.value = true
}

const handleFeaturedPromo = (item) => {
  // 小禾正在下单时先记住意图，订单落定后再垂下，避免播报互相打断。
  if (assistantOrdering.value) {
    pendingFeaturedPromoItem = item
    return
  }
  openFeaturedPromo(item)
}

const closeFeaturedPromo = () => {
  featuredPromoVisible.value = false
}

watch(assistantOrdering, (busy) => {
  if (busy || !pendingFeaturedPromoItem) return
  const item = pendingFeaturedPromoItem
  pendingFeaturedPromoItem = null
  openFeaturedPromo(item)
})

// 打开任意弹窗或侧边菜单时收起吊屏，避免视觉层级互相遮挡。
watch([
  showSushiNavigation,
  orderHistoryVisible,
  settingVisible,
  callWaiterConfirmVisible,
  () => menuVisibility.value.left,
  () => menuVisibility.value.right
], (values) => {
  if (values.some(Boolean)) closeFeaturedPromo()
})

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

const confirmCallWaiter = (options = {}) => {
  callWaiterConfirmVisible.value = false
  if (pendingAssistantAction.value?.type === 'call_waiter') pendingAssistantAction.value = null
  ElMessage.info(t('display.waiterCalled'))
  if (options?.assistant) {
    assistantContinueListening.value = true
    setAssistantFeedback(t('assistant.callWaiterSent'), ASSISTANT_AUDIO.CALL_WAITER_SENT)
  }
}

const cancelCallWaiter = () => {
  callWaiterConfirmVisible.value = false
  if (pendingAssistantAction.value?.type === 'call_waiter') pendingAssistantAction.value = null
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
}

const handleBeltSpeedChanged = (speed) => {
  beltSpeed.value = speed
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

}

// 组件挂载时初始化设置
onMounted(async () => {
  initBeltSettings()

  // 初始化计数器
  leftPrevCount.value = getCartCount('left')
  rightPrevCount.value = getCartCount('right')

  // 从服务器获取传送带商品数据
  await fetchSushiData();
})

// 监听菜品数据变化，自动重新计算
watch(() => displaySushiData.length, () => {
  // 菜品数据变化时，虚拟滚动会自动重新计算
  // 不需要重新创建大量副本，只需要重新渲染可见区域
  console.log('菜品数据已更新，虚拟滚动自动适配')
}, { immediate: true })

onUnmounted(() => {
  if (assistantFeedbackTimer) clearTimeout(assistantFeedbackTimer)
  window.clearTimeout(orderFeedbackTimers.left)
  window.clearTimeout(orderFeedbackTimers.right)
})
</script>

<style lang="scss" scoped>
@use '@/styles/conveyor-belt.scss';

/* Theme B keeps the 3840 x 1080 beach artwork visible and only floats the
   functional surfaces that need contrast. */
.conveyor-display {
  color: #173944;
  background-color: #61c5ef;
}

.top-section {
  position: relative;
  z-index: 50;
  height: 178px; /* 加高：给 126px 的小禾角色留出完整头部空间 */
  box-sizing: border-box;
  padding: 12px 24px 10px;
  display: flex;
  align-items: stretch;
}

/* 单条主题横幅：品牌 / 投碟进度 / 小禾 三区；背景透明，直接透出页面主题背景（无裁切、无错位） */
.top-scene-banner {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(270px, 0.72fr) minmax(330px, 1.08fr) minmax(460px, 1.2fr);
  gap: 6px;
  align-items: stretch;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  box-shadow: none;
}

/* 品牌区保留文字对比度，中间投盘区尽量透出页面主题背景。 */
.top-scene-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(95deg,
    rgba(6, 36, 50, 0) 0%,
    rgba(6, 36, 50, 0) 46%,
    rgba(6, 36, 50, 0) 100%);
  pointer-events: none;
  z-index: 0;
}

.brand-lockup {
  position: relative;
  z-index: 1;
  min-width: 0;
  display: grid;
  gap: 3px;
  align-content: center;
  padding: 10px 20px;
}

.brand-kicker {
  color: #f4d28b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-shadow: 0 1px 3px rgba(4, 26, 35, 0.5);
}

.brand-lockup strong {
  color: #fff8e8;
  font-size: 30px;
  line-height: 1;
  text-shadow: 0 2px 6px rgba(4, 26, 35, 0.6);
}

.brand-table {
  color: rgba(255, 248, 232, 0.86);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 3px rgba(4, 26, 35, 0.45);
}

/* 投碟进度完全使用主题图片，由组件按真实百分比裁切 bar2.png。 */
.top-progress {
  position: absolute;
  top: 8px;
  left: 50%;
  z-index: 4;
  width: min(941px, calc(100vw - 40px));
  min-width: 0;
  display: flex;
  justify-content: center;
  padding: 0;
  transform: translateX(-50%);
  pointer-events: none;
}

.top-progress :deep(.plate-progress) {
  width: 100%;
}

.assistant-slot {
  position: relative;
  z-index: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 0 14px 2px 8px;
  grid-column: 3;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: none;
}

.assistant-slot :deep(.assistant-recommendation-rail) {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 6px;
  flex: 1 1 auto;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 230px);
  background: transparent;
  border: 0;
  box-shadow: none;
}

.assistant-slot :deep(.assistant-recommendation-rail:not(.has-recommendations)) {
  grid-template-columns: minmax(0, 1fr) 270px;
}

.assistant-slot :deep(.assistant-recommendation-rail.has-recommendations) {
  width: 100%;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 230px);
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.assistant-slot :deep(.recommendation-list) { grid-auto-columns: 150px; gap: 8px; }
.assistant-slot :deep(.recommendation-card) {
  width: 150px;
  height: 84px;
  padding-left: 28px;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 7px;
}
.assistant-slot :deep(.recommendation-card img) { width: 46px; height: 46px; }
.assistant-slot :deep(.recommendation-number) { left: 5px; width: 20px; height: 20px; font-size: 10px; }
.assistant-slot :deep(.virtual-assistant) { grid-template-columns: minmax(0, 1fr) 102px; }
.assistant-slot :deep(.assistant-character) { width: 102px; height: 126px; }
.assistant-slot :deep(.assistant-bubble) { width: fit-content; max-width: min(100%, 420px); min-height: 0; height: auto; justify-self: end; padding: 8px 12px; }
.assistant-slot :deep(.assistant-bubble strong) { font-size: 15px; }
.assistant-slot :deep(.assistant-bubble span) { font-size: 14px; }

.middle-section {
  min-height: 0;
  padding: 0 18px 8px;
  align-items: stretch;
  /* 吊挂介绍屏从这里垂下/收回，裁剪让它看起来是从顶栏后方降下来的 */
  overflow: hidden;
}

.middle-section :deep(.scenic-dish-stage) { height: 100%; }

.middle-section > .product-state {
  inset: 70px auto auto 50%;
  width: min(440px, calc(100% - 32px));
  min-height: 80px;
  padding: 12px 18px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.86);
  transform: translateX(-50%);
  backdrop-filter: blur(10px);
}

@media (min-width: 1921px) {
  .top-section {
    height: 196px; /* 1921+ 小禾角色 150px，横幅需 ≥ 170px */
    padding: 14px 28px 12px;
  }

  .brand-kicker { font-size: 13px; }
  .brand-lockup strong { font-size: 36px; }
  .brand-table { font-size: 15px; }
  .top-scene-banner { grid-template-columns: minmax(420px, 0.7fr) minmax(560px, 1.05fr) minmax(1080px, 1.25fr); }
  .assistant-slot :deep(.assistant-recommendation-rail:not(.has-recommendations)) { grid-template-columns: minmax(0, 1fr) 320px; }
  .assistant-slot :deep(.assistant-recommendation-rail.has-recommendations) { grid-template-columns: minmax(0, 1fr) 300px; }
  .assistant-slot :deep(.recommendation-list) { grid-auto-columns: 160px; gap: 10px; }
  .assistant-slot :deep(.recommendation-card) {
    width: 160px;
    height: 90px;
    grid-template-columns: 50px minmax(0, 1fr);
  }
  .assistant-slot :deep(.recommendation-card img) { width: 50px; height: 50px; }
  .assistant-slot :deep(.virtual-assistant) { grid-template-columns: minmax(0, 1fr) 126px; }
  .assistant-slot :deep(.assistant-character) { width: 126px; height: 150px; }
  .assistant-slot :deep(.assistant-bubble) { max-width: min(100%, 520px); min-height: 0; padding: 10px 14px; }
  .assistant-slot :deep(.assistant-bubble strong) { font-size: 17px; }
  .assistant-slot :deep(.assistant-bubble span) { font-size: 16px; }
}

@media (max-width: 900px) {
  .top-section {
    height: 150px; /* ≤900 小禾角色 98px，横幅 ≥ 130px */
    padding: 10px 14px;
  }

  .top-scene-banner { grid-template-columns: minmax(190px, 0.6fr) minmax(240px, 1fr) minmax(0, 1.15fr); }
  .brand-lockup { padding-inline: 14px; }
  .brand-lockup strong { font-size: 24px; }
  .brand-table { font-size: 11px; }
  .top-progress {
    top: 6px;
    width: calc(100vw - 28px);
  }
  .assistant-slot { padding: 0 8px 2px 4px; }
  .assistant-slot :deep(.assistant-recommendation-rail) { padding: 3px; }
  .assistant-slot :deep(.assistant-recommendation-rail.has-recommendations) { grid-template-columns: minmax(0, 1fr) 180px; }
  .assistant-slot :deep(.assistant-recommendation-rail:not(.has-recommendations)) { grid-template-columns: minmax(0, 1fr) 180px; }
  .assistant-slot :deep(.virtual-assistant) { grid-template-columns: minmax(0, 1fr) 78px; }
  .assistant-slot :deep(.assistant-character) { width: 78px; height: 98px; }
  .middle-section { padding-inline: 14px; }
  .middle-section > .product-state { width: calc(100% - 28px); }
}

@media (max-width: 600px) {
  .conveyor-display {
    height: auto;
    min-height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .top-section {
    height: auto;
    padding: 8px 10px 10px;
  }

  .top-progress {
    top: 5px;
    width: calc(100vw - 20px);
  }
  .top-scene-banner {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto minmax(0, 1fr);
  }
  .brand-lockup {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 9px 12px 3px;
  }
  .brand-kicker { display: none; }
  .brand-lockup strong { font-size: 24px; }
  .brand-table { font-size: 11px; }
  .assistant-slot {
    grid-column: 1;
    min-height: 0;
    padding: 0 4px 2px;
  }
  .assistant-slot :deep(.assistant-recommendation-rail),
  .assistant-slot :deep(.assistant-recommendation-rail.has-recommendations),
  .assistant-slot :deep(.assistant-recommendation-rail:not(.has-recommendations)) {
    grid-template-columns: minmax(0, 1fr) 92px;
  }
  .assistant-slot :deep(.recommendation-lane__header) { display: none; }
  .assistant-slot :deep(.recommendation-list) { display: none; }
  .assistant-slot :deep(.virtual-assistant) { grid-template-columns: minmax(0, 1fr) 76px; }
  .assistant-slot :deep(.assistant-character) { width: 76px; height: 96px; }
  .assistant-slot :deep(.assistant-bubble) { max-width: min(100%, 280px); min-height: 0; padding: 6px 8px; }
  .middle-section { flex: 0 0 440px; min-height: 440px; padding: 0 8px 8px; }
  .middle-section > .product-state { top: 56px; width: calc(100% - 16px); }
}

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

.conveyor-display.is-midnight-station {
  .product-state {
    color: var(--station-text-primary);
    background: var(--station-overlay-deep);
    border-color: var(--station-border);
    border-radius: var(--station-radius-panel);
    box-shadow: var(--station-shadow-e1);

    p { font-family: var(--station-font-ui); }
  }

  .confirm-icon {
    color: var(--station-primary);
    font-size: 42px;
  }

  .assistant-slot :deep(.assistant-recommendation-rail:not(.has-recommendations)) {
    grid-template-columns: minmax(0, 1fr) 214px;
  }

  .assistant-slot :deep(.assistant-recommendation-rail.has-recommendations) {
    grid-template-columns: minmax(0, 1fr) minmax(176px, 214px);
  }

  .assistant-slot :deep(.virtual-assistant) {
    grid-template-columns: minmax(0, 1fr) 94px;
  }

  .assistant-slot :deep(.assistant-character) {
    width: 94px;
    height: 114px;
  }
}

@media (min-width: 1921px) {
  .conveyor-display.is-midnight-station {
    .assistant-slot :deep(.assistant-recommendation-rail:not(.has-recommendations)) {
      grid-template-columns: minmax(0, 1fr) 254px;
    }

    .assistant-slot :deep(.assistant-recommendation-rail.has-recommendations) {
      grid-template-columns: minmax(0, 1fr) minmax(206px, 254px);
    }

    .assistant-slot :deep(.virtual-assistant) {
      grid-template-columns: minmax(0, 1fr) 108px;
    }

    .assistant-slot :deep(.assistant-character) {
      width: 108px;
      height: 130px;
    }
  }
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

:deep(.call-waiter-dialog.is-midnight-station) {
  border: 1px solid var(--station-border);
  border-radius: var(--station-radius-panel);
  background: var(--station-surface-elevated);
  box-shadow: var(--station-shadow-e3);

  .el-dialog__header {
    background: var(--station-background-deep);
    border-bottom-color: var(--station-border);

    .el-dialog__title { color: var(--station-text-primary); font-family: var(--station-font-brand); }
  }

  .el-dialog__body { background: var(--station-surface-elevated); }
  .el-dialog__footer { background: var(--station-surface); border-top-color: var(--station-border); }

  .call-waiter-confirm {
    padding: 18px 0;
    color: var(--station-text-on-surface);

    .confirm-icon { color: var(--station-primary); }
    .confirm-message h3 { color: var(--station-text-on-surface); font-family: var(--station-font-brand); }
    .confirm-message p { color: var(--station-text-muted); }
  }

  .dialog-footer .el-button {
    min-height: 48px;
    border-radius: var(--station-radius-control);
    font-family: var(--station-font-ui);
  }

  .dialog-footer .el-button--primary {
    color: var(--station-text-primary);
    background: var(--station-primary);
    border-color: var(--station-accent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .conveyor-display.is-midnight-station .confirm-icon { animation: none; }
}

/* 原版底部组件使用 827/790px 固定画布；移动端仅等比例收紧尺寸，
   保留主题贴图、按钮顺序和左右购物车结构。 */
@media (max-width: 600px) {
  .bottom-section {
    height: auto;
    min-height: 388px;
    padding: 0 8px 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .bottom-center { order: 1; }
  .bottom-left { order: 2; }
  .bottom-right { order: 3; }

  .bottom-left,
  .bottom-right {
    width: 100%;
    min-width: 0;
    padding: 0;
    margin: 0;
  }

  .bottom-left :deep(.cart-section),
  .bottom-right :deep(.cart-section) {
    width: 100%;
    height: 126px;
    padding: 8px;
    background-size: 100% 100%;
  }

  .bottom-left :deep(.item-group),
  .bottom-right :deep(.item-group) {
    width: 100%;
    height: 110px;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
  }

  .bottom-left :deep(.cart-item),
  .bottom-right :deep(.cart-item) {
    width: 54px;
    height: 106px;
    gap: 3px;
  }

  .bottom-left :deep(.item-circle),
  .bottom-right :deep(.item-circle) {
    width: 54px;
    height: 54px;
  }

  .bottom-left :deep(.item-info),
  .bottom-right :deep(.item-info) {
    margin-top: -7px;
  }

  .bottom-left :deep(.item-name-area),
  .bottom-right :deep(.item-name-area) {
    height: 22px;
    padding: 0 2px;
    line-height: 22px;
    font-size: 10px;
  }

  .bottom-left :deep(.item-controls),
  .bottom-right :deep(.item-controls) {
    height: 22px;
    padding: 0 3px;
  }

  .bottom-left :deep(.order-btn),
  .bottom-right :deep(.order-btn) {
    width: 66px;
    height: 110px;
    flex: 0 0 66px;
    padding: 0;
    background-size: 100% 100%;
  }

  .bottom-left :deep(.order-progress),
  .bottom-right :deep(.order-progress) {
    top: auto;
    bottom: 16px;
    font-size: 18px;
  }

  :deep(.bottom-center) {
    width: 100%;
    height: 170px;
    padding: 8px;
    margin: 0;
    background-size: 100% 100%;
  }

  :deep(.center-layout) {
    width: 100%;
    height: 154px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 0;
  }

  :deep(.menu-btn) {
    width: 64px;
    height: 140px;
    flex: 0 0 64px;
    background-size: 100% 100%;
  }

  :deep(.center-functions) {
    width: auto;
    height: 144px;
    flex: 1 1 auto;
    min-width: 0;
    gap: 4px;
  }

  :deep(.function-row) {
    height: 70px;
    display: flex;
    flex-direction: row;
    gap: 6px;
  }

  :deep(.first-row .function-btn),
  :deep(.second-row .function-btn) {
    width: auto;
    height: 100%;
    flex: 1 1 0;
    min-width: 0;
    background-size: 100% 100%;
  }
}

</style>
