<template>
  <Transition name="promo-screen">
    <section
      v-if="visible && promo"
      class="featured-screen"
      :class="[`is-${themeKey}`, { 'is-fallback': videoFailed }]"
      role="dialog"
      :aria-label="`${getName(item)} ${t('display.promoBadge')}`"
    >
      <span class="featured-screen__rope featured-screen__rope--left" aria-hidden="true"></span>
      <span class="featured-screen__rope featured-screen__rope--right" aria-hidden="true"></span>

      <div class="featured-screen__body">
        <button type="button" class="featured-screen__close" :aria-label="t('common.close')" @click="emit('close')">
          <el-icon><Close /></el-icon>
        </button>

        <figure class="featured-screen__media">
          <span class="featured-screen__badge">{{ t('display.promoBadge') }}</span>
          <img
            v-if="!isVideoPlaying"
            class="featured-screen__poster"
            :src="promo.posterImage"
            :alt="getName(item)"
            @error="handlePosterError"
          />
          <video
            ref="videoRef"
            class="featured-screen__video"
            :class="{ 'is-visible': isVideoPlaying }"
            :src="promo.videoSrc"
            :poster="posterSource"
            muted
            autoplay
            playsinline
            preload="auto"
            @canplay="handleCanPlay"
            @playing="isVideoPlaying = true"
            @ended="handleEnded"
            @error="handleVideoError"
            @click="retryPlay"
          ></video>
        </figure>

      </div>
    </section>
  </Transition>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { useI18n } from '@/i18n'
import { findPromoForItem, PROMO_FALLBACK_CLOSE_DELAY } from '@/config/promoContent'

const props = defineProps({
  item: { type: Object, default: null },
  visible: { type: Boolean, default: false },
  themeKey: { type: String, default: 'zhenxian' }
})

const emit = defineEmits(['close'])
const { t } = useI18n()

const videoRef = ref(null)
const isVideoPlaying = ref(false)
const videoFailed = ref(false)
const posterBroken = ref(false)
let endTimer = 0
let fallbackTimer = 0

// 素材缺失时整个吊屏不渲染，父层也不会收到触发事件。
const promo = computed(() => findPromoForItem(props.item))
const posterSource = computed(() => (posterBroken.value ? '' : promo.value?.posterImage || ''))

const getName = (item) => item?.name || item?.storeName || item?.productName || t('common.unknown')
const clearTimers = () => {
  window.clearTimeout(endTimer)
  window.clearTimeout(fallbackTimer)
  endTimer = 0
  fallbackTimer = 0
}

const startFallbackTimer = () => {
  window.clearTimeout(fallbackTimer)
  // 视频不可播时退化为静态海报卡，倒计时后自动收回，避免屏幕一直挂着。
  fallbackTimer = window.setTimeout(() => emit('close'), PROMO_FALLBACK_CLOSE_DELAY)
}

const attemptPlay = () => {
  const video = videoRef.value
  if (!video || videoFailed.value) return
  video.muted = true // 满足浏览器自动播放策略；店内场景也保持静音。
  const playing = video.play()
  if (playing && typeof playing.catch === 'function') {
    playing.catch(() => {}) // 被策略拦截时停留在海报帧，用户点视频可重试。
  }
}

const handleCanPlay = () => attemptPlay()

const retryPlay = () => {
  if (!videoRef.value || isVideoPlaying.value || videoFailed.value) return
  attemptPlay()
}

const handleEnded = () => {
  // 单次播放：片尾定格片刻后自动收回，不循环。
  window.clearTimeout(endTimer)
  endTimer = window.setTimeout(() => emit('close'), 700)
}

const handleVideoError = () => {
  if (videoFailed.value) return
  videoFailed.value = true
  isVideoPlaying.value = false
  startFallbackTimer()
}

const handlePosterError = () => {
  posterBroken.value = true
}

watch(() => props.visible, async (visible) => {
  clearTimers()
  if (!visible) {
    // 收回时立刻停掉解码，leave 动画期间定格最后一帧即可。
    videoRef.value?.pause()
    return
  }
  videoFailed.value = false
  posterBroken.value = false
  isVideoPlaying.value = false
  await nextTick()
  attemptPlay()
})

onUnmounted(clearTimers)
</script>

