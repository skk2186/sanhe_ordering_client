<template>
  <div class="belt-container">
    <div
      :ref="(el) => beltTrackRef && (beltTrackRef.value = el)"
      class="belt-track"
      :class="{ 'dragging': isDragging }"
      @mousedown="$emit('drag-start', $event)"
      @touchstart.passive="$emit('drag-start', $event)"
    >
      <div class="belt-surface">
        <div
          :ref="(el) => beltItemsRef && (beltItemsRef.value = el)"
          class="belt-items"
          :class="{ 'dragging': isDragging, 'momentum': isMomentum }"
          :style="{ transform: `translateX(${displayOffset}px)` }"
        >
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isDragging: { type: Boolean, default: false },
  isMomentum: { type: Boolean, default: false },
  displayOffset: { type: Number, required: true },
  beltTrackRef: { type: Object, default: null },
  beltItemsRef: { type: Object, default: null }
})
</script>

<style scoped>
/* 传送带容器与表面（从父组件迁移，保证样式在子组件生效） */
.belt-container {
  position: absolute;
  left: 0;
  right: 0;
  top: 65%;
  transform: translateY(-50%);
  height: 180px;
  z-index: 5;
}

.belt-track {
  width: 100%;
  height: 180px;
  background: linear-gradient(to bottom, #8B4513 0%, #A0522D 50%, #8B4513 100%);
  border-radius: 90px;
  position: relative;
  cursor: grab;
}
.belt-track:active,
.belt-track.dragging {
  cursor: grabbing;
}

.belt-surface {
  position: absolute;
  top: 15px;
  left: 15px;
  right: 15px;
  height: 150px;
  background: linear-gradient(to bottom, #2C2C2C 0%, #1A1A1A 50%, #2C2C2C 100%);
  border-radius: 75px;
}

.belt-items {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 30px;
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}
.belt-items.dragging,
.belt-items.momentum {
  transition: none !important;
}
</style>

