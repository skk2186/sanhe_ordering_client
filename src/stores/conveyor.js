import { defineStore } from 'pinia'
import { ref, computed, onMounted, onUnmounted } from 'vue'

export const useConveyorStore = defineStore('conveyor', () => {
  // 状态
  const isRunning = ref(true)
  const speed = ref(1)
  const direction = ref(1) // 1: 正向, -1: 反向
  const offset = ref(0)
  const selectedSushi = ref(null)
  const isDragging = ref(false)
  
  // 寿司数据
  const sushiData = ref([
    { id: 1, name: '三文鱼握寿司', emoji: '🍣', price: 25, category: 'nigiri' },
    { id: 2, name: '金枪鱼刺身', emoji: '🐟', price: 45, category: 'sashimi' },
    { id: 3, name: '鳗鱼握寿司', emoji: '🍱', price: 35, category: 'nigiri' },
    { id: 4, name: '海胆军舰', emoji: '🦐', price: 55, category: 'gunkan' },
    { id: 5, name: '三文鱼卷', emoji: '🍙', price: 30, category: 'maki' },
    { id: 6, name: '加州卷', emoji: '🥢', price: 28, category: 'maki' },
    { id: 7, name: '天妇罗虾', emoji: '🍤', price: 40, category: 'tempura' },
    { id: 8, name: '章鱼握寿司', emoji: '🐙', price: 32, category: 'nigiri' },
    { id: 9, name: '蟹肉沙拉卷', emoji: '🦀', price: 38, category: 'maki' },
    { id: 10, name: '烤鳗鱼卷', emoji: '🍣', price: 42, category: 'maki' }
  ])

  // 动画相关
  let animationFrame = null
  const lastTime = ref(0)

  // 计算属性
  const displayItems = computed(() => {
    // 创建循环显示的寿司项目
    const items = []
    const itemWidth = 150 // 每个寿司项的宽度
    const totalWidth = sushiData.value.length * itemWidth
    const screenWidth = window.innerWidth || 1920
    const visibleCount = Math.ceil(screenWidth / itemWidth) + 2

    for (let i = 0; i < visibleCount; i++) {
      const dataIndex = i % sushiData.value.length
      const item = { ...sushiData.value[dataIndex] }
      item.position = (i * itemWidth + offset.value) % (totalWidth + screenWidth)
      items.push(item)
    }

    return items
  })

  const currentSpeed = computed(() => speed.value * direction.value)

  // 方法
  const startBelt = () => {
    isRunning.value = true
  }

  const stopBelt = () => {
    isRunning.value = false
  }

  const toggleBelt = () => {
    isRunning.value = !isRunning.value
  }

  const setSpeed = (newSpeed) => {
    speed.value = Math.max(0.1, Math.min(3, newSpeed))
  }

  const speedUp = () => {
    setSpeed(speed.value + 0.2)
  }

  const slowDown = () => {
    setSpeed(speed.value - 0.2)
  }

  const reverseDirection = () => {
    direction.value *= -1
  }

  const selectSushi = (sushi) => {
    selectedSushi.value = sushi
  }

  const clearSelection = () => {
    selectedSushi.value = null
  }

  // 动画循环
  const animate = (currentTime) => {
    if (!lastTime.value) lastTime.value = currentTime
    const deltaTime = currentTime - lastTime.value
    lastTime.value = currentTime

    if (isRunning.value && !isDragging.value) {
      // 基础速度：每秒移动50像素
      const baseSpeed = 50
      offset.value += (baseSpeed * currentSpeed.value * deltaTime) / 1000
      
      // 保持offset在合理范围内
      const itemWidth = 150
      const totalWidth = sushiData.value.length * itemWidth
      if (offset.value > totalWidth) {
        offset.value -= totalWidth
      } else if (offset.value < -totalWidth) {
        offset.value += totalWidth
      }
    }

    animationFrame = requestAnimationFrame(animate)
  }

  const startAnimation = () => {
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(animate)
    }
  }

  const stopAnimation = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
  }

  // 拖拽相关
  const startDrag = () => {
    isDragging.value = true
  }

  const endDrag = () => {
    isDragging.value = false
  }

  const dragMove = (deltaX) => {
    if (isDragging.value) {
      offset.value += deltaX
    }
  }

  // 重置传送带
  const reset = () => {
    isRunning.value = true
    speed.value = 1
    direction.value = 1
    offset.value = 0
    selectedSushi.value = null
    isDragging.value = false
  }

  // 获取指定位置的寿司
  const getSushiAtPosition = (x, y) => {
    // 这里可以实现根据坐标获取寿司的逻辑
    // 暂时返回随机寿司用于演示
    const randomIndex = Math.floor(Math.random() * sushiData.value.length)
    return sushiData.value[randomIndex]
  }

  // 添加新寿司到数据中
  const addSushiType = (sushi) => {
    const newId = Math.max(...sushiData.value.map(s => s.id)) + 1
    sushiData.value.push({ ...sushi, id: newId })
  }

  // 移除寿司类型
  const removeSushiType = (id) => {
    const index = sushiData.value.findIndex(s => s.id === id)
    if (index > -1) {
      sushiData.value.splice(index, 1)
    }
  }

  return {
    // 状态
    isRunning,
    speed,
    direction,
    offset,
    selectedSushi,
    isDragging,
    sushiData,
    
    // 计算属性
    displayItems,
    currentSpeed,
    
    // 方法
    startBelt,
    stopBelt,
    toggleBelt,
    setSpeed,
    speedUp,
    slowDown,
    reverseDirection,
    selectSushi,
    clearSelection,
    startAnimation,
    stopAnimation,
    startDrag,
    endDrag,
    dragMove,
    reset,
    getSushiAtPosition,
    addSushiType,
    removeSushiType
  }
})
