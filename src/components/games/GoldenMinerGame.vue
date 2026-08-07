<template>
  <section class="miner-game" aria-labelledby="miner-title" aria-keyshortcuts="A B Escape">
    <header class="game-header">
      <div>
        <p class="game-kicker">{{ $t('games.localOnly') }}</p>
        <h2 id="miner-title">{{ $t('games.goldenMiner.title') }}</h2>
      </div>
    </header>

    <div class="score-strip" aria-live="polite">
      <div class="metric"><span>{{ $t('games.score') }}</span><strong>{{ score }}</strong></div>
      <div class="metric"><span>{{ $t('games.bestScore') }}</span><strong>{{ displayedBest }}</strong></div>
      <div class="metric"><span>{{ $t('games.time') }}</span><strong>{{ remainingSeconds }}s</strong></div>
      <div class="metric"><span>{{ $t('games.tools') }}</span><strong>{{ toolsLeft }}</strong></div>
    </div>

    <div ref="arenaRef" class="miner-arena" :style="{ backgroundImage: `url(${minerBackground})` }">
      <div class="mine-shade"></div>
      <div class="winch" aria-hidden="true">
        <span class="winch-wheel"></span>
      </div>

      <div class="hook-arm" :style="hookStyle" aria-hidden="true">
        <span class="hook-line"></span>
        <img class="hook-head" :src="hookImage" alt="">
        <img v-if="caughtTarget" class="hook-cargo" :src="caughtTarget.image" alt="">
      </div>

      <div
        v-for="target in targets"
        :key="target.id"
        class="mine-target"
        :class="`target-${target.type}`"
        :style="targetStyle(target)"
        aria-hidden="true"
      >
        <img :src="target.image" alt="">
        <small>+{{ target.value }}</small>
      </div>

      <div v-if="status === 'finished'" class="game-state">
        <h3>{{ stateTitle }}</h3>
        <p>{{ stateDescription }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from '@/i18n'
import minerBackground from '@/assets/games/golden-miner/background.webp'
import hookImage from '@/assets/games/golden-miner/hook.webp'
import goldLargeImage from '@/assets/games/golden-miner/gold-large.webp'
import goldSmallImage from '@/assets/games/golden-miner/gold-small.webp'
import diamondImage from '@/assets/games/golden-miner/diamond.webp'
import rockImage from '@/assets/games/golden-miner/rock.webp'

const props = defineProps({
  bestScore: { type: Number, default: 0 }
})

const emit = defineEmits(['start', 'score-change', 'finish', 'close'])
const { t } = useI18n()

const GAME_DURATION = 45_000
const BASE_HOOK_LENGTH = 34
const arenaRef = ref(null)
const status = ref('idle')
const score = ref(0)
const localBest = ref(Number(localStorage.getItem('game-best-golden-miner')) || 0)
const remainingMs = ref(GAME_DURATION)
const toolsLeft = ref(3)
const targets = ref([])
const hookAngle = ref(-52)
const hookLength = ref(BASE_HOOK_LENGTH)
const hookMode = ref('swinging')
const caughtTarget = ref(null)
const fastRetract = ref(false)

let frameId = 0
let lastFrameTime = 0
let swingDirection = 1
let targetSequence = 0

const remainingSeconds = computed(() => Math.max(0, Math.ceil(remainingMs.value / 1000)))
const displayedBest = computed(() => Math.max(props.bestScore, localBest.value, score.value))
const hookStyle = computed(() => ({
  height: `${hookLength.value}px`,
  transform: `translateX(-50%) rotate(${hookAngle.value}deg)`
}))
const stateTitle = computed(() => {
  if (status.value === 'paused') return t('games.paused')
  if (status.value === 'finished') return t('games.finished')
  return t('games.goldenMiner.readyTitle')
})
const stateDescription = computed(() => {
  if (status.value === 'paused') return t('games.pauseHint')
  if (status.value === 'finished') return t('games.finalScore', { score: score.value })
  return t('games.goldenMiner.readyHint')
})

const targetTypes = [
  { type: 'gold-small', image: goldSmallImage, value: 15, radius: 18, weight: 1 },
  { type: 'gold-large', image: goldLargeImage, value: 35, radius: 27, weight: 1.7 },
  { type: 'diamond', image: diamondImage, value: 60, radius: 18, weight: 0.8 },
  { type: 'rock', image: rockImage, value: 5, radius: 25, weight: 2.3 }
]

const createTarget = (index) => {
  const random = Math.random()
  const type = random > 0.9 ? targetTypes[2] : random > 0.65 ? targetTypes[1] : random > 0.28 ? targetTypes[0] : targetTypes[3]
  const column = index % 5
  const row = Math.floor(index / 5)
  return {
    ...type,
    id: `mine-${targetSequence++}`,
    x: 12 + column * 19 + (Math.random() * 8 - 4),
    y: 34 + row * 22 + (Math.random() * 8 - 4)
  }
}

const resetTargets = () => {
  targets.value = Array.from({ length: 10 }, (_, index) => createTarget(index))
}

const targetStyle = (target) => ({
  left: `${target.x}%`,
  top: `${target.y}%`,
  width: `${target.radius * 2}px`,
  height: `${target.radius * 2}px`
})

const getMaxHookLength = () => Math.max(180, (arenaRef.value?.clientHeight || 420) * 0.82)

const findCollision = () => {
  const arena = arenaRef.value
  if (!arena) return null
  const radians = hookAngle.value * Math.PI / 180
  const tipDistance = hookLength.value + 26
  const tipX = arena.clientWidth / 2 + Math.sin(radians) * tipDistance
  const tipY = 30 + Math.cos(radians) * tipDistance
  return targets.value.find((target) => {
    const targetX = arena.clientWidth * target.x / 100
    const targetY = arena.clientHeight * target.y / 100
    return Math.hypot(tipX - targetX, tipY - targetY) <= target.radius + 10
  }) || null
}

const collectTarget = () => {
  if (!caughtTarget.value) return
  score.value += caughtTarget.value.value
  emit('score-change', { id: 'golden-miner', score: score.value })
  targets.value.push(createTarget(Math.floor(Math.random() * 10)))
  caughtTarget.value = null
}

const updateHook = (deltaSeconds) => {
  const arenaScale = Math.max(0.75, (arenaRef.value?.clientHeight || 420) / 420)
  if (hookMode.value === 'swinging') {
    hookAngle.value += swingDirection * deltaSeconds * 72
    if (hookAngle.value >= 58 || hookAngle.value <= -58) {
      hookAngle.value = Math.max(-58, Math.min(58, hookAngle.value))
      swingDirection *= -1
    }
    return
  }

  if (hookMode.value === 'extending') {
    hookLength.value += deltaSeconds * 330 * arenaScale
    const hit = findCollision()
    if (hit) {
      targets.value = targets.value.filter(target => target.id !== hit.id)
      caughtTarget.value = hit
      hookMode.value = 'retracting'
    } else if (hookLength.value >= getMaxHookLength()) {
      hookMode.value = 'retracting'
    }
    return
  }

  const weight = caughtTarget.value?.weight || 1
  const retractSpeed = (fastRetract.value ? 680 : 360 / weight) * arenaScale
  hookLength.value -= deltaSeconds * retractSpeed
  if (hookLength.value <= BASE_HOOK_LENGTH) {
    hookLength.value = BASE_HOOK_LENGTH
    collectTarget()
    hookMode.value = 'swinging'
    fastRetract.value = false
  }
}

const gameLoop = (timestamp) => {
  if (status.value !== 'running') return
  if (!lastFrameTime) lastFrameTime = timestamp
  const deltaMs = Math.min(40, timestamp - lastFrameTime)
  lastFrameTime = timestamp
  remainingMs.value -= deltaMs
  updateHook(deltaMs / 1000)
  if (remainingMs.value <= 0) {
    finishGame('time')
    return
  }
  frameId = requestAnimationFrame(gameLoop)
}

const saveBestScore = () => {
  if (score.value <= localBest.value) return
  localBest.value = score.value
  localStorage.setItem('game-best-golden-miner', String(score.value))
}

const startLoop = () => {
  cancelAnimationFrame(frameId)
  lastFrameTime = 0
  frameId = requestAnimationFrame(gameLoop)
}

const startGame = async () => {
  cancelAnimationFrame(frameId)
  score.value = 0
  remainingMs.value = GAME_DURATION
  toolsLeft.value = 3
  hookAngle.value = -52
  hookLength.value = BASE_HOOK_LENGTH
  hookMode.value = 'swinging'
  caughtTarget.value = null
  fastRetract.value = false
  resetTargets()
  status.value = 'running'
  emit('start', { id: 'golden-miner' })
  emit('score-change', { id: 'golden-miner', score: 0 })
  await nextTick()
  startLoop()
}

const finishGame = (reason = 'manual') => {
  if (status.value === 'finished') return
  cancelAnimationFrame(frameId)
  status.value = 'finished'
  saveBestScore()
  emit('finish', { id: 'golden-miner', score: score.value, bestScore: displayedBest.value, reason })
}

const closeGame = () => {
  if (status.value === 'running' || status.value === 'paused') finishGame('closed')
  cancelAnimationFrame(frameId)
  emit('close', { id: 'golden-miner', score: score.value })
}

const dropHook = () => {
  if (status.value === 'running' && hookMode.value === 'swinging') hookMode.value = 'extending'
}

const useToolOrRetract = () => {
  if (status.value !== 'running') return
  if (hookMode.value !== 'swinging') {
    hookMode.value = 'retracting'
    fastRetract.value = true
    return
  }
  if (toolsLeft.value <= 0) return
  const rock = targets.value.find(target => target.type === 'rock')
  if (!rock) return
  toolsLeft.value -= 1
  targets.value = targets.value.filter(target => target.id !== rock.id)
  targets.value.push(createTarget(Math.floor(Math.random() * 10)))
}

const handleKeydown = (event) => {
  const code = event.code
  if (!['KeyA', 'KeyB', 'Escape'].includes(code)) return
  event.preventDefault()

  if (code === 'Escape') {
    closeGame()
    return
  }
  if (event.repeat) return
  if (status.value === 'idle' || status.value === 'finished') {
    void startGame()
    return
  }
  if (code === 'KeyA') dropHook()
  if (code === 'KeyB') useToolOrRetract()
}

resetTargets()
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  void startGame()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.miner-game {
  width: 94vw;
  height: 94dvh;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 12px;
  padding: 18px;
  box-sizing: border-box;
  border-radius: 8px;
  background: #f7f4ee;
  color: #242424;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  h2 { margin: 2px 0 0; font-size: 24px; letter-spacing: 0; }
}

.game-kicker { margin: 0; color: #826014; font-size: 13px; }

.score-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 10px;
  background: #282624;
  border-radius: 6px;
  color: #fff;
}

.metric {
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
  span { color: #d5d0c7; font-size: 13px; }
  strong { color: #ffd44d; font-size: 22px; }
}

.miner-arena {
  position: relative;
  min-height: 310px;
  overflow: hidden;
  border: 2px solid #3e372f;
  border-radius: 6px;
  background-position: center;
  background-size: cover;
  background-color: #392a1e;
  isolation: isolate;
}

.mine-shade {
  position: absolute;
  inset: 0;
  background: rgba(23, 16, 11, 0.2);
  z-index: -1;
}

.winch {
  position: absolute;
  top: 8px;
  left: 50%;
  width: 78px;
  height: 38px;
  transform: translateX(-50%);
  border: 4px solid #332b22;
  border-radius: 6px;
  background: #d9a32e;
  z-index: 4;
}

.winch-wheel {
  position: absolute;
  inset: 5px 22px;
  border: 5px solid #5f4318;
  border-radius: 50%;
  background: #f8cf55;
}

.hook-arm {
  position: absolute;
  top: 30px;
  left: 50%;
  width: 4px;
  transform-origin: 50% 0;
  z-index: 3;
  pointer-events: none;
}

.hook-line { position: absolute; inset: 0; background: #e8e8e8; box-shadow: 0 0 3px #000; }
.hook-head {
  position: absolute;
  left: 50%;
  bottom: -38px;
  width: 44px;
  height: 48px;
  transform: translateX(-50%);
  object-fit: contain;
  filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.65));
}

.hook-cargo {
  position: absolute;
  left: 50%;
  bottom: -76px;
  width: 52px;
  height: 52px;
  transform: translateX(-50%);
  object-fit: contain;
  filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.55));
}

.mine-target {
  position: absolute;
  transform: translate(-50%, -50%);
  box-sizing: border-box;
  color: #fff;
  filter: drop-shadow(0 5px 5px rgba(0, 0, 0, 0.52));
  img { display: block; width: 100%; height: 100%; object-fit: contain; }
  small {
    position: absolute;
    left: 50%;
    bottom: -18px;
    transform: translateX(-50%);
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.75);
    font-size: 11px;
    white-space: nowrap;
  }
}

.game-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  background: rgba(17, 17, 17, 0.72);
  color: #fff;
  z-index: 8;
  h3 { margin: 0 0 8px; font-size: 26px; letter-spacing: 0; }
  p { max-width: 560px; margin: 0; line-height: 1.55; }
}

@media (max-width: 700px) {
  .miner-game {
    width: 100vw;
    height: 100dvh;
    padding: 10px;
    gap: 8px;
    border-radius: 0;
  }
  .game-header h2 { font-size: 20px; }
  .game-kicker { display: none; }
  .score-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 6px; }
  .metric { justify-content: space-between; padding: 0 5px; strong { font-size: 18px; } }
  .miner-arena { min-height: 0; }
}

</style>
