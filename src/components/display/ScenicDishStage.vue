<template>
  <section
    class="scenic-dish-stage"
    :class="{
      'is-paused': streamMotionPaused,
      'is-reversed': direction === 'right',
      'is-dragging': isStreamDragging,
      'is-chef-theme': themeKey === 'ailaotou',
      'is-beach-theme': themeKey === 'zhenxian',
      'is-underwater-theme': themeKey === 'xiaoxin',
      'is-midnight-station': themeKey === 'midnight-station',
      'is-scene-entering': sceneEntryActive
    }"
    :style="stageTimingStyle"
    :aria-label="t('menu.dishList')"
  >
    <AmbientSceneEffects :paused="streamMotionPaused || isStreamDragging" />
    <header class="tide-toolbar">
      <nav
        ref="categoryScrollerRef"
        class="tide-categories"
        :class="{ 'is-dragging': isCategoryDragging }"
        aria-label="Dish categories"
        @pointerdown="handleCategoryPointerDown"
        @pointermove="handleCategoryPointerMove"
        @pointerup="handleCategoryPointerEnd"
        @pointercancel="handleCategoryPointerEnd"
        @wheel="handleCategoryWheel"
        @click.capture="handleCategoryClickCapture"
      >
        <button
          v-for="category in categoryOptions"
          :key="category.id"
          type="button"
          :class="{ 'is-active': activeCategoryId === category.id }"
          @click="selectCategory(category.id)"
        >
          {{ category.name }}
        </button>
      </nav>

      <button
        type="button"
        class="tide-pause"
        :aria-label="effectivePaused ? t('games.resume') : t('games.pause')"
        :title="effectivePaused ? t('games.resume') : t('games.pause')"
        @click="emit('paused-change', !effectivePaused)"
      >
        <el-icon><VideoPlay v-if="effectivePaused" /><VideoPause v-else /></el-icon>
      </button>
    </header>

    <div ref="tideStageRef" class="tide-stage">
      <StationPlatformScene
        v-if="themeKey === 'midnight-station'"
      />

      <div class="tide-current tide-current--back" aria-hidden="true"></div>
      <div class="tide-current tide-current--middle" aria-hidden="true"></div>
      <div class="tide-current tide-current--front" aria-hidden="true"></div>

      <div
        v-if="themeKey === 'midnight-station' && effectivePaused"
        class="station-platform-hold"
        role="status"
        aria-live="polite"
      >
        <strong>PLATFORM HOLD</strong>
        <span>PAUSED</span>
      </div>

      <div
        v-if="streamCycleItems.length"
        ref="streamRef"
        class="tide-stream"
        @pointerdown="handleStreamPointerDown"
        @pointermove="handleStreamPointerMove"
        @pointerup="handleStreamPointerEnd"
        @pointercancel="handleStreamPointerEnd"
        @wheel="handleStreamWheel"
        @click.capture="handleStreamClickCapture"
      >
        <div class="tide-track">
          <div v-for="cycleIndex in 3" :key="cycleIndex" class="tide-cycle">
            <div
              v-for="entry in streamCycleItems"
              :key="`${cycleIndex}-${entry.kind}-${entry.instanceIndex}-${getItemKey(entry.item, entry.sourceIndex)}`"
              class="tide-slot"
              :class="{
                'is-queue-event': entry.kind === 'event',
                'is-sold-out': entry.kind === 'dish' && !isAvailable(entry.item),
                'is-recommended': entry.kind === 'dish' && recommendationIds.has(String(entry.item.id))
              }"
              :data-station-lane="entry.lane"
              :data-station-entry-key="getEntryKey(entry, cycleIndex)"
              :style="entry.style"
            >
              <BeachBoatPass
                v-if="entry.kind === 'event' && themeKey === 'zhenxian'"
                :direction="direction"
                :promo-item="promoTriggerItem"
                :promo-content="promoTrigger"
                @dish-click="emitDishClick"
                @featured-promo="emitFeaturedPromo"
              />
              <SeaTurtlePass
                v-else-if="entry.kind === 'event' && themeKey === 'xiaoxin'"
                :direction="direction"
                :promo-item="promoTriggerItem"
                :promo-content="promoTrigger"
                @dish-click="emitDishClick"
                @featured-promo="emitFeaturedPromo"
              />
              <article
                v-else
                class="tide-dish"
                :class="{
                  'is-station-pressed': themeKey === 'midnight-station' && pressedDishKey === getEntryKey(entry, cycleIndex),
                  'is-station-stamped': themeKey === 'midnight-station' && selectedDishKey === getEntryKey(entry, cycleIndex)
                }"
                :data-station-entry-key="getEntryKey(entry, cycleIndex)"
                :tabindex="isAvailable(entry.item) ? 0 : -1"
                :aria-label="`${getName(entry.item)} ¥${formatPrice(entry.item.price)}`"
                @pointerdown="handleDishPointerDown(getEntryKey(entry, cycleIndex), $event)"
                @pointerup="handleDishPointerUp(getEntryKey(entry, cycleIndex))"
                @pointercancel="handleDishPointerUp(getEntryKey(entry, cycleIndex))"
                @pointerleave="handleDishPointerUp(getEntryKey(entry, cycleIndex))"
                @click="handleDishClick(entry.item, $event, getEntryKey(entry, cycleIndex))"
                @keydown.enter.prevent="handleDishClick(entry.item, $event, getEntryKey(entry, cycleIndex))"
              >
                <span v-if="recommendationIds.has(String(entry.item.id))" class="tide-dish__ai">AI</span>
                <span v-if="!isAvailable(entry.item)" class="tide-dish__soldout">{{ t('common.soldOut') }}</span>
                <span v-if="themeKey === 'midnight-station'" class="station-platform-marker" aria-hidden="true"></span>
                <span
                  v-if="themeKey === 'midnight-station' && selectedDishKey === getEntryKey(entry, cycleIndex)"
                  class="station-dish-stamp"
                  aria-hidden="true"
                >BOARDING</span>
                <span v-if="themeKey === 'midnight-station'" class="station-dish-plate" aria-hidden="true">
                  <span class="station-dish-plate__surface"></span>
                  <span class="station-dish-plate__rim"></span>
                  <span class="station-dish-plate__contact-shadow"></span>
                </span>
                <span v-if="themeKey === 'midnight-station'" class="station-dish-cradle" aria-hidden="true">
                  <i class="station-dish-cradle__wheel station-dish-cradle__wheel--left"></i>
                  <i class="station-dish-cradle__wheel station-dish-cradle__wheel--right"></i>
                </span>
                <img
                  class="tide-dish__shell"
                  src="/images/ui/b/shell-dish-tray.png"
                  alt=""
                  aria-hidden="true"
                />
                <span class="tide-dish__beach-board" aria-hidden="true"></span>
                <span class="tide-dish__chef-tray" aria-hidden="true"></span>
                <div class="tide-dish__image">
                  <img :src="getImage(entry.item)" :alt="getName(entry.item)" @error="handleImageError" />
                </div>
                <div class="tide-dish__copy station-dish-ticket">
                  <h3>{{ getName(entry.item) }}</h3>
                  <strong>¥{{ formatPrice(entry.item.price) }}</strong>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="tide-empty">{{ t('menu.noDishes') }}</div>

      <!-- 特殊事件水花层：小新船尾浪花、海龟气泡与涟漪都画在这层 canvas 上 -->
      <StageSplashLayer
        v-if="splashLayerEnabled"
        ref="splashLayerRef"
        :frozen="streamMotionPaused"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  VideoPause,
  VideoPlay
} from '@element-plus/icons-vue'
import { useI18n } from '@/i18n'
import AmbientSceneEffects from '@/components/display/AmbientSceneEffects.vue'
import BeachBoatPass from '@/components/display/BeachBoatPass.vue'
import SeaTurtlePass from '@/components/display/SeaTurtlePass.vue'
import StageSplashLayer from '@/components/display/StageSplashLayer.vue'
import StationPlatformScene from '@/components/display/midnight/StationPlatformScene.vue'
import { findPromoForItem } from '@/config/promoContent'

const props = defineProps({
  sceneKey: { type: String, default: 'zhenxian' },
  entryRevision: { type: Number, default: 0 },
  items: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  recommendations: { type: Array, default: () => [] },
  selectedItemId: { type: [Number, String], default: null },
  direction: { type: String, default: 'left' },
  speed: { type: Number, default: 1 },
  paused: { type: Boolean, default: false }
})

const emit = defineEmits(['dish-click', 'paused-change', 'featured-promo'])
const { t } = useI18n()
// Midnight gets a real dish fallback; legacy themes keep their historical
// asset path so this polish pass cannot alter their visual language.
const LEGACY_DEFAULT_DISH_IMAGE = '/images/default-dish.jpg'
const MIDNIGHT_DEFAULT_DISH_IMAGE = '/images/menu/generated/nigiri.webp'
const getName = item => item?.name || item?.storeName || item?.productName || t('common.unknown')
// A shorter cycle makes the beach event recur sooner without placing two
// boats on screen at once.
const MIN_STREAM_ITEMS = 10
const activeCategoryId = ref('all')
const categoryScrollerRef = ref(null)
const streamRef = ref(null)
const tideStageRef = ref(null)
const splashLayerRef = ref(null)
const isCategoryDragging = ref(false)
const isStreamDragging = ref(false)
const reducedMotion = ref(false)
const themeKey = computed(() => props.sceneKey)
const sceneEntryActive = ref(false)
const pressedDishKey = ref('')
const selectedDishKey = ref('')
const specialEventOffset = ref(5)
const getPopularity = item => Number(item?.salesCount ?? item?.sales ?? item?.soldCount ?? 0)
const availablePromoItems = computed(() => props.items
  .filter(item => isAvailable(item))
  .sort((left, right) => getPopularity(right) - getPopularity(left)))
const promoTriggerItem = computed(() => availablePromoItems.value.find(item => findPromoForItem(item)) || null)
const promoTrigger = computed(() => findPromoForItem(promoTriggerItem.value))

// 水花层只在带特殊事件的场景启用（沙滩=小新船，海底=海龟）
const splashLayerEnabled = computed(() => themeKey.value === 'zhenxian' || themeKey.value === 'xiaoxin')

// 事件元素缓存：非响应式普通数组，避免每帧遍历响应式代理的开销
let eventArtCache = []
// 上一帧的滚动位置采样，用于计算真实滚动速度（覆盖匀速/拖拽/惯性）
let lastScrollSample = null

const categoryDrag = {
  pointerId: null,
  startX: 0,
  startScrollLeft: 0,
  moved: false
}

const streamDrag = {
  pointerId: null,
  startX: 0,
  startY: 0,
  startScrollLeft: 0,
  axis: '',
  moved: false,
  // Pointer events can arrive faster than the display refresh rate. Keep the
  // latest target and commit it from the stream animation frame instead of
  // forcing a scroll/layout update for every event.
  pendingScrollLeft: null
}

// ===== 甩动惯性物理 =====
// 松手测速：保留最近 120ms 的指针采样，松手时线性回归取窗口末速；
// 最新样本超过 90ms 视为用户有意按停，不给惯性。
const FLICK_SAMPLE_WINDOW_MS = 120
const FLICK_STALE_MS = 90
// 甩出速度上限按屏宽缩放：小屏至少 2400px/s，大屏约 2.2 倍屏宽，绝对上限 9000px/s。
const FLICK_VELOCITY_MIN = 2400
const FLICK_VELOCITY_WIDTH_RATIO = 2.2
const FLICK_VELOCITY_MAX = 9000
// 速度相关摩擦（UIScrollView 双段模型）：指数衰减时间常数随初速增大，
// 快甩滑得更远；叠加恒定摩擦保证收尾干脆、不拖长尾。
const INERTIA_TAU_BASE = 0.28
const INERTIA_TAU_RANGE = 0.35
const INERTIA_TAU_REF_VELOCITY = 6000
const INERTIA_CONSTANT_FRICTION = 320
const INERTIA_STOP_VELOCITY = 2

