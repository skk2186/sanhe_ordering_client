<template>
  <div
    class="cart-section"
    :class="[
      `cart-section--${side}`,
      {
        'is-midnight-station': themeKey === 'midnight-station',
        'is-order-success': orderFeedback === 'success',
        'is-order-error': orderFeedback === 'error'
      }
    ]"
  >

    <div v-if="tipsType === 'order_meal' || tipsType === 'out_meal'"
        class="tips-overlay"
        :class="tipsType"
        @click="handleTipsClick"
    >
      <span
        v-if="themeKey === 'midnight-station' && tipsType === 'order_meal'"
        class="station-order-signal"
        aria-hidden="true"
      >
        <i></i><i></i><i></i><b>SIGNAL GREEN</b>
      </span>
      <!-- out_meal 提示：点击任意位置关闭 -->
    </div>

    <div class="item-group" v-if="!tipsType">
      <div :class="['order-btn', `order-btn-${side}`, { 'is-submitting': submitting }]" type="button"
          :style="'order: ' + (side ==='left' ? '1' : '0') "
          :aria-label="`${$t('common.placeOrder')}-${side}`" :aria-disabled="submitting"
          :title="$t('common.placeOrder')" @click="!submitting && $emit('place-order', side)">
        <span v-if="themeKey === 'midnight-station' && submitting" class="station-departure-signal" aria-hidden="true">ROUTE</span>
        <span v-else-if="themeKey === 'midnight-station' && orderFeedback === 'success'" class="station-departure-signal is-success" aria-hidden="true">ACCEPTED</span>
        <span v-else-if="themeKey === 'midnight-station' && orderFeedback === 'error'" class="station-departure-signal is-error" aria-hidden="true">CHECK</span>
        <el-icon v-if="submitting" class="submitting-icon"><Loading /></el-icon>
        <div v-else class="order-progress">{{ count }}/4</div>
      </div>

      <!-- 购物车圆形显示 -->
      <div
        v-for="(item, index) in items"
        :key="`${side}-circle-${index}`"
        :class="[
          'cart-item',
          `cart-item-${side}`,
          {
            'is-station-quantity-changing': quantityChanging.has(index),
            'is-station-increasing': quantityDirections[index] === 'increase',
            'is-station-decreasing': quantityDirections[index] === 'decrease'
          }
        ]"
        :data-station-cart-side="side"
        :data-station-cart-index="index"
      >
        <div class="item-circle" :class="{ 'has-item': item, 'empty-item': !item }" @click="$emit('select', side, index)">
          <div v-if="item" class="item-image w3-animate-top">
            <img :src="item.image" :alt="item.name" />
          </div>
            <button v-if="item" class="circle-close-btn" type="button" :disabled="submitting"
            :aria-label="$t('common.remove')" :title="$t('common.remove')"
                  @click.stop="handleRemove(index)">×</button>
        </div>
        <div
          v-if="themeKey === 'midnight-station' && removedTicket && removedTicket.index === index"
          class="station-removed-ticket"
          aria-hidden="true"
        >
          <strong>{{ removedTicket.name }}</strong>
          <span>REMOVED</span>
        </div>
        <!-- 下方信息区域 - 始终显示 -->
        <div class="item-info" :class="{ 'empty-info': !item }">
          <div class="item-name-area" :class="{ 'empty-name': !item }">
            <div v-if="item" >{{ item.storeName }}</div>
          </div>
          <div class="item-controls" :class="{ 'empty-controls': !item }">
            <button class="minus-btn" type="button" :disabled="!item || submitting" :aria-disabled="!item || submitting"
             :class="{ 'empty-btn': !item }" :aria-label="$t('common.decrease')" title="-"
                    @click="item && $emit('decrease', side, index)">-</button>
          <span
            class="quantity-display"
            :class="{ 'empty-quantity': !item }"
            :data-station-quantity="item ? item.quantity : 0"
            aria-live="polite"
          >{{ item ? item.quantity : 0 }}</span>
            <button class="plus-btn" type="button" :disabled="!item || submitting || (item && item.quantity >= 4)" :aria-disabled="!item || submitting || (item && item.quantity >= 4)"
             :class="{ 'empty-btn': !item, 'max-quantity': item && item.quantity >= 4 }" :aria-label="$t('common.increase')" title="+"
                    @click="item && item.quantity < 4 && $emit('increase', side, index)">+</button>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
