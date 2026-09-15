<template>
  <article
    class="midnight-dish-trolley"
    :class="{
      'is-reversed': direction === 'right',
      'is-recommended': recommended,
      'is-selected': selected,
      'is-sold-out': soldOut,
      'is-paused': paused
    }"
    :tabindex="soldOut ? -1 : 0"
    :aria-label="`${name} ¥${price}`"
    @click="handleActivate"
    @keydown.enter.prevent="handleActivate"
  >
    <span class="midnight-dish-trolley__lamp" aria-hidden="true"></span>

    <div class="midnight-dish-trolley__dish">
      <img :src="image" :alt="name" @error="handleImageError" />
    </div>

    <img
      class="midnight-dish-trolley__vehicle"
      src="/images/ui/midnight-station/delivery-trolley.webp"
      alt=""
      aria-hidden="true"
    />

    <div class="midnight-dish-trolley__copy">
      <h3>{{ name }}</h3>
      <strong>¥{{ price }}</strong>
    </div>

    <span v-if="recommended" class="midnight-dish-trolley__ai">AI</span>
    <span v-if="soldOut" class="midnight-dish-trolley__soldout">{{ t('common.soldOut') }}</span>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/i18n'

const props = defineProps({
  item: { type: Object, required: true },
  direction: { type: String, default: 'left' },
  recommended: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  soldOut: { type: Boolean, default: false },
  paused: { type: Boolean, default: false }
})

const emit = defineEmits(['dish-click'])
const { t } = useI18n()
const DEFAULT_DISH_IMAGE = '/images/default-dish.jpg'

const name = computed(() => (
  props.item?.name || props.item?.storeName || props.item?.productName || t('common.unknown')
))
const image = computed(() => props.item?.image || props.item?.imageUrl || DEFAULT_DISH_IMAGE)
const price = computed(() => {
  const value = Number(props.item?.price)
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
})

const handleActivate = (event) => {
  if (!props.soldOut) emit('dish-click', props.item, event)
}

const handleImageError = (event) => {
  const target = event?.target
  if (!target || target.dataset.fallbackApplied === '1') return
  target.dataset.fallbackApplied = '1'
  target.src = DEFAULT_DISH_IMAGE
}
</script>

<style lang="scss" scoped>
.midnight-dish-trolley {
  --station-ink: #e5d7bc;
  --station-amber: #f2c978;
  position: relative;
  isolation: isolate;
  width: 100%;
  height: clamp(224px, 12.5vw, 246px);
  color: var(--station-ink);
  cursor: pointer;
  outline: none;
  transform-origin: 50% 88%;
  animation: midnight-trolley-suspension 3.8s ease-in-out infinite;
}

.midnight-dish-trolley__vehicle {
  position: absolute;
  left: 50%;
  bottom: 0;
  z-index: 2;
  width: 116%;
  height: auto;
  transform: translateX(-50%);
  filter: drop-shadow(0 8px 6px rgba(1, 7, 12, .55));
  pointer-events: none;
  user-select: none;
  transition: filter 180ms ease;
}

.midnight-dish-trolley__dish {
  position: absolute;
  left: 50%;
  top: 0;
  z-index: 3;
  width: clamp(164px, 9.6vw, 194px);
  aspect-ratio: 1;
  overflow: hidden;
  border: 3px solid rgba(229, 215, 188, .88);
  border-radius: 50%;
  background: #101b24;
  box-shadow: 0 8px 16px rgba(1, 7, 12, .42), 0 0 0 3px rgba(32, 56, 51, .78);
  transform: translateX(-50%);
}

.midnight-dish-trolley__dish img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
}

.midnight-dish-trolley__copy {
  position: absolute;
  left: 50%;
  bottom: 30px;
  z-index: 4;
  width: min(92%, 318px);
  min-height: 46px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 6px 12px;
  border: 1px solid rgba(242, 201, 120, .5);
  border-radius: 6px;
  background: rgba(7, 17, 29, .9);
  box-shadow: 0 5px 12px rgba(1, 7, 12, .4);
  transform: translateX(-50%);
}

.midnight-dish-trolley__copy h3 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #fff5df;
  font-size: clamp(18px, 1.1vw, 26px);
  font-weight: 700;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.midnight-dish-trolley__copy strong {
  flex: 0 0 auto;
  color: var(--station-amber);
  font-size: clamp(21px, 1.25vw, 31px);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.midnight-dish-trolley__lamp {
  position: absolute;
  left: 7%;
  bottom: 43px;
  z-index: 5;
  width: 12px;
  height: 12px;
  border: 2px solid #101b24;
  border-radius: 50%;
  background: #d99b4a;
  box-shadow: 0 0 8px rgba(217, 155, 74, .5);
}

.is-reversed .midnight-dish-trolley__lamp {
  left: auto;
  right: 7%;
}

.midnight-dish-trolley__ai {
  position: absolute;
  top: 4px;
  right: 9%;
  z-index: 6;
  min-width: 48px;
  min-height: 36px;
  display: grid;
  place-items: center;
  padding: 0 8px;
  color: #07111d;
  background: #f2c978;
  border: 2px solid #fff5df;
  border-radius: 18px;
  font-size: 18px;
  font-weight: 900;
  box-shadow: 0 5px 12px rgba(1, 7, 12, .35);
}

.midnight-dish-trolley__soldout {
  position: absolute;
  left: 50%;
  top: 72px;
  z-index: 8;
  min-width: 128px;
  padding: 8px 18px;
  color: #fff;
  background: rgba(140, 61, 52, .95);
  border: 2px solid #e5d7bc;
  border-radius: 5px;
  font-size: 22px;
  font-weight: 800;
  text-align: center;
  transform: translateX(-50%) rotate(-5deg);
}

.midnight-dish-trolley:hover .midnight-dish-trolley__vehicle,
.midnight-dish-trolley:focus-visible .midnight-dish-trolley__vehicle,
.midnight-dish-trolley.is-selected .midnight-dish-trolley__vehicle {
  filter: drop-shadow(0 9px 7px rgba(1, 7, 12, .62)) brightness(1.08);
}

.midnight-dish-trolley:focus-visible::after,
.midnight-dish-trolley.is-selected::after {
  content: '';
  position: absolute;
  inset: -4px 2px 5px;
  z-index: 7;
  border: 3px solid var(--station-amber);
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
  filter: grayscale(.55) brightness(.62);
}

.midnight-dish-trolley.is-paused {
  animation-play-state: paused;
}

@keyframes midnight-trolley-suspension {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(2px); }
}

@media (min-width: 1921px) {
  .midnight-dish-trolley {
    height: 256px;
  }

  .midnight-dish-trolley__dish {
    width: 204px;
  }
}

@media (max-width: 900px) {
  .midnight-dish-trolley { height: 210px; }
  .midnight-dish-trolley__dish { width: 150px; }
  .midnight-dish-trolley__copy { bottom: 25px; min-height: 40px; }
  .midnight-dish-trolley__copy h3 { font-size: 16px; }
  .midnight-dish-trolley__copy strong { font-size: 19px; }
}

@media (prefers-reduced-motion: reduce) {
  .midnight-dish-trolley { animation: none; }
  .midnight-dish-trolley__vehicle { transition: none; }
}
</style>