let streamFrameId = 0
let lastFrameTime = 0
let inertiaVelocity = 0
let inertiaTimeConstant = INERTIA_TAU_BASE
// (timeStamp, clientX) 采样环，只保留最近 FLICK_SAMPLE_WINDOW_MS 内的样本
const flickSamples = []
// cycleWidth 缓存：避免滚动循环每帧读 offsetWidth 触发强制同步布局
let streamCycleWidth = 0
let streamResizeObserver = null

const invalidateCycleWidth = () => {
  streamCycleWidth = 0
}

const observeStreamSize = () => {
  if (!streamResizeObserver || !streamRef.value) return
  streamResizeObserver.observe(streamRef.value)
}

// 高采样率触控屏上指针事件可能被合并下发，用 getCoalescedEvents 补全中间点，
// 松手前的末速不被 60Hz 事件节流稀释。
const recordFlickSamples = (event) => {
  const samples = (typeof event.getCoalescedEvents === 'function' && event.getCoalescedEvents().length)
    ? event.getCoalescedEvents()
    : [event]
  for (const sample of samples) {
    const time = sample.timeStamp > 0 ? sample.timeStamp : performance.now()
    flickSamples.push({ time, x: sample.clientX })
  }
  const newest = flickSamples[flickSamples.length - 1]
  while (flickSamples.length > 2 && newest && newest.time - flickSamples[0].time > FLICK_SAMPLE_WINDOW_MS) {
    flickSamples.shift()
  }
}

// 松手速度 = 最近采样窗口的线性回归斜率；符号约定与 scrollLeft 一致（手指右移 → 负速度）
const estimateFlickVelocity = () => {
  const now = performance.now()
  if (!flickSamples.length) return 0
  if (now - flickSamples[flickSamples.length - 1].time > FLICK_STALE_MS) return 0
  const samples = flickSamples.filter((sample) => now - sample.time <= FLICK_SAMPLE_WINDOW_MS)
  if (samples.length < 2) return 0
  const firstTime = samples[0].time
  let sumT = 0
  let sumX = 0
  let sumTT = 0
  let sumTX = 0
  for (const sample of samples) {
    const t = sample.time - firstTime
    sumT += t
    sumX += sample.x
    sumTT += t * t
    sumTX += t * sample.x
  }
  const count = samples.length
  const denominator = count * sumTT - sumT * sumT
  if (denominator <= 0) return 0
  const slopePerMs = (count * sumTX - sumT * sumX) / denominator
  return -slopePerMs * 1000
}

const getFlickVelocityLimit = () => {
  const width = streamRef.value?.clientWidth || 0
  return Math.min(FLICK_VELOCITY_MAX, Math.max(FLICK_VELOCITY_MIN, width * FLICK_VELOCITY_WIDTH_RATIO))
}

const computeInertiaTimeConstant = (velocity) => (
  INERTIA_TAU_BASE + INERTIA_TAU_RANGE * Math.min(1, velocity / INERTIA_TAU_REF_VELOCITY)
)
let categoryClickTimer = 0
let streamClickTimer = 0
let sceneEntryTimer = 0
let dishPressTimer = 0
let dishStampTimer = 0
let lastSplashLayoutTime = 0
const SPLASH_LAYOUT_INTERVAL = 34
const STATION_FOCUS_INTERVAL_MS = 84
let lastStationFocusUpdate = 0
let stationFocusMetrics = []
let stationFocusClientWidth = 0
let stationFocusMetricsDirty = true

const WAVE_PROFILE = [
  { offset: 30, lift: 7, tilt: -1.1 },
  { offset: 142, lift: 10, tilt: 1.4 },
  { offset: 62, lift: 8, tilt: -0.8 },
  { offset: 178, lift: 11, tilt: 1.2 },
  { offset: 94, lift: 9, tilt: -1.4 },
  { offset: 154, lift: 7, tilt: 0.9 },
  { offset: 42, lift: 10, tilt: -1.2 },
  { offset: 124, lift: 8, tilt: 1.1 }
]
const WAVE_PHASE_STEP = Math.PI / 4
const WAVE_AMPLITUDE = 42
const DISH_LIFT_AMPLITUDE = 8
const TILT_AMPLITUDE = 1.4

const STATION_LANE_PROFILES = [
  { name: 'back', y: -18, scale: 0.94, opacity: 0.72, brightness: 0.94, z: 1 },
  { name: 'middle', y: 0, scale: 0.985, opacity: 0.9, brightness: 0.98, z: 2 },
  { name: 'front', y: 18, scale: 1, opacity: 1, brightness: 1, z: 3 }
]

const getImage = (item) => item?.image || item?.imageUrl || (
  themeKey.value === 'midnight-station' ? MIDNIGHT_DEFAULT_DISH_IMAGE : LEGACY_DEFAULT_DISH_IMAGE
)
// The app API uses cateId, while older/mock payloads may use categoryId or
// snake_case fields. Keep category matching tolerant of all supported shapes.
const getCategoryId = (item) => String(
  item?.categoryId
    ?? item?.cateId
    ?? item?.cate_id
    ?? item?.category?.id
    ?? (typeof item?.category === 'object' ? item.category?.categoryId : item?.category)
    ?? 'uncategorized'
)
const getCategoryName = (item) => String(
  item?.categoryName
    ?? item?.category?.name
    ?? item?.category?.categoryName
    ?? (typeof item?.category === 'string' ? item.category : '')
    ?? ''
)
const getItemKey = (item, fallback) => String(item?.id ?? item?.productId ?? fallback)
const getEntryKey = (entry, cycleIndex = '') => `${cycleIndex}-${entry.kind}-${entry.instanceIndex}-${getItemKey(entry.item, entry.sourceIndex)}`
const isAvailable = (item) => item && item.available !== false && item.status !== 'OFF_SHELF'
const formatPrice = (value) => {
  const price = Number(value)
  return Number.isFinite(price) ? price.toFixed(2) : '0.00'
}

const categoryOptions = computed(() => {
  const source = props.categories
    .map((category) => ({
      id: String(category?.id ?? category?.categoryId ?? category?.cateId ?? category?.cate_id ?? category?.value ?? ''),
      name: category?.name || category?.label || category?.categoryName || ''
    }))
    .filter((category) => category.id && category.name)
  const unique = source.filter((category, index, list) => (
    list.findIndex((item) => item.id === category.id) === index
  ))
  return [{ id: 'all', name: t('common.all') }, ...unique]
})

const filteredItems = computed(() => {
  if (activeCategoryId.value === 'all') return props.items
  const selectedCategory = categoryOptions.value.find(category => category.id === activeCategoryId.value)
  const matching = props.items.filter((item) => getCategoryId(item) === activeCategoryId.value)
  if (matching.length || !selectedCategory) return matching
  // Some imported/mock products expose only a category name. Match that name
  // against the selected option instead of comparing it with the numeric ID.
  return props.items.filter((item) => getCategoryName(item) === selectedCategory.name)
})

const orderedItems = computed(() => {
  const list = filteredItems.value
  if (!list.length || props.selectedItemId === null || props.selectedItemId === undefined) return list
  const selectedIndex = list.findIndex((item) => String(item.id) === String(props.selectedItemId))
  if (selectedIndex <= 0) return list
  return [...list.slice(selectedIndex), ...list.slice(0, selectedIndex)]
})

const recommendationIds = computed(() => new Set(
  props.recommendations.map((item) => String(item.id))
))

const normalizedSpeed = computed(() => Math.min(3, Math.max(0.2, Number(props.speed) || 1)))
const effectivePaused = computed(() => props.paused)
const streamMotionPaused = computed(() => effectivePaused.value)

const streamCycleItems = computed(() => {
  const list = orderedItems.value
  const count = list.length ? Math.max(MIN_STREAM_ITEMS, list.length) : 0
  const entries = Array.from({ length: count }, (_, instanceIndex) => {
    const sourceIndex = instanceIndex % list.length
    const phase = instanceIndex * WAVE_PHASE_STEP
    const waveOffset = Math.sin(phase) * WAVE_AMPLITUDE
    const lift = Math.sin(phase) * DISH_LIFT_AMPLITUDE
    const tilt = Math.cos(phase) * TILT_AMPLITUDE
    const stationLane = STATION_LANE_PROFILES[instanceIndex % STATION_LANE_PROFILES.length]
    return {
      kind: 'dish',
      item: list[sourceIndex],
      sourceIndex,
      instanceIndex,
      lane: themeKey.value === 'midnight-station' ? stationLane.name : undefined,
      style: {
        '--wave-offset': `${waveOffset}px`,
        '--lift-up': `${lift * -0.55}px`,
        '--lift-soft': `${lift * 0.15}px`,
        '--lift-down': `${lift}px`,
        '--lift-return': `${lift * -0.1}px`,
        '--tilt-start': `${tilt * -0.8}deg`,
        '--tilt-main': `${tilt}deg`,
        '--tilt-soft': `${tilt * 0.45}deg`,
        '--tilt-return': `${tilt * -0.35}deg`,
        '--float-delay': `${instanceIndex * -620}ms`,
        ...(themeKey.value === 'midnight-station'
          ? {
              '--station-lane-y': `${stationLane.y}px`,
              '--station-lane-scale': stationLane.scale,
              '--station-lane-opacity': stationLane.opacity,
              '--station-lane-brightness': stationLane.brightness,
              '--station-lane-z': stationLane.z,
              '--station-entry-delay': `${420 + (instanceIndex % MIN_STREAM_ITEMS) * 42}ms`
            }
          : {})
      }
    }
  })
  if (!list.length || activeCategoryId.value !== 'all' || themeKey.value === 'midnight-station') return entries
  const eventIndex = Math.min(specialEventOffset.value, entries.length)
  const eventWave = WAVE_PROFILE[(eventIndex + 2) % WAVE_PROFILE.length]
  entries.splice(eventIndex, 0, {
    kind: 'event',
    item: null,
    sourceIndex: 'event',
    instanceIndex: `event-${themeKey.value}-${specialEventOffset.value}`,
    style: {
      '--wave-offset': `${Math.max(18, eventWave.offset - 34)}px`,
      '--float-delay': '-900ms'
    }
  })
  return entries
})

const randomizeSpecialEventOffset = () => {
  // Keep the event random, but bring it forward often enough to be noticed.
  specialEventOffset.value = 1 + Math.floor(Math.random() * 5)
}

const bobDuration = computed(() => Math.round(
  Math.min(7000, Math.max(3600, 5200 / normalizedSpeed.value))
))

const stageTimingStyle = computed(() => ({
  '--bob-duration': `${bobDuration.value}ms`
}))

const getStreamCycleWidth = () => {
  // 命中缓存时零 DOM 读取；失效后下一次调用重测
  if (streamCycleWidth > 0) return streamCycleWidth
  const cycle = streamRef.value?.querySelector('.tide-cycle')
  streamCycleWidth = cycle?.offsetWidth || 0
  return streamCycleWidth
}

