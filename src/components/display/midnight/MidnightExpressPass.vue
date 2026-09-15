<template>
  <article class="midnight-express-pass" :class="{ 'is-reversed': direction === 'right', 'is-paused': paused }" aria-label="Night dining express">
    <div class="midnight-express-pass__visual" aria-hidden="true">
      <span class="midnight-express-pass__shadow"></span>
      <div class="midnight-express-pass__running-gear">
        <img v-for="wheel in wheels" :key="wheel.id" class="midnight-express-pass__wheel" :class="wheel.kind" :style="{ left: `${wheel.x}%` }" src="/images/ui/midnight-station/special-wheel.webp" alt="" />
        <img class="midnight-express-pass__driving-rod" src="/images/ui/midnight-station/special-driving-rod.webp" alt="" />
      </div>
      <img class="midnight-express-pass__body" src="/images/ui/midnight-station/special-express-body-v2.webp" alt="" />
      <img class="midnight-express-pass__lower-mask" src="/images/ui/midnight-station/special-express-lower-mask.webp" alt="" />
      <span class="midnight-express-pass__headlamp"></span>
      <span class="midnight-express-pass__window-glow"></span>
      <span v-for="index in 3" :key="index" class="midnight-express-pass__mist" :class="`mist-${index}`"></span>
    </div>

    <button v-if="promoItem && promoContent" type="button" class="midnight-express-pass__promo" :aria-label="`Open ${name} promotion`" :title="`Open ${name} promotion`" @click.stop.prevent="handlePromoClick">
      <img :src="promoContent.triggerImage" alt="" aria-hidden="true" @error="handlePromoError" />
      <span>{{ name }}</span>
    </button>
  </article>
</template>

<script setup>
import { computed } from 'vue'

// One component is one complete event: one leading locomotive and one dining
// car. Wheel groups are separate rear layers, never painted over the body.
const wheels = [
  { id: 'loco-1', x: 7.7, kind: 'is-driving' },
  { id: 'loco-2', x: 16.3, kind: 'is-driving' },
  { id: 'loco-3', x: 27.2, kind: 'is-driving' },
  { id: 'loco-4', x: 34.1, kind: 'is-driving' },
  { id: 'car-1', x: 48.8, kind: 'is-carriage' },
  { id: 'car-2', x: 57.2, kind: 'is-carriage' },
  { id: 'car-3', x: 82.7, kind: 'is-carriage' },
  { id: 'car-4', x: 91.1, kind: 'is-carriage' }
]

const props = defineProps({ direction: { type: String, default: 'left' }, paused: { type: Boolean, default: false }, promoItem: { type: Object, default: null }, promoContent: { type: Object, default: null } })
const emit = defineEmits(['featured-promo'])
const name = computed(() => props.promoItem?.name || props.promoItem?.storeName || props.promoItem?.productName || 'Dish')
const handlePromoError = event => event.target.closest?.('.midnight-express-pass__promo')?.remove()
const handlePromoClick = () => { if (props.promoItem) emit('featured-promo', props.promoItem) }
</script>

