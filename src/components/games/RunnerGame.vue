<template>
  <section class="runner-game" aria-labelledby="runner-title" aria-keyshortcuts="A B Escape">
    <header class="game-header">
      <div>
        <p class="game-kicker">{{ $t('games.localOnly') }}</p>
        <h2 id="runner-title">{{ $t('games.runner.title') }}</h2>
      </div>
    </header>

    <div class="score-strip" aria-live="polite">
      <div class="metric"><span>{{ $t('games.score') }}</span><strong>{{ score }}</strong></div>
      <div class="metric"><span>{{ $t('games.bestScore') }}</span><strong>{{ displayedBest }}</strong></div>
      <div class="metric"><span>{{ $t('games.time') }}</span><strong>{{ remainingSeconds }}s</strong></div>
      <div class="metric lives"><span>{{ $t('games.lives') }}</span><strong>{{ lives }}</strong></div>
      <div class="metric"><span>{{ $t('games.combo') }}</span><strong>x{{ combo }}</strong></div>
    </div>

    <div ref="arenaRef" class="runner-arena">
      <div ref="gameHostRef" class="game-canvas-host" aria-hidden="true"></div>

      <div v-if="status === 'running'" class="difficulty-meter" aria-hidden="true">
        <span>{{ $t('games.difficulty') }}</span>
        <div><i :style="{ width: `${difficultyPercent}%` }"></i></div>
      </div>

      <div v-if="status === 'loading' || status === 'error' || status === 'finished'" class="game-state">
        <template v-if="status === 'loading'">
          <h3>{{ $t('games.runner.loading') }}</h3>
        </template>
        <template v-else-if="status === 'error'">
          <h3>{{ $t('games.runner.loadFailed') }}</h3>
        </template>
        <template v-else>
          <h3>{{ stateTitle }}</h3>
          <p>{{ $t('games.finalScore', { score }) }}</p>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from '@/i18n'
import backgroundImage from '@/assets/games/runner/background.webp'
import groundImage from '@/assets/games/runner/ground.webp'
import runnerRunImage from '@/assets/games/runner/runner-run.webp'
import runnerActionsImage from '@/assets/games/runner/runner-actions.webp'
import serviceCartImage from '@/assets/games/runner/obstacle-service-cart.webp'
import sauceCrateImage from '@/assets/games/runner/obstacle-sauce-crate.webp'
import sushiImage from '@/assets/games/runner/collectible-sushi.webp'
import shieldImage from '@/assets/games/runner/powerup-shield.webp'

const props = defineProps({
  bestScore: { type: Number, default: 0 }
})

const emit = defineEmits(['start', 'score-change', 'finish', 'close'])
const { t } = useI18n()

const GAME_ID = 'sushi-runner'
const STORAGE_KEY = 'game-best-sushi-runner'
const GAME_DURATION = 45_000
const arenaRef = ref(null)
const gameHostRef = ref(null)
const status = ref('loading')
const score = ref(0)
const localBest = ref(Number(localStorage.getItem(STORAGE_KEY)) || 0)
const remainingMs = ref(GAME_DURATION)
const lives = ref(3)
const combo = ref(0)

let Phaser = null
let phaserGame = null
let runnerScene = null
let resizeObserver = null
let disposed = false

const remainingSeconds = computed(() => Math.max(0, Math.ceil(remainingMs.value / 1000)))
const displayedBest = computed(() => Math.max(props.bestScore, localBest.value, score.value))
const elapsedRatio = computed(() => Math.min(1, Math.max(0, (GAME_DURATION - remainingMs.value) / GAME_DURATION)))
const difficultyPercent = computed(() => Math.round(12 + elapsedRatio.value * 88))
const stateTitle = computed(() => (
  lives.value <= 0 ? t('games.runner.outOfLives') : t('games.finished')
))

const saveBestScore = () => {
  if (score.value <= localBest.value) return
  localBest.value = score.value
  localStorage.setItem(STORAGE_KEY, String(score.value))
}

