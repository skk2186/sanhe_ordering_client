<template>
  <section
    class="orbital-dish-rail"
    :class="{ 'is-reversed': direction === 'right', 'is-recommendation-mode': recommendations.length }"
    :aria-label="t('menu.dishList')"
  >
    <div class="rail-heading">
      <div>
        <span class="rail-kicker">LIVE MENU</span>
        <h2>{{ activeCategoryLabel }}</h2>
      </div>
      <div class="rail-actions">
        <button type="button" class="rail-arrow" :aria-label="t('common.previousPage')" :title="t('common.previousPage')" @click="rotate(-1)">
          <span aria-hidden="true">&#8592;</span>
        </button>
        <span class="rail-count">{{ itemCountLabel }}</span>
        <button type="button" class="rail-arrow" :aria-label="t('common.nextPage')" :title="t('common.nextPage')" @click="rotate(1)">
          <span aria-hidden="true">&#8594;</span>
        </button>
      </div>
    </div>

    <div
      ref="stageRef"
      class="orbital-stage"
      :class="{ 'is-dragging': isDragging }"
      @pointerdown="handlePointerDown"
      @wheel.prevent="handleWheel"
    >
      <div class="orbit-line orbit-line-outer" aria-hidden="true"></div>
      <div class="orbit-line orbit-line-inner" aria-hidden="true"></div>
      <div class="orbit-marker orbit-marker-left" aria-hidden="true"></div>
      <div class="orbit-marker orbit-marker-right" aria-hidden="true"></div>

      <button
        v-for="slot in orbitItems"
        :key="`${slot.item.id}-${slot.offset}`"
        type="button"
        class="orbit-dish"
        :class="{ 'is-sold-out': !isAvailable(slot.item), 'is-recommended': recommendationIds.has(String(slot.item.id)) }"
        :style="slot.style"
        :aria-label="`${getName(slot.item)} ¥${formatPrice(slot.item.price)}`"
        :disabled="!isAvailable(slot.item)"
        @click.stop="selectItem(slot.index)"
      >
        <span class="orbit-dish__image">
          <img :src="getImage(slot.item)" :alt="getName(slot.item)" @error="handleImageError" />
        </span>
        <span class="orbit-dish__meta">
          <strong>{{ getName(slot.item) }}</strong>
          <span>¥{{ formatPrice(slot.item.price) }}</span>
        </span>
        <span v-if="recommendationIds.has(String(slot.item.id))" class="orbit-dish__signal">AI</span>
      </button>

      <article v-if="activeItem" class="orbit-focus" :class="{ 'is-sold-out': !isAvailable(activeItem) }">
        <div class="orbit-focus__image">
          <img :src="getImage(activeItem)" :alt="getName(activeItem)" @error="handleImageError" />
        </div>
        <div class="orbit-focus__copy">
          <span class="orbit-focus__eyebrow">{{ recommendations.length ? 'AI PICK' : 'CHEF PICK' }}</span>
          <h3>{{ getName(activeItem) }}</h3>
          <span class="orbit-focus__price">¥{{ formatPrice(activeItem.price) }}</span>
        </div>
        <button
          type="button"
          class="orbit-focus__add"
          :disabled="!isAvailable(activeItem)"
          :aria-label="`${t('common.addToCart')} ${getName(activeItem)}`"
          :title="t('common.addToCart')"
          @click.stop="emitDishClick($event)"
        >
          <span aria-hidden="true">+</span>
        </button>
      </article>

      <div v-else class="orbit-empty">{{ t('menu.noDishes') }}</div>
      <div class="drop-zone drop-zone-left" aria-hidden="true"><span>{{ t('assistant.leftSide') }}</span></div>
      <div class="drop-zone drop-zone-right" aria-hidden="true"><span>{{ t('assistant.rightSide') }}</span></div>
    </div>

    <nav class="rail-categories" aria-label="Dish categories">
      <button
        v-for="category in categoryOptions"
        :key="category.id"
        type="button"
        class="category-chip"
        :class="{ 'is-active': activeCategoryId === category.id }"
        @click="selectCategory(category.id)"
      >
        {{ category.name }}
      </button>
    </nav>

    <p class="rail-hint">
      <span aria-hidden="true">&#8596;</span>
      {{ instructionText }}
    </p>
  </section>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from '@/i18n'

const props = defineProps({
  items: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  recommendations: { type: Array, default: () => [] },
  selectedItemId: { type: [Number, String], default: null },
  direction: { type: String, default: 'left' },
  speed: { type: Number, default: 1 }
})

const emit = defineEmits(['dish-click', 'add-to-side'])
const { currentLocale, t } = useI18n()
const DEFAULT_DISH_IMAGE = '/images/default-dish.jpg'
const activeCategoryId = ref('all')
const rotationIndex = ref(0)
const stageRef = ref(null)
const isDragging = ref(false)
const pointerState = ref(null)

