<template>
  <article class="queue-forest-event" :class="{ 'is-reversed': direction === 'right' }">
    <div class="forest-stage">
      <img class="forest-stage__art" src="/images/ui/b/forest-special-stump-stage.png" alt="" aria-hidden="true">
      <button
        v-if="promoItem"
        type="button"
        class="forest-stage__promo"
        :aria-label="promoContent ? `查看${getName(promoItem)}介绍` : `添加${getName(promoItem)}`"
        :title="promoContent ? `查看${getName(promoItem)}介绍` : `添加${getName(promoItem)}`"
        @click.stop.prevent="handleFeaturedClick"
      >
        <img :src="promoContent?.triggerImage || getImage(promoItem)" alt="" aria-hidden="true">
      </button>
      <span class="forest-stage__leaf forest-stage__leaf--one" aria-hidden="true"></span>
      <span class="forest-stage__leaf forest-stage__leaf--two" aria-hidden="true"></span>
    </div>
  </article>
</template>

<script setup>
const props = defineProps({
  direction: { type: String, default: 'left' },
  promoItem: { type: Object, default: null },
  promoContent: { type: Object, default: null }
})
const emit = defineEmits(['dish-click', 'featured-promo'])
const getName = item => item?.name || item?.storeName || item?.productName || 'Dish'
const getImage = item => item?.image || item?.imageUrl || '/images/default-dish.jpg'
const handleFeaturedClick = () => {
  if (!props.promoItem) return
  emit(props.promoContent ? 'featured-promo' : 'dish-click', props.promoItem)
}
</script>

<style lang="scss" scoped>
.queue-forest-event {
  position: relative;
  width: 100%;
  height: clamp(260px, 15vw, 360px);
  animation: stump-rest 5.8s ease-in-out infinite;
}

.forest-stage {
  position: absolute;
  inset: -24% -2% 0;
  filter: drop-shadow(0 12px 12px rgba(73, 52, 24, .28));
}

.forest-stage__art {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.forest-stage__promo {
  position: absolute;
  left: 50%;
  top: 49%;
  display: grid;
  place-items: center;
  width: 21%;
  aspect-ratio: 1;
  padding: 5px;
  border: 3px solid rgba(255, 247, 211, .93);
  border-radius: 50%;
  background: #fff8e4;
  box-shadow: 0 5px 12px rgba(89, 53, 24, .25);
  cursor: pointer;
  transform: translate(-50%, -50%);
}

.forest-stage__promo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}

.forest-stage__promo:hover,
.forest-stage__promo:focus-visible {
  transform: translate(-50%, -50%) scale(1.06);
}

.forest-stage__leaf {
  position: absolute;
  top: 23%;
  width: 12px;
  height: 22px;
  border-radius: 100% 0 100% 0;
  background: #a8bd54;
  opacity: 0;
  pointer-events: none;
  animation: forest-leaf-drift 4s ease-in-out infinite;
}

.forest-stage__leaf--one { left: 18%; }
.forest-stage__leaf--two { right: 15%; animation-delay: -2s; }

@keyframes stump-rest {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

@keyframes forest-leaf-drift {
  0% { opacity: 0; transform: translate(0, -8px) rotate(-20deg); }
  25% { opacity: .7; }
  100% { opacity: 0; transform: translate(20px, 48px) rotate(90deg); }
}

@media (prefers-reduced-motion: reduce) {
  .queue-forest-event, .forest-stage__leaf { animation: none; }
}
</style>
