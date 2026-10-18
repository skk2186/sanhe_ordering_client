<template>
  <article
    class="midnight-dish-trolley"
    :class="{
      'is-reversed': direction === 'right',
      'is-recommended': recommended,
      'is-selected': selected,
      'is-sold-out': soldOut,
      'is-paused': paused,
    }"
    :tabindex="soldOut ? -1 : 0"
    :aria-label="`${name} ¥${price}`"
    role="button"
    :aria-pressed="selected"
    :aria-disabled="soldOut"
    @click="handleActivate"
    @keydown.enter.prevent="handleActivate"
    @keydown.space.prevent="handleActivate"
  >
    <span class="midnight-dish-trolley__shadow" aria-hidden="true"></span>

    <span class="midnight-dish-trolley__vehicle" aria-hidden="true">
      <img
        class="midnight-dish-trolley__vehicle-art"
        src="/images/ui/midnight-station/delivery-trolley-body-v3.webp"
        alt=""
        draggable="false"
      />
      <span class="midnight-dish-trolley__dish">
        <img :key="image" :src="image" :alt="name" @error="handleImageError" />
      </span>
      <img
        class="midnight-dish-trolley__vehicle-art midnight-dish-trolley__vehicle-art--front"
        src="/images/ui/midnight-station/delivery-trolley-body-v3.webp"
        alt=""
        draggable="false"
      />
      <span class="midnight-dish-trolley__running-gear">
        <img
          v-for="wheel in trolleyWheels"
          :key="wheel"
          :style="{ left: `${wheel}%` }"
          src="/images/ui/midnight-station/special-wheel.webp"
          alt=""
          draggable="false"
        />
      </span>
      <span class="midnight-dish-trolley__plaque-mounts" aria-hidden="true"></span>
      <span class="midnight-dish-trolley__side-plaque" aria-hidden="true">
        <span class="midnight-dish-trolley__plaque-name" :title="name">{{ name }}</span>
        <strong class="midnight-dish-trolley__plaque-price">¥{{ price }}</strong>
      </span>
    </span>

    <span class="midnight-dish-trolley__lamp" aria-hidden="true"></span>
    <span v-if="recommended" class="midnight-dish-trolley__ai">AI</span>
    <span v-if="soldOut" class="midnight-dish-trolley__soldout">{{ t('common.soldOut') }}</span>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/i18n'
import { getMidnightFoodImage } from '@/utils/midnightFoodImages'

const trolleyWheels = [24, 76]
const props = defineProps({
  item: { type: Object, required: true },
  direction: { type: String, default: 'left' },
  recommended: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  soldOut: { type: Boolean, default: false },
  paused: { type: Boolean, default: false },
})
const emit = defineEmits(['dish-click'])
const { t } = useI18n()
const DEFAULT_DISH_IMAGE = '/images/ui/midnight-station/default-food.svg'
const name = computed(() => props.item?.name || props.item?.storeName || props.item?.productName || t('common.unknown'))
const image = computed(() => getMidnightFoodImage(props.item, DEFAULT_DISH_IMAGE))
const price = computed(() => {
  const value = Number(props.item?.price)
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
})
const handleActivate = event => {
  if (!props.soldOut) emit('dish-click', props.item, event)
}
const handleImageError = event => {
  const target = event?.target
  if (!target || target.dataset.fallbackApplied === '1') return
  target.dataset.fallbackApplied = '1'
  target.src = DEFAULT_DISH_IMAGE
}
</script>

<style lang="scss" scoped>
.midnight-dish-trolley {
  --trolley-bottom: 9px;
  position: relative;
  isolation: isolate;
  width: 100%;
  height: var(--midnight-trolley-height, 248px);
  color: #e5d7bc;
  cursor: pointer;
  outline: none;
  transform-origin: 50% 90%;
  animation: midnight-trolley-suspension 4.2s ease-in-out infinite;
}

.midnight-dish-trolley__shadow {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 3px;
  z-index: 0;
  height: 16px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(0, 0, 0, .66), transparent 72%);
  filter: blur(3px);
}

.midnight-dish-trolley__vehicle {
  position: absolute;
  left: 50%;
  bottom: var(--trolley-bottom);
  z-index: 2;
  width: var(--midnight-body-width, min(90%, 480px));
  aspect-ratio: 3 / 1;
  transform: translateX(-50%);
  pointer-events: none;
  transition: filter 180ms ease;
}

.midnight-dish-trolley__vehicle-art {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 5px 4px rgba(1, 7, 12, .44));
  user-select: none;
}

.midnight-dish-trolley__vehicle-art--front {
  z-index: 3;
  clip-path: inset(35% 0 0);
  pointer-events: none;
}

.is-reversed .midnight-dish-trolley__vehicle-art {
  transform: scaleX(-1);
}

.midnight-dish-trolley__running-gear {
  position: absolute;
  inset: 0;
  z-index: 4;
}

.midnight-dish-trolley__running-gear img {
  position: absolute;
  top: 76%;
  width: 17.5%;
  aspect-ratio: 1;
  object-fit: contain;
  transform: translate(-50%, -50%) rotate(var(--midnight-trolley-wheel-angle, 0deg));
  filter: brightness(.72) saturate(.64) drop-shadow(0 2px 2px rgba(0, 0, 0, .58));
  will-change: transform;
}

.is-reversed .midnight-dish-trolley__running-gear img {
  transform: translate(-50%, -50%) rotate(var(--midnight-trolley-wheel-angle-reversed, 0deg));
}

.midnight-dish-trolley__dish {
  position: absolute;
  left: 50%;
  bottom: 58%;
  z-index: 2;
  width: var(--midnight-food-width, clamp(170px, 5.2vw, 200px));
  height: var(--midnight-food-height, clamp(115px, 3.5vw, 134px));
  overflow: hidden;
  transform: translateX(-50%);
  pointer-events: none;
}