// Midnight uses the existing scroll stream as its only source of truth. This
// cache gives the visual focus treatment a content-space position without
// reading every dish's layout on every animation frame.
const cacheStationFocusMetrics = async () => {
  if (themeKey.value !== 'midnight-station') {
    stationFocusMetrics = []
    stationFocusClientWidth = 0
    stationFocusMetricsDirty = false
    return
  }

  await nextTick()
  const stream = streamRef.value
  if (!stream) return
  const streamRect = stream.getBoundingClientRect()
  stationFocusClientWidth = stream.clientWidth
  stationFocusMetrics = Array.from(stream.querySelectorAll('.tide-slot:not(.is-queue-event)'))
    .map((slot) => {
      const rect = slot.getBoundingClientRect()
      return {
        element: slot,
        center: rect.left - streamRect.left + stream.scrollLeft + rect.width / 2
      }
    })
  stationFocusMetricsDirty = false
}

const clearStationFocusStyles = () => {
  stationFocusMetrics.forEach(({ element }) => {
    element.style.removeProperty('--station-focus-scale')
    element.style.removeProperty('--station-focus-brightness')
    element.style.removeProperty('--station-focus-opacity')
    element.removeAttribute('data-station-focus')
  })
  stationFocusMetrics = []
  stationFocusMetricsDirty = true
}

const updateStationFocus = (time) => {
  if (themeKey.value !== 'midnight-station' || !streamRef.value) return
  if (time - lastStationFocusUpdate < STATION_FOCUS_INTERVAL_MS) return
  lastStationFocusUpdate = time

  if (stationFocusMetricsDirty) {
    cacheStationFocusMetrics()
    return
  }

  const stream = streamRef.value
  const viewportCenter = stream.scrollLeft + stationFocusClientWidth / 2
  const focusRange = Math.max(280, stationFocusClientWidth * 0.42)
  for (const metric of stationFocusMetrics) {
    const focus = Math.max(0, 1 - Math.abs(metric.center - viewportCenter) / focusRange)
    const laneOpacity = Number.parseFloat(metric.element.style.getPropertyValue('--station-lane-opacity')) || 1
    metric.element.style.setProperty('--station-focus-scale', (1 + focus * 0.015).toFixed(3))
    metric.element.style.setProperty('--station-focus-brightness', (1 + focus * 0.055).toFixed(3))
    metric.element.style.setProperty('--station-focus-opacity', Math.min(1, laneOpacity + focus * 0.1).toFixed(3))
    metric.element.toggleAttribute('data-station-focus', focus > 0.72)
  }
}

const normalizeStreamPosition = () => {
  const stream = streamRef.value
  const cycleWidth = getStreamCycleWidth()
  if (!stream || !cycleWidth) return
  if (stream.scrollLeft < cycleWidth * 0.25) {
    stream.scrollLeft += cycleWidth
    // 无缝循环补位是瞬移，丢弃速度采样避免水花误判为高速
    lastScrollSample = null
  }
  if (stream.scrollLeft > cycleWidth * 1.75) {
    stream.scrollLeft -= cycleWidth
    lastScrollSample = null
  }
}

const resetStreamPosition = async () => {
  await nextTick()
  const stream = streamRef.value
  const cycleWidth = getStreamCycleWidth()
  if (!stream || !cycleWidth) return
  stream.scrollLeft = cycleWidth
  inertiaVelocity = 0
  lastFrameTime = performance.now()
  lastScrollSample = null
}

const rebuildEventArtCache = async () => {
  await nextTick()
  const stream = streamRef.value
  if (!stream) {
    eventArtCache = []
    return
  }
  // 分别收集船和海龟的可视元素，类型由组件根类名决定；
  // 船额外缓存图片节点，用于把发射点换算到 contain 缩放后的真实船体区域
  eventArtCache = Array.from(stream.querySelectorAll('.queue-boat-event'))
    .map((el) => ({ el, kind: 'boat', artImg: el.querySelector('img') }))
    .concat(Array.from(stream.querySelectorAll('.queue-turtle-event'))
      .map((el) => ({ el, kind: 'turtle', artImg: null })))
}

// ===== 特殊事件水花发射：把事件元素位置换算成舞台本地坐标喂给粒子层 =====
const TURTLE_WATERLINE_RATIO = 0.74 // 海龟气泡生成线相对高度比例
const BOAT_KEEL_RATIO = 0.9         // 荷叶船底吃水线在船图内的纵向比例
const BOAT_TIP_RATIO = 0.78         // 船头/船尾上翘端口的喷溅纵向比例

const updateEventSplashes = (dtSeconds) => {
  const layer = splashLayerRef.value
  const stageEl = tideStageRef.value
  const stream = streamRef.value
  if (!layer || !stageEl || !stream || !eventArtCache.length) return
  // 减少动态（reduced motion）下完全不生成粒子
  if (reducedMotion.value) return

  // 用相邻两帧 scrollLeft 差值求真实速度，拖拽和惯性也会自然反映到水花强度上
  const now = performance.now()
  let speedPxPerSec = 0
  if (lastScrollSample) {
    const elapsedMs = Math.max(1, now - lastScrollSample.time)
    speedPxPerSec = ((stream.scrollLeft - lastScrollSample.left) / elapsedMs) * 1000
  }
  lastScrollSample = { left: stream.scrollLeft, time: now }

  // Event art uses getBoundingClientRect(), which can trigger a synchronous
  // layout after scrollLeft changes. Particle motion remains smooth at 30fps
  // while leaving the main drag/scroll loop free to run at the display rate.
  if (now - lastSplashLayoutTime < SPLASH_LAYOUT_INTERVAL) return
  lastSplashLayoutTime = now

  const stageRect = stageEl.getBoundingClientRect()
  // 内容向左移动（scrollLeft 增大）时行进方向朝左，船尾在右侧；反之在左侧
  const speedSign = speedPxPerSec >= 0 ? 1 : -1
  const speedRatio = Math.min(1, Math.abs(speedPxPerSec) / 260)

  for (const entry of eventArtCache) {
    const rect = entry.el.getBoundingClientRect()
    const localX = rect.left - stageRect.left
    const localY = rect.top - stageRect.top
    // 视口外（留 120px 余量供提前起浪）直接跳过
    if (localX + rect.width < -120 || localX > stageRect.width + 120) continue
    if (localY + rect.height < 0 || localY > stageRect.height) continue

    if (entry.kind === 'boat') {
      // 静止时船不激起浪花
      if (speedRatio < 0.03) continue
      // 船图是 object-fit: contain 且底部对齐，在又高又窄的事件槽位里
      // 只占元素底部一小条区域；必须先按图片原始宽高比还原船的真实显示框，
      // 否则按元素比例取点会落进上方空白（小新脚下、餐盘底下）。
      const artImg = entry.artImg
      const natW = artImg?.naturalWidth
      const natH = artImg?.naturalHeight
      if (!natW || !natH) continue // 图片尚未加载完成时跳过，加载后自然恢复发射
      const scale = Math.min(rect.width / natW, rect.height / natH)
      const drawW = natW * scale
      const drawH = natH * scale
      const drawX = localX + (rect.width - drawW) / 2 // contain 水平居中
      const drawY = localY + (rect.height - drawH)    // contain 垂直贴底
      const keelY = drawY + drawH * BOAT_KEEL_RATIO
      // 拖后的一端为船尾主喷点；沿荷叶船底布置两个翻腾点；迎水一端给破水小喷点
      const sternX = speedSign >= 0 ? drawX + drawW * 0.88 : drawX + drawW * 0.12
      const bowX = speedSign >= 0 ? drawX + drawW * 0.12 : drawX + drawW * 0.88
      layer.emitBoat(
        [
          { x: sternX, y: drawY + drawH * BOAT_TIP_RATIO },
          { x: sternX + (bowX - sternX) * 0.2, y: keelY },
          { x: drawX + drawW * 0.5, y: drawY + drawH * Math.min(0.97, BOAT_KEEL_RATIO + 0.04) },
          { x: bowX, y: drawY + drawH * BOAT_TIP_RATIO }
        ],
        Math.min(1, speedRatio * 1.15),
        speedSign,
        dtSeconds
      )
    } else if (entry.kind === 'turtle') {
      // 气泡沿身后半边散布；涟漪与移动方向无关
      const rearAnchorX = speedSign >= 0 ? localX + rect.width * 0.4 : localX + rect.width * 0.15
      layer.emitTurtle(rearAnchorX, localY + rect.height * TURTLE_WATERLINE_RATIO, rect.width * 0.5, Math.max(0.35, speedRatio), dtSeconds)
    }
  }
}

const runStreamFrame = (time) => {
  const stream = streamRef.value
  if (!lastFrameTime) lastFrameTime = time
  const deltaSeconds = Math.min(0.05, Math.max(0, (time - lastFrameTime) / 1000))
  lastFrameTime = time

  if (stream) {
    if (streamDrag.pendingScrollLeft !== null) {
      stream.scrollLeft = streamDrag.pendingScrollLeft
      streamDrag.pendingScrollLeft = null
      normalizeStreamPosition()
    }

    // A pointer can be down before the horizontal axis is resolved. Freeze
    // automatic movement during that short window so the first drag pixel
    // never fights the conveyor's own motion.
    if (!isStreamDragging.value && streamDrag.pointerId === null) {
      let scrollDelta = 0
      if (Math.abs(inertiaVelocity) > INERTIA_STOP_VELOCITY) {
        scrollDelta += inertiaVelocity * deltaSeconds
        // v ← sign(v)·(|v|·e^(-dt/τ) − μ·dt)，τ 由松手初速决定：慢甩停得快，快甩滑得远
        const magnitude = Math.abs(inertiaVelocity) * Math.exp(-deltaSeconds / inertiaTimeConstant)
          - INERTIA_CONSTANT_FRICTION * deltaSeconds
        inertiaVelocity = magnitude > 0 ? Math.sign(inertiaVelocity) * magnitude : 0
      } else {
        inertiaVelocity = 0
      }

      if (!streamMotionPaused.value) {
        const directionFactor = props.direction === 'right' ? -1 : 1
        // 传送带是核心内容流，不随系统"减少动态效果"降速；并按屏宽加速，
        // 保证大屏上也能明显看到碟子滑动（1440px 基准 42px/s，4K 约 112px/s）。
        const widthScale = Math.min(3, Math.max(1, (stream.clientWidth || 1440) / 1440))
        scrollDelta += directionFactor * 42 * normalizedSpeed.value * widthScale * deltaSeconds
      }

      if (scrollDelta) stream.scrollLeft += scrollDelta
      normalizeStreamPosition()
    }

    updateStationFocus(time)
  }

  // 滚动更新后定位特殊事件并发射水花粒子；传送带暂停时不再生成新粒子
  if (!streamMotionPaused.value) updateEventSplashes(deltaSeconds)

  streamFrameId = window.requestAnimationFrame(runStreamFrame)
}

const handleCategoryPointerDown = (event) => {
  if (event.pointerType === 'touch' || event.button !== 0) return
  const scroller = categoryScrollerRef.value
  if (!scroller) return
  categoryDrag.pointerId = event.pointerId
  categoryDrag.startX = event.clientX
  categoryDrag.startScrollLeft = scroller.scrollLeft
  categoryDrag.moved = false
}

const handleCategoryPointerMove = (event) => {
  if (categoryDrag.pointerId !== event.pointerId) return
  const scroller = categoryScrollerRef.value
  if (!scroller) return
  const deltaX = event.clientX - categoryDrag.startX
  if (!categoryDrag.moved && Math.abs(deltaX) < 5) return
  if (!categoryDrag.moved) {
    categoryDrag.moved = true
    isCategoryDragging.value = true
    scroller.setPointerCapture?.(event.pointerId)
  }
  if (event.cancelable) event.preventDefault()
  scroller.scrollLeft = categoryDrag.startScrollLeft - deltaX
}

