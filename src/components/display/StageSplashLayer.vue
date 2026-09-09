<template>
  <canvas ref="canvasRef" class="stage-splash-canvas" aria-hidden="true"></canvas>
</template>

<script setup>
// 特殊事件水花图层：覆盖在 .tide-stage 上的透明 canvas。
// 父级（ScenicDishStage）每帧调用 emitBoat / emitTurtle 喂入事件位置，
// 本组件只负责画布尺寸、渲染循环和冻结控制，不含任何定位逻辑。
import { onMounted, onUnmounted, ref } from 'vue'
import { StageSplashEngine } from '@/utils/stageSplashEngine'

const props = defineProps({
  // 传送带暂停时冻结整个粒子画面
  frozen: { type: Boolean, default: false }
})

const canvasRef = ref(null)
const engine = new StageSplashEngine()

let ctx = null
let frameId = 0
let lastFrameTime = 0
let resizeObserver = null

/** 按 DPR 设置画布物理分辨率，绘制时统一使用 CSS 像素坐标 */
const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const parent = canvas.parentElement
  if (!parent) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const width = parent.clientWidth
  const height = parent.clientHeight
  canvas.width = Math.max(1, Math.round(width * dpr))
  canvas.height = Math.max(1, Math.round(height * dpr))
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

const runFrame = (time) => {
  frameId = window.requestAnimationFrame(runFrame)
  if (!ctx) return

  let deltaSeconds = 0
  // 冻结时不推进时间也不推进粒子，保持与传送带暂停一致的静止画面
  if (!props.frozen) {
    if (!lastFrameTime) lastFrameTime = time
    deltaSeconds = Math.min(0.05, Math.max(0, (time - lastFrameTime) / 1000))
    engine.update(deltaSeconds, false)
  }
  lastFrameTime = time

  // clearRect 受 DPR 变换影响，先重置变换再按物理像素清屏
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()

  if (engine.alive) engine.draw(ctx)
}

const ensureLoop = () => {
  if (frameId) return
  lastFrameTime = 0
  frameId = window.requestAnimationFrame(runFrame)
}

/**
 * 船体水花入口。spots 为船底发射点数组（舞台本地坐标），
 * ratio 为 0~1 强度（由实际滚动速度换算），speedSign 为内容移动方向，
 * dt 为父级帧间隔（秒），用于帧率无关的发射量累积。
 */
const emitBoat = (spots, ratio, speedSign, dt) => {
  engine.emitBoat(spots, ratio, dt || 1 / 60, speedSign)
  ensureLoop()
}

/** 海龟尾迹入口。width 用于在身后一条线上散布气泡。 */
const emitTurtle = (x, y, width, ratio, dt) => {
  engine.emitTurtle(x, y, width, ratio, dt || 1 / 60)
  ensureLoop()
}

onMounted(() => {
  resizeCanvas()
  resizeObserver = new ResizeObserver(resizeCanvas)
  if (canvasRef.value?.parentElement) resizeObserver.observe(canvasRef.value.parentElement)
  ensureLoop()
})

onUnmounted(() => {
  window.cancelAnimationFrame(frameId)
  frameId = 0
  resizeObserver?.disconnect()
  resizeObserver = null
})

defineExpose({ emitBoat, emitTurtle })
</script>

<style lang="scss" scoped>
.stage-splash-canvas {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}
</style>
