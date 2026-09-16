<template>
  <div class="cart-section is-midnight-cart" :style="midnightCartStyle">
    <img
      class="midnight-cart-facility"
      :src="`/images/ui/midnight-station/cart-counter-${side}-v3.png`"
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
const rect = (x, y, width, height) => ({ x, y, width, height })

// V3 uses final, fine-grained asset coordinates. Every visible datum and
// control has its own physical rectangle; no child inset is used to guess it.
const MIDNIGHT_CART_V3_ANCHORS = {
  left: {
    slots: [8.7, 25.1, 41.5, 57.9].map((x) => ({
      imageRect: rect(x, 24.5, 14.7, 24.2),
      nameRect: rect(x + .2, 49.5, 14.3, 7.3),
      minusRect: rect(x + .2, 57.4, 4.25, 10.2),
      quantityRect: rect(x + 5.05, 57.4, 4.6, 10.2),
      plusRect: rect(x + 10.25, 57.4, 4.25, 10.2),
      removeRect: rect(x + 11.4, 22.4, 3.5, 6.2)
    })),
    order: {
      previewRect: rect(74.8, 23.4, 20.2, 29.8),
      labelRect: rect(75.2, 54.1, 8.0, 11.5),
      countRect: rect(83.8, 54.1, 5.4, 11.5),
      totalRect: rect(89.7, 54.1, 6.1, 11.5),
      buttonRect: rect(74.6, 22.8, 21.5, 44.0)
    }
  },
  right: {
    slots: [27.0, 43.4, 59.8, 76.2].map((x) => ({
      imageRect: rect(x, 24.5, 14.7, 24.2),
      nameRect: rect(x + .2, 49.5, 14.3, 7.3),
      minusRect: rect(x + .2, 57.4, 4.25, 10.2),
      quantityRect: rect(x + 5.05, 57.4, 4.6, 10.2),
      plusRect: rect(x + 10.25, 57.4, 4.25, 10.2),
      removeRect: rect(x + 11.4, 22.4, 3.5, 6.2)
    })),
    order: {
      previewRect: rect(4.8, 23.4, 20.2, 29.8),
      labelRect: rect(4.2, 54.1, 8.0, 11.5),
      countRect: rect(12.8, 54.1, 5.4, 11.5),
      totalRect: rect(18.7, 54.1, 6.1, 11.5),
      buttonRect: rect(3.8, 22.8, 21.5, 44.0)
    }
  }
}

const rectVars = (prefix, value) => ({
  [`--${prefix}-x`]: `${value.x}%`,
  [`--${prefix}-y`]: `${value.y}%`,
  [`--${prefix}-w`]: `${value.width}%`,
  [`--${prefix}-h`]: `${value.height}%`
})
const localRect = (child, parent) => rect(
  (child.x - parent.x) / parent.width * 100,
  (child.y - parent.y) / parent.height * 100,
  child.width / parent.width * 100,
  child.height / parent.height * 100
)

const midnightCartStyle = computed(() => {
  const anchor = MIDNIGHT_CART_V3_ANCHORS[props.side]
  const button = anchor.order.buttonRect
  return {
    ...rectVars('order-preview', localRect(anchor.order.previewRect, button)),
    ...rectVars('order-label', localRect(anchor.order.labelRect, button)),
    ...rectVars('order-count', localRect(anchor.order.countRect, button)),
    ...rectVars('order-total', localRect(anchor.order.totalRect, button)),
    ...rectVars('order-button', anchor.order.buttonRect)
  }
})