.midnight-dish-trolley__dish img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 2px 2px rgba(20, 20, 17, .28));
  user-select: none;
  -webkit-user-drag: none;
}

.midnight-dish-trolley__plaque-mounts {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}

.midnight-dish-trolley__plaque-mounts::before,
.midnight-dish-trolley__plaque-mounts::after {
  content: '';
  position: absolute;
  top: 61%;
  width: 22%;
  height: 7%;
  box-sizing: border-box;
  border: 1px solid #684a27;
  border-radius: 2px;
  background: linear-gradient(180deg, #e0c47b 0%, #a27a43 48%, #4b3920 100%);
  box-shadow: 0 2px 3px rgba(4, 8, 7, .48);
}

.midnight-dish-trolley__plaque-mounts::before {
  left: 6%;
  background-image:
    radial-gradient(circle at 96% 50%, #f4d995 0 2px, transparent 2.6px),
    linear-gradient(180deg, #e0c47b 0%, #a27a43 48%, #4b3920 100%);
}

.midnight-dish-trolley__plaque-mounts::after {
  right: 6%;
  background-image:
    radial-gradient(circle at 4% 50%, #f4d995 0 2px, transparent 2.6px),
    linear-gradient(180deg, #e0c47b 0%, #a27a43 48%, #4b3920 100%);
}

.midnight-dish-trolley__side-plaque {
  position: absolute;
  left: 50%;
  top: 38%;
  z-index: 6;
  width: 48%;
  height: 56%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  overflow: hidden;
  padding: 5px 10px;
  color: #f2e7d0;
  border: 2px solid #d4ad68;
  border-radius: 4px;
  background:
    linear-gradient(180deg, transparent 0 49%, rgba(154, 111, 54, .42) 49% 52%, transparent 52%),
    linear-gradient(145deg, #285044 0%, #17372f 70%, #122a25 100%);
  box-shadow: inset 0 0 0 2px rgba(255, 235, 189, .12), 0 4px 7px rgba(3, 8, 7, .56);
  text-align: center;
  transform: translateX(-50%);
}

.midnight-dish-trolley__plaque-name {
  align-self: center;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  color: #fff0d3;
  font-size: var(--station-product-title, clamp(25px, .81vw, 31px));
  font-weight: 850;
  line-height: 1.02;
  letter-spacing: -.025em;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .58);
}

.midnight-dish-trolley__plaque-price {
  display: block;
  align-self: center;
  color: #f3c774;
  font-size: var(--station-product-price, clamp(26px, .885vw, 34px));
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1.02;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .64);
}

.midnight-dish-trolley__lamp {
  position: absolute;
  left: 13%;
  bottom: 65px;
  z-index: 4;
  width: 10px;
  height: 10px;
  border: 2px solid #101b24;
  border-radius: 50%;
  background: #d99b4a;
  box-shadow: 0 0 8px rgba(217, 155, 74, .5);
}

.is-reversed .midnight-dish-trolley__lamp {
  left: auto;
  right: 13%;
}

.midnight-dish-trolley__ai {
  position: absolute;
  top: 5%;
  right: 7%;
  z-index: 5;
  min-width: 36px;
  min-height: 28px;
  display: grid;
  place-items: center;
  padding: 0 7px;
  color: #fff9ee;
  background: #db7457;
  border: 2px solid #fff5df;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 900;
  box-shadow: 0 4px 10px rgba(1, 7, 12, .35);
}

.midnight-dish-trolley__soldout {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 7;
  min-width: 112px;
  padding: 7px 14px;
  color: #fff;
  background: rgba(140, 61, 52, .96);
  border: 2px solid #e5d7bc;
  border-radius: 5px;
  font-size: 18px;
  font-weight: 800;
  text-align: center;
  transform: translate(-50%, -50%) rotate(-5deg);
}

.midnight-dish-trolley:hover .midnight-dish-trolley__vehicle-art,
.midnight-dish-trolley:focus-visible .midnight-dish-trolley__vehicle-art,
.midnight-dish-trolley.is-selected .midnight-dish-trolley__vehicle-art {
  filter: drop-shadow(0 9px 7px rgba(1, 7, 12, .62)) brightness(1.08);
}

.midnight-dish-trolley:focus-visible::after,
.midnight-dish-trolley.is-selected::after {
  content: '';
  position: absolute;
  inset: 4px 2px 8px;
  z-index: 8;
  border: 3px solid #f2c978;
  border-radius: 10px;
  pointer-events: none;
}

.midnight-dish-trolley.is-recommended .midnight-dish-trolley__lamp {
  background: #f2c978;
  box-shadow: 0 0 12px rgba(242, 201, 120, .76);
}

.midnight-dish-trolley.is-sold-out {
  cursor: not-allowed;
}

.midnight-dish-trolley.is-sold-out > :not(.midnight-dish-trolley__soldout) {
  filter: grayscale(.42) brightness(.68);
}

.midnight-dish-trolley.is-paused {
  animation-play-state: paused;
}

@keyframes midnight-trolley-suspension {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(1px); }
}

@media (max-width: 900px) {
  .midnight-dish-trolley {
    height: 214px;
    --midnight-body-width: min(88vw, 250px);
    --midnight-food-width: clamp(150px, 66vw, 180px);
    --midnight-food-height: clamp(108px, 47vw, 128px);
    --station-product-title: 19px;
    --station-product-price: 20px;
  }

  .midnight-dish-trolley__soldout {
    font-size: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .midnight-dish-trolley { animation: none; }
  .midnight-dish-trolley__vehicle-art { transition: none; }
  .midnight-dish-trolley__running-gear img { will-change: auto; }
}
</style>
