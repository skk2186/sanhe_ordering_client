<template>
  <div v-if="visible" class="sushi-navigation-overlay">
    <div class="navigation-container">
      <!-- 底部功能区容器 -->
      <div class="bottom-section-navigation">
        <!-- 左侧购物车 -->
        <div class="bottom-left">
          <CartPanel
            side="left"
            :items="props.leftCart"
            :count="getCartCount('left')"
            @place-order="handlePlaceOrder"
            @remove="handleRemoveFromCart"
            @increase="handleIncreaseQuantity"
            @decrease="handleDecreaseQuantity"
            @select="handleSelectSlot"
          />
        </div>
        <!-- 返回按钮 -->
        <div class="return-btn" @click="closeNavigation">
          返回传送带
        </div>
        <!-- 右侧购物车 -->
        <div class="bottom-right">
          <CartPanel
            side="right"
            :items="props.rightCart"
            :count="getCartCount('right')"
            @place-order="handlePlaceOrder"
            @remove="handleRemoveFromCart"
            @increase="handleIncreaseQuantity"
            @decrease="handleDecreaseQuantity"
            @select="handleSelectSlot"
          />
        </div>
      </div>

      <!-- 加载动画 -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-content">
          <div class="sushi-loading">
            <div class="sushi-plate">
              <div class="sushi-item sushi-1">🍣</div>
              <div class="sushi-item sushi-2">🍱</div>
              <div class="sushi-item sushi-3">🍤</div>
              <div class="sushi-item sushi-4">🥢</div>
            </div>
            <div class="loading-waves">
              <div class="wave wave-1"></div>
              <div class="wave wave-2"></div>
              <div class="wave wave-3"></div>
            </div>
          </div>
          <div class="loading-text">
            <h3>正在准备美味寿司</h3>
            <p>请稍候，我们正在为您加载精选菜单...</p>
            <div class="loading-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${loadingProgress}%` }"></div>
              </div>
              <div class="progress-text">{{ Math.round(loadingProgress) }}% ({{ Math.round(loadingProgress * totalImages / 100) }}/{{ totalImages }})</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无界大菜单容器 -->
      <div
        v-show="!isLoading"
        ref="menuContainer"
        class="infinite-menu-container"
        @mousedown="startDrag"
        @touchstart="startDrag"
        @wheel="handleWheel"
      >
        <!-- 右侧拖动区域 -->
        <div class="right-drag-area"></div>
        <div
          ref="menuContent"
          class="menu-content"
          :style="{
            transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
            transition: 'none'
          }"
        >
          <!-- 菜品网格（筛选格子分散在各处） -->
          <div class="menu-items-grid">
            <template v-for="(item, index) in mixedItems" :key="item.type === 'filter' ? `filter-${item.id}` : item.id">
              <!-- 筛选格子 -->
              <div
                v-if="item.type === 'filter'"
                class="menu-item filter-item"
                :class="{ 'active-filter': activeFilter === item.id }"
                @click="handleFilterClick(item.id)"
              >
                <div class="item-image filter-image">
                  <div class="filter-content">
                    <div class="filter-name">{{ item.name }}</div>
                    <div class="filter-keyword">{{ item.keyword }}</div>
                  </div>
                  <div class="filter-arrow">
                    <div class="arrow-circle">
                      <span>></span>
                    </div>
                  </div>
                </div>

                <div class="item-info">
                  <h3 class="item-name">{{ item.name }}</h3>
                  <div class="item-price">{{ item.keyword }}</div>
                </div>
              </div>

              <!-- 菜品 -->
              <div
                v-else
                class="menu-item"
                :class="{ 'sold-out': item.soldOut }"
                @click="addToCart(item)"
              >
                <div class="item-image">
                  <img :src="item.image" :alt="item.name" />
                  <div v-if="item.soldOut" class="sold-out-overlay">
                    <span>已售完</span>
                  </div>
                  <div v-if="item.isNew" class="new-badge">新品</div>
                </div>

                <div class="item-info">
                  <h3 class="item-name">{{ item.name }}</h3>
                </div>

                <!-- 添加按钮 -->
                <div class="add-overlay" v-if="!item.soldOut">
                  <el-icon class="add-icon"><Plus /></el-icon>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick, watch, toRefs } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { sushiData, filterCategories } from '@/data/sushiData.js'
