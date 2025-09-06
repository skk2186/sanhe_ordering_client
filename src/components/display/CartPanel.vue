<template>
  <div class="item-group">
    <!-- 右侧场景：先渲染下单按钮 -->
    <button v-if="orderFirst" class="order-btn" type="button"
            :aria-label="`下单-${side}`" :title="`下单`"
            @click="$emit('place-order', side)">
      <div class="order-text">下单</div>
      <div class="order-progress">{{ count }}/4</div>
    </button>

    <!-- 购物车圆形显示 -->
    <div v-for="(item, index) in items" :key="`${side}-circle-${index}`" class="cart-item">
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
    <button v-if="!orderFirst" class="order-btn" type="button"
            :aria-label="`下单-${side}`" :title="`下单`"
            @click="$emit('place-order', side)">
      <div class="order-text">下单</div>
      <div class="order-progress">{{ count }}/4</div>
    </button>
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
</style>