const createRunnerScene = () => class RunnerScene extends Phaser.Scene {
  constructor() {
    super('runner-scene')
    this.entities = []
    this.playerState = ''
    this.roundRunning = false
  }

  preload() {
    this.load.image('runner-background', backgroundImage)
    this.load.image('runner-ground', groundImage)
    this.load.spritesheet('runner-cycle', runnerRunImage, { frameWidth: 256, frameHeight: 512 })
    this.load.spritesheet('runner-actions', runnerActionsImage, { frameWidth: 256, frameHeight: 512 })
    this.load.image('service-cart', serviceCartImage)
    this.load.image('sauce-crate', sauceCrateImage)
    this.load.image('sushi', sushiImage)
    this.load.image('shield', shieldImage)
  }

  create() {
    runnerScene = this
    this.background = this.add.image(0, 0, 'runner-background').setOrigin(0.5)
    this.ground = this.add.tileSprite(0, 0, 1, 1, 'runner-ground').setOrigin(0)
    this.player = this.add.sprite(0, 0, 'runner-cycle', 0).setOrigin(0.5, 0.82)
    this.shieldAura = this.add.graphics().setDepth(8)

    this.anims.create({
      key: 'runner-running',
      frames: this.anims.generateFrameNumbers('runner-cycle', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    })

    this.handleResize(this.scale.width, this.scale.height)
    this.resetRound()
  }

  get unit() {
    return Math.max(0.68, Math.min(1.3, this.scale.height / 500))
  }

  get groundY() {
    return this.scale.height * 0.72
  }

  handleResize(width, height, previousWidth = width, previousHeight = height) {
    if (!this.background || width <= 0 || height <= 0) return

    const backgroundScale = Math.max(width / this.background.width, height / this.background.height)
    this.background
      .setPosition(width / 2, height / 2)
      .setScale(backgroundScale)

    this.ground
      .setPosition(0, height * 0.28)
      .setSize(width, height * 0.72)
      .setTileScale((height * 0.72) / 512)

    const widthRatio = previousWidth > 0 ? width / previousWidth : 1
    this.entities.forEach((entity) => {
      entity.display.x *= widthRatio
      this.layoutEntity(entity)
    })

    const heightRatio = previousHeight > 0 ? height / previousHeight : 1
    this.jumpOffset = (this.jumpOffset || 0) * heightRatio
    this.layoutPlayer()
  }

  resetRound() {
    this.entities.forEach((entity) => entity.display.destroy())
    this.entities = []
    this.roundRunning = true
    this.spawnCount = 0
    this.spawnAccumulator = -350
    this.scoreAccumulator = 0
    this.jumpOffset = 0
    this.jumpVelocity = 0
    this.slideUntil = 0
    this.landUntil = 0
    this.invulnerableUntil = 0
    this.shieldActive = false
    this.trackDistance = 0
    this.player.setAlpha(1)
    this.setPlayerState('run')

    score.value = 0
    lives.value = 3
    combo.value = 0
    remainingMs.value = GAME_DURATION
    status.value = 'running'
    emit('start', { id: GAME_ID })
    emit('score-change', { id: GAME_ID, score: 0 })
  }

  setPlayerState(nextState) {
    if (this.playerState === nextState) return
    this.playerState = nextState

    if (nextState === 'run') {
      this.player.setOrigin(0.5, 0.82).play('runner-running', true)
      return
    }

    this.player.stop()
    const frame = nextState === 'jump' ? 1 : nextState === 'land' ? 2 : 3
    this.player.setOrigin(0.5, nextState === 'slide' ? 0.84 : 0.82)
    this.player.setTexture('runner-actions', frame)
  }

  layoutPlayer() {
    if (!this.player) return
    const scale = Math.max(0.38, Math.min(0.72, this.scale.height / 820))
    this.player
      .setScale(scale)
      .setPosition(this.scale.width * 0.18, this.groundY - (this.jumpOffset || 0))

    this.shieldAura.clear()
    if (this.shieldActive) {
      const radius = 82 * this.unit
      this.shieldAura
        .lineStyle(5 * this.unit, 0x8cecff, 0.92)
        .fillStyle(0x54cfe8, 0.12)
        .fillCircle(this.player.x, this.player.y - 72 * this.unit, radius)
        .strokeCircle(this.player.x, this.player.y - 72 * this.unit, radius)
    }
  }

  layoutEntity(entity) {
    const unit = this.unit
    const definition = entity.definition

    if (definition.mode === 'ground') {
      entity.display
        .setDisplaySize(definition.displayWidth * unit, definition.displayHeight * unit)
        .setOrigin(0.5, definition.baseline)
        .setY(this.groundY)
      return
    }

    if (definition.mode === 'air') {
      entity.display
        .setDisplaySize(definition.displayWidth * unit, definition.displayHeight * unit)
        .setOrigin(0.5)
        .setY(this.groundY - definition.lift * unit)
      return
    }

    entity.display
      .setScale(unit)
      .setY(this.groundY - 190 * unit)
  }

  createNoren(x) {
    const graphics = this.add.graphics()
    graphics.fillStyle(0x5b351f, 1).fillRoundedRect(-82, 0, 164, 18, 4)
    graphics.fillStyle(0x163f4b, 1)
    for (let index = 0; index < 3; index += 1) {
      graphics.fillRoundedRect(-76 + index * 52, 14, 48, 92, 4)
    }
    graphics.lineStyle(2, 0xe9d6b8, 0.62)
    graphics.lineBetween(-80, 18, 80, 18)
    return this.add.container(x, 0, [graphics]).setDepth(6)
  }

  spawnEntity(type) {
    const definitions = {
      cart: { kind: 'obstacle', mode: 'ground', texture: 'service-cart', displayWidth: 150, displayHeight: 150, baseline: 0.82, colliderWidth: 108, colliderHeight: 96 },
      crate: { kind: 'obstacle', mode: 'ground', texture: 'sauce-crate', displayWidth: 145, displayHeight: 145, baseline: 0.73, colliderWidth: 122, colliderHeight: 72 },
      noren: { kind: 'obstacle', mode: 'overhead', colliderWidth: 150, colliderHeight: 112 },
      'sushi-low': { kind: 'collectible', mode: 'air', texture: 'sushi', displayWidth: 78, displayHeight: 78, lift: 108, colliderWidth: 54, colliderHeight: 48, value: 25 },
      'sushi-high': { kind: 'collectible', mode: 'air', texture: 'sushi', displayWidth: 78, displayHeight: 78, lift: 205, colliderWidth: 54, colliderHeight: 48, value: 35 },
      shield: { kind: 'shield', mode: 'air', texture: 'shield', displayWidth: 68, displayHeight: 68, lift: 142, colliderWidth: 50, colliderHeight: 50 }
    }
    const definition = definitions[type]
    const x = this.scale.width + 120 * this.unit
    const display = type === 'noren'
      ? this.createNoren(x)
      : this.add.image(x, 0, definition.texture).setDepth(definition.kind === 'obstacle' ? 6 : 7)
    const entity = { type, definition, display, resolved: false }
    this.entities.push(entity)
    this.layoutEntity(entity)
  }

  chooseSpawnType() {
    const openingSequence = ['sushi-low', 'crate', 'sushi-high', 'noren', 'cart']
    if (this.spawnCount < openingSequence.length) return openingSequence[this.spawnCount]

    const random = Math.random()
    if (random < 0.24) return Math.random() < 0.52 ? 'crate' : 'cart'
    if (random < 0.42) return 'noren'
    if (random < 0.72) return 'sushi-low'
    if (random < 0.93) return 'sushi-high'
    return this.shieldActive ? 'sushi-low' : 'shield'
  }

  getPlayerRect() {
    const unit = this.unit
    const sliding = this.playerState === 'slide'
    const width = (sliding ? 92 : 58) * unit
    const height = (sliding ? 54 : 148) * unit
    const bottom = this.groundY - this.jumpOffset
    return new Phaser.Geom.Rectangle(this.player.x - width / 2, bottom - height, width, height)
  }

  getEntityRect(entity) {
    const unit = this.unit
    const definition = entity.definition
    const width = definition.colliderWidth * unit
    const x = entity.display.x - width / 2

    if (definition.mode === 'ground') {
      const height = definition.colliderHeight * unit
      return new Phaser.Geom.Rectangle(x, this.groundY - height, width, height)
    }
    if (definition.mode === 'overhead') {
      return new Phaser.Geom.Rectangle(x, this.groundY - 184 * unit, width, definition.colliderHeight * unit)
    }

    const height = definition.colliderHeight * unit
    return new Phaser.Geom.Rectangle(x, entity.display.y - height / 2, width, height)
  }

  addScore(amount) {
    score.value = Math.max(0, score.value + amount)
    emit('score-change', { id: GAME_ID, score: score.value })
  }

  resolveEntity(entity, now) {
    entity.resolved = true
    const { definition } = entity

    if (definition.kind === 'collectible') {
      combo.value += 1
      this.addScore(definition.value + combo.value * 4)
      this.tweens.add({ targets: entity.display, alpha: 0, scale: entity.display.scale * 1.35, duration: 120 })
      return
    }

    if (definition.kind === 'shield') {
      this.shieldActive = true
      this.addScore(15)
      this.tweens.add({ targets: entity.display, alpha: 0, scale: entity.display.scale * 1.3, duration: 120 })
      return
    }

    if (now < this.invulnerableUntil) return
    combo.value = 0
    if (this.shieldActive) {
      this.shieldActive = false
    } else {
      lives.value = Math.max(0, lives.value - 1)
    }
    this.invulnerableUntil = now + 1200
    this.cameras.main.shake(100, 0.008)
    this.cameras.main.flash(90, 210, 70, 55, false)
    if (lives.value <= 0) this.finishRound('lives')
  }

  updateEntities(now, deltaSeconds, speed) {
    const playerRect = this.getPlayerRect()
    this.entities.forEach((entity) => {
      entity.display.x -= speed * deltaSeconds
      if (entity.resolved) return
      const entityRect = this.getEntityRect(entity)
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerRect, entityRect)) {
        this.resolveEntity(entity, now)
      }
    })

    this.entities = this.entities.filter((entity) => {
      if (entity.display.x < -220 * this.unit || (entity.resolved && entity.definition.kind !== 'obstacle')) {
        entity.display.destroy()
        return false
      }
      return true
    })
  }

  updatePlayer(now, deltaSeconds) {
    if (this.jumpOffset > 0 || this.jumpVelocity > 0) {
      this.jumpOffset += this.jumpVelocity * deltaSeconds
      this.jumpVelocity -= this.scale.height * 3.6 * deltaSeconds
      if (this.jumpOffset <= 0) {
        this.jumpOffset = 0
        this.jumpVelocity = 0
        this.landUntil = now + 110
        this.setPlayerState('land')
      } else {
        this.setPlayerState('jump')
      }
    } else if (now < this.slideUntil) {
      this.setPlayerState('slide')
    } else if (now < this.landUntil) {
      this.setPlayerState('land')
    } else {
      this.setPlayerState('run')
    }

    this.player.setAlpha(now < this.invulnerableUntil && Math.floor(now / 80) % 2 === 0 ? 0.32 : 1)
    this.layoutPlayer()
  }

  jump() {
    if (!this.roundRunning || this.jumpOffset > 0 || this.playerState === 'slide') return
    this.jumpVelocity = this.scale.height * 1.6
    this.landUntil = 0
    this.setPlayerState('jump')
  }

  slide(now = this.time.now) {
    if (!this.roundRunning || this.jumpOffset > 0) return
    this.slideUntil = Math.max(this.slideUntil, now + 720)
    this.setPlayerState('slide')
  }

  finishRound(reason = 'time') {
    if (!this.roundRunning) return
    this.roundRunning = false
    this.player.stop()
    status.value = 'finished'
    saveBestScore()
    emit('finish', { id: GAME_ID, score: score.value, bestScore: displayedBest.value, reason })
  }

  update(now, delta) {
    if (!this.roundRunning) return
    const deltaMs = Math.min(40, delta)
    const deltaSeconds = deltaMs / 1000
    remainingMs.value = Math.max(0, remainingMs.value - deltaMs)

    const progress = 1 - remainingMs.value / GAME_DURATION
    const widthScale = Math.max(0.78, Math.min(1.45, this.scale.width / 1200))
    const speed = (285 + progress * 235) * widthScale
    this.trackDistance += speed * deltaSeconds
    this.ground.tilePositionX = this.trackDistance / this.ground.tileScaleX

    this.spawnAccumulator += deltaMs
    const spawnInterval = 1220 - progress * 500
    if (this.spawnAccumulator >= spawnInterval) {
      this.spawnAccumulator = 0
      this.spawnEntity(this.chooseSpawnType())
      this.spawnCount += 1
    }

    this.scoreAccumulator += deltaMs
    if (this.scoreAccumulator >= 250) {
      const ticks = Math.floor(this.scoreAccumulator / 250)
      this.scoreAccumulator -= ticks * 250
      this.addScore(ticks * 2)
    }

    this.updatePlayer(now, deltaSeconds)
    this.updateEntities(now, deltaSeconds, speed)
    if (remainingMs.value <= 0) this.finishRound('time')
  }
}