import CartPanel from '@/components/display/CartPanel.vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  leftCart: {
    type: Array,
    default: () => []
  },
  rightCart: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['close', 'add-to-cart', 'update-cart', 'remove-from-cart', 'place-order'])

// 响应式数据
const menuContainer = ref(null)
const menuContent = ref(null)
const isDragging = ref(false)
const offsetX = ref(0)
const offsetY = ref(0)
const activeFilter = ref('all')
const isLoading = ref(false)
const loadedImages = ref(new Set())
const loadingProgress = ref(0)
const totalImages = ref(0)

// 拖拽相关状态
const dragState = reactive({
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  velocityX: 0,
  velocityY: 0,
  lastTime: 0,
  hasMoved: false // 记录是否发生了拖拽移动
})

// 筛选后的商品
const filteredItems = computed(() => {
  if (activeFilter.value === 'all') {
    return sushiData
  }

  return sushiData.filter(item => {
    if (activeFilter.value === 'popular') return item.isPopular
    if (activeFilter.value === 'new') return item.isNew
    if (activeFilter.value === 'cheap') return item.price <= 20
    if (activeFilter.value === 'premium') return item.price >= 50
    return item.category === activeFilter.value
  })
})

// 混合筛选格子和菜品 - 根据筛选状态显示不同内容
const mixedItems = computed(() => {
  const items = [...filteredItems.value]

  // 如果选择了特定筛选，只显示筛选后的商品，不显示筛选格子
  if (activeFilter.value !== 'all') {
    return items
  }

  // 如果是显示全部，则混合显示筛选格子和商品
  const filters = filterCategories.map(filter => ({ ...filter, type: 'filter' }))
  const mixed = []
  const filterInterval = Math.max(1, Math.floor(items.length / filters.length))

  let filterIndex = 0
  for (let i = 0; i < items.length; i++) {
    // 每隔一定数量的菜品插入一个筛选格子
    if (i > 0 && i % filterInterval === 0 && filterIndex < filters.length) {
      mixed.push(filters[filterIndex])
      filterIndex++
    }
    mixed.push(items[i])
  }

  // 确保所有筛选格子都被添加
  while (filterIndex < filters.length) {
    mixed.push(filters[filterIndex])
    filterIndex++
  }

  return mixed
})

// 处理筛选点击 - 防止拖拽时误触
const handleFilterClick = (filterId) => {
  // 如果正在拖拽或刚刚发生过拖拽移动，不执行筛选操作
  if (isDragging.value || dragState.hasMoved) {
    return
  }
  applyFilter(filterId)
}

// 应用筛选
const applyFilter = (filterId) => {
  activeFilter.value = filterId
  // 重置位置到可见区域
  offsetX.value = 50
  offsetY.value = 50
}

// 开始拖拽
const startDrag = (event) => {
  event.preventDefault()
  isDragging.value = true

  const clientX = event.touches ? event.touches[0].clientX : event.clientX
  const clientY = event.touches ? event.touches[0].clientY : event.clientY

  dragState.startX = clientX - offsetX.value
  dragState.startY = clientY - offsetY.value
  dragState.lastX = clientX
  dragState.lastY = clientY
  dragState.lastTime = Date.now()
  dragState.hasMoved = false // 重置移动标记

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', handleDrag, { passive: false })
  document.addEventListener('touchend', endDrag)
}

