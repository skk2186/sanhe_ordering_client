<template>
  <div class="cart-section is-midnight-cart" :style="midnightCartStyle">
    <img
      class="midnight-cart-facility"
      :src="`/images/ui/midnight-station/cart-counter-${side}-v2.png`"
      alt=""
      aria-hidden="true"
    >

    <div v-if="tipsType === 'order_meal' || tipsType === 'out_meal'"
        class="tips-overlay"
        :class="tipsType"
        @click="handleTipsClick"
    >
      <!-- out_meal 提示：点击任意位置关闭 -->
    </div>

    <div class="item-group" v-if="!tipsType">
      <button :class="['order-btn', `order-btn-${side}`, { 'is-submitting': submitting }]"
          :style="'order: ' + (side ==='left' ? '1' : '0') "
          :aria-label="`${$t('common.placeOrder')}-${side}`" :disabled="submitting"
          :title="$t('common.placeOrder')" @click="$emit('place-order', side)">
        <el-icon v-if="submitting" class="submitting-icon"><Loading /></el-icon>
        <template v-else>
          <span v-if="orderPreviewItem" class="order-preview" aria-hidden="true">
            <img :src="orderPreviewItem.image" alt="" />
          </span>
          <span class="order-label">{{ $t('common.placeOrder') }}</span>
          <span class="order-progress">{{ count }}/4</span>
          <span class="order-total">¥ {{ totalPrice }}</span>
        </template>
      </button>

      <!-- 购物车圆形显示 -->
      <div v-for="(item, index) in items" :key="`${side}-circle-${index}`" :class="'cart-item cart-item-'+side" :style="midnightSlotStyle(index)">
        <div class="item-circle" :class="{ 'has-item': item, 'empty-item': !item }" role="button" tabindex="0"
          @click="$emit('select', side, index)" @keydown.enter="$emit('select', side, index)" @keydown.space.prevent="$emit('select', side, index)">
          <div v-if="item" class="item-image w3-animate-top">
            <img :src="item.image" :alt="item.name" />
          </div>
            <button v-if="item" class="circle-close-btn" type="button" :disabled="submitting"
            :aria-label="$t('common.remove')" :title="$t('common.remove')"
                  @click.stop="$emit('remove', side, index)">×</button>
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
            <span class="quantity-display" :class="{ 'empty-quantity': !item }" aria-live="polite">{{ item ? item.quantity : 0 }}</span>
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
import { computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
const props = defineProps({
  side: { type: String, required: true },
  items: { type: Array, required: true },
  count: { type: Number, required: true },
  submitting: { type: Boolean, default: false },
  tipsType: {
    type: String,
    default: '',
    validator: (val) => {
      return ['', 'order_meal', 'out_meal'].includes(val)
    }
  }
})

const emit = defineEmits(['place-order', 'remove', 'increase', 'decrease', 'select', 'close-tips'])
const totalPrice = computed(() => props.items.reduce((total, item) => {
  if (!item) return total
  const unit = Number(item.price ?? item.storePrice ?? item.unitPrice ?? 0)
  return total + unit * Number(item.quantity ?? 0)
}, 0).toFixed(2))

// Midnight assets contain fixed physical bays.  These normalized rectangles are
// the single source of truth for all DOM content instead of visual nudging.
const MIDNIGHT_CART_ANCHORS = {
  left: {
    slots: [
      { x: 8.4, y: 31.5, width: 17.1, height: 34 },
      { x: 25.8, y: 31.5, width: 17.1, height: 34 },
      { x: 43.2, y: 31.5, width: 17.1, height: 34 },
      { x: 60.6, y: 31.5, width: 17.1, height: 34 }
    ],
    order: { x: 78.1, y: 30.5, width: 17.2, height: 38 }
  },
  right: {
    slots: [
      { x: 24.1, y: 31.5, width: 17.1, height: 34 },
      { x: 41.5, y: 31.5, width: 17.1, height: 34 },
      { x: 58.9, y: 31.5, width: 17.1, height: 34 },
      { x: 76.3, y: 31.5, width: 17.1, height: 34 }
    ],
    order: { x: 5.1, y: 30.5, width: 17.2, height: 38 }
  }
}

const midnightCartStyle = computed(() => {
  const anchor = MIDNIGHT_CART_ANCHORS[props.side]
  return {
    '--midnight-order-x': `${anchor.order.x}%`,
    '--midnight-order-y': `${anchor.order.y}%`,
    '--midnight-order-w': `${anchor.order.width}%`,
    '--midnight-order-h': `${anchor.order.height}%`
  }
})

const midnightSlotStyle = (index) => {
  const anchor = MIDNIGHT_CART_ANCHORS[props.side].slots[index]
  return {
    '--midnight-slot-x': `${anchor.x}%`,
    '--midnight-slot-y': `${anchor.y}%`,
    '--midnight-slot-w': `${anchor.width}%`,
    '--midnight-slot-h': `${anchor.height}%`
  }
}

const orderPreviewItem = computed(() => props.items.find(Boolean) || null)

// 处理提示点击事件
const handleTipsClick = () => {
  // 只有out_meal类型的提示支持点击关闭
  if (props.tipsType === 'out_meal') {
    emit('close-tips')
  }
  // order_meal类型不处理点击，让它自动3秒后关闭
}
</script>

<style lang="scss" scoped>
@use '@/styles/conveyor-belt.scss';

.midnight-cart-facility { display: none; }

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

/* Midnight Station: the carts are staffed luggage / meal-ticket counters.
   Every selector is rooted at the document theme so legacy skins stay intact. */
[data-theme="midnight-station"] .is-midnight-cart {
  padding: 0;
  overflow: visible;
  background: transparent;

  .midnight-cart-facility {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
    user-select: none;
  }

  .item-group {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    display: grid;
    align-items: start;
    gap: 0;
    box-sizing: border-box;
    padding-block: clamp(60px, 3.55vw, 72px) 9px;
  }

  .order-btn-left ~ .cart-item,
  .order-btn-right ~ .cart-item { min-width: 0; }

  &:has(.order-btn-left) .item-group {
    grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(118px, 1.18fr);
    padding-inline: 7.5% 1.8%;
  }

  &:has(.order-btn-right) .item-group {
    grid-template-columns: minmax(118px, 1.28fr) repeat(4, minmax(0, 1fr));
    padding-inline: 2.5% 7.2%;
  }

  .cart-item {
    width: 100%;
    height: 142px;
    gap: 0;
  }

  .item-circle {
    width: 78%;
    height: 58px;
    box-sizing: border-box;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;

    &:hover { transform: translateY(-2px); filter: drop-shadow(0 0 7px rgba(242, 201, 120, .72)); box-shadow: none; }
    &:focus-visible { outline: 3px solid #f2c978; outline-offset: 3px; }
    &.empty-item::after { color: rgba(242, 201, 120, .52); font-size: 25px; }
  }

  .item-image img { width: 94%; height: 94%; object-fit: contain; filter: drop-shadow(0 4px 4px rgba(0, 0, 0, .48)); }
  .circle-close-btn {
    top: -7px; right: -13px; width: 28px; height: 28px;
    border: 0; border-radius: 50%;
    background: transparent; color: #fff6df; box-shadow: none;
    &:hover:not(:disabled) { background: transparent; filter: drop-shadow(0 0 6px #f4a77c); transform: scale(1.06); }
    &:focus-visible { outline: 3px solid #f2c978; outline-offset: 2px; }
  }

  .item-info {
    width: 100%;
    margin-top: -1px;
    display: flex;
    flex-direction: column-reverse;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    overflow: visible;
  }
  .item-name-area { height: 29px; padding: 1px 5px; line-height: 27px; color: #fff1c8; font-size: clamp(14px, .82vw, 20px); font-weight: 800; text-shadow: 0 2px 4px #06100e; }
  .item-controls { height: 28px; padding: 0 13%; color: #fff1c8; }
  .quantity-display { min-width: 2ch; font-size: clamp(17px, 1vw, 24px); font-weight: 900; }
  .item-controls .minus-btn,
  .item-controls .plus-btn {
    width: 30px; height: 28px; border: 0; border-radius: 50%;
    background: transparent; color: #21180d; font-size: 20px;
    box-shadow: none; text-shadow: 0 1px rgba(255, 236, 177, .72);
    &:hover:not(.empty-btn) { background: transparent; filter: drop-shadow(0 0 6px #ffe4a0); transform: translateY(-1px); }
    &:focus-visible { outline: 3px solid #f2c978; outline-offset: 1px; }
  }

  .order-btn {
    width: 100%; height: 132px; box-sizing: border-box; padding: 3px 8px 10px;
    display: grid; place-content: center; gap: 5px;
    border: 0; border-radius: 0;
    color: #fff1c8; background: transparent;
    box-shadow: none; text-shadow: 0 2px 4px #020706;
    font-family: inherit; cursor: pointer;
    &:hover:not(:disabled) { transform: translateY(-2px); filter: drop-shadow(0 0 7px rgba(242, 201, 120, .72)); }
    &:active:not(:disabled) { transform: translateY(1px); }
    &:focus-visible { outline: 3px solid #f2c978; outline-offset: 3px; }
    &:disabled { cursor: wait; opacity: .68; }
  }
  .order-label { font-size: clamp(18px, 1.1vw, 26px); font-weight: 900; letter-spacing: .06em; }
  .order-progress { position: static; padding: 0; font-size: clamp(19px, 1.15vw, 28px); font-weight: 800; line-height: 1; }
  .order-total { color: #e5d7bc; font-size: clamp(14px, .8vw, 19px); font-weight: 700; }

  /* Asset-anchor layout: the tray, control strip and ticket window remain
     visible because every interactive rectangle is mapped to its painted bay. */
  .item-group { display: block; padding: 0; }
  .cart-item {
    position: absolute;
    left: var(--midnight-slot-x);
    top: var(--midnight-slot-y);
    width: var(--midnight-slot-w);
    height: var(--midnight-slot-h);
    display: block;
  }
  .item-circle { width: 100%; height: 57%; }
  .item-info { position: absolute; inset: 56% 0 0; display: block; }
  .item-name-area {
    height: 44%; padding: 0 5%; line-height: 1.15;
    display: grid; place-items: center; font-size: clamp(14px, .9vw, 22px);
  }
  .item-controls {
    position: absolute; inset: 47% 3% 0;
    height: auto; padding: 0; display: grid;
    grid-template-columns: 1fr minmax(30px, .8fr) 1fr; gap: 4%;
  }
  .quantity-display { align-self: center; justify-self: center; font-size: clamp(18px, 1.05vw, 26px); }
  .item-controls .minus-btn,
  .item-controls .plus-btn {
    width: 100%; min-width: 30px; height: 100%; min-height: 30px;
    font-size: clamp(20px, 1.18vw, 28px);
  }
  .circle-close-btn { top: -6px; right: -5px; width: 30px; height: 30px; }
  .order-btn {
    position: absolute;
    left: var(--midnight-order-x); top: var(--midnight-order-y);
    width: var(--midnight-order-w); height: var(--midnight-order-h);
    padding: 4% 5% 3%; display: grid;
    grid-template-columns: minmax(0, 1fr); grid-template-rows: 1fr auto auto auto;
    gap: 2px; align-items: center; justify-items: center;
  }
  .order-preview { min-width: 0; min-height: 0; height: 100%; display: grid; place-items: center; }
  .order-preview img { width: min(72px, 78%); height: 100%; object-fit: contain; filter: drop-shadow(0 3px 3px rgba(0,0,0,.6)); }
  .order-label { font-size: clamp(17px, 1.05vw, 25px); }
  .order-progress { font-size: clamp(19px, 1.18vw, 28px); }
  .order-total { font-size: clamp(15px, .9vw, 21px); }
}

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

  [data-theme="midnight-station"] .is-midnight-cart {
    .item-group { height: 100%; padding-block: 46px 5px; }
    &:has(.order-btn-left) .item-group { padding-inline: 7.5% 1.8%; }
    &:has(.order-btn-right) .item-group { padding-inline: 2.5% 7.2%; }
    .cart-item { width: 100%; height: 116px; }
    .item-circle { width: 78%; height: 43px; }
    .item-name-area { height: 24px; line-height: 22px; font-size: 13px; }
    .item-controls { height: 24px; padding-inline: 8%; }
    .item-controls .minus-btn,
    .item-controls .plus-btn { width: 24px; height: 24px; font-size: 17px; }
    .quantity-display { font-size: 17px; }
    .order-btn { width: 100%; height: 105px; padding: 0 4px 5px; }
    .order-label { font-size: 17px; }
    .order-progress { font-size: 20px; }
    .order-total { font-size: 13px; }
    .item-group { display: block; padding: 0; }
    .cart-item { position: absolute; left: var(--midnight-slot-x); top: var(--midnight-slot-y); width: var(--midnight-slot-w); height: var(--midnight-slot-h); }
    .item-circle { width: 100%; height: 57%; }
    .item-info { position: absolute; inset: 56% 0 0; display: block; }
    .item-name-area { height: 44%; display: grid; place-items: center; line-height: 1.1; font-size: clamp(12px, .75vw, 15px); }
    .item-controls { position: absolute; inset: 47% 2% 0; height: auto; padding: 0; display: grid; grid-template-columns: 1fr 1fr 1fr; }
    .item-controls .minus-btn, .item-controls .plus-btn { width: 100%; height: 100%; min-width: 24px; min-height: 24px; }
    .order-btn { position: absolute; left: var(--midnight-order-x); top: var(--midnight-order-y); width: var(--midnight-order-w); height: var(--midnight-order-h); padding: 3% 4%; grid-template-rows: 1fr auto auto auto; }
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
</style>
