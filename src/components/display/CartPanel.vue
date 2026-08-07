<template>
  <div class="cart-section">

    <div v-if="tipsType === 'order_meal' || tipsType === 'out_meal'"
        class="tips-overlay"
        :class="tipsType"
        @click="handleTipsClick"
    >
      <!-- out_meal 提示：点击任意位置关闭 -->
    </div>

    <div class="item-group" v-if="!tipsType">
      <div :class="['order-btn', `order-btn-${side}`, { 'is-submitting': submitting }]" type="button"
          :style="'order: ' + (side ==='left' ? '1' : '0') "
          :aria-label="`${$t('common.placeOrder')}-${side}`" :aria-disabled="submitting"
          :title="$t('common.placeOrder')" @click="!submitting && $emit('place-order', side)">
        <el-icon v-if="submitting" class="submitting-icon"><Loading /></el-icon>
        <div v-else class="order-progress">{{ count }}/4</div>
      </div>

      <!-- 购物车圆形显示 -->
      <div v-for="(item, index) in items" :key="`${side}-circle-${index}`" :class="'cart-item cart-item-'+side">
        <div class="item-circle" :class="{ 'has-item': item, 'empty-item': !item }" @click="$emit('select', side, index)">
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
</style>
