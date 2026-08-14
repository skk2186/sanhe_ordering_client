<template>
  <section class="catch-game" aria-labelledby="catch-title" aria-keyshortcuts="A B Escape">
    <header class="game-header">
      <div>
        <p class="game-kicker">{{ $t('games.localOnly') }}</p>
        <h2 id="catch-title">{{ $t('games.sushiCatch.title') }}</h2>
      </div>
    </header>

    <div class="score-strip" aria-live="polite">
      <div class="metric"><span>{{ $t('games.score') }}</span><strong>{{ score }}</strong></div>
      <div class="metric"><span>{{ $t('games.bestScore') }}</span><strong>{{ displayedBest }}</strong></div>
      <div class="metric"><span>{{ $t('games.time') }}</span><strong>{{ remainingSeconds }}s</strong></div>
      <div class="metric lives"><span>{{ $t('games.lives') }}</span><strong>{{ lifeText }}</strong></div>
      <div class="metric"><span>{{ $t('games.combo') }}</span><strong>x{{ combo }}</strong></div>
    </div>

    <div ref="arenaRef" class="catch-arena" :style="{ backgroundImage: `url(${sushiBackground})` }">
      <div class="sea-shade"></div>
      <div class="difficulty-meter">
        <span>{{ $t('games.difficulty') }}</span>
        <div><i :style="{ width: `${difficultyPercent}%` }"></i></div>
      </div>

      <div
        v-for="item in fallingItems"
        :key="item.id"
        class="falling-item"
        :class="`item-${item.type}`"
        :style="itemStyle(item)"
        aria-hidden="true"
      >
        <img :src="item.image" alt="">
      </div>

      <div class="catch-tray" :style="trayStyle" aria-hidden="true">
        <img :src="trayImage" alt="">
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
import sushiBackground from '@/assets/games/sushi/background.webp'
import trayImage from '@/assets/games/sushi/tray.webp'
import sushiNormalImage from '@/assets/games/sushi/sushi-normal.webp'
import sushiRareImage from '@/assets/games/sushi/sushi-rare.webp'
import wasabiImage from '@/assets/games/sushi/wasabi.webp'
import emptyPlateImage from '@/assets/games/sushi/empty-plate.webp'

const props = defineProps({
  bestScore: { type: Number, default: 0 }
})

const emit = defineEmits(['start', 'score-change', 'finish', 'close'])
const { t } = useI18n()

const GAME_DURATION = 45_000

// Vue 负责渲染下落物数组；所有位置以 arena 实时尺寸换算，兼容横向大屏和移动端。
const arenaRef = ref(null)
const status = ref('idle')
const score = ref(0)
const localBest = ref(Number(localStorage.getItem('game-best-sushi-catch')) || 0)
const remainingMs = ref(GAME_DURATION)
const lives = ref(3)
const combo = ref(0)
const trayX = ref(50)
const fallingItems = ref([])

let frameId = 0
let lastFrameTime = 0
let spawnAccumulator = 0
let itemSequence = 0
let moveTimer = 0
// Set 同时记录 A/B，可正确处理两键同时按下和不同顺序松开的情况。
const pressedControls = new Set()

const remainingSeconds = computed(() => Math.max(0, Math.ceil(remainingMs.value / 1000)))
const displayedBest = computed(() => Math.max(props.bestScore, localBest.value, score.value))
const lifeText = computed(() => '♥'.repeat(Math.max(0, lives.value)) || '0')
const elapsedRatio = computed(() => Math.min(1, Math.max(0, (GAME_DURATION - remainingMs.value) / GAME_DURATION)))
const difficultyPercent = computed(() => Math.round(18 + elapsedRatio.value * 82))
const trayStyle = computed(() => ({ left: `${trayX.value}%` }))
const stateTitle = computed(() => {
  if (status.value === 'paused') return t('games.paused')
  if (status.value === 'finished') return lives.value <= 0 ? t('games.sushiCatch.outOfLives') : t('games.finished')
  return t('games.sushiCatch.readyTitle')
})
const stateDescription = computed(() => {
  if (status.value === 'paused') return t('games.pauseHint')
  if (status.value === 'finished') return t('games.finalScore', { score: score.value })
  return t('games.sushiCatch.readyHint')
})

const itemDefinitions = {
  normal: { type: 'normal', image: sushiNormalImage, value: 10 },
  rare: { type: 'rare', image: sushiRareImage, value: 25 },
  wasabi: { type: 'wasabi', image: wasabiImage, value: 0 },
  plate: { type: 'plate', image: emptyPlateImage, value: 0 }
}