const getName = (item) => item?.name || item?.storeName || item?.productName || 'Dish'
const getImage = (item) => item?.image || item?.imageUrl || DEFAULT_DISH_IMAGE
const formatPrice = (value) => {
  const price = Number(value)
  return Number.isFinite(price) ? price.toFixed(2) : '0.00'
}
const isAvailable = (item) => item && item.available !== false && item.status !== 'OFF_SHELF'
const getCategoryId = (item) => String(item?.categoryId ?? item?.category?.id ?? item?.category ?? 'uncategorized')

const categoryOptions = computed(() => {
  const source = props.categories
    .map((category) => ({
      id: String(category?.id ?? category?.categoryId ?? category?.value ?? ''),
      name: category?.name || category?.label || category?.categoryName || ''
    }))
    .filter((category) => category.id && category.name)
  const unique = source.filter((category, index, list) => list.findIndex((item) => item.id === category.id) === index)
  return [{ id: 'all', name: t('common.all') }, ...unique]
})

const filteredItems = computed(() => {
  if (activeCategoryId.value === 'all') return props.items
  const matching = props.items.filter((item) => getCategoryId(item) === activeCategoryId.value)
  return matching.length ? matching : props.items.filter((item) => String(item?.categoryName || '') === activeCategoryId.value)
})

const recommendationIds = computed(() => new Set(props.recommendations.map((item) => String(item.id))))
const activeItem = computed(() => {
  const list = filteredItems.value
  if (!list.length) return null
  const index = ((rotationIndex.value % list.length) + list.length) % list.length
  return list[index]
})

const activeCategoryLabel = computed(() => {
  return categoryOptions.value.find((category) => category.id === activeCategoryId.value)?.name || t('common.all')
})

const instructionText = computed(() => ({
  'zh-CN': '滑动浏览，将焦点菜品拖向任一侧购物车。',
  'en-US': 'Swipe to browse. Drag the focus dish toward either cart.',
  'ja-JP': 'スワイプで閲覧し、選択中の料理を左右のカートへドラッグできます。'
})[currentLocale.value] || 'Swipe to browse. Drag the focus dish toward either cart.')

const itemCountLabel = computed(() => ({
  'zh-CN': `${filteredItems.value.length} 道菜品`,
  'en-US': `${filteredItems.value.length} items`,
  'ja-JP': `${filteredItems.value.length} 品`
})[currentLocale.value] || `${filteredItems.value.length} items`)

const orbitItems = computed(() => {
  const list = filteredItems.value
  if (list.length < 2) return []
  const center = ((rotationIndex.value % list.length) + list.length) % list.length
  const offsets = [-1, 1, -2, 2, -3, 3]
    .slice(0, Math.min(6, list.length - 1))
    .sort((left, right) => left - right)
  return offsets.map((offset) => {
    const index = (center + offset + list.length) % list.length
    const angle = offset * 17
    const radians = (angle * Math.PI) / 180
    const x = Math.sin(radians) * 42
    const y = (1 - Math.cos(radians)) * 24
    const scale = 1 - Math.abs(offset) * 0.055
    return {
      item: list[index],
      index,
      offset,
      style: {
        '--orbit-x': `${x}%`,
        '--orbit-y': `${y}%`,
        '--orbit-scale': scale,
        '--orbit-depth': 30 - Math.abs(offset)
      }
    }
  })
})

const rotate = (step) => {
  const length = filteredItems.value.length
  if (!length) return
  const directionMultiplier = props.direction === 'right' ? -1 : 1
  const rotationStep = props.speed >= 2 ? 2 : 1
  rotationIndex.value = (rotationIndex.value + (step * directionMultiplier * rotationStep)) % length
}

const selectItem = (index) => {
  if (!filteredItems.value.length) return
  rotationIndex.value = index
}

const selectCategory = (id) => {
  activeCategoryId.value = id
  rotationIndex.value = 0
}

const emitDishClick = (event) => {
  if (activeItem.value && isAvailable(activeItem.value)) emit('dish-click', activeItem.value, event)
}

const handleWheel = (event) => {
  rotate(event.deltaY > 0 ? 1 : -1)
}

const handlePointerDown = (event) => {
  if (event.target.closest('button')) return
  pointerState.value = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    originWasFocus: Boolean(event.target.closest('.orbit-focus'))
  }
  isDragging.value = false
  window.addEventListener('pointermove', handlePointerMove, { passive: false })
  window.addEventListener('pointerup', handlePointerUp)
  window.addEventListener('pointercancel', handlePointerUp)
}