const createGame = () => {
  const host = gameHostRef.value
  if (!host || disposed) return
  const width = Math.max(320, host.clientWidth)
  const height = Math.max(240, host.clientHeight)

  phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width,
    height,
    backgroundColor: '#183d45',
    render: { antialias: true, roundPixels: true },
    scene: createRunnerScene()
  })

  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry || !phaserGame || !runnerScene) return
    const nextWidth = Math.max(320, Math.round(entry.contentRect.width))
    const nextHeight = Math.max(240, Math.round(entry.contentRect.height))
    const previousWidth = phaserGame.scale.width
    const previousHeight = phaserGame.scale.height
    if (nextWidth === previousWidth && nextHeight === previousHeight) return
    phaserGame.scale.resize(nextWidth, nextHeight)
    runnerScene.handleResize(nextWidth, nextHeight, previousWidth, previousHeight)
  })
  resizeObserver.observe(host)
}

const initializeGame = async () => {
  if (phaserGame || disposed) return
  status.value = 'loading'
  try {
    const module = await import('phaser')
    if (disposed) return
    Phaser = module.default || module
    createGame()
  } catch (error) {
    console.error('Failed to initialize runner game', error)
    status.value = 'error'
  }
}

const closeGame = () => {
  if (runnerScene?.roundRunning) runnerScene.finishRound('closed')
  emit('close', { id: GAME_ID, score: score.value })
}