const handleCategoryPointerEnd = (event) => {
  if (categoryDrag.pointerId !== event.pointerId) return
  const scroller = categoryScrollerRef.value
  if (categoryDrag.moved) {
    window.clearTimeout(categoryClickTimer)
    categoryClickTimer = window.setTimeout(() => { categoryDrag.moved = false }, 80)
  }
  if (scroller?.hasPointerCapture?.(event.pointerId)) scroller.releasePointerCapture(event.pointerId)
  categoryDrag.pointerId = null
  isCategoryDragging.value = false
}

const handleCategoryClickCapture = (event) => {
  if (!categoryDrag.moved) return
  event.preventDefault()
  event.stopPropagation()
}

const handleCategoryWheel = (event) => {
  const scroller = categoryScrollerRef.value
  if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
  if (event.cancelable) event.preventDefault()
  scroller.scrollLeft += event.deltaY
}

const handleStreamPointerDown = (event) => {
  if (event.button !== 0) return
  const stream = streamRef.value
  if (!stream) return
  inertiaVelocity = 0
  streamDrag.pointerId = event.pointerId
  streamDrag.startX = event.clientX
  streamDrag.startY = event.clientY
  streamDrag.startScrollLeft = stream.scrollLeft
  streamDrag.axis = ''
  streamDrag.moved = false
  streamDrag.pendingScrollLeft = null
  flickSamples.length = 0
}

const handleStreamPointerMove = (event) => {
  if (streamDrag.pointerId !== event.pointerId) return
  const stream = streamRef.value
  if (!stream) return
  const deltaX = event.clientX - streamDrag.startX
  const deltaY = event.clientY - streamDrag.startY

  if (!streamDrag.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 7) {
    streamDrag.axis = Math.abs(deltaX) > Math.abs(deltaY) * 1.05 ? 'horizontal' : 'vertical'
  }
  if (streamDrag.axis !== 'horizontal') return

  if (!streamDrag.moved) {
    streamDrag.moved = true
    isStreamDragging.value = true
    clearDishPress()
    stream.setPointerCapture?.(event.pointerId)
  }
  if (event.cancelable) event.preventDefault()
  streamDrag.pendingScrollLeft = streamDrag.startScrollLeft - deltaX

  recordFlickSamples(event)
}

const handleStreamPointerEnd = (event) => {
  if (streamDrag.pointerId !== event.pointerId) return
  const stream = streamRef.value
  if (streamDrag.moved) {
    const flickVelocity = estimateFlickVelocity()
    const limit = getFlickVelocityLimit()
    inertiaVelocity = Math.max(-limit, Math.min(limit, flickVelocity))
    inertiaTimeConstant = computeInertiaTimeConstant(Math.abs(inertiaVelocity))
    window.clearTimeout(streamClickTimer)
    streamClickTimer = window.setTimeout(() => { streamDrag.moved = false }, 90)
  }
  flickSamples.length = 0
  if (stream?.hasPointerCapture?.(event.pointerId)) stream.releasePointerCapture(event.pointerId)
  streamDrag.pointerId = null
  streamDrag.axis = ''
  isStreamDragging.value = false
}

const handleStreamClickCapture = (event) => {
  if (!streamDrag.moved) return
  event.preventDefault()
  event.stopPropagation()
}

const handleStreamWheel = (event) => {
  const stream = streamRef.value
  if (!stream) return
  const horizontalDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
    ? event.deltaX
    : (event.shiftKey ? event.deltaY : 0)
  if (!horizontalDelta) return
  if (event.cancelable) event.preventDefault()
  inertiaVelocity = 0
  stream.scrollLeft += horizontalDelta
  normalizeStreamPosition()
}

const selectCategory = (id) => {
  activeCategoryId.value = id
}

const emitDishClick = (item, event) => {
  if (isAvailable(item)) emit('dish-click', item, event)
}

const clearDishPress = () => {
  window.clearTimeout(dishPressTimer)
  pressedDishKey.value = ''
}

const handleDishPointerDown = (entryKey, event) => {
  if (themeKey.value !== 'midnight-station' || event.button !== 0) return
  window.clearTimeout(dishPressTimer)
  pressedDishKey.value = entryKey
  dishPressTimer = window.setTimeout(() => {
    pressedDishKey.value = ''
  }, 120)
}

const handleDishPointerUp = (entryKey) => {
  if (pressedDishKey.value === entryKey) clearDishPress()
}

const handleDishClick = (item, event, entryKey) => {
  clearDishPress()
  if (!isAvailable(item)) return
  if (themeKey.value === 'midnight-station') {
    window.clearTimeout(dishStampTimer)
    selectedDishKey.value = entryKey
    dishStampTimer = window.setTimeout(() => {
      selectedDishKey.value = ''
    }, 380)
  }
  emitDishClick(item, event)
}

// 舞台级热门内容触发物被点击时，把匹配的热门菜品原样上抛给展示页。
const emitFeaturedPromo = (item) => {
  if (isAvailable(item)) emit('featured-promo', item)
}

const handleImageError = (event) => {
  const image = event?.target
  if (!image || image.dataset.fallbackApplied === '1') return
  image.dataset.fallbackApplied = '1'
  image.src = themeKey.value === 'midnight-station'
    ? MIDNIGHT_DEFAULT_DISH_IMAGE
    : LEGACY_DEFAULT_DISH_IMAGE
}

const triggerSceneEntry = async () => {
  window.clearTimeout(sceneEntryTimer)
  if (reducedMotion.value) {
    sceneEntryActive.value = false
    return
  }
  sceneEntryActive.value = false
  await nextTick()
  sceneEntryActive.value = true
  sceneEntryTimer = window.setTimeout(() => {
    sceneEntryActive.value = false
  }, 1100)
}

watch(streamCycleItems, () => {
  // 槽位数量变化会改变循环宽度，缓存必须在重置位置前失效
  invalidateCycleWidth()
  observeStreamSize()
  resetStreamPosition()
  // 槽位列表变化意味着事件元素重建，需要重新收集引用
  rebuildEventArtCache()
  stationFocusMetricsDirty = true
  cacheStationFocusMetrics()
})

watch([themeKey, () => props.entryRevision], randomizeSpecialEventOffset)
// 切换场景后船/海龟元素整体更换，同样重建缓存
watch(themeKey, () => {
  clearStationFocusStyles()
  rebuildEventArtCache()
  cacheStationFocusMetrics()
})
watch(() => props.entryRevision, (nextRevision, previousRevision) => {
  if (nextRevision === previousRevision) return
  triggerSceneEntry()
})

onMounted(() => {
  reducedMotion.value = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
  randomizeSpecialEventOffset()
  triggerSceneEntry()
  if (window.ResizeObserver) {
    // 容器尺寸变化（含窗口缩放）会使 clamp() 槽距变化，届时失效循环宽度缓存
    streamResizeObserver = new ResizeObserver(() => {
      invalidateCycleWidth()
      stationFocusMetricsDirty = true
    })
    observeStreamSize()
  }
  resetStreamPosition()
  rebuildEventArtCache()
  streamFrameId = window.requestAnimationFrame(runStreamFrame)
})

onUnmounted(() => {
  streamResizeObserver?.disconnect()
  streamResizeObserver = null
  window.cancelAnimationFrame(streamFrameId)
  window.clearTimeout(categoryClickTimer)
  window.clearTimeout(streamClickTimer)
  window.clearTimeout(sceneEntryTimer)
  window.clearTimeout(dishPressTimer)
  window.clearTimeout(dishStampTimer)
  clearStationFocusStyles()
})
</script>

<style lang="scss" scoped>
.scenic-dish-stage {
  --sea: #159bc8;
  --deep-sea: #086c96;
  --foam: #fffef8;
  --sand: #ffd768;
  --coral: #ef5b3f;
  --ink: #173944;
  --stream-gap: clamp(64px, 3.5vw, 134px);
  --stream-drop: clamp(104px, 10vh, 142px);
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 390px;
  overflow: hidden;
  color: var(--ink);
}

.scenic-dish-stage.is-scene-entering {
  animation: scenic-stage-enter 1100ms cubic-bezier(0.22, 0.72, 0.24, 1) both;
  will-change: opacity, transform, filter;
}

.scenic-dish-stage.is-underwater-theme {
  --sea: #0d92bd;
  --deep-sea: #075b91;
  --foam: #e5fbff;
  --sand: #9ce7f0;
  --coral: #ff9274;
  --ink: #073b5d;
}

.scenic-dish-stage.is-underwater-theme .tide-current::after {
  opacity: 0.72;
  filter: hue-rotate(14deg) saturate(0.8);
}

@keyframes scenic-stage-enter {
  0% {
    opacity: 0;
    transform: translate3d(0, 18px, 0) scale(0.985);
    filter: blur(5px);
  }
  58% {
    opacity: 0.94;
    transform: translate3d(0, -2px, 0) scale(1.002);
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scenic-dish-stage.is-scene-entering { animation: none; }
}

.tide-toolbar {
  position: absolute;
  bottom: 4px;
  left: 50%;
  z-index: 50;
  width: min(1560px, calc(100% - 32px));
  min-height: 54px;
  display: flex;
  align-items: center;
  gap: 12px;
  transform: translateX(-50%);
}

.tide-categories {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  gap: 9px;
  overflow-x: auto;
  padding: 5px;
  scrollbar-width: none;
  scroll-behavior: smooth;
  scroll-snap-type: x proximity;
  overscroll-behavior-inline: contain;
  touch-action: pan-x;
  cursor: grab;
  user-select: none;
}

.tide-categories::-webkit-scrollbar { display: none; }

.tide-categories.is-dragging {
  cursor: grabbing;
  scroll-behavior: auto;
}

.tide-categories button,
.tide-pause {
  flex: 0 0 auto;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.82);
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 5px 12px rgba(8, 94, 132, 0.16);
  cursor: pointer;
  backdrop-filter: blur(7px);
}

.tide-categories button {
  min-height: 50px;
  padding: 11px 22px;
  border-radius: 25px;
  font-size: 18px;
  font-weight: 800;
  scroll-snap-align: start;
}

.tide-categories button:hover,
.tide-categories button:focus-visible,
.tide-pause:hover,
.tide-pause:focus-visible {
  color: #fff;
  background: var(--deep-sea);
}

.tide-categories button.is-active {
  color: #fff;
  background: var(--coral);
}

.tide-pause {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 50%;
}

.tide-stage {
  position: absolute;
  inset: 0 0 62px;
  z-index: 2;
  overflow: hidden;
}

.tide-current {
  position: absolute;
  left: -8%;
  width: 116%;
  pointer-events: none;
  border-top: solid rgba(255, 255, 255, 0.82);
  border-radius: 50%;
  filter: drop-shadow(0 6px 0 rgba(21, 155, 200, 0.18));
}

.tide-current::after {
  content: '';
  position: absolute;
  top: -20px;
  left: 0;
  width: 100%;
  height: 28px;
  background: radial-gradient(
    circle at 50% 100%,
    transparent 15px,
    rgba(255, 255, 255, 0.78) 16px 20px,
    transparent 21px
  ) 0 0 / 82px 28px repeat-x;
  animation: foam-drift 12s linear infinite;
}

.tide-current--back {
  top: 22%;
  height: 25%;
  border-top-width: 7px;
  opacity: 0.64;
  transform: rotate(1.4deg);
}

