<template>
  <article class="queue-turtle-event" :class="{ 'is-reversed': direction === 'right', 'is-layered-failed': layeredFailed }">
    <div class="queue-turtle-sway">
      <div class="queue-turtle-visual" aria-hidden="true">
        <img v-if="layeredFailed" class="queue-turtle-fallback" src="/images/ui/c/sea-turtle-coral-tray-two.png" alt="" @error="handleFallbackError" />
        <div v-else class="turtle-canvas">
          <div class="turtle-body-group">
            <img class="queue-turtle-layer queue-turtle-fin queue-turtle-fin--rear-left" src="/images/ui/c/turtle-layered/finRearLeftCrop.png" alt="" @error="handleLayerError" />
            <img class="queue-turtle-layer queue-turtle-fin queue-turtle-fin--rear-right" src="/images/ui/c/turtle-layered/finRearRightCrop.png" alt="" @error="handleLayerError" />
            <img class="queue-turtle-layer queue-turtle-body" src="/images/ui/c/turtle-layered/bodyCrop.png" alt="" @error="handleLayerError" />
            <img class="queue-turtle-layer queue-turtle-shell" src="/images/ui/c/turtle-layered/shellCrop.png" alt="" @error="handleLayerError" />
            <img class="queue-turtle-layer queue-turtle-fin queue-turtle-fin--front-left" src="/images/ui/c/turtle-layered/finFrontLeftCrop.png" alt="" @error="handleLayerError" />
            <img class="queue-turtle-layer queue-turtle-fin queue-turtle-fin--front-right" src="/images/ui/c/turtle-layered/finFrontRightCrop.png" alt="" @error="handleLayerError" />
            <img class="queue-turtle-layer queue-turtle-head" src="/images/ui/c/turtle-layered/headStaticCrop.png" alt="" @error="handleLayerError" />
          </div>
          <div class="turtle-tray-group">
            <img class="queue-turtle-layer queue-turtle-tray" src="/images/ui/c/turtle-layered/trayCropnew-transparent.png" alt="" @error="handleLayerError" />
            <div class="queue-turtle-dishes" aria-label="Open the featured video">
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
          </div>
          <img class="queue-turtle-layer queue-turtle-splash queue-turtle-splash--rear" src="/images/ui/c/turtle-layered/splashGenerated.png" alt="" @error="handleLayerError" />
          <img class="queue-turtle-layer queue-turtle-splash queue-turtle-splash--front" src="/images/ui/c/turtle-layered/splashGenerated.png" alt="" @error="handleLayerError" />
          <span class="queue-turtle-bubble queue-turtle-bubble--one"></span>
          <span class="queue-turtle-bubble queue-turtle-bubble--two"></span>
          <span class="queue-turtle-bubble queue-turtle-bubble--three"></span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({
  direction: { type: String, default: 'left' },
  promoItem: { type: Object, default: null },
  promoContent: { type: Object, default: null }
})
const emit = defineEmits(['dish-click', 'featured-promo'])
const layeredFailed = ref(false)
const getName = item => item?.name || item?.storeName || item?.productName || 'Dish'
const handleLayerError = () => { layeredFailed.value = true }
const handleFallbackError = event => { event.target.style.display = 'none' }
const handlePromoError = event => { event.target.closest?.('.queue-event-promo')?.remove() }
const handlePromoClick = () => { if (props.promoItem) emit('featured-promo', props.promoItem) }
</script>