const handleKeydown = (event) => {
  if (!['KeyA', 'KeyB', 'Escape'].includes(event.code)) return
  event.preventDefault()
  if (event.code === 'Escape') {
    closeGame()
    return
  }
  if (event.repeat) return
  if (status.value === 'error') {
    void initializeGame()
    return
  }
  if (status.value === 'finished') {
    runnerScene?.resetRound()
    return
  }
  if (status.value !== 'running') return
  if (event.code === 'KeyA') runnerScene?.jump()
  if (event.code === 'KeyB') runnerScene?.slide()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  void initializeGame()
})

onBeforeUnmount(() => {
  disposed = true
  window.removeEventListener('keydown', handleKeydown)
  resizeObserver?.disconnect()
  resizeObserver = null
  runnerScene = null
  phaserGame?.destroy(true)
  phaserGame = null
})
</script>

<style lang="scss" scoped>
.runner-game {
  width: 94vw;
  height: 94dvh;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 12px;
  padding: 18px;
  box-sizing: border-box;
  border-radius: 8px;
  background: #f5f7f5;
  color: #222a28;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  h2 {
    margin: 2px 0 0;
    font-size: 24px;
    letter-spacing: 0;
  }
}

.game-kicker {
  margin: 0;
  color: #8a4c24;
  font-size: 13px;
}