.tide-current--middle {
  top: 49%;
  height: 27%;
  border-top-width: 10px;
  opacity: 0.82;
  transform: rotate(-1.2deg);
}

.tide-current--middle::after {
  animation-direction: reverse;
  animation-duration: 15s;
}

.tide-current--front {
  top: 76%;
  height: 20%;
  border-top-width: 13px;
  transform: rotate(1deg);
}

.is-reversed .tide-current::after {
  animation-direction: reverse;
}

.is-reversed .tide-current--middle::after {
  animation-direction: normal;
}

.tide-stream {
  position: absolute;
  inset: 2px 0 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  scroll-behavior: auto;
  overscroll-behavior-inline: contain;
  overscroll-behavior-x: contain;
  touch-action: pan-y;
  cursor: grab;
  user-select: none;
  will-change: scroll-position;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  -webkit-overflow-scrolling: touch;
}

.tide-stream::-webkit-scrollbar { display: none; }

.is-dragging .tide-stream { cursor: grabbing; }

.tide-track {
  width: max-content;
  height: 100%;
  display: flex;
}

.tide-cycle {
  height: 100%;
  display: flex;
  align-items: flex-start;
  gap: var(--stream-gap);
  padding-right: var(--stream-gap);
  flex: 0 0 auto;
}

.tide-slot {
  width: clamp(210px, 11vw, 300px);
  height: 100%;
  flex: 0 0 clamp(210px, 11vw, 300px);
  padding-top: calc(var(--wave-offset) + var(--stream-drop));
}

.tide-slot.is-queue-event {
  /* A special event consumes two ordinary delivery slots plus their gap. */
  width: calc((clamp(176px, 9vw, 270px) * 2) + var(--stream-gap));
  flex-basis: calc((clamp(176px, 9vw, 270px) * 2) + var(--stream-gap));
  padding-top: calc(var(--wave-offset) + var(--stream-drop));
}

/* Scene-level promo object. It is independent from the moving boat/turtle. */
.scene-promo-trigger {
  position: absolute;
  top: clamp(20px, 6vh, 76px);
  right: clamp(24px, 7vw, 120px);
  z-index: 12;
  width: clamp(58px, 5.4vw, 94px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  filter: drop-shadow(0 7px 12px rgba(8, 94, 132, .28));
}

.scene-promo-trigger img {
  position: relative;
  z-index: 2;
  width: 78%;
  height: 78%;
  object-fit: contain;
  border-radius: 50%;
  background: rgba(235, 250, 255, .92);
  padding: 4px;
  animation: scene-promo-float 2.4s ease-in-out infinite;
}

.scene-promo-trigger__pulse {
  position: absolute;
  inset: 4%;
  border: 2px solid rgba(155, 231, 255, .78);
  border-radius: 50%;
  animation: scene-promo-pulse 2.6s ease-out infinite;
}

.scene-promo-trigger.is-zhenxian img { background: rgba(255, 247, 232, .94); }

@keyframes scene-promo-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes scene-promo-pulse { 0%, 100% { opacity: .72; transform: scale(.84); } 60% { opacity: 0; transform: scale(1.22); } }

@media (max-width: 600px) {
  .scene-promo-trigger { top: 16px; right: 20px; width: 58px; }
}

@media (prefers-reduced-motion: reduce) {
  .scene-promo-trigger img, .scene-promo-trigger__pulse { animation: none; }
}

/* Shin-chan's lotus boat belongs to the lower shallow-water lane. It should
   not inherit the ordinary dish wave offsets, which made the event jump
   between water bands and look detached from the beach scene. */
.scenic-dish-stage.is-beach-theme .tide-slot.is-queue-event {
  /* Lift the enlarged boat by roughly one ordinary dish position while it
   remains in the lower shallow-water lane. */
  padding-top: clamp(100px, 12vh, 160px);
}

/* The turtle also travels in the lower underwater lane so its enlarged
   event stays readable without colliding with the ordinary dish waves. */
.scenic-dish-stage.is-underwater-theme .tide-slot.is-queue-event {
  padding-top: clamp(106px, 13vh, 176px);
}

.tide-dish {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: clamp(220px, 10vw, 250px);
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  justify-items: center;
  gap: 3px;
  padding: 11px 16px 13px;
  color: var(--ink);
  background: transparent;
  border: 0;
  border-radius: 38% 42% 46% 44%;
  cursor: pointer;
  transform-origin: 50% 70%;
  animation: dish-bob var(--bob-duration) ease-in-out var(--float-delay) infinite;
  will-change: transform;
}

.tide-dish::after {
  content: '';
  position: absolute;
  left: 10%;
  bottom: -4px;
  z-index: 0;
  width: 80%;
  height: 24px;
  background: radial-gradient(ellipse, rgba(8, 108, 150, 0.24), transparent 68%);
  border-radius: 50%;
  filter: blur(4px);
  pointer-events: none;
}

.tide-dish:hover .tide-dish__shell,
.tide-dish:focus-visible .tide-dish__shell {
  filter: drop-shadow(0 16px 17px rgba(8, 94, 132, 0.3)) brightness(1.05);
  transform: translateY(-2px) scale(1.025);
}

.tide-dish:focus-visible {
  outline: 3px solid var(--sand);
  outline-offset: 2px;
}

.tide-dish__shell {
  position: absolute;
  inset: -24px -34px -26px;
  z-index: 1;
  width: calc(100% + 68px);
  height: calc(100% + 50px);
  object-fit: fill;
  pointer-events: none;
  filter: drop-shadow(0 12px 14px rgba(8, 94, 132, 0.24));
  transition: filter 0.2s ease, transform 0.2s ease;
}

.tide-dish__chef-tray {
  display: none;
}

.tide-dish__beach-board {
  display: none;
}

.tide-dish__image,
.tide-dish__copy {
  position: relative;
  z-index: 2;
  transform: translateY(-80px);
}

.tide-slot.is-recommended .tide-dish__shell {
  filter: drop-shadow(0 12px 14px rgba(239, 91, 63, 0.24));
}

.tide-slot.is-sold-out {
  pointer-events: none;
}

/* 只降低菜品本体透明度，保证售罄角标保持全不透明。 */
// .tide-slot.is-sold-out .tide-dish > :not(.tide-dish__soldout) {
//   opacity: 0.45;
// }

// .tide-slot.is-sold-out .tide-dish::after {
//   opacity: 0.45;
// }

.tide-dish__soldout {
  position: absolute;
  left: 50%;
  top: 38%;
  z-index: 5;
  margin: 0;
  padding: 5px 16px;
  border-radius: 999px;
  transform: translate(-50%, -50%) rotate(-10deg);
  font-size: clamp(13px, 0.85vw, 17px);
  font-weight: 700;
  letter-spacing: 2px;
  color: #fff;
  background: rgba(232, 62, 48, 0.94);
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 18px rgba(8, 94, 132, 0.3);
  pointer-events: none;
}

.tide-dish__image {
  width: clamp(160px, 8vw, 210px);
  aspect-ratio: 1;
  overflow: hidden;
  border: 0;
  border-radius: 50%;
  background: transparent;
  box-shadow: 0 4px 12px rgba(8, 108, 150, 0.2);
  margin-top: 2px;
}

.tide-dish__image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
}

.tide-dish__copy {
  min-width: 0;
  width: calc(100% - 14px);
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 7px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.62);
  border-radius: 10px;
}

.tide-dish__copy h3 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--ink);
  font-size: clamp(13px, 0.78vw, 18px);
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tide-dish__copy strong {
  flex: 0 0 auto;
  color: var(--coral);
  font-size: clamp(14px, 0.85vw, 19px);
}

.tide-dish__ai {
  position: absolute;
  top: 2px;
  right: 8px;
  z-index: 3;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--coral);
  border: 2px solid #fff;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 900;
}

.tide-empty {
  position: absolute;
  left: 50%;
  top: 54%;
  z-index: 30;
  padding: 10px 18px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.84);
  border: 2px solid #fff;
  border-radius: 8px;
  transform: translate(-50%, -50%);
  backdrop-filter: blur(8px);
}

.scenic-dish-stage.is-paused .tide-dish,
.scenic-dish-stage.is-paused .tide-current::after {
  animation-play-state: paused;
}

@keyframes foam-drift {
  from { background-position-x: 0; }
  to { background-position-x: 164px; }
}

@keyframes dish-bob {
  0% {
    transform: translate3d(0, var(--lift-up), 0) rotate(var(--tilt-start));
  }
  25% {
    transform: translate3d(0, var(--lift-soft), 0) rotate(var(--tilt-main));
  }
  55% {
    transform: translate3d(0, var(--lift-down), 0) rotate(var(--tilt-soft));
  }
  78% {
    transform: translate3d(0, var(--lift-return), 0) rotate(var(--tilt-return));
  }
  100% {
    transform: translate3d(0, var(--lift-up), 0) rotate(var(--tilt-start));
  }
}

/* The beach uses shallow-water drift rafts; the underwater scene keeps the
   shell tray. The raft is intentionally quiet so the dish remains primary. */
.scenic-dish-stage.is-beach-theme .tide-dish__shell {
  display: none;
}

.scenic-dish-stage.is-beach-theme .tide-dish__beach-board {
  position: absolute;
  inset: 3px -28px -6px;
  z-index: 1;
  display: block;
  background: url('/images/ui/b/shallow-drift-raft.png') center / 100% 100% no-repeat;
  filter: drop-shadow(0 10px 11px rgba(8, 94, 132, 0.24));
  pointer-events: none;
  transition: filter 0.2s ease, transform 0.2s ease;
}

.scenic-dish-stage.is-beach-theme .tide-dish__beach-board::before {
  content: '';
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: -3px;
  height: 14px;
  border-top: 2px solid rgba(255, 255, 255, 0.62);
  border-radius: 50%;
  opacity: 0.72;
  transform: scaleY(0.52);
}

.scenic-dish-stage.is-beach-theme .tide-dish__beach-board::after {
  content: '';
  position: absolute;
  left: -12%;
  bottom: 3px;
  width: 30%;
  height: 7px;
  border-top: 2px solid rgba(255, 255, 255, 0.48);
  border-radius: 50%;
  opacity: 0.68;
}

.scenic-dish-stage.is-beach-theme .tide-dish:hover .tide-dish__beach-board,
.scenic-dish-stage.is-beach-theme .tide-dish:focus-visible .tide-dish__beach-board {
  filter: brightness(1.06);
  transform: translateY(-2px) scale(1.02);
}

.scenic-dish-stage.is-beach-theme .tide-slot.is-recommended .tide-dish__beach-board {
  filter: drop-shadow(0 10px 11px rgba(239, 91, 63, 0.3)) brightness(1.04);
}

/* The chef artwork uses a fixed-height serving rail instead of the water
   themes' wave profile. Every dish gets the same tray, image frame, and
   motion so its position on the rail does not change its visual importance. */
.scenic-dish-stage.is-chef-theme {
  --stream-gap: clamp(48px, 2.8vw, 96px);
  --chef-tray: #8f4e27;
  --chef-tray-dark: #512817;
  --chef-ink: #3b2115;
  --chef-cream: #fff4df;
}

.scenic-dish-stage.is-chef-theme .tide-current {
  display: none;
}

.scenic-dish-stage.is-chef-theme .tide-stage {
  inset: 0 0 62px;
}

.scenic-dish-stage.is-chef-theme .tide-cycle {
  align-items: flex-end;
  padding-bottom: 4px;
}

