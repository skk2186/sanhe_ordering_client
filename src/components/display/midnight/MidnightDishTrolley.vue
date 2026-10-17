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
      <img
        class="midnight-dish-trolley__platter"
        src="/images/ui/midnight-station/delivery-trolley-platter.svg"
        alt=""
        draggable="false"
      />
      <span class="midnight-dish-trolley__dish">
        <img :key="image" :src="image" :alt="name" @error="handleImageError" />
      </span>
      <span class="midnight-dish-trolley__copy">
        <span class="midnight-dish-trolley__name">{{ name }}</span>
        <strong>¥{{ price }}</strong>
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
const image = computed(() => props.item?.image || props.item?.imageUrl || DEFAULT_DISH_IMAGE)
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
  height: 248px;
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
  width: var(--midnight-body-width, min(90%, 320px));
  aspect-ratio: 3 / 1;
  transform: translateX(-50%);
  pointer-events: none;
  transition: filter 180ms ease;
}

.midnight-dish-trolley__vehicle-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 5px 4px rgba(1, 7, 12, .44));
  user-select: none;
}

.is-reversed .midnight-dish-trolley__vehicle-art {
  transform: scaleX(-1);
}

.midnight-dish-trolley__running-gear {
  position: absolute;
  inset: 0;
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

.midnight-dish-trolley__platter {
  position: absolute;
  left: 50%;
  top: 16%;
  z-index: 1;
  width: var(--midnight-platter-width, clamp(150px, 4.85vw, 186px));
  height: auto;
  transform: translateX(-50%);
  filter: drop-shadow(0 4px 4px rgba(10, 14, 13, .5));
  user-select: none;
}

.midnight-dish-trolley__dish {
  position: absolute;
  left: 50%;
  top: -42%;
  z-index: 2;
  width: var(--midnight-food-width, clamp(145px, 4.3vw, 165px));
  height: var(--midnight-food-height, clamp(80px, 2.55vw, 98px));
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 48% 48% 42% 42%;
  background: radial-gradient(ellipse, rgba(250, 243, 225, .92), rgba(226, 207, 169, .78) 74%, transparent 100%);
  transform: translateX(-50%);
  pointer-events: none;
}

.midnight-dish-trolley__dish img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 3px 3px rgba(20, 20, 17, .25));
  user-select: none;
  -webkit-user-drag: none;
}

.midnight-dish-trolley__copy {
  position: absolute;
  left: 50%;
  top: 53%;
  z-index: 3;
  width: 42%;
  min-height: 27%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  overflow: hidden;
  padding: 0 4px;
  color: #392817;
  border: 1px solid #f5dda4;
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(226, 191, 126, .98), rgba(177, 132, 73, .98));
  box-shadow: inset 0 1px 0 rgba(255, 249, 222, .72), 0 2px 4px rgba(5, 9, 8, .36);
  text-align: center;
  transform: translate(-50%, -50%);
}

.midnight-dish-trolley__name {
  min-width: 0;
  overflow: hidden;
  color: #392817;
  font-size: var(--station-product-title, clamp(14px, .42vw, 16px));
  font-weight: 800;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.midnight-dish-trolley__copy strong {
  flex: 0 0 auto;
  color: #6c301f;
  font-size: var(--station-product-price, clamp(14px, .42vw, 16px));
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
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
    --midnight-platter-width: 144px;
    --midnight-food-width: 112px;
    --midnight-food-height: 76px;
    --station-product-title: 12px;
    --station-product-price: 13px;
  }

  .midnight-dish-trolley__copy {
    width: 40%;
    gap: 2px;
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