<style lang="scss" scoped>
.featured-screen {
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 60;
  width: min(880px, calc(100% - 48px));
  /* 顶部留出麻绳空间：middle-section 是 overflow hidden 的，绳子必须画在内部 */
  padding-top: 42px;
  transform: translateX(-50%);
  pointer-events: none;
}

.featured-screen__rope {
  position: absolute;
  top: 0;
  width: 5px;
  height: 48px;
  background:
    repeating-linear-gradient(180deg,
      #8a5a33 0 7px,
      #75492a 7px 12px);
  border-radius: 3px;
  box-shadow: 0 3px 6px rgba(8, 94, 132, 0.25);

  &--left { left: 17%; }
  &--right { right: 17%; }
}

.is-underwater-theme .featured-screen__rope {
  background:
    repeating-linear-gradient(180deg,
      rgba(223, 251, 255, 0.9) 0 7px,
      rgba(156, 231, 240, 0.85) 7px 12px);
}

.featured-screen__body {
  position: relative;
  display: block;
  pointer-events: auto;
  padding: 13px;
  background: linear-gradient(180deg, rgba(255, 250, 235, 0.97), rgba(255, 240, 214, 0.95));
  border: 4px solid #b9793f;
  border-radius: 18px;
  box-shadow: 0 18px 34px rgba(8, 94, 132, 0.32);
  backdrop-filter: blur(6px);
  overflow: hidden;
}

.is-underwater-theme .featured-screen__body {
  background: linear-gradient(180deg, rgba(230, 250, 255, 0.96), rgba(198, 240, 250, 0.94));
  border-color: #2e9ec4;
}

.featured-screen__close {
  position: absolute;
  top: 9px;
  right: 10px;
  z-index: 6;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  color: #fff;
  background: rgba(239, 91, 63, 0.92);
  border: 2px solid rgba(255, 255, 255, 0.92);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(8, 94, 132, 0.28);

  &:hover,
  &:focus-visible { background: #d8452c; }
}

.featured-screen__media {
  position: relative;
  pointer-events: auto;
  margin: 0;
  aspect-ratio: 16 / 8;
  border-radius: 12px;
  overflow: hidden;
  background: #123c55;
  cursor: default;

  .featured-screen:not(.is-fallback) & { cursor: pointer; }
}

.featured-screen__poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.featured-screen__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 320ms ease;

  &.is-visible { opacity: 1; }
}

.featured-screen__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 3;
  padding: 4px 13px;
  color: #fff;
  background: rgba(239, 91, 63, 0.94);
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.1em;
  box-shadow: 0 4px 9px rgba(8, 40, 66, 0.3);
}

/* 下垂与收起：从顶栏后方垂下来，收起时向上退回。 */
.promo-screen-enter-active { transition: transform 640ms cubic-bezier(0.3, 0.86, 0.36, 1.05); }
.promo-screen-leave-active { transition: transform 460ms cubic-bezier(0.55, 0, 0.72, 0.24); }
.promo-screen-enter-from,
.promo-screen-leave-to { transform: translateX(-50%) translate3d(0, -118%, 0); }

@media (max-width: 900px) {
  .featured-screen { width: calc(100% - 28px); }

  .featured-screen__body {
    padding: 10px;
    border-width: 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .promo-screen-enter-active,
  .promo-screen-leave-active { transition-duration: 1ms; }

  .featured-screen__video { transition: none; }
}

/* Phase 01 skin only: the existing promo flow remains a single-play promo,
   while Midnight Station presents it as a paper station notice board. */
.is-midnight-station .featured-screen__rope { display: none; }

.is-midnight-station .featured-screen__body {
  padding: 14px;
  background: var(--station-surface-elevated);
  border: 1px solid var(--station-border);
  border-radius: var(--station-radius-panel);
  box-shadow: var(--station-shadow-e3);
}

.is-midnight-station .featured-screen__media {
  border: 1px solid var(--station-border);
  border-radius: var(--station-radius-ticket);
  background: var(--station-background-deep);
}

.is-midnight-station .featured-screen__badge {
  color: var(--station-text-primary);
  background: var(--station-primary);
  border: 1px solid var(--station-accent);
  border-radius: var(--station-radius-ticket);
  box-shadow: none;
  font-family: var(--station-font-number);
}

.is-midnight-station .featured-screen__close {
  color: var(--station-text-primary);
  background: var(--station-primary-strong);
  border-color: var(--station-accent);
  border-radius: var(--station-radius-small);
  box-shadow: none;
}
</style>
