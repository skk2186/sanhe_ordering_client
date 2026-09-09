/**
 * 舞台特殊事件水花粒子引擎（纯 Canvas 2D，无第三方依赖）。
 *
 * 坐标系为舞台本地坐标（调用方负责把事件元素位置换算进来）。
 * 支持四种粒子：
 * - droplet 水滴：受重力抛物线运动，用于船尾激起的浪花
 * - foam    浮沫：在水面上短暂扩散后消失的白点
 * - bubble  气泡：向上漂浮并左右摆动，用于海龟身后
 * - ripple  涟漪：原地扩散的椭圆环
 */

const MAX_PARTICLES = 240

export class StageSplashEngine {
  constructor() {
    /** @type {Array<object>} 所有存活粒子 */
    this.particles = []
    // 发射预算：按 dt 累积，凑满 1 才生成一个粒子，保证帧率无关
    this.dropletBudget = 0
    this.foamBudget = 0
    this.bubbleBudget = 0
    this.rippleTimer = 0
    this.time = 0
  }

  /** 是否还有需要绘制的粒子 */
  get alive() {
    return this.particles.length > 0
  }

  reset() {
    this.particles.length = 0
    this.dropletBudget = 0
    this.foamBudget = 0
    this.bubbleBudget = 0
    this.rippleTimer = 0
    this.time = 0
  }

  /**
   * 船体行进水花：spots 为沿船底的一组发射点（第一个视为船尾主喷点，权重更高），
   * ratio 为 0~1 的强度（由实际滚动速度换算），dt 单位秒。
   * speedSign 为内容移动方向：+1 表示画面向左移动（船尾在右），-1 相反。
   */
  emitBoat(spots, ratio, dt, speedSign) {
    if (!Array.isArray(spots) || !spots.length || ratio <= 0) return
    const intensity = Math.min(1, ratio)

    this.dropletBudget += (20 + 110 * intensity) * dt
    while (this.dropletBudget >= 1 && this.particles.length < MAX_PARTICLES) {
      this.dropletBudget -= 1
      const spot = this.pickSpot(spots)
      this.spawnDroplet(spot.x, spot.y, intensity * (spot.power ?? 1), speedSign)
    }

    this.foamBudget += (16 + 64 * intensity) * dt
    while (this.foamBudget >= 1 && this.particles.length < MAX_PARTICLES) {
      this.foamBudget -= 1
      const spot = this.pickSpot(spots)
      this.spawnFoam(spot.x, spot.y, intensity, speedSign)
    }
  }

  /** 船尾主喷点占约一半概率，其余点均分，让浪花沿船底连成一线 */
  pickSpot(spots) {
    if (spots.length === 1 || Math.random() < 0.5) return spots[0]
    return spots[1 + Math.floor(Math.random() * (spots.length - 1))]
  }

  /**
   * 海龟尾迹：气泡沿身后上浮 + 周期性涟漪。气泡与移动方向无关。
   */
  emitTurtle(x, y, width, ratio, dt) {
    if (ratio <= 0) return

    this.bubbleBudget += (5 + 16 * Math.min(1, ratio)) * dt
    while (this.bubbleBudget >= 1 && this.particles.length < MAX_PARTICLES) {
      this.bubbleBudget -= 1
      this.spawnBubble(x + width * (0.3 + Math.random() * 0.45), y + (Math.random() - 0.5) * 14)
    }

    this.rippleTimer += dt * (0.4 + ratio)
    if (this.rippleTimer >= 1.3) {
      this.rippleTimer = 0
      this.spawnRipple(x + width * 0.55, y + 10)
    }
  }

  spawnDroplet(x, y, intensity, speedSign) {
    this.particles.push({
      type: 'droplet',
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 8,
      // 记录发射水面高度：水滴回落到这条线以下就算入水消亡
      waterY: y,
      // 主要朝船行进的反方向抛出，同时带随机扩散和向上的初始速度
      vx: -speedSign * (40 + Math.random() * 110 * intensity) + (Math.random() - 0.5) * 60,
      vy: -(140 + Math.random() * 220 * intensity),
      radius: 1.6 + Math.random() * 2.8,
      life: 0,
      maxLife: 0.45 + Math.random() * 0.45
    })
  }