.scenic-dish-stage.is-chef-theme .tide-slot {
  width: clamp(190px, 10vw, 270px);
  height: auto;
  flex-basis: clamp(190px, 10vw, 270px);
  padding-top: 0;
}

.scenic-dish-stage.is-chef-theme .tide-dish {
  height: clamp(210px, 11vw, 248px);
  padding: 13px 15px 12px;
  grid-template-rows: minmax(0, 1fr) 34px;
  gap: 5px;
  border-radius: 10px;
  animation: chef-dish-rest var(--bob-duration) ease-in-out var(--float-delay) infinite;
}

.scenic-dish-stage.is-chef-theme .tide-dish__shell {
  display: none;
}

.scenic-dish-stage.is-chef-theme .tide-dish__chef-tray {
  position: absolute;
  inset: 0 -18px -2px;
  z-index: 1;
  display: block;
  border: 4px solid var(--chef-tray-dark);
  border-radius: 16px 16px 22px 22px;
  background:
    linear-gradient(90deg, rgba(255, 232, 178, 0.28), transparent 24%, rgba(48, 14, 5, 0.2) 75%, rgba(255, 236, 190, 0.2)),
    linear-gradient(180deg, #b96c37 0%, var(--chef-tray) 48%, #713516 100%);
  box-shadow: 0 13px 14px rgba(46, 18, 7, 0.28), inset 0 2px 0 rgba(255, 224, 160, 0.38);
  pointer-events: none;
}

.scenic-dish-stage.is-chef-theme .tide-dish__image {
  width: clamp(120px, 6.4vw, 168px);
  border: 0;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #fffaf2;
  box-shadow: 0 5px 11px rgba(59, 33, 21, 0.23);
}

.scenic-dish-stage.is-chef-theme .tide-dish__copy {
  width: calc(100% - 8px);
  height: 34px;
  box-sizing: border-box;
  padding: 4px 8px;
  color: var(--chef-ink);
  background: rgba(255, 244, 223, 0.95);
  border: 1px solid rgba(81, 40, 23, 0.24);
  border-radius: 5px;
}

.scenic-dish-stage.is-chef-theme .tide-dish__copy h3 {
  color: var(--chef-ink);
  font-size: clamp(13px, 0.78vw, 17px);
}

.scenic-dish-stage.is-chef-theme .tide-dish__copy strong {
  color: #a53d20;
  font-size: clamp(14px, 0.84vw, 18px);
}

.scenic-dish-stage.is-chef-theme .tide-categories button,
.scenic-dish-stage.is-chef-theme .tide-pause {
  color: var(--chef-ink);
  background: rgba(255, 244, 223, 0.92);
  border-color: rgba(255, 244, 223, 0.98);
  box-shadow: 0 5px 12px rgba(59, 33, 21, 0.2);
}

.scenic-dish-stage.is-chef-theme .tide-categories button:hover,
.scenic-dish-stage.is-chef-theme .tide-categories button:focus-visible,
.scenic-dish-stage.is-chef-theme .tide-pause:hover,
.scenic-dish-stage.is-chef-theme .tide-pause:focus-visible {
  color: var(--chef-cream);
  background: var(--chef-tray-dark);
}

.scenic-dish-stage.is-chef-theme .tide-categories button.is-active {
  color: var(--chef-cream);
  background: #a53d20;
}

@keyframes chef-dish-rest {
  0%, 100% { transform: translate3d(0, -2px, 0) rotate(-0.25deg); }
  50% { transform: translate3d(0, 2px, 0) rotate(0.25deg); }
}

@media (min-width: 1921px) {
  .scenic-dish-stage {
    /* 3840px screen: eight 358px dishes with seven existing 134px gaps use 3802px. */
    --stream-drop: clamp(128px, 12vh, 168px);
    min-height: 470px;
  }
  .tide-toolbar {
    bottom: 6px;
    width: min(1780px, calc(100% - 48px));
  }
  .tide-categories button {
    min-height: 56px;
    padding: 13px 26px;
    border-radius: 28px;
    font-size: 20px;
  }
  .tide-pause { width: 50px; height: 50px; }
  .tide-stage { inset: 0 0 70px; }

  .tide-slot:not(.is-queue-event) {
    width: 358px;
    flex-basis: 358px;
  }

  .tide-dish {
    height: 320px;
  }

  .tide-dish__image {
    width: 280px;
  }

  .tide-dish__shell {
    inset: -30px -48px -32px;
    width: calc(100% + 96px);
    height: calc(100% + 62px);
  }

  .scenic-dish-stage.is-beach-theme .tide-dish__beach-board {
    inset: 0 -42px -10px;
  }

  .scenic-dish-stage.is-chef-theme .tide-dish__chef-tray {
    inset: -2px -24px -4px;
  }

  .scenic-dish-stage.is-chef-theme .tide-slot:not(.is-queue-event) {
    width: 358px;
    flex-basis: 358px;
  }

  .scenic-dish-stage.is-chef-theme .tide-dish:not(.is-queue-event) {
    height: 320px;
  }

  .scenic-dish-stage.is-chef-theme .tide-dish__image {
    width: 280px;
  }
}

@media (max-width: 900px) {
  .scenic-dish-stage {
    --stream-gap: 44px;
    --stream-drop: 72px;
  }
  .tide-toolbar { width: calc(100% - 20px); }
  .tide-slot {
    width: 190px;
    flex-basis: 190px;
  }
  .tide-slot.is-queue-event {
    width: calc((158px * 2) + var(--stream-gap));
    flex-basis: calc((158px * 2) + var(--stream-gap));
  }

  .scenic-dish-stage.is-beach-theme .tide-slot.is-queue-event {
    padding-top: 96px;
  }
  .scenic-dish-stage.is-underwater-theme .tide-slot.is-queue-event {
    padding-top: 104px;
  }
  .tide-dish { height: 200px; }
  .tide-dish__image { width: 140px; }
  .scenic-dish-stage.is-chef-theme {
    --stream-gap: 42px;
  }

  .scenic-dish-stage.is-chef-theme .tide-slot {
    width: 176px;
    flex-basis: 176px;
    padding-top: 0;
  }

  .scenic-dish-stage.is-chef-theme .tide-dish {
    height: 190px;
    padding-inline: 12px;
    grid-template-rows: minmax(0, 1fr) 30px;
  }

  .scenic-dish-stage.is-chef-theme .tide-dish__image { width: 112px; }
  .scenic-dish-stage.is-chef-theme .tide-dish__copy { height: 30px; }
}

@media (max-width: 600px) {
  .scenic-dish-stage {
    --stream-gap: 34px;
    --stream-drop: 50px;
    min-height: 430px;
  }
  .tide-toolbar { bottom: 0; align-items: center; }
  .tide-categories { padding-inline: 0; }
  .tide-categories button { min-height: 44px; padding: 9px 16px; font-size: 15px; }
  .tide-pause { width: 40px; height: 40px; }
  .tide-stage { inset: 0 0 54px; }

  .tide-slot {
    width: 170px;
    flex-basis: 170px;
  }
  .tide-slot.is-queue-event {
    width: calc((142px * 2) + var(--stream-gap));
    flex-basis: calc((142px * 2) + var(--stream-gap));
  }

  .scenic-dish-stage.is-beach-theme .tide-slot.is-queue-event {
    padding-top: 76px;
  }
  .scenic-dish-stage.is-underwater-theme .tide-slot.is-queue-event {
    padding-top: 82px;
  }

  .tide-dish { height: 184px; padding: 8px 10px 10px; }
  .tide-dish__shell { inset: -18px -25px -20px; width: calc(100% + 50px); height: calc(100% + 38px); }
  .tide-dish__image { width: 120px; }
  .tide-dish__copy { gap: 4px; }
  .tide-dish__copy h3 { max-width: 82px; font-size: 11px; }
  .tide-dish__copy strong { font-size: 12px; }
  .scenic-dish-stage.is-chef-theme {
    --stream-gap: 34px;
    min-height: 430px;
  }

  .scenic-dish-stage.is-chef-theme .tide-slot {
    width: 152px;
    flex-basis: 152px;
    padding-top: 0;
  }

  .scenic-dish-stage.is-chef-theme .tide-dish {
    height: 166px;
    padding: 8px 9px 9px;
    grid-template-rows: minmax(0, 1fr) 25px;
    gap: 3px;
  }

  .scenic-dish-stage.is-chef-theme .tide-dish__chef-tray {
    inset: 0 -14px -2px;
    border-width: 3px;
    border-radius: 12px 12px 16px 16px;
  }

  .scenic-dish-stage.is-chef-theme .tide-dish__image {
    width: 96px;
    border-width: 0;
    border-radius: 50%;
  }

  .scenic-dish-stage.is-chef-theme .tide-dish__copy {
    height: 25px;
    padding: 2px 5px;
  }

  .scenic-dish-stage.is-chef-theme .tide-dish__copy h3 { font-size: 11px; }
  .scenic-dish-stage.is-chef-theme .tide-dish__copy strong { font-size: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .tide-dish { animation-duration: 9000ms; }
  .tide-current::after { animation-duration: 24s; }
}

/* Ordinary dishes travel on one horizontal lane. Event slots keep their
   independent wave offsets and component animations. */
.scenic-dish-stage .tide-slot:not(.is-queue-event) {
  padding-top: calc(var(--stream-drop) + 180px);
}

.scenic-dish-stage .tide-slot:not(.is-queue-event) .tide-dish {
  animation: dish-bob var(--bob-duration) ease-in-out var(--float-delay) infinite;
}

/* Midnight Station foundation: a quiet rail stage, paper dish tickets and
   signal-like controls. Phase 01 deliberately keeps the existing horizontal
   conveyor interaction and omits special-event art/complex choreography. */
.scenic-dish-stage.is-midnight-station {
  --ink: var(--station-text-on-surface);
  --stream-gap: clamp(48px, 3vw, 112px);
  --stream-drop: clamp(76px, 8vh, 126px);
  color: var(--station-text-primary);
  background: transparent;
}

.scenic-dish-stage.is-midnight-station .tide-stage {
  inset: 0 0 62px;
  background: var(--station-overlay-faint);
}

.scenic-dish-stage.is-midnight-station .tide-stage::before,
.scenic-dish-stage.is-midnight-station .tide-stage::after {
  position: absolute;
  z-index: 0;
  content: '';
  pointer-events: none;
}

.scenic-dish-stage.is-midnight-station .tide-stage::before {
  left: 4%;
  right: 4%;
  top: 28%;
  bottom: 21%;
  border-top: 1px solid var(--station-paper-line);
  border-bottom: 1px solid var(--station-paper-line-soft);
}

.scenic-dish-stage.is-midnight-station .tide-stage::after {
  left: 7%;
  right: 7%;
  top: 52%;
  border-top: 1px solid var(--station-accent-line);
}

.scenic-dish-stage.is-midnight-station .tide-current {
  left: 6%;
  width: 88%;
  height: 18px;
  border: 0;
  border-top: 2px solid var(--station-accent-line-strong);
  border-radius: 0;
  filter: none;
  opacity: 1;
  transform: none;
}

.scenic-dish-stage.is-midnight-station .tide-current::after {
  top: 7px;
  height: 1px;
  background: none;
  border-top: 1px dashed var(--station-paper-dash);
  animation: none;
}

.scenic-dish-stage.is-midnight-station .tide-current--back { top: 31%; }
.scenic-dish-stage.is-midnight-station .tide-current--middle { top: 53%; }
.scenic-dish-stage.is-midnight-station .tide-current--front { top: 75%; }

.scenic-dish-stage.is-midnight-station .tide-toolbar {
  gap: var(--station-space-2);
}

.scenic-dish-stage.is-midnight-station .tide-categories button,
.scenic-dish-stage.is-midnight-station .tide-pause {
  color: var(--station-text-primary);
  background: var(--station-background-deep);
  border: 1px solid var(--station-border);
  border-radius: var(--station-radius-control);
  box-shadow: var(--station-shadow-e0);
  backdrop-filter: none;
  transition: color var(--station-motion-fast) ease,
    background-color var(--station-motion-fast) ease,
    border-color var(--station-motion-fast) ease,
    transform var(--station-motion-instant) ease;
}

.scenic-dish-stage.is-midnight-station .tide-categories button {
  min-height: 48px;
  padding: 10px 18px;
  font-family: var(--station-font-number);
  font-size: var(--station-size-ticket);
  font-weight: 700;
  letter-spacing: 0.06em;
}

.scenic-dish-stage.is-midnight-station .tide-categories button:hover,
.scenic-dish-stage.is-midnight-station .tide-categories button:focus-visible,
.scenic-dish-stage.is-midnight-station .tide-pause:hover,
.scenic-dish-stage.is-midnight-station .tide-pause:focus-visible {
  color: var(--station-text-on-surface);
  background: var(--station-hover);
  border-color: var(--station-accent);
  transform: translateY(-1px);
}

.scenic-dish-stage.is-midnight-station .tide-categories button.is-active {
  color: var(--station-text-primary);
  background: var(--station-primary);
  border-color: var(--station-primary);
}

.scenic-dish-stage.is-midnight-station .tide-pause {
  width: 48px;
  height: 48px;
}

.scenic-dish-stage.is-midnight-station .tide-stream {
  z-index: 3;
}

.scenic-dish-stage.is-midnight-station .tide-slot:not(.is-queue-event) {
  width: clamp(210px, 10vw, 330px);
  flex-basis: clamp(210px, 10vw, 330px);
  padding-top: clamp(76px, 8vh, 126px);
}

.scenic-dish-stage.is-midnight-station .tide-dish::after,
.scenic-dish-stage.is-midnight-station .tide-dish__shell,
.scenic-dish-stage.is-midnight-station .tide-dish__beach-board,
.scenic-dish-stage.is-midnight-station .tide-dish__chef-tray {
  display: none;
}

.scenic-dish-stage.is-midnight-station .tide-dish__soldout {
  padding: 5px 12px;
  color: var(--station-text-primary);
  background: var(--station-error);
  border: 1px solid var(--station-surface-elevated);
  border-radius: var(--station-radius-ticket);
  box-shadow: var(--station-shadow-e1);
  transform: translate(-50%, -50%);
}

.scenic-dish-stage.is-midnight-station .tide-empty {
  color: var(--station-text-primary);
  background: var(--station-background-deep);
  border: 1px solid var(--station-border);
  border-radius: var(--station-radius-control);
  box-shadow: var(--station-shadow-e1);
  backdrop-filter: none;
}

@media (min-width: 1921px) {
  .scenic-dish-stage.is-midnight-station .tide-slot:not(.is-queue-event) {
    width: 330px;
    flex-basis: 330px;
  }

  .scenic-dish-stage.is-midnight-station .tide-categories button { min-height: 52px; }
}

@media (max-width: 900px) {
  .scenic-dish-stage.is-midnight-station .tide-slot:not(.is-queue-event) {
    width: 190px;
    flex-basis: 190px;
    padding-top: 78px;
  }

  .scenic-dish-stage.is-midnight-station .tide-categories button { min-height: 46px; padding-inline: 14px; }
}

@media (max-width: 600px) {
  .scenic-dish-stage.is-midnight-station .tide-slot:not(.is-queue-event) {
    width: 170px;
    flex-basis: 170px;
    padding-top: 56px;
  }

  .scenic-dish-stage.is-midnight-station .tide-pause { width: 44px; height: 44px; }
}

@media (prefers-reduced-motion: reduce) {
  .scenic-dish-stage.is-midnight-station .tide-categories button:hover,
  .scenic-dish-stage.is-midnight-station .tide-categories button:focus-visible,
  .scenic-dish-stage.is-midnight-station .tide-pause:hover,
  .scenic-dish-stage.is-midnight-station .tide-pause:focus-visible {
    transition: none;
    transform: none;
  }
}

/* Midnight Station motion system: one real horizontal stream, three visual
   depth lanes. Scroll, drag and inertia remain owned by the existing stream. */
.scenic-dish-stage.is-midnight-station .tide-slot:not(.is-queue-event) {
  position: relative;
  z-index: var(--station-lane-z, 2);
  opacity: var(--station-focus-opacity, var(--station-lane-opacity, 1));
  transform: translate3d(0, var(--station-lane-y, 0px), 0) scale(var(--station-lane-scale, 1));
  filter: brightness(var(--station-focus-brightness, var(--station-lane-brightness, 1)));
  transition: transform var(--station-motion-normal) var(--station-easing-standard),
    opacity var(--station-motion-normal) ease,
    filter var(--station-motion-normal) ease;
}

.scenic-dish-stage.is-midnight-station .tide-slot[data-station-focus] {
  z-index: 8;
}

.scenic-dish-stage.is-midnight-station .tide-dish {
  position: relative;
  overflow: visible;
}

.scenic-dish-stage.is-midnight-station .station-platform-marker {
  position: absolute;
  left: 19%;
  right: 19%;
  bottom: -10px;
  height: 3px;
  display: block;
  background: var(--station-accent);
  border-radius: var(--station-radius-small);
  opacity: 0.26;
  transform: scaleX(0.42);
  transform-origin: center;
  transition: opacity var(--station-motion-fast) ease,
    transform var(--station-motion-fast) var(--station-easing-standard);
}

.scenic-dish-stage.is-midnight-station .tide-slot[data-station-focus] .station-platform-marker,
.scenic-dish-stage.is-midnight-station .tide-dish:hover .station-platform-marker,
.scenic-dish-stage.is-midnight-station .tide-dish:focus-visible .station-platform-marker {
  opacity: 0.96;
  transform: scaleX(1);
}

.scenic-dish-stage.is-midnight-station .station-dish-stamp {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 5;
  padding: 4px 6px;
  color: var(--station-text-primary);
  background: var(--station-primary);
  border: 1px solid var(--station-accent);
  border-radius: var(--station-radius-ticket);
  font-family: var(--station-font-number);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  pointer-events: none;
  animation: station-dish-stamp var(--station-motion-stamp) var(--station-easing-enter) both;
}

.scenic-dish-stage.is-midnight-station .tide-dish.is-station-pressed {
  box-shadow: var(--station-shadow-pressed);
  transform: translateY(1px) scale(0.985);
}

.scenic-dish-stage.is-midnight-station .tide-dish.is-station-stamped {
  border-color: var(--station-accent);
}

.scenic-dish-stage.is-midnight-station .tide-dish.is-station-stamped .tide-dish__copy {
  border-top-color: var(--station-accent);
}

.scenic-dish-stage.is-midnight-station .station-platform-hold {
  position: absolute;
  left: 50%;
  top: 48%;
  z-index: 20;
  min-width: 190px;
  padding: 10px 18px;
  display: grid;
  gap: 3px;
  color: var(--station-text-on-surface);
  background: var(--station-surface);
  border: 1px solid var(--station-accent);
  border-radius: var(--station-radius-ticket);
  box-shadow: var(--station-shadow-e2);
  text-align: center;
  transform: translate(-50%, -50%);
  animation: station-hold-in var(--station-motion-normal) var(--station-easing-enter) both;
}

.station-platform-hold strong {
  color: var(--station-primary-strong);
  font-family: var(--station-font-number);
  font-size: var(--station-size-ticket);
  letter-spacing: 0.12em;
}

.station-platform-hold span {
  color: var(--station-text-muted);
  font-family: var(--station-font-ui);
  font-size: var(--station-size-body);
}

.scenic-dish-stage.is-midnight-station.is-scene-entering {
  animation: station-stage-open var(--station-motion-scene) var(--station-easing-enter) both;
  filter: none;
}

.scenic-dish-stage.is-midnight-station.is-scene-entering .tide-current {
  animation: station-rail-deploy 760ms var(--station-easing-enter) both;
}

.scenic-dish-stage.is-midnight-station.is-scene-entering .tide-current--back { animation-delay: 120ms; }
.scenic-dish-stage.is-midnight-station.is-scene-entering .tide-current--middle { animation-delay: 210ms; }
.scenic-dish-stage.is-midnight-station.is-scene-entering .tide-current--front { animation-delay: 300ms; }

.scenic-dish-stage.is-midnight-station.is-scene-entering .tide-cycle:nth-child(2) .tide-slot:not(.is-queue-event) {
  animation: station-dish-arrive 600ms var(--station-easing-enter) var(--station-entry-delay) both;
}

.scenic-dish-stage.is-midnight-station.is-paused .tide-current,
.scenic-dish-stage.is-midnight-station.is-paused .tide-cycle:nth-child(2) .tide-slot {
  animation-play-state: paused;
}

@keyframes station-stage-open {
  0% { opacity: 0.68; transform: translate3d(0, 7px, 0); }
  52% { opacity: 0.94; transform: translate3d(0, -1px, 0); }
  100% { opacity: 1; transform: translate3d(0, 0, 0); }
}

@keyframes station-rail-deploy {
  from { opacity: 0; transform: translateX(-1%) scaleX(0.12); transform-origin: center; }
  to { opacity: 1; transform: translateX(0) scaleX(1); transform-origin: center; }
}

@keyframes station-dish-arrive {
  from {
    opacity: 0;
    transform: translate3d(0, var(--station-lane-y, 0px), 0) scale(0.92);
  }
  68% {
    opacity: var(--station-focus-opacity, var(--station-lane-opacity, 1));
    transform: translate3d(0, var(--station-lane-y, 0px), 0) scale(1.018);
  }
  to {
    opacity: var(--station-focus-opacity, var(--station-lane-opacity, 1));
    transform: translate3d(0, var(--station-lane-y, 0px), 0) scale(var(--station-lane-scale, 1));
  }
}

@keyframes station-dish-stamp {
  0% { opacity: 0; transform: translateY(4px) rotate(-3deg); }
  22% { opacity: 1; transform: translateY(0) rotate(-3deg); }
  78% { opacity: 1; transform: translateY(0) rotate(-3deg); }
  100% { opacity: 0; transform: translateY(-4px) rotate(-3deg); }
}

@keyframes station-hold-in {
  from { opacity: 0; transform: translate(-50%, -46%); }
  to { opacity: 1; transform: translate(-50%, -50%); }
}

@media (prefers-reduced-motion: reduce) {
  .scenic-dish-stage.is-midnight-station.is-scene-entering {
    animation: none !important;
    opacity: 1;
    transform: none;
  }

  .scenic-dish-stage.is-midnight-station .tide-slot:not(.is-queue-event),
  .scenic-dish-stage.is-midnight-station .tide-dish,
  .scenic-dish-stage.is-midnight-station .station-platform-marker,
  .scenic-dish-stage.is-midnight-station .station-platform-hold {
    transition: none;
    animation: none !important;
  }

  .scenic-dish-stage.is-midnight-station.is-scene-entering .tide-current,
  .scenic-dish-stage.is-midnight-station.is-scene-entering .tide-cycle:nth-child(2) .tide-slot:not(.is-queue-event) {
    animation: none !important;
    opacity: var(--station-focus-opacity, var(--station-lane-opacity, 1));
    transform: translate3d(0, var(--station-lane-y, 0px), 0) scale(var(--station-lane-scale, 1));
  }

  .scenic-dish-stage.is-midnight-station .tide-dish.is-station-pressed {
    transform: translateY(1px) scale(0.985);
  }
}

/* Phase 02R visual redesign: the Midnight stage is an architectural space,
   not a set of decorative dividers. The stream remains the interaction model;
   this layer supplies the canopy, columns, platform floor and one physical
   service rail behind the dishes. */
.scenic-dish-stage.is-midnight-station .tide-stage {
  perspective: 900px;
  background: var(--station-background-deep);
}

.scenic-dish-stage.is-midnight-station .tide-stage::before,
.scenic-dish-stage.is-midnight-station .tide-stage::after,
.scenic-dish-stage.is-midnight-station .tide-current {
  display: none;
}

.scenic-dish-stage.is-midnight-station .tide-stream {
  z-index: 4;
}

.scenic-dish-stage.is-midnight-station .tide-slot:not(.is-queue-event) {
  padding-top: clamp(84px, 11vh, 132px);
}

.scenic-dish-stage.is-midnight-station .tide-dish {
  height: clamp(226px, 14vw, 286px);
  padding: 0;
  display: block;
  overflow: visible;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  color: var(--station-text-on-surface);
  transform-origin: 50% 74%;
  transition: transform var(--station-motion-fast) var(--station-easing-standard);
}

.scenic-dish-stage.is-midnight-station .tide-dish:hover,
.scenic-dish-stage.is-midnight-station .tide-dish:focus-visible {
  border: 0;
  background: transparent;
  box-shadow: none;
  transform: translateY(-4px);
}

.scenic-dish-stage.is-midnight-station .tide-dish:focus-visible {
  outline: 3px solid var(--station-accent);
  outline-offset: 5px;
}

.scenic-dish-stage.is-midnight-station .tide-dish__shell,
.scenic-dish-stage.is-midnight-station .tide-dish__beach-board,
.scenic-dish-stage.is-midnight-station .tide-dish__chef-tray {
  display: none;
}

.scenic-dish-stage.is-midnight-station .station-dish-plate {
  position: absolute;
  left: 50%;
  top: 16px;
  z-index: 1;
  width: 88%;
  height: 132px;
  display: block;
  border-radius: 50%;
  background: var(--station-surface-elevated);
  box-shadow: 0 10px 0 var(--station-surface-muted), 0 17px 20px rgba(8, 12, 10, 0.38);
  transform: translateX(-50%) perspective(720px) rotateX(9deg);
  transform-origin: center bottom;
  transition: transform var(--station-motion-fast) var(--station-easing-standard),
    box-shadow var(--station-motion-fast) ease;
}

.scenic-dish-stage.is-midnight-station .station-dish-plate__surface {
  position: absolute;
  inset: 10px;
  display: block;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 50% 38%, rgba(255, 255, 255, 0.72), transparent 46%),
    radial-gradient(ellipse at 50% 64%, var(--station-surface-muted) 0 52%, #C2B6A1 68%, #A99D89 100%);
  box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.62), inset 0 -8px 12px rgba(32, 39, 37, 0.18);
}

.scenic-dish-stage.is-midnight-station .station-dish-plate__rim {
  position: absolute;
  inset: 5px;
  display: block;
  border: 4px solid var(--station-surface);
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(109, 119, 107, 0.52);
}

.scenic-dish-stage.is-midnight-station .station-dish-plate__contact-shadow {
  position: absolute;
  left: 11%;
  right: 11%;
  bottom: -27px;
  height: 30px;
  display: block;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(8, 12, 10, 0.48), transparent 69%);
  filter: blur(2px);
  opacity: 0.9;
  transform: rotateX(52deg);
}