const handlePointerMove = (event) => {
  if (!pointerState.value || event.pointerId !== pointerState.value.id) return
  const deltaX = event.clientX - pointerState.value.x
  const deltaY = event.clientY - pointerState.value.y
  if (Math.hypot(deltaX, deltaY) < 18) return
  if (event.cancelable) event.preventDefault()
  isDragging.value = true
  if (pointerState.value.originWasFocus) return
  if (Math.abs(deltaX) >= 24) {
    rotate(deltaX > 0 ? -1 : 1)
    pointerState.value.x = event.clientX
  }
}

const handlePointerUp = (event) => {
  if (!pointerState.value || event.pointerId !== pointerState.value.id) return
  const state = pointerState.value
  const rect = stageRef.value?.getBoundingClientRect()
  if (isDragging.value && state.originWasFocus && rect && activeItem.value) {
    const ratio = (event.clientX - rect.left) / rect.width
    if (ratio < 0.2) emit('add-to-side', activeItem.value, 'left')
    if (ratio > 0.8) emit('add-to-side', activeItem.value, 'right')
  } else if (!isDragging.value && state.originWasFocus && Math.abs(event.clientX - state.x) < 8) {
    emitDishClick(event)
  }
  cleanupPointer()
}

const cleanupPointer = () => {
  pointerState.value = null
  isDragging.value = false
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  window.removeEventListener('pointercancel', handlePointerUp)
}

const handleImageError = (event) => {
  const image = event?.target
  if (!image || image.dataset.fallbackApplied === '1') return
  image.dataset.fallbackApplied = '1'
  image.src = DEFAULT_DISH_IMAGE
}

watch(filteredItems, () => {
  if (rotationIndex.value >= filteredItems.value.length) rotationIndex.value = 0
})

watch(() => props.selectedItemId, (id) => {
  if (id === null || id === undefined) return
  const index = filteredItems.value.findIndex((item) => String(item.id) === String(id))
  if (index >= 0) rotationIndex.value = index
})

onUnmounted(cleanupPointer)
</script>

<style lang="scss" scoped>
.orbital-dish-rail {
  --ink: #1f2929;
  --muted: #667172;
  --paper: #fbfaf7;
  --line: rgba(31, 41, 41, 0.14);
  --accent: #d4523e;
  --fresh: #3d8279;
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 12px 20px 8px;
  display: grid;
  grid-template-rows: auto minmax(260px, 1fr) auto auto;
  gap: 8px;
  overflow: hidden;
  color: var(--ink);
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 14px 34px rgba(28, 39, 38, 0.12);
}

.rail-heading,
.rail-actions,
.rail-categories {
  display: flex;
  align-items: center;
}

.rail-heading {
  justify-content: space-between;
  min-height: 38px;
}