.score-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  padding: 10px;
  background: #173d43;
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

  span {
    overflow: hidden;
    color: #bed5d5;
    font-size: 13px;
    text-overflow: ellipsis;
  }

  strong {
    flex: 0 0 auto;
    color: #ffd45a;
    font-size: 21px;
  }
}

.lives strong {
  color: #ff8a72;
}

.runner-arena {
  position: relative;
  min-height: 310px;
  overflow: hidden;
  border: 2px solid #315d5c;
  border-radius: 6px;
  background: #183d45;
  isolation: isolate;
  touch-action: none;
}

.game-canvas-host {
  position: absolute;
  inset: 0;

  :deep(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }
}

.difficulty-meter {
  position: absolute;
  top: 10px;
  left: 12px;
  width: min(220px, 42%);
  padding: 7px 9px;
  border-radius: 5px;
  background: rgba(19, 49, 52, 0.82);
  color: #fff;
  font-size: 12px;
  pointer-events: none;
  z-index: 4;

  > div {
    height: 6px;
    margin-top: 5px;
    overflow: hidden;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.26);
  }

  i {
    display: block;
    height: 100%;
    background: #f2b84b;
    transition: width 0.3s;
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
  background: rgba(13, 42, 45, 0.76);
  color: #fff;
  z-index: 8;

  h3 {
    margin: 0 0 8px;
    font-size: 26px;
    letter-spacing: 0;
  }

  p {
    max-width: 580px;
    margin: 0;
    line-height: 1.55;
  }
}

@media (max-width: 700px) {
  .runner-game {
    width: 100vw;
    height: 100dvh;
    padding: 10px;
    gap: 8px;
    border-radius: 0;
  }

  .game-header h2 {
    font-size: 20px;
  }

  .game-kicker {
    display: none;
  }

  .score-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 6px;
  }

  .metric {
    justify-content: space-between;
    padding: 0 5px;

    strong {
      font-size: 18px;
    }
  }

  .score-strip .metric:last-child {
    grid-column: 1 / -1;
  }

  .runner-arena {
    min-height: 0;
  }
}
</style>