/** 根据局内难度创建一个下落物；x 使用百分比，y 和速度使用像素。 */
const createFallingItem = () => {
  const random = Math.random()
  const definition = random < 0.12
    ? itemDefinitions.rare
    : random < 0.25
      ? itemDefinitions.wasabi
      : random < 0.36
        ? itemDefinitions.plate
        : itemDefinitions.normal
  return {
    ...definition,
    id: `fall-${itemSequence++}`,
    x: 7 + Math.random() * 86,
    y: -58,
    speed: 105 + elapsedRatio.value * 155 + Math.random() * 32,
    rotation: Math.random() * 24 - 12
  }
}

const itemStyle = (item) => ({
  left: `${item.x}%`,
  top: `${item.y}px`,
  transform: `translateX(-50%) rotate(${item.rotation}deg)`
})

const updateScore = (nextScore) => {
  score.value = Math.max(0, nextScore)
  emit('score-change', { id: 'sushi-catch', score: score.value })
}

const resolveCatch = (item) => {
  // 稀有寿司增加连击并获得额外分；普通寿司保留连击；坏物品重置连击并扣生命。
  if (item.type === 'rare') {
    combo.value += 1
    updateScore(score.value + item.value + combo.value * 5)
    return
  }
  if (item.type === 'normal') {
    updateScore(score.value + item.value + combo.value * 2)
    return
  }
  combo.value = 0
  lives.value = Math.max(0, lives.value - 1)
}

/**
 * 推进所有下落物并用托盘中心的水平容差判断接住。
 * 已接住和落出屏幕的物品都不会进入 remaining，避免数组随游戏时间持续增长。
 */
const updateItems = (deltaSeconds) => {
  const arena = arenaRef.value
  if (!arena) return
  const arenaScale = Math.max(0.75, arena.clientHeight / 420)
  const trayTop = arena.clientHeight - 62
  const trayCenterX = arena.clientWidth * trayX.value / 100
  // 大屏按宽度放大有效接取范围，小屏保留至少 52px 的可操作宽度。
  const catchRange = Math.max(52, arena.clientWidth * 0.105)
  const remaining = []

  fallingItems.value.forEach((item) => {
    item.y += item.speed * arenaScale * deltaSeconds
    const itemCenterX = arena.clientWidth * item.x / 100
    const reachesTray = item.y + 48 >= trayTop && item.y < trayTop + 30
    if (reachesTray && Math.abs(itemCenterX - trayCenterX) <= catchRange) {
      resolveCatch(item)
      return
    }
    if (item.y <= arena.clientHeight + 64) remaining.push(item)
  })

  fallingItems.value = remaining
}

const gameLoop = (timestamp) => {
  if (status.value !== 'running') return
  if (!lastFrameTime) lastFrameTime = timestamp
  // 页面从后台恢复时限制到 40ms，防止物品跨越托盘碰撞区。
  const deltaMs = Math.min(40, timestamp - lastFrameTime)
  lastFrameTime = timestamp
  remainingMs.value -= deltaMs
  spawnAccumulator += deltaMs

  const spawnInterval = 900 - elapsedRatio.value * 520
  // 时间越接近结束，生成间隔越短；单帧最多生成一个，避免卡顿后突然堆积。
  if (spawnAccumulator >= spawnInterval) {
    spawnAccumulator = 0
    fallingItems.value.push(createFallingItem())
  }

  updateItems(deltaMs / 1000)
  if (remainingMs.value <= 0 || lives.value <= 0) {
    finishGame(lives.value <= 0 ? 'lives' : 'time')
    return
  }
  frameId = requestAnimationFrame(gameLoop)
}

const saveBestScore = () => {
  if (score.value <= localBest.value) return
  localBest.value = score.value
  localStorage.setItem('game-best-sushi-catch', String(score.value))
}

const startLoop = () => {
  cancelAnimationFrame(frameId)
  lastFrameTime = 0
  frameId = requestAnimationFrame(gameLoop)
}

/** 完整重置一局并等待 DOM 尺寸稳定后启动动画帧。 */
const startGame = async () => {
  cancelAnimationFrame(frameId)
  pressedControls.clear()
  stopMoving()
  score.value = 0
  remainingMs.value = GAME_DURATION
  lives.value = 3
  combo.value = 0
  trayX.value = 50
  fallingItems.value = []
  spawnAccumulator = 0
  status.value = 'running'
  emit('start', { id: 'sushi-catch' })
  emit('score-change', { id: 'sushi-catch', score: 0 })
  await nextTick()
  startLoop()
}

const finishGame = (reason = 'manual') => {
  if (status.value === 'finished') return
  stopMoving()
  cancelAnimationFrame(frameId)
  status.value = 'finished'
  saveBestScore()
  emit('finish', { id: 'sushi-catch', score: score.value, bestScore: displayedBest.value, reason })
}

const closeGame = () => {
  if (status.value === 'running' || status.value === 'paused') finishGame('closed')
  pressedControls.clear()
  stopMoving()
  cancelAnimationFrame(frameId)
  emit('close', { id: 'sushi-catch', score: score.value })
}

