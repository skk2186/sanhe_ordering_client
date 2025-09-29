<template>
  <div
    class="sushi-plate-container"
    :class="{
      'clicked': isClicked,
      'paused': isPaused,
      'dragging': isDragging
    }"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
    @touchstart.passive="handleTouchStart"
    @touchmove.passive="handleTouchMove"
    @touchend.passive="handleTouchEnd"
  >
    <!-- 圆形寿司显示区域 -->
    <div class="sushi-circle">
      <div class="sushi-image">
        <img
          :src="getImageSrc(item.image)"
          :alt="item.storeName"
          @error="handleImageError"
          @load="handleImageLoad"
        />
      </div>
<!--      <div class="price-tag">¥{{ item.price }}</div>-->

      <!-- 停顿状态指示器 -->
      <div v-if="isPaused" class="pause-indicator">
        <div class="pause-progress"></div>
      </div>
    </div>

    <!-- 下方信息区域 -->
    <div class="sushi-info">
      <!-- 上方橙色区域显示名称 -->
      <div class="sushi-name-area">
        <div class="sushi-name">{{ item.storeName }}</div>
      </div>
      <!-- 下方价格区域 -->
      <div class="sushi-price-area">
        <div class="sushi-price">¥{{ item.price }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click', 'drag-start', 'drag-move', 'drag-end'])

// 状态管理
const isClicked = ref(false)
const isPaused = ref(false)
const isDragging = ref(false)
const isInteracting = ref(false) // 新增：是否正在交互
const imageLoaded = ref(false)
const imageError = ref(false)

// 交互数据
const startPos = ref({ x: 0, y: 0 })
const currentPos = ref({ x: 0, y: 0 })
const startTime = ref(0)
const pauseTimer = ref(null)
const dragThreshold = 10 // 拖动阈值（像素）
const lastEmitTime = ref(0) // 新增：上次emit时间，用于节流

// 清理定时器
const clearPauseTimer = () => {
  if (pauseTimer.value) {
    clearTimeout(pauseTimer.value)
    pauseTimer.value = null
  }
}

// 重置状态
const resetState = () => {
  clearPauseTimer()
  isPaused.value = false
  isDragging.value = false
  isClicked.value = false
  isInteracting.value = false

  // 清理document事件监听器
  document.removeEventListener('mousemove', handleDocumentMouseMove)
  document.removeEventListener('mouseup', handleDocumentMouseUp)
}

// 图片处理方法
const getImageSrc = (imagePath) => {
  // 如果图片路径为空或undefined，返回默认图片
  if (!imagePath) {
    return '/images/default-dish.jpg'
  }
  return imagePath
}

const DEFAULT_FALLBACK = '/images/default-dish.jpg'
const PLACEHOLDER_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLz4='

const handleImageError = (event) => {
  const img = event?.target
  if (!img) return
  console.warn('图片加载失败:', img.src)
  imageError.value = true

  // 如果已尝试过默认图，改为使用内联占位，彻底阻断重复请求
  if (img.dataset.fallbackApplied === '1') {
    img.onerror = null
    img.src = PLACEHOLDER_DATA_URL
    return
  }

  // 首次回退到默认图，并标记避免死循环
  img.dataset.fallbackApplied = '1'
  img.src = DEFAULT_FALLBACK
}

const handleImageLoad = () => {
  imageLoaded.value = true
  imageError.value = false
}

// 开始交互（鼠标/触摸）
const startInteraction = (clientX, clientY) => {
  // 如果已经在交互中，忽略
  if (isInteracting.value) return

  isInteracting.value = true
  startPos.value = { x: clientX, y: clientY }
  currentPos.value = { x: clientX, y: clientY }
  startTime.value = Date.now()
  lastEmitTime.value = Date.now()

  // 开始停顿
  isPaused.value = true
  isClicked.value = true

  // 设置停顿定时器（1秒后自动触发点击）
  pauseTimer.value = setTimeout(() => {
    if (isPaused.value && !isDragging.value && isInteracting.value) {
      // 停顿结束，触发点击
      triggerClick()
    }
  }, 1000)
}

// 移动交互
const moveInteraction = (clientX, clientY) => {
  if (!isInteracting.value || (!isPaused.value && !isDragging.value)) return

  currentPos.value = { x: clientX, y: clientY }

  // 计算移动距离
  const deltaX = clientX - startPos.value.x
  const deltaY = clientY - startPos.value.y
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  // 如果移动距离超过阈值，开始拖动
  if (distance > dragThreshold && !isDragging.value && isPaused.value) {
    startDrag()
  }

  // 如果正在拖动，发送拖动事件（节流处理）
  if (isDragging.value) {
    const now = Date.now()
    // 节流：每50ms最多emit一次
    if (now - lastEmitTime.value > 50) {
      lastEmitTime.value = now
      emit('drag-move', {
        item: props.item,
        startPos: startPos.value,
        currentPos: currentPos.value,
        deltaX,
        deltaY,
        distance
      })
    }
  }
}

// 结束交互
const endInteraction = () => {
  if (isDragging.value) {
    // 结束拖动
    emit('drag-end', {
      item: props.item,
      startPos: startPos.value,
      currentPos: currentPos.value
    })
  } else if (isPaused.value) {
    // 如果还在停顿中，立即触发点击
    triggerClick()
  }

  resetState()
}

// 开始拖动
const startDrag = () => {
  clearPauseTimer()
  isPaused.value = false
  isDragging.value = true

  emit('drag-start', {
    item: props.item,
    startPos: startPos.value
  })
}

// 触发点击
const triggerClick = () => {
  // 创建一个模拟的事件对象，包含点击位置信息
  const mockEvent = {
    clientX: startPos.value.x,
    clientY: startPos.value.y
  }
  emit('click', props.item, mockEvent)
  resetState()
}

// 鼠标事件处理
const handleMouseDown = (e) => {
  e.preventDefault()

  // 先清理可能存在的事件监听器
  document.removeEventListener('mousemove', handleDocumentMouseMove)
  document.removeEventListener('mouseup', handleDocumentMouseUp)

  startInteraction(e.clientX, e.clientY)

  // 在document上添加鼠标移动和释放事件监听
  document.addEventListener('mousemove', handleDocumentMouseMove)
  document.addEventListener('mouseup', handleDocumentMouseUp)
}

const handleDocumentMouseMove = (e) => {
  moveInteraction(e.clientX, e.clientY)
}

const handleDocumentMouseUp = () => {
  endInteraction()
  // 移除document事件监听
  document.removeEventListener('mousemove', handleDocumentMouseMove)
  document.removeEventListener('mouseup', handleDocumentMouseUp)
}

const handleMouseMove = () => {
  // 这个方法保留但不使用，因为我们使用document监听
}

const handleMouseUp = () => {
  // 这个方法保留但不使用，因为我们使用document监听
}

const handleMouseLeave = () => {
  // 鼠标离开时不立即结束交互，因为可能在拖动
}

// 触摸事件处理
const handleTouchStart = (e) => {
  // 移除preventDefault以支持被动事件监听器
  // e.preventDefault()
  const touch = e.touches[0]
  startInteraction(touch.clientX, touch.clientY)
}

const handleTouchMove = (e) => {
  // 移除preventDefault以支持被动事件监听器
  // e.preventDefault()
  const touch = e.touches[0]
  moveInteraction(touch.clientX, touch.clientY)
}

const handleTouchEnd = (e) => {
  // 移除preventDefault以支持被动事件监听器
  // e.preventDefault()
  endInteraction()
}

// 组件卸载时清理
onUnmounted(() => {
  clearPauseTimer()
  // 清理可能残留的事件监听器
  document.removeEventListener('mousemove', handleDocumentMouseMove)
  document.removeEventListener('mouseup', handleDocumentMouseUp)
})
</script>

<style lang="scss" scoped>
.sushi-plate-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  z-index: 10;
  pointer-events: auto;

  // 改善触摸体验
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:hover:not(.paused):not(.dragging) {
    .sushi-circle {
      transform: translateY(-2px);
    }
  }

  // 停顿状态
  //&.paused {
  //  .sushi-circle {
  //    box-shadow: 0 8px 25px rgba(255, 122, 0, 0.4);
  //    border: 2px solid rgba(255, 122, 0, 0.6);
  //    animation: pausePulse 1s ease-in-out;
  //  }
  //}

  // 拖动状态
  &.dragging {
    .sushi-circle {
      transform: rotate(5deg);
      opacity: 0.8;
      z-index: 1000;
    }
    cursor: grabbing;
  }

  //&.clicked:not(.paused):not(.dragging) {
  //  .sushi-circle {
  //    box-shadow: 0 8px 25px rgba(255, 122, 0, 0.3);
  //  }
  //}
}
.sushi-circle {
  position: relative;
  width: 300px;
  height: 300px;
  //background: radial-gradient(circle, #FFFFFF 0%, #F0F0F0 70%, #E0E0E0 100%);
  //border-radius: 50%;
  //box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  //align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 2;
  overflow: hidden;
}

.sushi-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    //border-radius: 50%;
  }
}

.sushi-info {
  width: 100%;
  padding: 10px 0;
  margin-top: -8px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1;
  background:#fff;
  position: relative;
  color: black;
  border: 2px solid black;
}

.sushi-name-area {
  height: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 4px;
}
.sushi-name {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.sushi-price-area {
  height: 40%;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

}
.sushi-price {
  font-size: 16px;

  font-weight: bold;
  color: #553C20;
  text-align: center;
}

// 停顿脉冲动画
@keyframes pausePulse {
  0% {
    border-color: rgba(255, 122, 0, 0.6);
  }
  50% {
    border-color: rgba(255, 122, 0, 0.9);
  }
  100% {
    border-color: rgba(255, 122, 0, 0.6);
  }
}

// 停顿进度动画
@keyframes pauseProgress {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}



.price-tag {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #FF4757;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(255, 71, 87, 0.3);
}

// 停顿指示器 - 更加微妙的设计
.pause-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  pointer-events: none;

  .pause-progress {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 2px solid transparent;
    border-top: 2px solid rgba(255, 122, 0, 0.8);
    border-radius: 50%;
    animation: pauseProgress 1s linear;
  }
}
</style>