const props = defineProps({
  side: { type: String, required: true },
  themeKey: { type: String, default: 'zhenxian' },
  items: { type: Array, required: true },
  count: { type: Number, required: true },
  submitting: { type: Boolean, default: false },
  orderFeedback: { type: String, default: '' },
  tipsType: {
    type: String,
    default: '',
    validator: (val) => {
      return ['', 'order_meal', 'out_meal'].includes(val)
    }
  }
})

const emit = defineEmits(['place-order', 'remove', 'increase', 'decrease', 'select', 'close-tips'])
const quantityChanging = ref(new Set())
const quantityDirections = ref({})
const removedTicket = ref(null)
const quantityTimers = new Map()
let removedTicketTimer = 0

const getMotionDuration = (token, fallback) => {
  const raw = window.getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) ? value : fallback
}

const showRemovedTicket = (index, item) => {
  if (props.themeKey !== 'midnight-station' || !item) return
  window.clearTimeout(removedTicketTimer)
  removedTicket.value = {
    index,
    name: item.name || item.storeName || item.productName || 'DISH'
  }
  removedTicketTimer = window.setTimeout(() => {
    removedTicket.value = null
  }, getMotionDuration('--station-motion-remove', 260))
}

const markQuantityChange = (index, direction) => {
  if (props.themeKey !== 'midnight-station') return
  const nextChanging = new Set(quantityChanging.value)
  nextChanging.add(index)
  quantityChanging.value = nextChanging
  quantityDirections.value = { ...quantityDirections.value, [index]: direction }

  window.clearTimeout(quantityTimers.get(index))
  const timer = window.setTimeout(() => {
    const settled = new Set(quantityChanging.value)
    settled.delete(index)
    quantityChanging.value = settled
    const nextDirections = { ...quantityDirections.value }
    delete nextDirections[index]
    quantityDirections.value = nextDirections
    quantityTimers.delete(index)
  }, getMotionDuration('--station-motion-number', 190))
  quantityTimers.set(index, timer)
}

const handleRemove = (index) => {
  const item = props.items[index]
  showRemovedTicket(index, item)
  // Emit immediately so business state and persisted cart data are never
  // delayed by the visual removal ticket.
  emit('remove', props.side, index)
}

watch(() => props.items.map(item => item
  ? {
      id: item.id,
      quantity: item.quantity,
      name: item.name || item.storeName || item.productName || 'DISH'
    }
  : null), (next, previous) => {
  if (!Array.isArray(previous)) return
  next.forEach((item, index) => {
    const previousItem = previous[index]
    const previousQuantity = Number(previousItem?.quantity)
    const nextQuantity = Number(item?.quantity)
    if (Number.isFinite(previousQuantity) && Number.isFinite(nextQuantity) && previousQuantity !== nextQuantity) {
      markQuantityChange(index, nextQuantity > previousQuantity ? 'increase' : 'decrease')
    }
    if (previousItem && !item) showRemovedTicket(index, previousItem)
  })
})

// 处理提示点击事件
const handleTipsClick = () => {
  // 只有out_meal类型的提示支持点击关闭
  if (props.tipsType === 'out_meal') {
    emit('close-tips')
  }
  // order_meal类型不处理点击，让它自动3秒后关闭
}

onUnmounted(() => {
  quantityTimers.forEach(timer => window.clearTimeout(timer))
  window.clearTimeout(removedTicketTimer)
})
</script>

<style lang="scss" scoped>
@use '@/styles/conveyor-belt.scss';

.tips-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 10; // 确保覆盖原有内容
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-btn.is-submitting {
  cursor: wait;
  opacity: 0.75;
}

.submitting-icon {
  color: #fff;
  font-size: 28px;
  animation: rotating 1s linear infinite;
}




// 9. 提示覆盖层交互样式
.tips-overlay {
  cursor: pointer; // 显示可点击状态

  // order_meal 不显示点击提示，让用户知道会自动关闭
  &.order_meal {
    cursor: default;
  }
}