// 处理拖拽 - 优化性能，减少计算
const handleDrag = (event) => {
  if (!isDragging.value) return

  event.preventDefault()

  const clientX = event.touches ? event.touches[0].clientX : event.clientX
  const clientY = event.touches ? event.touches[0].clientY : event.clientY

  // 检查是否发生了实际移动
  const deltaX = Math.abs(clientX - dragState.lastX)
  const deltaY = Math.abs(clientY - dragState.lastY)
  if (deltaX > 3 || deltaY > 3) {
    dragState.hasMoved = true
  }

  // 简化速度计算，只在需要时计算
  const currentTime = Date.now()
  const deltaTime = currentTime - dragState.lastTime
  if (deltaTime > 16) { // 限制计算频率，约60fps
    dragState.velocityX = (clientX - dragState.lastX) / deltaTime
    dragState.velocityY = (clientY - dragState.lastY) / deltaTime
    dragState.lastX = clientX
    dragState.lastY = clientY
    dragState.lastTime = currentTime
  }

  // 直接更新位置，减少边界检查频率
  offsetX.value = clientX - dragState.startX
  offsetY.value = clientY - dragState.startY
}

// 结束拖拽 - 移除惯性滚动减少卡顿
const endDrag = () => {
  if (!isDragging.value) return

  // 立即重置拖拽状态
  isDragging.value = false

  // 延迟重置移动标记，防止点击事件立即触发
  setTimeout(() => {
    dragState.hasMoved = false
  }, 150)

  // 应用边界约束
  applyBoundaryConstraints()

  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', endDrag)
}

// 处理滚轮事件
const handleWheel = (event) => {
  event.preventDefault()

  const deltaX = event.deltaX
  const deltaY = event.deltaY

  offsetX.value -= deltaX * 0.5

  offsetY.value -= deltaY * 0.5

  applyBoundaryConstraints()
}

// 边界约束 - 简化计算
const applyBoundaryConstraints = () => {
  if (!menuContainer.value || !menuContent.value) return

  // 简化边界计算，使用固定值减少DOM查询
  const maxOffsetX = 2500 // 固定最大拖拽范围
  const maxOffsetY = 1500

  // 应用约束
  offsetX.value = Math.max(-maxOffsetX, Math.min(400, offsetX.value))
  offsetY.value = Math.max(-maxOffsetY, Math.min(200, offsetY.value))
}

// 应用惯性滚动
const applyMomentumScroll = () => {
  const friction = 0.95
  const threshold = 0.1

  const animate = () => {
    if (Math.abs(dragState.velocityX) < threshold && Math.abs(dragState.velocityY) < threshold) {
      return
    }

    offsetX.value += dragState.velocityX * 16
    offsetY.value += dragState.velocityY * 16

    applyBoundaryConstraints()

    dragState.velocityX *= friction
    dragState.velocityY *= friction

    requestAnimationFrame(animate)
  }

  if (Math.abs(dragState.velocityX) > threshold || Math.abs(dragState.velocityY) > threshold) {
    requestAnimationFrame(animate)
  }
}

// 关闭导航
const closeNavigation = () => {
  console.log(3213213321)
  emit('close')
}

// 添加到购物车 - 防止拖拽时误触
const addToCart = (item) => {
  // 如果正在拖拽或刚刚发生过拖拽移动，不执行添加操作
  if (isDragging.value || dragState.hasMoved) {
    return
  }
  emit('add-to-cart', item)
}

// 购物车数量计算
const getCartCount = (side) => {
  const cart = side === 'left' ? props.leftCart : props.rightCart
  return cart.reduce((total, item) => total + (item ? item.quantity : 0), 0)
}

// 处理购物车事件 - 转发给父组件
const handleRemoveFromCart = (side, index) => {
  emit('remove-from-cart', side, index)
}

const handleIncreaseQuantity = (side, index) => {
  emit('update-cart', side, index, 'increase')
}

const handleDecreaseQuantity = (side, index) => {
  emit('update-cart', side, index, 'decrease')
}

const handleSelectSlot = (side, index) => {
  // 可以添加选择槽位的逻辑
}

const handlePlaceOrder = (side) => {
  emit('place-order', side)
}

