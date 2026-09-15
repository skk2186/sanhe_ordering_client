<template>
  <article
    class="midnight-express-pass"
    :class="{ 'is-reversed': direction === 'right', 'is-paused': paused }"
    aria-label="Night dining express"
  >
    <div class="midnight-express-pass__visual" aria-hidden="true">
      <img
        class="midnight-express-pass__train"
        src="/images/ui/midnight-station/special-express.webp"
        alt=""
      />
      <span class="midnight-express-pass__headlamp"></span>
      <span class="midnight-express-pass__window-glow"></span>
      <span v-for="index in 4" :key="index" class="midnight-express-pass__mist" :class="`mist-${index}`"></span>
    </div>

    <button
      v-if="promoItem && promoContent"
      type="button"
      class="midnight-express-pass__promo"
      :aria-label="`Open ${name} promotion`"
      :title="`Open ${name} promotion`"
      @click.stop.prevent="handlePromoClick"
    >
      <img :src="promoContent.triggerImage" alt="" aria-hidden="true" @error="handlePromoError" />
      <span>{{ name }}</span>
    </button>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  direction: { type: String, default: 'left' },
  paused: { type: Boolean, default: false },
  promoItem: { type: Object, default: null },
  promoContent: { type: Object, default: null }
})

const emit = defineEmits(['featured-promo'])
const name = computed(() => (
  props.promoItem?.name || props.promoItem?.storeName || props.promoItem?.productName || 'Dish'
))

const handlePromoError = (event) => {
  event.target.closest?.('.midnight-express-pass__promo')?.remove()
}

const handlePromoClick = () => {
  if (props.promoItem) emit('featured-promo', props.promoItem)
}
</script>

<style lang="scss" scoped>
.midnight-express-pass {
  position: relative;
  width: 100%;
  height: clamp(280px, 9.5vw, 380px);
  margin-top: clamp(-120px, -3.2vw, -56px);
  pointer-events: none;
}

.midnight-express-pass__visual {
  position: absolute;
  inset: 0;
  filter: drop-shadow(0 14px 10px rgba(1, 7, 12, .62));
}

.midnight-express-pass__train {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  transform-origin: 50% 72%;
  transition: filter 180ms ease;
  user-select: none;
}

.is-reversed .midnight-express-pass__train {
  transform: scaleX(-1);
}

.midnight-express-pass__headlamp {
  position: absolute;
  left: 1.6%;
  top: 50%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #f2c978;
  box-shadow: 0 0 12px 4px rgba(242, 201, 120, .36);
}

.is-reversed .midnight-express-pass__headlamp {
  left: auto;
  right: 1.6%;
}

.midnight-express-pass__window-glow {
  position: absolute;
  left: 47%;
  top: 35%;
  width: 48%;
  height: 23%;
  border-radius: 42%;
  background: rgba(217, 155, 74, .08);
  filter: blur(12px);
  animation: midnight-window-breathe 4.8s ease-in-out infinite;
}

.is-reversed .midnight-express-pass__window-glow {
  left: 5%;
}

.midnight-express-pass__mist {
  position: absolute;
  bottom: 4%;
  width: 96px;
  height: 24px;
  border-radius: 50%;
  background: rgba(183, 201, 207, .18);
  filter: blur(8px);
  opacity: 0;
  animation: midnight-rail-mist 3.6s ease-out infinite;
}

.mist-1 { left: 8%; animation-delay: -2.8s; }
.mist-2 { left: 28%; animation-delay: -1.4s; }
.mist-3 { right: 28%; animation-delay: -2.1s; }
.mist-4 { right: 8%; animation-delay: -.6s; }

.midnight-express-pass__promo {
  position: absolute;
  left: 69%;
  top: 36%;
  z-index: 4;
  width: clamp(112px, 7.2vw, 144px);
  min-height: clamp(96px, 6.4vw, 128px);
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  color: #fff5df;
  background: rgba(7, 17, 29, .92);
  border: 2px solid rgba(242, 201, 120, .78);
  border-radius: 7px;
  box-shadow: 0 8px 16px rgba(1, 7, 12, .48);
  transform: translate(-50%, -50%);
  cursor: pointer;
  pointer-events: auto;
}

.is-reversed .midnight-express-pass__promo {
  left: 31%;
}

.midnight-express-pass__promo img {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border: 2px solid #e5d7bc;
  border-radius: 50%;
}

.midnight-express-pass__promo span {
  min-width: 0;
  overflow: hidden;
  font-size: clamp(18px, 1.05vw, 24px);
  font-weight: 750;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.midnight-express-pass__promo:hover,
.midnight-express-pass__promo:focus-visible {
  border-color: #fff5df;
  outline: 3px solid #f2c978;
  outline-offset: 3px;
}

.midnight-express-pass.is-paused .midnight-express-pass__window-glow,
.midnight-express-pass.is-paused .midnight-express-pass__mist {
  animation-play-state: paused;
}

@keyframes midnight-window-breathe {
  0%, 100% { opacity: .35; }
  50% { opacity: .72; }
}

@keyframes midnight-rail-mist {
  0% { opacity: 0; transform: translate3d(-20px, 5px, 0) scale(.72); }
  35% { opacity: .48; }
  100% { opacity: 0; transform: translate3d(46px, -14px, 0) scale(1.2); }
}

@media (max-width: 1920px) {
  .midnight-express-pass__promo {
    width: 118px;
    min-height: 92px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .midnight-express-pass__train { transition: none; }
  .midnight-express-pass__window-glow,
  .midnight-express-pass__mist { animation: none; }
  .midnight-express-pass__mist { display: none; }
}
</style>