  spawnFoam(x, y, intensity, speedSign) {
    this.particles.push({
      type: 'foam',
      x: x + speedSign * (Math.random() * 18 - 6),
      y: y + (Math.random() - 0.5) * 6,
      vx: -speedSign * (10 + Math.random() * 40),
      vy: -6 - Math.random() * 14,
      radius: 2.2 + Math.random() * 3.4,
      life: 0,
      maxLife: 0.5 + Math.random() * 0.5
    })
  }

  spawnBubble(x, y) {
    this.particles.push({
      type: 'bubble',
      x,
      y: y + (Math.random() - 0.5) * 8,
      vy: -(26 + Math.random() * 42),
      radius: 1.6 + Math.random() * 3.2,
      // 摆动参数：气泡上升时左右摇曳
      wobbleAmp: 6 + Math.random() * 12,
      wobbleFreq: 2 + Math.random() * 3,
      phase: Math.random() * Math.PI * 2,
      originX: x,
      life: 0,
      maxLife: 1.4 + Math.random() * 1.2
    })
  }

  spawnRipple(x, y) {
    this.particles.push({
      type: 'ripple',
      x,
      y,
      radius: 6,
      growSpeed: 34 + Math.random() * 22,
      life: 0,
      maxLife: 1.5
    })
  }

  /**
   * 推进物理。frozen 为 true 时完全冻结（传送带暂停时整个画面静止）。
   */
  update(dt, frozen) {
    if (frozen || dt <= 0) return
    this.time += dt

    let writeIndex = 0
    for (const p of this.particles) {
      p.life += dt
      let dead = p.life >= p.maxLife

      if (!dead) {
        switch (p.type) {
          case 'droplet':
            p.vy += 1500 * dt
            p.x += p.vx * dt
            p.y += p.vy * dt
            // 下落阶段越过发射水面：入水消亡
            if (p.vy > 0 && p.y >= p.waterY) dead = true
            break
          case 'foam':
            p.x += p.vx * dt
            p.y += p.vy * dt
            p.vx *= Math.pow(0.4, dt)
            break
          case 'bubble': {
            p.y += p.vy * dt
            // 用正弦摆动模拟气泡摇曳上升
            p.phase += p.wobbleFreq * dt
            p.x = p.originX + Math.sin(p.phase) * p.wobbleAmp
            break
          }
          case 'ripple':
            p.radius += p.growSpeed * dt
            break
        }
      }

      if (!dead) this.particles[writeIndex++] = p
    }
    this.particles.length = writeIndex
  }

  /** 绘制所有粒子。ctx 已按 DPR 缩放，坐标使用 CSS 像素。 */
  draw(ctx) {
    ctx.save()
    for (const p of this.particles) {
      const t = p.life / p.maxLife
      switch (p.type) {
        case 'droplet': {
          // 前 15% 渐显，之后线性淡出
          const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85
          ctx.globalAlpha = alpha * 0.9
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.fill()
          break
        }
        case 'foam': {
          const alpha = 1 - t
          ctx.globalAlpha = alpha * 0.75
          ctx.fillStyle = 'rgba(255, 254, 248, 0.95)'
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius * (1 + t * 1.6), 0, Math.PI * 2)
          ctx.fill()
          break
        }
        case 'bubble': {
          // 快结束时快速收缩模拟破裂
          const shrink = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1
          const alpha = (t < 0.1 ? t / 0.1 : 1) * 0.65
          ctx.globalAlpha = alpha
          ctx.strokeStyle = 'rgba(229, 251, 255, 0.95)'
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(p.x, p.y, Math.max(0.4, p.radius * shrink), 0, Math.PI * 2)
          ctx.stroke()
          // 高光点让气泡更通透
          ctx.globalAlpha = alpha * 0.9
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(p.x - p.radius * 0.35, p.y - p.radius * 0.35, Math.max(0.3, p.radius * 0.28 * shrink), 0, Math.PI * 2)
          ctx.fill()
          break
        }
        case 'ripple': {
          const alpha = (1 - t) * 0.5
          ctx.globalAlpha = alpha
          ctx.strokeStyle = 'rgba(255, 254, 248, 0.9)'
          ctx.lineWidth = 2 * (1 - t) + 0.5
          ctx.beginPath()
          // 扁椭圆更贴近水面视角
          ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.32, 0, 0, Math.PI * 2)
          ctx.stroke()
          break
        }
      }
    }
    ctx.restore()
  }
}
