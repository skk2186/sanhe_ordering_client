<template>
  <div class="cart-section">
    <div class="item-group">
      <div :class="'order-btn order-btn-' + side" type="button" :style="'order: ' + (side ==='left' ? '1' : '0') "
           :aria-label="`下单-${side}`" :title="`下单`"
           @click="$emit('place-order', side)">
        <div class="order-progress">{{ count }}/4</div>
      </div>

      <!-- 购物车圆形显示 -->
      <div v-for="(item, index) in items" :key="`${side}-circle-${index}`" :class="'cart-item cart-item-'+side">
        <div class="item-circle" :class="{ 'has-item': item, 'empty-item': !item }" @click="$emit('select', side, index)">
          <div v-if="item" class="item-image">
            <img :src="item.image" :alt="item.name" />
          </div>
          <button v-if="item" class="circle-close-btn" type="button"
                  aria-label="移除该项" title="移除"
                  @click.stop="$emit('remove', side, index)">×</button>
        </div>
        <!-- 下方信息区域 - 始终显示 -->
        <div class="item-info" :class="{ 'empty-info': !item }">
          <div class="item-name-area" :class="{ 'empty-name': !item }">
            <div class="item-name" v-if="item">{{ item.name }}</div>
          </div>
          <div class="item-controls" :class="{ 'empty-controls': !item }">
            <button class="minus-btn" type="button" :disabled="!item" :aria-disabled="!item"
                    :class="{ 'empty-btn': !item }" aria-label="减少数量" title="-"
                    @click="item && $emit('decrease', side, index)">-</button>
            <span class="quantity-display" :class="{ 'empty-quantity': !item }" aria-live="polite">{{ item ? item.quantity : 0 }}</span>
            <button class="plus-btn" type="button" :disabled="!item || (item && item.quantity >= 4)" :aria-disabled="!item || (item && item.quantity >= 4)"
                    :class="{ 'empty-btn': !item, 'max-quantity': item && item.quantity >= 4 }" aria-label="增加数量" title="+"
                    @click="item && item.quantity < 4 && $emit('increase', side, index)">+</button>
          </div>
        </div>
      </div>

      <!-- 左侧场景：最后渲染下单按钮 -->
<!--      <div v-if="!orderFirst" class="order-btn order-btn-right" type="button"-->
<!--           :aria-label="`下单-${side}`" :title="`下单`"-->
<!--           @click="$emit('place-order', side)">-->
<!--        <div class="order-progress">{{ count }}/4</div>-->
<!--      </div>-->
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  side: { type: String, required: true },
  items: { type: Array, required: true },
  count: { type: Number, required: true }
})

const orderFirst = computed(() => props.side === 'right')

defineEmits(['place-order', 'remove', 'increase', 'decrease', 'select'])
</script>

<style lang="scss" scoped>
@use '@/styles/conveyor-belt.scss';


.item-group {
  display: flex;
  align-items: flex-end;
  gap: 50px;
}

[data-theme="ailaotou"] .cart-section {
  background: url('/images/ui/a/cart_bg.png');
  .cart-item-left {
    background: url('/images/ui/a/diezi1.png') ;
  }
  .cart-item-right {
    background: url('/images/ui/a/diezi2.png') ;
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
}
[data-theme="xiaoxin"] .cart-section {
  background: url('/images/ui/c/cart_bg.png') ;
  .cart-item-left {
    background: url('/images/ui/c/diezi1.png') ;
  }
  .cart-item-right {
    background: url('/images/ui/c/diezi2.png') ;
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
    width: 112px;
    height: 167px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

}
</style>