<style lang="scss" scoped>
.queue-turtle-event { position: relative; width: 110%; height: clamp(260px, 15vw, 360px); margin-left: -5%; opacity: 1; transform-origin: 50% 78%; animation: queue-turtle-float 5.8s ease-in-out infinite; }
.queue-turtle-sway { position: absolute; inset: 0; transform-origin: 50% 78%; }
/* All layer positions use the 488x430 composition canvas from the source preview. */
.queue-turtle-visual { position: absolute; top: -28%; left: -3%; z-index: 1; width: 106%; aspect-ratio: 488 / 430; height: auto; transform-origin: 50% 64%; filter: drop-shadow(0 13px 12px rgba(5,67,104,.24)); pointer-events: none; }
.turtle-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.turtle-body-group { position: absolute; inset: 0; transform: scaleX(-1); transform-origin: 50% 64%; }
.is-reversed .turtle-body-group { transform: none; }
.queue-turtle-layer { position: absolute; display: block; height: auto; max-width: none; pointer-events: none; user-select: none; }
.queue-turtle-fallback { position: absolute; inset: 8% 2% auto; z-index: 2; width: 96%; height: auto; pointer-events: none; user-select: none; }
.queue-turtle-fallback { transform: scaleX(-1); transform-origin: 50% 50%; }
.is-reversed .queue-turtle-fallback { transform: none; }
.is-layered-failed .queue-turtle-tray { opacity: 0; }
.turtle-tray-group { position: absolute; left: 25%; top: 35%; z-index: 6; width: 60%; aspect-ratio: 372 / 116; animation: turtle-tray-float 1.9s ease-in-out infinite reverse; transform-origin: 50% 82%; pointer-events: auto; }
.queue-turtle-tray { inset: 0; width: 100%; }
//龟身
.queue-turtle-body { left: 3.5%; top: 50%; z-index: 2; width: 70.08%; animation: turtle-body-glide 1.72s ease-in-out infinite; transform-origin: 52% 44%; }
//龟甲
.queue-turtle-shell { left: 14%; top: 43.02%; z-index: 3; width: 63.11%; animation: turtle-body-glide 1.72s ease-in-out -0.18s infinite; transform-origin: 50% 70%; }
.queue-turtle-head { left:67%; top: 17.91%; z-index: 4; width: 40.57%; animation: turtle-head-look 2.15s ease-in-out infinite; transform-origin: 24% 74%; }
//.queue-turtle-fin { z-index: 4; }
// 后鳍
.queue-turtle-fin--rear-left { left: 8%; top: 57%; z-index: 4; width: 20.49%; transform-origin: 92% 42%; animation: turtle-rear-left 0.92s ease-in-out infinite; }
// 右后鳍使用拆分图中的原始位置，放在龟身后，避免遮住龟甲和前鳍。
.queue-turtle-fin--rear-right { left: 17%; top: 41%; z-index: 1; width: 22.5%; transform-origin: 12% 42%; animation: turtle-rear-right 0.92s ease-in-out -0.46s infinite; }
.queue-turtle-fin--front-left { left: 47%; top: 50%; z-index: 5; width: 27.05%; transform-origin: 88% 12%; animation: turtle-front-left 0.82s ease-in-out infinite; }
.queue-turtle-fin--front-right { left: 67.62%; top: 52.79%; z-index: 3; width: 27.25%; transform-origin: 12% 12%; animation: turtle-front-right 0.82s ease-in-out -0.41s infinite; }
.queue-turtle-splash { z-index: 0; width: 31%; opacity: 0; object-fit: contain; animation: turtle-splash-burst 0.72s ease-out infinite; }
.queue-turtle-splash--rear { left: -2%; bottom: 0; animation-delay: -0.42s; }
.queue-turtle-splash--front { right: -2%; bottom: 0; animation-delay: -0.08s; }
.queue-turtle-bubble { position: absolute; z-index: 7; display: block; width: clamp(7px, 0.8vw, 13px); aspect-ratio: 1; border: 2px solid rgba(203,245,255,.9); border-radius: 50%; background: rgba(114,220,249,.18); box-shadow: inset 1px 1px 0 rgba(255,255,255,.8); opacity: 0; animation: turtle-bubble-rise 2.45s ease-out infinite; }
.queue-turtle-bubble--one { left: 15%; top: 33%; animation-delay: -1.75s; }
.queue-turtle-bubble--two { left: 79%; top: 39%; width: clamp(5px, 0.55vw, 9px); animation-delay: -.72s; }
.queue-turtle-bubble--three { left: 86%; top: 29%; width: clamp(8px, 0.9vw, 14px); animation-delay: -2.2s; }
.queue-turtle-dishes { position: absolute; inset: 0; z-index: 2; pointer-events: auto; }
.queue-event-promo { position: absolute; top: 50%; left: 50%; width: 23%; aspect-ratio: 1; display: grid; place-items: center; padding: 0; border: 0; border-radius: 50%; background: rgba(255, 252, 239, .88); cursor: pointer; transform: translate(-50%, -50%); filter: drop-shadow(0 5px 9px rgba(8, 108, 150, .25)); pointer-events: auto; }
.queue-event-promo img { width: 82%; aspect-ratio: 1; object-fit: contain; border-radius: 50%; }
.queue-event-promo::after { content: ''; position: absolute; inset: 3%; border: 2px solid rgba(255, 255, 255, .82); border-radius: 50%; animation: turtle-promo-pulse 2.6s ease-out infinite; }
.queue-event-promo:hover img, .queue-event-promo:focus-visible img { transform: scale(1.08); }
@keyframes queue-turtle-float { 0%,100% { transform: translateY(-2px); } 50% { transform: translateY(5px); } }
@keyframes turtle-body-glide { 0%,100% { transform: translateY(1px); } 50% { transform: translateY(-4px); } }
@keyframes turtle-tray-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
@keyframes turtle-head-look { 0%,100% { transform: translateY(1px) rotate(-2deg); } 48% { transform: translateY(-3px) rotate(2deg); } 58% { transform: translateY(-1px) rotate(0deg); } }
@keyframes turtle-front-left { 0%,100% { transform: rotate(8deg) translate(0,0); } 50% { transform: rotate(-16deg) translate(-3px,5px); } }
@keyframes turtle-front-right { 0%,100% { transform: rotate(-12deg) translate(0,0); } 50% { transform: rotate(15deg) translate(3px,4px); } }
@keyframes turtle-rear-left { 0%,100% { transform: rotate(4deg); } 50% { transform: rotate(-9deg) translate(-2px,2px); } }
@keyframes turtle-rear-right { 0%,100% { transform: scaleX(-1) rotate(-5deg); } 50% { transform: scaleX(-1) rotate(8deg) translate(2px,2px); } }
@keyframes turtle-splash-burst { 0%,100% { opacity: 0; transform: scale(.64) translateY(4px); } 22% { opacity: .76; } 58% { opacity: .42; transform: scale(1) translateY(0); } 86% { opacity: 0; transform: scale(1.1) translateY(-4px); } }
@keyframes turtle-bubble-rise { 0% { opacity: 0; transform: translate(0,7px) scale(.6); } 22% { opacity: .74; } 76% { opacity: .3; transform: translate(8px,-26px) scale(1); } 100% { opacity: 0; transform: translate(12px,-37px) scale(1.12); } }
@keyframes turtle-promo-pulse { 0%, 100% { opacity: .78; transform: scale(.86); } 60% { opacity: 0; transform: scale(1.22); } }
@media (max-width: 900px) { .queue-turtle-event { width: 112%; margin-left: -6%; height: 250px; } .queue-event-promo { width: 24%; } }
@media (max-width: 600px) { .queue-turtle-event { width: 116%; margin-left: -8%; height: 220px; } .queue-event-promo { width: 25%; } }
@media (prefers-reduced-motion: reduce) { .queue-turtle-event, .queue-turtle-layer, .queue-turtle-bubble, .turtle-body-group, .turtle-tray-group { animation: none; } .queue-turtle-splash { opacity: .28; } .queue-event-promo::after { animation: none; } }
</style>
