<template>
  <article class="queue-boat-event" :class="{ 'is-reversed': direction === 'right' }">
    <!-- 船体图必须保持为组件内第一张 <img>：ScenicDishStage 的水花层依赖它换算船底坐标 -->
    <img class="queue-boat-art" src="/images/ui/b/shinchan-boat-guidenew-transparent.png" alt="" aria-hidden="true" />
    <div class="queue-boat-dishes" aria-label="Featured video">
      <button
        v-if="promoItem && promoContent"
        type="button"
        class="queue-event-promo queue-event-promo--plate-b"
        :aria-label="`Open ${getName(promoItem)} promotion`"
        :title="`Open ${getName(promoItem)} promotion`"
        @click.stop.prevent="handlePromoClick"
      >
        <img :src="promoContent.triggerImage" alt="" aria-hidden="true" @error="handlePromoError" />
      </button>
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
const handlePromoError = event => { event.target.closest?.('.queue-event-promo')?.remove() }
const handlePromoClick = () => { if (props.promoItem) emit('featured-promo', props.promoItem) }
</script>

<style lang="scss" scoped>
.queue-boat-event { position: relative; width: 110%; height: clamp(300px, 17vw, 420px); margin-left: -5%; opacity: 1; transform-origin: 50% 78%; animation: queue-boat-float 5.8s ease-in-out infinite; }
.queue-boat-art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: center bottom; filter: drop-shadow(0 13px 12px rgba(5,86,111,.24)); pointer-events: none; }
.is-reversed .queue-boat-art { transform: scaleX(-1); }
.queue-boat-dishes { position: absolute; inset: 0; z-index: 2; }
.queue-event-promo { position: absolute; top: 55%; left: 50%; width: 19%; aspect-ratio: 1; display: grid; place-items: center; padding: 0; border: 0; border-radius: 50%; background: rgba(255, 252, 239, .9); cursor: pointer; transform: translate(-50%, -50%); filter: drop-shadow(0 5px 9px rgba(95, 57, 27, .25)); }
.queue-event-promo img { width: 82%; aspect-ratio: 1; object-fit: contain; border-radius: 50%; }
.queue-event-promo:hover img, .queue-event-promo:focus-visible img { transform: scale(1.08); }
@keyframes queue-boat-float { 0%,100% { transform: translateY(-2px) rotate(-.5deg); } 50% { transform: translateY(5px) rotate(.6deg); } }
@media (max-width: 900px) { .queue-boat-event { width: 112%; margin-left: -6%; height: 270px; } .queue-event-promo { width: 21%; } }
@media (max-width: 600px) { .queue-boat-event { width: 116%; margin-left: -8%; height: 236px; } .queue-event-promo { width: 23%; } }
@media (prefers-reduced-motion: reduce) { .queue-boat-event { animation: none; } }
</style>