// 10. 父容器增加相对定位：确保 tips-overlay 绝对定位生效
.cart-section {
  width: 827px;
  height: 217px;
  flex: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 20px;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center center;
  position: relative; // 关键：为子元素绝对定位提供参考
  overflow: hidden; // 防止内容溢出

  .cart-item {
    width: 114px;
    height: 167px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
}

.item-group {
  display: flex;
  align-items: flex-end;
  gap: 50px;
}

.item-info {
  width: 100%;
  margin-top: -18px; /* 增加负边距，让信息框覆盖圆形下方约1/4 */
  border-radius: 8px;
  overflow: hidden;
  z-index: 2; /* 提高层级，确保挡住圆形 */
  position: relative;
}
.item-name-area {
  height: 30px;
  text-align: center;
  line-height: 30px;
  padding: 2px 4px;
  font-size: 16px;
  overflow: hidden;
}


[data-theme="ailaotou"] .cart-section {
  background: url('/images/ui/a/cart_bg.png');
  .cart-item-left {
    background: url('/images/ui/a/diezi1.png') ;
  }
  .cart-item-right {
    background: url('/images/ui/a/diezi2.png') ;
  }
  .item-name-area {
    color: #fff;
  }
  .tips-overlay.order_meal {
    background-image: url('/images/ui/a/order_meal.png');
  }
  .tips-overlay.out_meal {
    background-image: url('/images/ui/a/out_meal.png');
  }

}
[data-theme="zhenxian"] .cart-section {
  background: url('/images/ui/b/cart_bg.png') ;
  .cart-item-left {
    background: url('/images/ui/b/diezi1.png') ;
  }
  .cart-item-right {
    background: url('/images/ui/b/diezi2.png') ;
  }
  .item-name-area {
    color: #fff;
  }
  .tips-overlay.order_meal {
    background-image: url('/images/ui/b/order_meal.png');
  }
  .tips-overlay.out_meal {
    background-image: url('/images/ui/b/out_meal.png');
  }

}
[data-theme="xiaoxin"] .cart-section {
  background: url('/images/ui/c/cart_bg.png') ;
  .cart-item-left {
    background: url('/images/ui/c/diezi1.png') ;
  }
  .cart-item-right {
    background: url('/images/ui/c/diezi2.png') ;
  }
  .item-name-area {
    color: #000;
  }
  .tips-overlay.order_meal {
    background-image: url('/images/ui/c/order_meal.png');
  }
  .tips-overlay.out_meal {
    background-image: url('/images/ui/c/out_meal.png');
  }

}


.cart-section {
  width: 827px;
  height: 217px;
  flex: 0 auto; /* 自动宽度，根据内容调整 */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 20px; /* 最小内边距 */
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center center;
  .cart-item {
    width: 114px;
    height: 167px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

}


.item-circle {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  &.empty-item {
    //background: transparent;
    //border: 2px dashed rgba(189, 189, 189, 0.3);

    &::after {
      content: '+';
      font-size: 24px;
      color: rgba(153, 153, 153, 0.3);
      font-weight: bold;
    }
  }

  .item-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 80%;
      height: 80%;
      object-fit: contain;
    }
  }

  .circle-close-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: #000;
    color: white;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 3;

    &:hover {
      background: #333;
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.9);
    }



  }
}