.scenic-dish-stage.is-midnight-station .tide-dish:hover .station-dish-plate,
.scenic-dish-stage.is-midnight-station .tide-dish:focus-visible .station-dish-plate {
  box-shadow: 0 13px 0 var(--station-surface-muted), 0 22px 24px rgba(8, 12, 10, 0.46);
  transform: translateX(-50%) perspective(720px) rotateX(9deg) scale(1.015);
}

.scenic-dish-stage.is-midnight-station .station-dish-cradle {
  position: absolute;
  left: 50%;
  top: 151px;
  z-index: 2;
  width: 70%;
  height: 26px;
  display: block;
  border-top: 3px solid #8B938B;
  border-bottom: 3px solid #3B4740;
  border-radius: 48%;
  background: linear-gradient(180deg, #8E9890, #29352F 58%, #161D1A);
  box-shadow: 0 5px 0 rgba(14, 18, 17, 0.46), inset 0 2px 0 rgba(247, 242, 232, 0.3);
  transform: translateX(-50%) perspective(700px) rotateX(26deg);
  transition: border-color var(--station-motion-fast) ease,
    filter var(--station-motion-fast) ease;
}

.scenic-dish-stage.is-midnight-station .station-dish-cradle::before,
.scenic-dish-stage.is-midnight-station .station-dish-cradle::after {
  position: absolute;
  top: 5px;
  width: 20%;
  height: 7px;
  content: '';
  border-radius: 50%;
  background: #121815;
  box-shadow: inset 0 2px 0 rgba(211, 169, 78, 0.34);
}

.scenic-dish-stage.is-midnight-station .station-dish-cradle::before { left: 8%; }
.scenic-dish-stage.is-midnight-station .station-dish-cradle::after { right: 8%; }

.scenic-dish-stage.is-midnight-station .station-dish-cradle__wheel {
  position: absolute;
  top: 16px;
  width: 9px;
  height: 9px;
  display: block;
  border: 2px solid #8B938B;
  border-radius: 50%;
  background: #151A19;
}

.scenic-dish-stage.is-midnight-station .station-dish-cradle__wheel--left { left: 20%; }
.scenic-dish-stage.is-midnight-station .station-dish-cradle__wheel--right { right: 20%; }

.scenic-dish-stage.is-midnight-station .tide-dish:hover .station-dish-cradle,
.scenic-dish-stage.is-midnight-station .tide-dish:focus-visible .station-dish-cradle {
  border-top-color: var(--station-accent);
  filter: brightness(1.08);
}

.scenic-dish-stage.is-midnight-station .tide-dish__image {
  position: absolute;
  left: 50%;
  top: 29px;
  z-index: 4;
  width: 60%;
  height: 108px;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(32, 39, 37, 0.42);
  border-radius: 48% 52% 45% 55%;
  background: var(--station-surface-elevated);
  box-shadow: 0 4px 8px rgba(14, 18, 17, 0.24), 0 0 0 3px rgba(247, 242, 232, 0.54);
  transform: translateX(-50%) perspective(720px) rotateX(8deg) rotate(-1deg);
  transition: transform var(--station-motion-fast) var(--station-easing-standard),
    filter var(--station-motion-fast) ease;
}

.scenic-dish-stage.is-midnight-station .tide-dish__image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: inherit;
}