const midnightSlotStyle = (index) => {
  const anchor = MIDNIGHT_CART_V3_ANCHORS[props.side].slots[index]
  return {
    ...rectVars('slot-image', anchor.imageRect),
    ...rectVars('slot-name', anchor.nameRect),
    ...rectVars('slot-minus', anchor.minusRect),
    ...rectVars('slot-quantity', anchor.quantityRect),
    ...rectVars('slot-plus', anchor.plusRect),
    ...rectVars('slot-remove', localRect(anchor.removeRect, anchor.imageRect))
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
  width: 1050px;
  height: 300px;
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
    display: block;
    box-sizing: border-box;
    padding: 0;
  }

  .cart-item { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .item-circle {
    position: absolute;
    left: var(--slot-image-x); top: var(--slot-image-y);
    width: var(--slot-image-w); height: var(--slot-image-h);
    box-sizing: border-box;
    border: 0; border-radius: 2px; background: transparent; box-shadow: none;
    pointer-events: auto;
    &:hover { filter: drop-shadow(0 0 8px rgba(242, 201, 120, .78)); }
    &:focus-visible { outline: 3px solid #f2c978; outline-offset: 3px; }
    &.empty-item::after { color: rgba(242, 201, 120, .58); font-size: clamp(26px, 1.35vw, 34px); }
  }

  .item-image,
  .item-image img { width: 100%; height: 100%; }
  .item-image img { object-fit: contain; filter: drop-shadow(0 5px 5px rgba(0, 0, 0, .58)); }
  .circle-close-btn {
    top: var(--slot-remove-y); left: var(--slot-remove-x);
    width: var(--slot-remove-w); height: var(--slot-remove-h);
    min-width: 32px; min-height: 32px;
    border: 0; border-radius: 50%;
    background: rgba(93, 21, 17, .82); color: #fff6df; box-shadow: 0 0 0 2px #c98f52;
    pointer-events: auto;
    &:hover:not(:disabled) { filter: drop-shadow(0 0 7px #f4a77c); transform: scale(1.06); }
    &:focus-visible { outline: 3px solid #f2c978; outline-offset: 2px; }
  }

  .item-info,
  .item-controls { display: contents; }
  .item-name-area {
    position: absolute;
    left: var(--slot-name-x); top: var(--slot-name-y);
    width: var(--slot-name-w); height: var(--slot-name-h);
    padding: 0 5%; display: grid; place-items: center;
    overflow: hidden; color: #fff1c8;
    font-size: clamp(16px, .95vw, 23px); font-weight: 800; line-height: 1.1;
    text-align: center; text-overflow: ellipsis; white-space: nowrap; text-shadow: 0 2px 4px #06100e;
  }
  .quantity-display {
    position: absolute;
    left: var(--slot-quantity-x); top: var(--slot-quantity-y);
    width: var(--slot-quantity-w); height: var(--slot-quantity-h);
    display: grid; place-items: center; color: #fff1c8;
    font-size: clamp(21px, 1.15vw, 29px); font-weight: 900; font-variant-numeric: tabular-nums;
  }
  .item-controls .minus-btn,
  .item-controls .plus-btn {
    position: absolute; min-width: 44px; min-height: 44px;
    width: var(--slot-minus-w); height: var(--slot-minus-h);
    border: 0; border-radius: 50%; background: transparent;
    color: #25170b; font-size: clamp(27px, 1.45vw, 36px); font-weight: 950;
    box-shadow: none; text-shadow: 0 1px rgba(255, 236, 177, .78); pointer-events: auto;
    &:hover:not(.empty-btn) { filter: drop-shadow(0 0 8px #ffe4a0); transform: scale(1.05); }
    &:focus-visible { outline: 3px solid #f2c978; outline-offset: 1px; }
  }
  .item-controls .minus-btn { left: var(--slot-minus-x); top: var(--slot-minus-y); }
  .item-controls .plus-btn { left: var(--slot-plus-x); top: var(--slot-plus-y); width: var(--slot-plus-w); height: var(--slot-plus-h); }

  .order-btn {
    position: absolute;
    left: var(--order-button-x); top: var(--order-button-y);
    width: var(--order-button-w); height: var(--order-button-h);
    padding: 0; display: block; border: 0; border-radius: 3px;
    color: #fff1c8; background: transparent; box-shadow: none;
    text-shadow: 0 2px 4px #020706; font-family: inherit; cursor: pointer;
    &:hover:not(:disabled) { filter: drop-shadow(0 0 9px rgba(242, 201, 120, .78)); }
    &:active:not(:disabled) { filter: brightness(.88); }
    &:focus-visible { outline: 3px solid #f2c978; outline-offset: 3px; }
    &:disabled { cursor: wait; opacity: .68; }
  }
  .order-preview,
  .order-label,
  .order-progress,
  .order-total { position: absolute; display: grid; place-items: center; margin: 0; }
  .order-preview { left: var(--order-preview-x); top: var(--order-preview-y); width: var(--order-preview-w); height: var(--order-preview-h); }
  .order-preview img { width: min(110px, 88%); height: min(110px, 92%); object-fit: contain; filter: drop-shadow(0 4px 4px rgba(0,0,0,.62)); }
  .order-label { left: var(--order-label-x); top: var(--order-label-y); width: var(--order-label-w); height: var(--order-label-h); font-size: clamp(19px, 1.08vw, 27px); font-weight: 900; }
  .order-progress { left: var(--order-count-x); top: var(--order-count-y); width: var(--order-count-w); height: var(--order-count-h); font-size: clamp(20px, 1.16vw, 29px); font-weight: 900; font-variant-numeric: tabular-nums; }
  .order-total { left: var(--order-total-x); top: var(--order-total-y); width: var(--order-total-w); height: var(--order-total-h); color: #fff1c8; font-size: clamp(16px, .9vw, 22px); font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
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
    width: 100%;
    height: 220px;
    .item-name-area { font-size: clamp(16px, 1.02vw, 20px); }
    .item-controls .minus-btn,
    .item-controls .plus-btn { min-width: 34px; min-height: 34px; font-size: clamp(23px, 1.4vw, 30px); }
    .quantity-display { font-size: clamp(19px, 1.2vw, 25px); }
    .order-preview img { width: min(70px, 88%); height: min(70px, 92%); }
    .order-label { font-size: clamp(17px, 1.15vw, 22px); }
    .order-progress { font-size: clamp(18px, 1.2vw, 24px); }
    .order-total { font-size: clamp(14px, .92vw, 18px); }
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