<style lang="scss" scoped>
.midnight-express-pass { position:relative; width:100%; height:clamp(310px,9.35vw,360px); margin-top:calc(clamp(52px,3.1vw,118px) * -1); pointer-events:none; }
.midnight-express-pass__visual { position:absolute; inset:0; filter:drop-shadow(0 12px 9px rgba(1,7,12,.58)); }
.midnight-express-pass__shadow { position:absolute; left:3%; right:3%; bottom:0; z-index:0; height:22px; border-radius:50%; background:radial-gradient(ellipse,rgba(0,0,0,.68),transparent 72%); filter:blur(4px); }
.midnight-express-pass__running-gear { position:absolute; inset:0; z-index:1; transform-origin:center; pointer-events:none; }
.midnight-express-pass__wheel { position:absolute; bottom:1px; width:6.2%; aspect-ratio:1; object-fit:contain; transform:translateX(-50%) rotate(var(--midnight-express-wheel-angle,0deg)); filter:brightness(.76) saturate(.68) drop-shadow(0 2px 2px rgba(0,0,0,.58)); will-change:transform; }
.midnight-express-pass__wheel.is-carriage { bottom:5px; width:4.85%; filter:brightness(.69) saturate(.55) drop-shadow(0 2px 2px rgba(0,0,0,.58)); }
.midnight-express-pass__driving-rod { position:absolute; left:6.3%; bottom:36px; z-index:2; width:29.2%; height:auto; object-fit:contain; transform:translate3d(var(--midnight-rod-x,0),var(--midnight-rod-y,0),0); filter:brightness(.82) drop-shadow(0 2px 2px rgba(0,0,0,.66)); will-change:transform; }
.midnight-express-pass__body,.midnight-express-pass__lower-mask { position:absolute; left:0; bottom:18px; width:100%; height:auto; object-fit:contain; transform-origin:center; user-select:none; pointer-events:none; }
.midnight-express-pass__body { z-index:3; }
.midnight-express-pass__lower-mask { z-index:4; }
.is-reversed .midnight-express-pass__body,.is-reversed .midnight-express-pass__lower-mask,.is-reversed .midnight-express-pass__running-gear { transform:scaleX(-1); }
.is-reversed .midnight-express-pass__wheel { transform:translateX(-50%) rotate(var(--midnight-express-wheel-angle-reversed,0deg)); }
.midnight-express-pass__headlamp { position:absolute; left:.9%; top:56%; z-index:5; width:14px; height:14px; border-radius:50%; background:#f2c978; box-shadow:0 0 11px 4px rgba(242,201,120,.3); }
.is-reversed .midnight-express-pass__headlamp { left:auto; right:.9%; }
.midnight-express-pass__window-glow { position:absolute; left:49%; top:39%; z-index:5; width:46%; height:20%; border-radius:42%; background:rgba(217,155,74,.065); filter:blur(11px); animation:midnight-window-breathe 5.4s ease-in-out infinite; }
.is-reversed .midnight-express-pass__window-glow { left:5%; }
.midnight-express-pass__mist { position:absolute; bottom:1%; z-index:5; width:86px; height:20px; border-radius:50%; background:rgba(183,201,207,.13); filter:blur(8px); opacity:0; animation:midnight-rail-mist 4.2s ease-out infinite; }
.mist-1 { left:9%; animation-delay:-3.1s; }.mist-2 { left:31%; animation-delay:-1.6s; }.mist-3 { right:12%; animation-delay:-.7s; }
.midnight-express-pass__promo { position:absolute; left:70%; top:43%; z-index:7; width:clamp(116px,7vw,150px); min-height:clamp(94px,5.8vw,122px); display:grid; grid-template-columns:52px minmax(0,1fr); align-items:center; gap:8px; padding:8px 10px; color:#fff5df; background:rgba(7,17,29,.92); border:2px solid rgba(242,201,120,.78); border-radius:7px; box-shadow:0 8px 16px rgba(1,7,12,.48); transform:translate(-50%,-50%); cursor:pointer; pointer-events:auto; }
.is-reversed .midnight-express-pass__promo { left:30%; }
.midnight-express-pass__promo img { width:52px; height:52px; object-fit:cover; border:2px solid #e5d7bc; border-radius:50%; }
.midnight-express-pass__promo span { min-width:0; overflow:hidden; font-size:clamp(18px,1.05vw,24px); font-weight:750; line-height:1.15; text-overflow:ellipsis; white-space:nowrap; }
.midnight-express-pass__promo:hover,.midnight-express-pass__promo:focus-visible { border-color:#fff5df; outline:3px solid #f2c978; outline-offset:3px; }
.midnight-express-pass.is-paused .midnight-express-pass__window-glow,.midnight-express-pass.is-paused .midnight-express-pass__mist { animation-play-state:paused; }
@keyframes midnight-window-breathe { 0%,100% { opacity:.32; } 50% { opacity:.65; } }
@keyframes midnight-rail-mist { 0% { opacity:0; transform:translate3d(-16px,4px,0) scale(.76); } 35% { opacity:.38; } 100% { opacity:0; transform:translate3d(40px,-11px,0) scale(1.16); } }
@media (max-width:1920px) { .midnight-express-pass__promo { width:118px; min-height:92px; } }
@media (prefers-reduced-motion:reduce) { .midnight-express-pass__window-glow,.midnight-express-pass__mist { animation:none; } .midnight-express-pass__mist { display:none; } .midnight-express-pass__wheel,.midnight-express-pass__driving-rod { will-change:auto; } }
</style>