const moveTray = (direction) => {
  if (status.value !== 'running') return
  // 保留 8% 边界，确保托盘图像不会完全移出可视区。
  trayX.value = Math.max(8, Math.min(92, trayX.value + direction * 5))
}

const stopMoving = () => {
  if (moveTimer) window.clearInterval(moveTimer)
  moveTimer = 0
}

const startMoving = (direction) => {
  // 先移动一次减少按键反馈延迟，再用固定节奏支持外接按钮长按。
  stopMoving()
  moveTray(direction)
  moveTimer = window.setInterval(() => moveTray(direction), 70)
}

const syncKeyboardMovement = () => {
  if (status.value !== 'running') {
    stopMoving()
    return
  }
  const movingLeft = pressedControls.has('KeyA')
  const movingRight = pressedControls.has('KeyB')
  // 两键同时按下视为方向抵消，松开任意一键后恢复剩余方向。
  if (movingLeft === movingRight) stopMoving()
  else startMoving(movingLeft ? -1 : 1)
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

  pressedControls.add(code)
  syncKeyboardMovement()
}

const handleKeyup = (event) => {
  const code = event.code
  if (!['KeyA', 'KeyB'].includes(code)) return
  event.preventDefault()
  pressedControls.delete(code)
  syncKeyboardMovement()
}

const releaseControls = () => {
  pressedControls.clear()
  stopMoving()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)
  window.addEventListener('blur', releaseControls)
  void startGame()
})

onBeforeUnmount(() => {
  // 失焦和卸载都要清空长按计时器，防止托盘在用户切走页面后继续移动。
  releaseControls()
  cancelAnimationFrame(frameId)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
  window.removeEventListener('blur', releaseControls)
})
</script>

<style lang="scss" scoped>
.catch-game {
  width: min(2200px, 94vw);
  height: min(940px, 94dvh);
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 12px;
  padding: 18px;
  box-sizing: border-box;
  border-radius: 8px;
  background: #f5f8fb;
  color: #1f2933;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  h2 { margin: 2px 0 0; font-size: 24px; letter-spacing: 0; }
}

.game-kicker { margin: 0; color: #23657b; font-size: 13px; }

.score-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  padding: 10px;
  background: #17394b;
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
  span { color: #b9d4df; font-size: 13px; }
  strong { color: #ffd65a; font-size: 21px; }
}

.lives strong { color: #ff7c79; letter-spacing: 2px; }

.catch-arena {
  position: relative;
  min-height: 310px;
  overflow: hidden;
  border: 2px solid #24657d;
  border-radius: 6px;
  background-position: center;
  background-size: cover;
  background-color: #8ed5dc;
  isolation: isolate;
  touch-action: none;
}

.sea-shade {
  position: absolute;
  inset: 0;
  background: rgba(8, 64, 88, 0.08);
  z-index: -1;
}

.difficulty-meter {
  position: absolute;
  top: 10px;
  left: 12px;
  width: min(220px, 42%);
  padding: 7px 9px;
  border-radius: 5px;
  background: rgba(10, 42, 55, 0.78);
  color: #fff;
  font-size: 12px;
  z-index: 4;
  > div { height: 6px; margin-top: 5px; overflow: hidden; border-radius: 3px; background: rgba(255, 255, 255, 0.28); }
  i { display: block; height: 100%; background: #ffbd32; transition: width 0.3s; }
}

.falling-item {
  position: absolute;
  width: 52px;
  height: 52px;
  box-sizing: border-box;
  filter: drop-shadow(0 5px 5px rgba(0, 0, 0, 0.3));
  img { width: 100%; height: 100%; object-fit: contain; }
}

.item-rare { filter: drop-shadow(0 0 8px #ffd030) drop-shadow(0 5px 5px rgba(0, 0, 0, 0.3)); }
.item-wasabi { filter: drop-shadow(0 0 6px rgba(202, 45, 42, 0.9)) drop-shadow(0 5px 5px rgba(0, 0, 0, 0.3)); }
.item-plate { filter: drop-shadow(0 0 4px rgba(47, 62, 72, 0.55)) drop-shadow(0 5px 5px rgba(0, 0, 0, 0.3)); }

.catch-tray {
  position: absolute;
  bottom: 8px;
  width: 170px;
  height: 58px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.055s linear;
  z-index: 3;
  img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 5px 5px rgba(0, 0, 0, 0.35)); }
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
  background: rgba(8, 37, 49, 0.76);
  color: #fff;
  z-index: 8;
  h3 { margin: 0 0 8px; font-size: 26px; letter-spacing: 0; }
  p { max-width: 580px; margin: 0; line-height: 1.55; }
}

@media (max-width: 700px) {
  .catch-game {
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
  .score-strip .metric:last-child { grid-column: 1 / -1; }
  .catch-arena { min-height: 0; }
  .catch-tray { width: 132px; height: 50px; }
  .falling-item { width: 46px; height: 46px; font-size: 28px; }
}

</style>
