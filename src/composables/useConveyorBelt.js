import { ref, reactive } from 'vue'

/**
 * 传送带滚动/拖拽/动量逻辑
 * 封装 normalizedOffset、dragState、isDragging/isMomentum，提供 addOffset/start/stop
 */
export function useConveyorBelt({ beltConfig, onUpdate }) {
  const displayOffset = ref(0)
  const isDragging = ref(false)
  const isMomentum = ref(false)

  const dragState = reactive({
    isActive: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    hasMoved: false,
    isLongPress: false,
    longPressTimer: null
  })

  // 设备自适应参数（轻度微调，若外部传入则以外部为准）
  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0))
  const cfg = { ...{
    autoSpeed: 1,
    maxVelocity: 15,
    decay: isTouch ? 0.96 : 0.95,
    minVelocity: isTouch ? 0.12 : 0.1,
    dragThreshold: isTouch ? 10 : 15,
    maxDragDistance: isTouch ? 80 : 50,
    longPressDelay: isTouch ? 600 : 600,
  }, ...beltConfig }

  let animationId = null
  const state = { normalizedOffset: 0, isRunning: false }

  const updateDisplay = () => {
    // 把标准化偏移量限制在一个合理的范围，并更新到 displayOffset
    if (state.normalizedOffset < -100000) state.normalizedOffset += 100000
    if (state.normalizedOffset > 100000) state.normalizedOffset -= 100000
    displayOffset.value = state.normalizedOffset
    onUpdate && onUpdate(displayOffset.value)
  }

  const addOffset = (delta) => {
    state.normalizedOffset += delta
    updateDisplay()
  }

  const start = () => {
    if (state.isRunning) return
    state.isRunning = true
    const animate = () => {
      if (!state.isRunning) return
      if (isDragging.value) {
        animationId = requestAnimationFrame(animate)
        return
      }
      state.normalizedOffset -= cfg.autoSpeed
      updateDisplay()
      animationId = requestAnimationFrame(animate)
    }
    animationId = requestAnimationFrame(animate)
  }

  const stop = () => {
    state.isRunning = false
    if (animationId) cancelAnimationFrame(animationId)
    animationId = null
  }

  const startMomentum = () => {
    isMomentum.value = true
    const step = () => {
      addOffset(dragState.velocity)
      dragState.velocity *= cfg.decay
      if (Math.abs(dragState.velocity) > cfg.minVelocity) {
        requestAnimationFrame(step)
      } else {
        isMomentum.value = false
        dragState.velocity = 0
        start()
      }
    }
    requestAnimationFrame(step)
  }

  // 统一的拖拽事件处理（页面仅绑定 startDrag）
  let boundMove = null
  let boundEnd = null

  const getClient = (e) => ({
    x: e.type.includes('mouse') ? e.clientX : e.touches[0].clientX,
    y: e.type.includes('mouse') ? e.clientY : e.touches[0].clientY,
  })

  // 更新配置的函数
  const updateConfig = (newConfig) => {
    Object.assign(cfg, newConfig)
  }

  const startDrag = (e) => {
    if (dragState.isActive) return
    // 移除preventDefault以支持被动事件监听器
    // e.preventDefault && e.preventDefault()

    const { x, y } = getClient(e)

    dragState.isActive = true
    dragState.hasMoved = false
    dragState.isLongPress = false
    dragState.startX = x
    dragState.startY = y
    dragState.lastX = x
    dragState.lastTime = Date.now()
    dragState.velocity = 0

    isDragging.value = true
    stop()

    dragState.longPressTimer = setTimeout(() => {
      dragState.isLongPress = true
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50)
    }, cfg.longPressDelay)

    boundMove = (evt) => handleDrag(evt)
    boundEnd = () => endDrag()
    document.addEventListener('mousemove', boundMove)
    document.addEventListener('mouseup', boundEnd)
    document.addEventListener('touchmove', boundMove, { passive: true })
    document.addEventListener('touchend', boundEnd, { passive: true })
    document.addEventListener('touchcancel', boundEnd, { passive: true })

    if (typeof document !== 'undefined' && document.body) document.body.style.cursor = 'grabbing'
  }

  const handleDrag = (e) => {
    if (!dragState.isActive) return
    // 移除preventDefault以支持被动事件监听器
    // e.preventDefault && e.preventDefault()

    const now = Date.now()
    const { x, y } = getClient(e)
    const deltaX = x - dragState.startX
    const deltaY = y - dragState.startY
    const distance = Math.hypot(deltaX, deltaY)

    if (distance > cfg.dragThreshold) {
      dragState.hasMoved = true
      if (dragState.longPressTimer) {
        clearTimeout(dragState.longPressTimer)
        dragState.longPressTimer = null
      }
    }

    // 仅在超过阈值（dragState.hasMoved）后才处理拖拽，避免快速点击造成漂移
    if (dragState.hasMoved) {
      const timeDelta = now - dragState.lastTime
      if (timeDelta > 0 && timeDelta < 100) {
        const moveDelta = x - dragState.lastX
        dragState.velocity = (moveDelta / timeDelta) * 16
        dragState.velocity = Math.max(-cfg.maxVelocity, Math.min(cfg.maxVelocity, dragState.velocity))
      }
      const limited = Math.max(-cfg.maxDragDistance, Math.min(cfg.maxDragDistance, deltaX))
      addOffset(limited)
      dragState.startX = x
      dragState.lastX = x
      dragState.lastTime = now
    }
  }

  const endDrag = () => {
    if (!dragState.isActive) return
    dragState.isActive = false
    isDragging.value = false
    if (typeof document !== 'undefined' && document.body) document.body.style.cursor = ''

    if (dragState.longPressTimer) {
      clearTimeout(dragState.longPressTimer)
      dragState.longPressTimer = null
    }

    document.removeEventListener('mousemove', boundMove)
    document.removeEventListener('mouseup', boundEnd)
    document.removeEventListener('touchmove', boundMove)
    document.removeEventListener('touchend', boundEnd)
    document.removeEventListener('touchcancel', boundEnd)

    if (Math.abs(dragState.velocity) > cfg.minVelocity) {
      startMomentum()
    } else {
      start()
    }

    setTimeout(() => {
      dragState.hasMoved = false
      dragState.isLongPress = false
    }, 100)
  }

  return {
    // 状态
    displayOffset,
    isDragging,
    isMomentum,
    dragState,
    // 行为
    addOffset,
    start,
    stop,
    startMomentum,
    startDrag,
    updateConfig,
  }
}

