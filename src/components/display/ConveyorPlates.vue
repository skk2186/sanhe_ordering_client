<template>
  <!-- 渲染寿司盘集合，保持与现有样式/行为一致 -->
  <SushiPlate
    v-for="item in items"
    :key="item.uniqueKey"
    :item="item"
    :style="{
      position: 'absolute',
      transform: item.transform,
      width: `${itemWidth}px`
    }"
    @click="(payload, evt) => $emit('click', payload, evt)"
    @drag-start="(data) => $emit('drag-start', data)"
    @drag-move="(data) => $emit('drag-move', data)"
    @drag-end="(data) => $emit('drag-end', data)"
  />
</template>

<script setup>
import SushiPlate from '@/components/display/SushiPlate.vue'

const props = defineProps({
  items: { type: Array, required: true },
  itemWidth: { type: Number, required: true }
})

defineEmits(['click', 'drag-start', 'drag-move', 'drag-end'])
</script>