.rail-kicker {
  display: block;
  color: var(--fresh);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

h2 {
  margin: 2px 0 0;
  font-size: 24px;
  line-height: 1.1;
  letter-spacing: 0;
}

.rail-actions { gap: 10px; }
.rail-count { color: var(--muted); font-size: 12px; white-space: nowrap; }
.rail-arrow {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  color: var(--ink);
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.rail-arrow:hover, .rail-arrow:focus-visible { color: #fff; background: var(--ink); transform: translateY(-1px); }

.orbital-stage {
  position: relative;
  min-height: 260px;
  overflow: hidden;
  touch-action: pan-y;
  user-select: none;
  cursor: grab;
}
.orbital-stage.is-dragging { cursor: grabbing; }

.orbit-line {
  position: absolute;
  left: 50%;
  top: 44%;
  width: min(74%, 760px);
  aspect-ratio: 2.5 / 1;
  border: 1px solid rgba(61, 130, 121, 0.25);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.orbit-line-inner { width: min(52%, 520px); border-color: rgba(212, 82, 62, 0.28); }
.orbit-marker { position: absolute; top: 42%; width: 7px; height: 7px; background: var(--accent); border-radius: 50%; }
.orbit-marker-left { left: 13%; }
.orbit-marker-right { right: 13%; }

.orbit-dish {
  position: absolute;
  left: calc(50% + var(--orbit-x));
  top: calc(42% + var(--orbit-y));
  z-index: var(--orbit-depth);
  width: clamp(112px, 12vw, 164px);
  min-height: 132px;
  padding: 8px;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  color: var(--ink);
  text-align: left;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 8px 18px rgba(28, 39, 38, 0.1);
  transform: translate(-50%, -50%) scale(var(--orbit-scale));
  transform-origin: center;
  cursor: pointer;
  transition: transform 0.25s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.orbit-dish:hover, .orbit-dish:focus-visible { border-color: var(--fresh); box-shadow: 0 10px 22px rgba(61, 130, 121, 0.2); transform: translate(-50%, -50%) scale(calc(var(--orbit-scale) + 0.04)); }
.orbit-dish.is-recommended { border-color: rgba(212, 82, 62, 0.72); }
.orbit-dish.is-sold-out { opacity: 0.44; cursor: not-allowed; }
.orbit-dish__image { width: 54px; height: 54px; overflow: hidden; border-radius: 6px; background: #edf0ed; }
.orbit-dish__image img { width: 100%; height: 100%; display: block; object-fit: cover; }
.orbit-dish__meta { min-width: 0; display: grid; gap: 6px; }
.orbit-dish__meta strong { overflow: hidden; font-size: 12px; line-height: 1.3; text-overflow: ellipsis; white-space: nowrap; }
.orbit-dish__meta span { color: var(--accent); font-size: 12px; font-weight: 800; }
.orbit-dish__signal { position: absolute; top: 6px; right: 6px; color: var(--accent); font-size: 9px; font-weight: 800; }

.orbit-focus {
  position: absolute;
  left: 50%;
  top: 44%;
  z-index: 50;
  width: clamp(236px, 25vw, 330px);
  min-height: 112px;
  padding: 10px;
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) 34px;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 2px solid var(--accent);
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(28, 39, 38, 0.18);
  transform: translate(-50%, -50%);
}
.orbit-focus__image { width: 76px; height: 76px; overflow: hidden; border-radius: 6px; background: #edf0ed; }
.orbit-focus__image img { width: 100%; height: 100%; display: block; object-fit: cover; }
.orbit-focus__copy { min-width: 0; display: grid; gap: 5px; }
.orbit-focus__eyebrow { color: var(--fresh); font-size: 9px; font-weight: 800; letter-spacing: 0.12em; }
.orbit-focus h3 { margin: 0; overflow: hidden; font-size: 15px; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.orbit-focus__price { color: var(--accent); font-size: 14px; font-weight: 800; }
.orbit-focus__add { width: 34px; height: 34px; display: grid; place-items: center; color: #fff; background: var(--ink); border: 0; border-radius: 50%; font-size: 22px; cursor: pointer; }
.orbit-focus__add:hover, .orbit-focus__add:focus-visible { background: var(--accent); }
.orbit-focus__add:disabled { opacity: 0.4; cursor: not-allowed; }
.orbit-focus.is-sold-out { border-color: var(--line); }
.orbit-empty { position: absolute; inset: 42% 0 auto; text-align: center; color: var(--muted); }

.drop-zone {
  position: absolute;
  top: 38%;
  width: 92px;
  height: 78px;
  display: grid;
  place-items: end center;
  padding-bottom: 12px;
  color: var(--muted);
  border: 1px dashed rgba(31, 41, 41, 0.22);
  border-radius: 8px;
  font-size: 9px;
  letter-spacing: 0.1em;
  pointer-events: none;
}
.drop-zone-left { left: 0; }
.drop-zone-right { right: 0; }

.rail-categories { gap: 8px; overflow-x: auto; padding: 2px 0; scrollbar-width: thin; }
.category-chip { flex: 0 0 auto; padding: 8px 13px; color: var(--muted); background: transparent; border: 1px solid var(--line); border-radius: 6px; font-size: 12px; cursor: pointer; }
.category-chip:hover, .category-chip:focus-visible { color: var(--ink); border-color: var(--fresh); }
.category-chip.is-active { color: #fff; background: var(--ink); border-color: var(--ink); }
.rail-hint { margin: 0; color: var(--muted); font-size: 11px; text-align: center; }
.rail-hint span { color: var(--accent); font-size: 15px; }

@media (max-width: 900px) {
  .orbital-dish-rail { padding-inline: 12px; border-radius: 8px; }
  .orbit-dish { width: 108px; min-height: 112px; grid-template-columns: 44px minmax(0, 1fr); padding: 6px; }
  .orbit-dish__image { width: 44px; height: 44px; }
  .orbit-focus { width: 230px; min-height: 94px; grid-template-columns: 58px minmax(0, 1fr) 30px; padding: 7px; }
  .orbit-focus__image { width: 58px; height: 58px; }
  .drop-zone { width: 60px; height: 64px; }
}

@media (max-width: 600px) {
  .orbital-dish-rail { min-height: 430px; grid-template-rows: auto minmax(280px, 1fr) auto auto; }
  .orbital-stage { min-height: 280px; }
  .orbit-line { width: 88%; }
  .orbit-line-inner { width: 64%; }
  .orbit-marker-left { left: 2%; }
  .orbit-marker-right { right: 2%; }
  .orbit-dish { width: 96px; min-height: 92px; grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .orbit-dish__meta { width: 100%; justify-items: center; }
  .orbit-dish__meta strong { max-width: 82px; }
  .orbit-focus { top: 45%; }
  .drop-zone { display: none; }
  .rail-actions .rail-count { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .orbit-dish, .rail-arrow { transition: none; }
}
</style>