.scenic-dish-stage.is-midnight-station .tide-dish:hover .tide-dish__image,
.scenic-dish-stage.is-midnight-station .tide-dish:focus-visible .tide-dish__image {
  filter: brightness(1.05);
  transform: translateX(-50%) perspective(720px) rotateX(8deg) rotate(-1deg) translateY(-2px);
}

.scenic-dish-stage.is-midnight-station .station-platform-marker {
  left: 19%;
  right: 19%;
  bottom: 27px;
  z-index: 0;
  height: 3px;
  opacity: 0.34;
  background: var(--station-accent);
  transform: scaleX(0.48);
}

.scenic-dish-stage.is-midnight-station .tide-slot[data-station-focus] .station-platform-marker,
.scenic-dish-stage.is-midnight-station .tide-dish:hover .station-platform-marker,
.scenic-dish-stage.is-midnight-station .tide-dish:focus-visible .station-platform-marker {
  opacity: 0.95;
  transform: scaleX(1);
}

.scenic-dish-stage.is-midnight-station .station-dish-ticket {
  position: absolute;
  left: 56%;
  top: 171px;
  z-index: 6;
  width: 94px;
  min-height: 38px;
  padding: 7px 8px 6px;
  box-sizing: border-box;
  display: grid;
  align-content: center;
  gap: 2px;
  color: var(--station-text-on-surface);
  background: var(--station-surface-elevated);
  border: 1px solid var(--station-border);
  border-inline-start: 4px solid var(--station-primary);
  border-radius: var(--station-radius-ticket);
  box-shadow: var(--station-shadow-e1);
  transform: rotate(-1.5deg);
  transition: border-color var(--station-motion-fast) ease,
    transform var(--station-motion-fast) var(--station-easing-standard),
    box-shadow var(--station-motion-fast) ease;
}

.scenic-dish-stage.is-midnight-station .station-dish-ticket::before {
  position: absolute;
  top: 5px;
  right: 7px;
  width: 20px;
  height: 2px;
  content: '';
  background: var(--station-accent);
  opacity: 0.75;
}

.scenic-dish-stage.is-midnight-station .station-dish-ticket h3 {
  max-width: 78px;
  margin: 0;
  overflow: hidden;
  color: var(--station-text-on-surface);
  font-family: var(--station-font-ui);
  font-size: clamp(12px, 0.72vw, 16px);
  font-weight: 700;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scenic-dish-stage.is-midnight-station .station-dish-ticket strong {
  color: var(--station-primary-strong);
  font-family: var(--station-font-number);
  font-size: clamp(15px, 0.9vw, 21px);
  line-height: 1;
}

.scenic-dish-stage.is-midnight-station .tide-dish:hover .station-dish-ticket,
.scenic-dish-stage.is-midnight-station .tide-dish:focus-visible .station-dish-ticket {
  border-color: var(--station-accent);
  box-shadow: var(--station-shadow-e2);
  transform: translate(4px, -2px) rotate(-1.5deg);
}

.scenic-dish-stage.is-midnight-station .tide-dish__ai {
  top: 12px;
  right: 14%;
  z-index: 8;
  width: auto;
  height: auto;
  min-height: 26px;
  padding: 5px 7px;
  color: var(--station-text-primary);
  background: var(--station-secondary);
  border: 1px solid var(--station-accent);
  border-radius: 2px 2px 2px 10px;
  font-family: var(--station-font-number);
  font-size: 0;
  letter-spacing: 0.06em;
  transform: rotate(3deg);
}

.scenic-dish-stage.is-midnight-station .tide-dish__ai::after {
  content: 'AI PICK';
  font-size: 9px;
  font-weight: 700;
}

.scenic-dish-stage.is-midnight-station .station-dish-stamp {
  top: auto;
  left: auto;
  right: 8px;
  bottom: 45px;
  z-index: 10;
  padding: 4px 6px;
  color: var(--station-text-primary);
  background: var(--station-primary);
  border: 1px solid var(--station-accent);
  border-radius: var(--station-radius-ticket);
  font-family: var(--station-font-number);
  font-size: 9px;
  letter-spacing: 0.08em;
  transform: rotate(-7deg);
}

.scenic-dish-stage.is-midnight-station .tide-dish.is-station-pressed {
  transform: translateY(1px) scale(0.985) !important;
}

@media (prefers-reduced-motion: reduce) {
  .scenic-dish-stage.is-midnight-station .station-dish-plate,
  .scenic-dish-stage.is-midnight-station .station-dish-cradle,
  .scenic-dish-stage.is-midnight-station .tide-dish__image,
  .scenic-dish-stage.is-midnight-station .station-dish-ticket {
    transition: none;
  }
}
</style>