// 预加载图片
const preloadImages = async () => {
  isLoading.value = true
  loadingProgress.value = 0
  const startTime = Date.now()

  // 设置总图片数量
  totalImages.value = sushiData.length
  let loadedCount = 0

  const imagePromises = sushiData.map(item => {
    return new Promise((resolve) => {
      if (loadedImages.value.has(item.image)) {
        loadedCount++
        loadingProgress.value = (loadedCount / totalImages.value) * 100
        resolve()
        return
      }

      const img = new Image()
      img.onload = () => {
        loadedImages.value.add(item.image)
        loadedCount++
        loadingProgress.value = (loadedCount / totalImages.value) * 100
        resolve()
      }
      img.onerror = () => {
        loadedCount++
        loadingProgress.value = (loadedCount / totalImages.value) * 100
        resolve() // 即使加载失败也继续
      }
      img.src = item.image
    })
  })

  // 等待所有图片加载完成
  await Promise.all(imagePromises)

  // 确保至少显示2秒加载动画，让用户能看清楚
  const elapsedTime = Date.now() - startTime
  const minLoadingTime = 2000 // 最少2秒

  if (elapsedTime < minLoadingTime) {
    await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime))
  }

  console.log(`所有图片加载完成，总耗时: ${Date.now() - startTime}ms`)
  isLoading.value = false
}

// 监听visible变化，每次打开时预加载
const { visible } = toRefs(props)
watch(visible, (newVisible) => {
  if (newVisible) {
    preloadImages()
  }
})

// 组件挂载时初始化
onMounted(() => {
  nextTick(() => {
    // 直接设置菜单显示在左上角可见位置
    offsetX.value = 50
    offsetY.value = 50
  })
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', endDrag)
})
</script>

<style lang="scss" scoped>
.sushi-navigation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: white;
  z-index: 9999;
  overflow: hidden;
}

.navigation-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: white;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

// 创建底部功能区容器 - 与主页完全一致
.bottom-section-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 213px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  pointer-events: none; // 让容器本身不阻挡点击
  background: transparent; // 确保背景透明
}

.bottom-left, .bottom-right {
  flex: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fffce7;
  height: 100%;
  padding: 10px;
  border: 3px solid #8B4513;
  border-bottom: none;
  border-radius: 15px 15px 0 0;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3);
  margin: 10px;
  min-width: fit-content;
  pointer-events: auto; // 恢复购物车区域的点击
}

// 加载动画样式
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #FFF3D6 0%, #FFE082 50%, #FFD54F 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.loading-content {
  text-align: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 2px solid #FFD54F;
}

.sushi-loading {
  position: relative;
  margin-bottom: 30px;
}

.sushi-plate {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
  border-radius: 50%;
  background: linear-gradient(135deg, #D4B996 0%, #C8B299 100%);
  border: 3px solid #B59B79;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  animation: plateRotate 6s linear infinite;
  overflow: visible;
}

.sushi-item {
  position: absolute;
  font-size: 28px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  animation: sushiMagicDance 6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.sushi-1 {
  animation-delay: 0s;
}

.sushi-2 {
  animation-delay: -1.5s;
}

.sushi-3 {
  animation-delay: -3s;
}

.sushi-4 {
  animation-delay: -4.5s;
}

.loading-waves {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.wave {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #FF9800;
  animation: waveAnimation 1.5s ease-in-out infinite;
}

.wave-1 {
  animation-delay: 0s;
}

.wave-2 {
  animation-delay: 0.3s;
}

.wave-3 {
  animation-delay: 0.6s;
}

.loading-text {
  h3 {
    font-size: 24px;
    color: #553C20;
    margin: 0 0 10px 0;
    font-weight: 700;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  }

  p {
    font-size: 16px;
    color: #8B7355;
    margin: 0 0 20px 0;
    font-weight: 500;
    opacity: 0.8;
  }
}

.loading-progress {
  margin-top: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 213, 79, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD54F 0%, #FF9800 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 2px 4px rgba(255, 152, 0, 0.3);
}

.progress-text {
  font-size: 14px;
  color: #8B7355;
  font-weight: 600;
  text-align: center;
}

@keyframes plateRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes sushiMagicDance {
  0% {
    transform: rotate(0deg) translateX(25px) rotate(0deg) scale(0.7);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
  }
  10% {
    transform: rotate(36deg) translateX(35px) rotate(-36deg) scale(0.85);
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.2));
  }
  20% {
    transform: rotate(72deg) translateX(45px) rotate(-72deg) scale(1.0);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25));
  }
  30% {
    transform: rotate(108deg) translateX(55px) rotate(-108deg) scale(1.15);
    filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.3));
  }
  40% {
    transform: rotate(144deg) translateX(60px) rotate(-144deg) scale(1.25);
    filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.35));
  }
  50% {
    transform: rotate(180deg) translateX(65px) rotate(-180deg) scale(1.3);
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
  }
  60% {
    transform: rotate(216deg) translateX(60px) rotate(-216deg) scale(1.25);
    filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.35));
  }
  70% {
    transform: rotate(252deg) translateX(50px) rotate(-252deg) scale(1.1);
    filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.3));
  }
  80% {
    transform: rotate(288deg) translateX(40px) rotate(-288deg) scale(0.95);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25));
  }
  90% {
    transform: rotate(324deg) translateX(30px) rotate(-324deg) scale(0.8);
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.2));
  }
  100% {
    transform: rotate(360deg) translateX(25px) rotate(-360deg) scale(0.7);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
  }
}