.item-name {
  color: white;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.item-controls {
  height: 30px; /* 下方4成 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px; /* 增加按钮距离边框的间距 */
  color: #000;
  &.empty-controls {

  }
}

.item-controls .minus-btn,
.item-controls .plus-btn {
  width: 18px; /* 稍微减小按钮宽度，给边距留出空间 */
  height: 18px;
  border: none;
  border-radius: 4px;
  background: linear-gradient(135deg, #FFD54F 0%, #FFC107 100%);
  cursor: pointer;
  font-size: 11px; /* 稍微减小字体 */
  font-weight: bold;
  color: #553C20;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(.empty-btn) {
    background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
    transform: scale(1.1);
  }

  &:active:not(.empty-btn) {
    transform: scale(0.95);
  }

  &.empty-btn {
    opacity: 0.4;
    cursor: default;
  }

  &.max-quantity {
    opacity: 0.5;
    cursor: not-allowed;
    background: linear-gradient(135deg, #CCCCCC 0%, #999999 100%);

    &:hover {
      background: linear-gradient(135deg, #CCCCCC 0%, #999999 100%);
      transform: none;
    }
  }
}

.w3-animate-top{position:relative;animation:animatetop 0.4s}@keyframes animatetop{from{top:-300px;opacity:0} to{top:0;opacity:1}}

@media (min-width: 769px) and (max-width: 1920px) {
  .cart-section {
    width: 100%;
    height: 170px;
    padding: 10px 12px;

    .cart-item {
      width: clamp(72px, 5vw, 96px);
      height: 150px;
      gap: 4px;
    }
  }

  .item-group {
    width: 100%;
    height: 150px;
    align-items: center;
    justify-content: space-between;
    gap: clamp(6px, 0.7vw, 14px);
  }

  .item-circle {
    width: clamp(72px, 5vw, 96px);
    height: clamp(72px, 5vw, 96px);

    .circle-close-btn {
      top: -5px;
      right: -5px;
      width: 26px;
      height: 26px;
      font-size: 15px;
    }
  }

  .item-info {
    margin-top: -12px;
  }

  .item-name-area {
    height: 26px;
    padding: 0 3px;
    line-height: 26px;
    font-size: 13px;
  }

  .item-controls {
    height: 26px;
    padding: 0 6px;
  }

  .order-btn {
    width: clamp(78px, 5.25vw, 100px);
    height: 150px;
    flex: 0 0 auto;
    padding: 0;
    background-size: 100% 100%;

    .order-progress {
      top: auto;
      bottom: 18px;
      font-size: 22px;
    }
  }
}
/* Midnight Station foundation: the two carts become seat ticket racks while
   keeping the existing four-slot structure and all event handlers intact. */
.cart-section.is-midnight-station {
  color: var(--station-text-primary);
  background: var(--station-background-deep);
  border: 1px solid var(--station-border);
  border-radius: var(--station-radius-panel);
  box-shadow: var(--station-shadow-e1);
  padding-top: 28px;

  &::before {
    position: absolute;
    top: 8px;
    left: 16px;
    color: var(--station-accent);
    font-family: var(--station-font-number);
    font-size: var(--station-size-ticket);
    font-weight: 700;
    letter-spacing: 0.14em;
  }

  &.cart-section--left::before { content: 'LEFT SEAT / A'; }
  &.cart-section--right::before { content: 'RIGHT SEAT / B'; }

  .item-group { gap: clamp(8px, 0.9vw, 18px); }

  .cart-item-left,
  .cart-item-right { background: transparent; }

  .item-circle {
    border: 1px solid var(--station-border);
    border-radius: var(--station-radius-control);
    background: var(--station-surface-elevated);
    box-shadow: var(--station-shadow-e0);
    transition: transform var(--station-motion-fast) var(--station-easing-standard),
      border-color var(--station-motion-fast) ease,
      box-shadow var(--station-motion-fast) ease;

    &:hover,
    &:focus-within {
      border-color: var(--station-hover);
      box-shadow: var(--station-shadow-e1);
      transform: translateY(-2px);
    }

    &.empty-item {
      background: var(--station-paper-ghost);
      border-style: dashed;
      &::after { color: var(--station-text-secondary); }
    }
  }

  .item-info {
    margin-top: -12px;
    border: 1px solid var(--station-border);
    border-radius: var(--station-radius-ticket);
    box-shadow: var(--station-shadow-e0);
  }

  .item-name-area {
    color: var(--station-text-on-surface);
    background: var(--station-surface);
    font-family: var(--station-font-ui);
    font-size: clamp(12px, 0.75vw, 15px);
    font-weight: 700;
  }

  .item-controls {
    color: var(--station-text-on-surface);
    background: var(--station-surface-muted);
  }

  .quantity-display {
    color: var(--station-text-on-surface);
    font-family: var(--station-font-number);
    font-size: var(--station-size-ticket);
  }

  .item-controls .minus-btn,
  .item-controls .plus-btn {
    width: 30px;
    min-width: 30px;
    height: 26px;
    color: var(--station-text-on-surface);
    background: var(--station-surface-elevated);
    border: 1px solid var(--station-border);
    border-radius: var(--station-radius-small);
    transition: background var(--station-motion-fast) ease,
      border-color var(--station-motion-fast) ease,
      transform var(--station-motion-instant) ease;

    &:hover:not(.empty-btn),
    &:focus-visible:not(.empty-btn) {
      color: var(--station-text-on-surface);
      background: var(--station-hover);
      border-color: var(--station-primary);
      transform: none;
    }

    &:active:not(.empty-btn) {
      transform: translateY(1px);
      box-shadow: var(--station-shadow-pressed);
    }

    &.max-quantity {
      color: var(--station-text-secondary);
      background: var(--station-surface-muted);
      border-color: var(--station-border);
    }
  }

  .circle-close-btn {
    width: 28px;
    height: 28px;
    color: var(--station-text-primary);
    background: var(--station-primary-strong);
    border: 1px solid var(--station-accent);
    border-radius: var(--station-radius-small);
    transition: background var(--station-motion-fast) ease,
      transform var(--station-motion-instant) ease;

    &:hover,
    &:focus-visible { background: var(--station-primary); transform: none; }
    &:active { transform: translateY(1px); }
  }

  .order-btn {
    color: var(--station-text-primary);
    background: var(--station-primary);
    border: 1px solid var(--station-accent);
    border-radius: var(--station-radius-control);
    box-shadow: var(--station-shadow-e1);
    transition: background var(--station-motion-fast) ease,
      transform var(--station-motion-instant) ease,
      box-shadow var(--station-motion-fast) ease;

    &::before {
      content: 'DEPART';
      position: absolute;
      top: 20px;
      left: 50%;
      color: var(--station-text-primary);
      font-family: var(--station-font-number);
      font-size: var(--station-size-ticket);
      font-weight: 700;
      letter-spacing: 0.12em;
      transform: translateX(-50%);
    }

    &:hover,
    &:focus-visible {
      background: var(--station-primary-strong);
      box-shadow: var(--station-shadow-e2);
      transform: translateY(-1px);
    }

    &:active { transform: translateY(1px); box-shadow: var(--station-shadow-pressed); }

    .order-progress {
      color: var(--station-text-primary);
      font-family: var(--station-font-number);
      text-shadow: none;
    }
  }

  .tips-overlay {
    top: 10px;
    left: auto;
    right: 10px;
    width: auto;
    height: auto;
    min-height: 0;
    padding: 8px 12px;
    z-index: 10;
    pointer-events: auto;
    color: var(--station-text-on-surface);
    background: var(--station-surface);
    border: 2px solid var(--station-primary);
    font-family: var(--station-font-number);
    font-size: var(--station-size-ticket);
    font-weight: 700;
    letter-spacing: 0.12em;

    &::before { content: 'SEAT FULL'; }
    &.order_meal {
      color: var(--station-text-on-surface);
      border-color: var(--station-success);
      animation: station-order-success var(--station-motion-receive) var(--station-easing-standard) both;
      &::before { content: 'ORDER SENT'; }
      &::after {
        content: none;
      }
    }
    &.out_meal { animation: station-full-alert var(--station-motion-receive) var(--station-easing-standard) both; }
  }

  .station-order-signal {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 8px;

    i {
      width: 8px;
      height: 8px;
      display: block;
      background: var(--station-border);
      border: 1px solid var(--station-text-on-surface);
      border-radius: 50%;
      animation: station-signal-light var(--station-motion-receive) var(--station-easing-standard) both;
    }

    i:nth-child(1) { --station-signal-color: var(--station-primary); animation-delay: 0ms; }
    i:nth-child(2) { --station-signal-color: var(--station-accent); animation-delay: 110ms; }
    i:nth-child(3) { --station-signal-color: var(--station-success); animation-delay: 220ms; }

    b {
      margin-left: 3px;
      color: var(--station-success);
      font-family: var(--station-font-number);
      font-size: 10px;
      letter-spacing: 0.08em;
    }
  }

  .cart-item {
    position: relative;
    transition: transform var(--station-motion-fast) var(--station-easing-standard);
  }

  .cart-item.is-station-receiving .item-circle {
    animation: station-ticket-catch var(--station-motion-receive) var(--station-easing-enter) both;
  }

  .cart-item.is-station-receiving .item-info {
    border-color: var(--station-accent);
  }

  .quantity-display {
    position: relative;
    min-width: 2ch;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform-origin: center center;
    backface-visibility: hidden;
  }

  .cart-item.is-station-quantity-changing .quantity-display {
    animation: station-number-flip var(--station-motion-number) var(--station-easing-standard) both;
  }

  .cart-item.is-station-increasing .quantity-display { --station-number-direction: -1; }
  .cart-item.is-station-decreasing .quantity-display { --station-number-direction: 1; }

  .station-removed-ticket {
    position: absolute;
    left: 50%;
    top: 38px;
    z-index: 4;
    width: 88px;
    min-height: 52px;
    padding: 7px 6px;
    box-sizing: border-box;
    display: grid;
    align-content: center;
    gap: 3px;
    color: var(--station-text-on-surface);
    background: var(--station-surface-muted);
    border: 1px solid var(--station-border);
    border-radius: var(--station-radius-ticket);
    box-shadow: var(--station-shadow-e1);
    text-align: center;
    pointer-events: none;
    transform: translate(-50%, -50%);
    animation: station-ticket-remove var(--station-motion-remove) var(--station-easing-exit) both;

    strong {
      overflow: hidden;
      font-family: var(--station-font-ui);
      font-size: 11px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: var(--station-primary-strong);
      font-family: var(--station-font-number);
      font-size: 9px;
      letter-spacing: 0.08em;
    }
  }

  .order-btn.is-submitting .station-departure-signal,
  .order-btn.is-order-success .station-departure-signal,
  .order-btn.is-order-error .station-departure-signal { display: block; }

  .station-departure-signal {
    position: absolute;
    top: 48px;
    left: 50%;
    z-index: 3;
    color: var(--station-text-primary);
    font-family: var(--station-font-number);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    transform: translateX(-50%);
  }

  .order-btn.is-submitting .submitting-icon { display: none; }

  .station-departure-signal:not(.is-success):not(.is-error) {
    animation: station-departure-sweep 900ms linear infinite;
  }

  .station-departure-signal.is-success { color: var(--station-success); }
  .station-departure-signal.is-error { color: var(--station-text-primary); }

  @keyframes station-ticket-catch {
    0% { transform: translateY(0); box-shadow: var(--station-shadow-e0); }
    42% { transform: translateY(-3px); box-shadow: inset 0 0 0 2px var(--station-accent), var(--station-shadow-e1); }
    100% { transform: translateY(0); box-shadow: var(--station-shadow-e0); }
  }

  @keyframes station-number-flip {
    0% { opacity: 0.35; transform: translateY(calc(var(--station-number-direction, -1) * 7px)) rotateX(-24deg); }
    100% { opacity: 1; transform: translateY(0) rotateX(0); }
  }

  @keyframes station-ticket-remove {
    from { opacity: 1; transform: translate(-50%, -50%) translateY(0); }
    to { opacity: 0; transform: translate(-50%, -50%) translateY(12px); }
  }

  @keyframes station-full-alert {
    0% { opacity: 0; transform: translateY(-3px); }
    30% { opacity: 1; transform: translateY(0); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes station-order-success {
    0% { opacity: 0; transform: translateY(-3px); border-color: var(--station-primary); }
    38% { opacity: 1; transform: translateY(0); border-color: var(--station-accent); }
    100% { opacity: 1; transform: translateY(0); border-color: var(--station-success); }
  }

  @keyframes station-signal-light {
    0% { background: var(--station-border); transform: scale(0.8); }
    55% { background: var(--station-signal-color); transform: scale(1.16); }
    100% { background: var(--station-signal-color); transform: scale(1); }
  }

  @keyframes station-departure-sweep {
    0%, 100% { opacity: 0.62; transform: translateX(-50%) translateY(0); }
    50% { opacity: 1; transform: translateX(-50%) translateY(-2px); }
  }
}

@media (prefers-reduced-motion: reduce) {
  .cart-section.is-midnight-station .tips-overlay.out_meal,
  .cart-section.is-midnight-station .tips-overlay.order_meal,
  .cart-section.is-midnight-station .cart-item.is-station-receiving .item-circle,
  .cart-section.is-midnight-station .cart-item.is-station-quantity-changing .quantity-display,
  .cart-section.is-midnight-station .station-removed-ticket,
  .cart-section.is-midnight-station .station-departure-signal {
    animation: none !important;
  }

  .cart-section.is-midnight-station .station-order-signal i {
    animation: none !important;
    background: var(--station-signal-color);
  }

  .cart-section.is-midnight-station .station-removed-ticket { opacity: 0; }
}
</style>
