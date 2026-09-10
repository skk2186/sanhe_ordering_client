<template>
  <div v-if="ghosts.length" class="station-cart-transfer-layer" aria-hidden="true">
    <div
      v-for="ghost in ghosts"
      :key="ghost.id"
      class="station-cart-transfer"
      :data-station-transfer-id="ghost.id"
      :style="ghost.style"
    >
      <span class="station-cart-transfer__rule"></span>
      <span class="station-cart-transfer__name">{{ ghost.name }}</span>
      <span class="station-cart-transfer__meta">BOARDING</span>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onUnmounted, ref } from 'vue'

const props = defineProps({
  themeKey: { type: String, default: 'zhenxian' }
})

const ghosts = ref([])
let transferId = 0
const activeAnimations = new Map()
const receiveTimers = new Set()

const getMotionDuration = (token, fallback) => {
  const raw = window.getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) ? value : fallback
}

const removeGhost = (id) => {
  const animation = activeAnimations.get(id)
  if (animation) {
    animation.onfinish = null
    animation.oncancel = null
    animation.cancel()
  }
  activeAnimations.delete(id)
  ghosts.value = ghosts.value.filter(ghost => ghost.id !== id)
}

const markCartReception = (side, index) => {
  const cart = document.querySelector(`.cart-section.is-midnight-station.cart-section--${side}`)
  const slot = cart?.querySelector(`[data-station-cart-index="${index}"]`)
  if (!cart || !slot) return

  cart.classList.add('is-station-receiving')
  slot.classList.add('is-station-receiving')

  const timer = window.setTimeout(() => {
    cart.classList.remove('is-station-receiving')
    slot.classList.remove('is-station-receiving')
    receiveTimers.delete(timer)
  }, getMotionDuration('--station-motion-receive', 220))
  receiveTimers.add(timer)
}

const getSourceRect = (sourceElement, sourcePoint) => {
  if (sourceElement?.isConnected) return sourceElement.getBoundingClientRect()
  const x = Number(sourcePoint?.x) || window.innerWidth / 2
  const y = Number(sourcePoint?.y) || window.innerHeight * 0.5
  return { left: x - 44, top: y - 28, width: 88, height: 56 }
}

const getTargetElement = (side, index) => {
  const cart = document.querySelector(`.cart-section.is-midnight-station.cart-section--${side}`)
  const slot = cart?.querySelector(`[data-station-cart-index="${index}"]`)
  return slot?.querySelector('.item-circle') || slot || cart
}

const play = async ({ item, side, index, sourceElement = null, sourcePoint = null } = {}) => {
  if (props.themeKey !== 'midnight-station' || !item || !side) return

  const startRect = getSourceRect(sourceElement, sourcePoint)
  const width = Math.min(116, Math.max(88, startRect.width * 0.36))
  const height = 58
  const id = `station-transfer-${++transferId}`
  const name = item.name || item.storeName || item.productName || 'DISH'

  ghosts.value.push({
    id,
    name,
    style: {
      left: `${startRect.left + (startRect.width - width) / 2}px`,
      top: `${startRect.top + startRect.height * 0.42 - height / 2}px`,
      width: `${width}px`,
      height: `${height}px`
    }
  })

  await nextTick()
  const node = document.querySelector(`[data-station-transfer-id="${id}"]`)
  const target = getTargetElement(side, index)
  const targetRect = target?.getBoundingClientRect()
  if (!node || !targetRect) {
    removeGhost(id)
    return
  }

  const startCenterX = startRect.left + startRect.width / 2
  const startCenterY = startRect.top + startRect.height * 0.42
  const targetCenterX = targetRect.left + targetRect.width / 2
  const targetCenterY = targetRect.top + targetRect.height / 2
  const deltaX = targetCenterX - startCenterX
  const deltaY = targetCenterY - startCenterY
  const arcLift = Math.min(112, Math.max(46, Math.abs(deltaX) * 0.16))
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion || typeof node.animate !== 'function') {
    markCartReception(side, index)
    removeGhost(id)
    return
  }

  const animation = node.animate([
    { transform: 'translate3d(0, 0, 0) scale(1) rotate(-2deg)', opacity: 1 },
    {
      transform: `translate3d(${Math.round(deltaX * 0.45)}px, ${Math.round(deltaY * 0.45 - arcLift)}px, 0) scale(.82) rotate(${side === 'left' ? -1 : 1}deg)`,
      opacity: 0.94,
      offset: 0.45
    },
    {
      transform: `translate3d(${Math.round(deltaX)}px, ${Math.round(deltaY)}px, 0) scale(.58) rotate(0deg)`,
      opacity: 0.2
    }
  ], {
    duration: getMotionDuration('--station-motion-transfer', 520),
    easing: 'cubic-bezier(0.18, 0.76, 0.2, 1)',
    fill: 'forwards'
  })

  activeAnimations.set(id, animation)
  const finish = () => {
    activeAnimations.delete(id)
    markCartReception(side, index)
    ghosts.value = ghosts.value.filter(ghost => ghost.id !== id)
  }
  animation.onfinish = finish
  animation.oncancel = () => {
    activeAnimations.delete(id)
    ghosts.value = ghosts.value.filter(ghost => ghost.id !== id)
  }
}

defineExpose({ play })

onUnmounted(() => {
  activeAnimations.forEach(animation => animation.cancel())
  activeAnimations.clear()
  receiveTimers.forEach(timer => window.clearTimeout(timer))
  receiveTimers.clear()
  ghosts.value = []
})
</script>

<style lang="scss" scoped>
.station-cart-transfer-layer {
  position: fixed;
  inset: 0;
  z-index: 120;
  overflow: visible;
  pointer-events: none;
}

.station-cart-transfer {
  position: fixed;
  z-index: 1;
  display: grid;
  align-content: center;
  gap: 2px;
  padding: 8px 10px;
  box-sizing: border-box;
  overflow: hidden;
  color: var(--station-text-on-surface);
  background: var(--station-surface-elevated);
  border: 1px solid var(--station-accent);
  border-radius: var(--station-radius-ticket);
  box-shadow: var(--station-shadow-e2);
  transform-origin: center center;
  will-change: transform, opacity;
}

.station-cart-transfer__rule {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 9px;
  height: 1px;
  background: var(--station-border);
}

.station-cart-transfer__name,
.station-cart-transfer__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.station-cart-transfer__name {
  margin-top: 4px;
  font-family: var(--station-font-ui);
  font-size: var(--station-size-ticket);
  font-weight: 700;
}

.station-cart-transfer__meta {
  color: var(--station-primary);
  font-family: var(--station-font-number);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

@media (prefers-reduced-motion: reduce) {
  .station-cart-transfer { transition: none !important; }
}
</style>