@keyframes waveAnimation {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.5);
    opacity: 1;
  }
}

// 购物车样式已移至 ConveyorShoppingCart 组件中，这里不需要重复定义

.infinite-menu-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  // 优化触摸性能
  touch-action: none;
  -webkit-overflow-scrolling: touch;

  // 启用硬件加速，减少卡顿
  transform: translateZ(0);
  will-change: transform;
}

// 右侧拖动区域
.right-drag-area {
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  pointer-events: auto;
  z-index: 10;
}

.menu-content {
  position: absolute;
  top: 0;
  left: 0;
  min-width: 100%;
  min-height: 100%;
  padding: 20px;

  // 启用硬件加速，优化平板性能
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;

  // 减少重绘，提升性能
  contain: layout style paint;
}

.menu-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
  min-width: 3000px; // 增加宽度确保能拖到最右边
  min-height: auto; // 改为自动高度，避免筛选后出现大量空白
  justify-content: center;
}

.menu-item {
  width: 200px;
  height: 250px;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
  display: flex;
  flex-direction: column;
  align-items: center;

  &:hover {
    transform: translateY(-4px);
  }

  &.sold-out {
    opacity: 0.6;
    cursor: not-allowed;

    &:hover {
      transform: none;
    }
  }

  // 筛选格子样式 - 与物品样式一致
  &.filter-item {
    opacity: 1;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    &.active-filter {
      border: 3px solid #007bff;
      box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
    }

    .filter-image {
      height: 150px;
      background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      color: white;

      .filter-content {
        text-align: center;

        .filter-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .filter-keyword {
          font-size: 12px;
          opacity: 0.9;
        }
      }

      .filter-arrow {
        position: absolute;
        bottom: 10px;
        right: 10px;

        .arrow-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
        }
      }
    }
  }
}

.item-image {
  width: 180px;
  height: 180px;
  position: relative;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.3s ease;
    background: transparent;
  }

  &:hover img {
    transform: scale(1.05);
  }
}

.sold-out-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.new-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #ff6b6b;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.item-info {
  width: 100%;
  height: 60px;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin-top: 10px;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: #000;
  margin: 0;
  text-align: center;
  line-height: 1.3;
}

.add-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 71, 87, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;

  .add-icon {
    font-size: 48px;
    color: white;
  }
}

.navigation-indicator {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 25px;

  .drag-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
}


.return-btn {
  margin: 0 300px;
  color: black;
  border: 2px solid black;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fff;
  pointer-events: auto;
  &:hover {
    background: #f0f0f0;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .menu-items-grid {
    grid-template-columns: repeat(5, 200px);
  }
}

@media (max-width: 1200px) {
  .menu-items-grid {
    grid-template-columns: repeat(4, 200px);
  }
}

@media (max-width: 900px) {
  .menu-items-grid {
    grid-template-columns: repeat(3, 180px);
  }

  .menu-item {
    width: 180px;
  }
}
</style>
