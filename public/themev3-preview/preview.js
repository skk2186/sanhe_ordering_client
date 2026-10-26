(() => {
  'use strict'

  const CANVAS = { width: 3840, height: 1080 }
  const VIEW_WIDTH = { full: 3840, center: 1920 }

  // Control points are the source image's plate-center lane mapped uniformly
  // from 2048x768 into a centered 2880x1080 image. Endpoints extend off-screen.
  const controlPoints = [
    { x: -240, y: 557 },
    { x: 480, y: 548 },
    { x: 900, y: 545 },
    { x: 1320, y: 556 },
    { x: 1740, y: 570 },
    { x: 2160, y: 571 },
    { x: 2580, y: 558 },
    { x: 3000, y: 543 },
    { x: 3360, y: 534 },
    { x: 4080, y: 515 }
  ]
  const DISH_COUNT = 8
  const SAMPLES_PER_SEGMENT = 48

  const host = document.querySelector('#viewport-host')
  const frame = document.querySelector('#viewport-frame')
  const canvas = document.querySelector('#scene-canvas')
  const platesRoot = document.querySelector('#moving-plates')
  const routePath = document.querySelector('#route-path')
  const controlPointRoot = document.querySelector('#control-points')
  const showGuides = document.querySelector('#show-guides')
  const reducedToggle = document.querySelector('#simulate-reduced-motion')
  const motionToggle = document.querySelector('#motion-toggle')
  const directionToggle = document.querySelector('#direction-toggle')
  const speedRange = document.querySelector('#speed-range')
  const speedValue = document.querySelector('#speed-value')
  const resetButton = document.querySelector('#reset-motion')
  const status = document.querySelector('#live-status')
  const caption = document.querySelector('#view-caption')
  const viewButtons = [...document.querySelectorAll('[data-view]')]
  const reduceMedia = window.matchMedia('(prefers-reduced-motion: reduce)')

  let viewMode = 'full'
  let direction = 1
  let speed = Number(speedRange.value)
  let paused = reduceMedia.matches
  let simulateReducedMotion = false
  let phase = 0
  let lastFrame = 0
  let frameId = 0
  let pathSamples = []
  let pathLength = 0

  const catmullPoint = (p0, p1, p2, p3, t) => {
    const t2 = t * t
    const t3 = t2 * t
    const component = (key) => 0.5 * (
      (2 * p1[key]) + (-p0[key] + p2[key]) * t +
      (2 * p0[key] - 5 * p1[key] + 4 * p2[key] - p3[key]) * t2 +
      (-p0[key] + 3 * p1[key] - 3 * p2[key] + p3[key]) * t3
    )
    return { x: component('x'), y: component('y') }
  }

  const buildPathSamples = () => {
    pathSamples = []
    pathLength = 0
    for (let index = 0; index < controlPoints.length - 1; index += 1) {
      const p0 = controlPoints[Math.max(0, index - 1)]
      const p1 = controlPoints[index]
      const p2 = controlPoints[index + 1]
      const p3 = controlPoints[Math.min(controlPoints.length - 1, index + 2)]
      for (let sampleIndex = index === 0 ? 0 : 1; sampleIndex <= SAMPLES_PER_SEGMENT; sampleIndex += 1) {
        const t = sampleIndex / SAMPLES_PER_SEGMENT
        const point = catmullPoint(p0, p1, p2, p3, t)
        const previous = pathSamples[pathSamples.length - 1]
        pathLength += previous ? Math.hypot(point.x - previous.x, point.y - previous.y) : 0
        pathSamples.push({ ...point, distance: pathLength })
      }
    }
  }

  const pointAtDistance = (distance) => {
    const target = Math.max(0, Math.min(pathLength, distance))
    let low = 0
    let high = pathSamples.length - 1
    while (low < high) {
      const middle = (low + high) >> 1
      if (pathSamples[middle].distance < target) low = middle + 1
      else high = middle
    }
    const current = pathSamples[low]
    const previous = pathSamples[Math.max(0, low - 1)]
    const segmentLength = current.distance - previous.distance
    const ratio = segmentLength ? (target - previous.distance) / segmentLength : 0
    const angle = Math.atan2(current.y - previous.y, current.x - previous.x)
    return {
      x: previous.x + (current.x - previous.x) * ratio,
      y: previous.y + (current.y - previous.y) * ratio,
      angle
    }
  }

  const drawRoute = () => {
    const pathParts = []
    for (let distance = 0; distance <= pathLength; distance += 18) {
      const point = pointAtDistance(distance)
      pathParts.push(`${distance === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    }
    const end = pointAtDistance(pathLength)
    pathParts.push(`L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`)
    routePath.setAttribute('d', pathParts.join(' '))

    controlPointRoot.replaceChildren()
    controlPoints.forEach((point, index) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', point.x)
      circle.setAttribute('cy', point.y)
      circle.setAttribute('r', '8')
      circle.setAttribute('class', 'route-point')
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      label.setAttribute('x', point.x + 10)
      label.setAttribute('y', point.y - 12)
      label.setAttribute('class', 'route-label')
      label.textContent = `P${index + 1} (${Math.round(point.x)}, ${Math.round(point.y)})`
      controlPointRoot.append(circle, label)
    })
  }

  const createPlates = () => {
    platesRoot.replaceChildren()
    for (let index = 0; index < DISH_COUNT; index += 1) {
      const plate = document.createElement('button')
      plate.type = 'button'
      plate.className = 'debug-plate'
      plate.dataset.plateIndex = String(index + 1)
      plate.setAttribute('aria-label', `测试餐盘 ${index + 1}；调试形状，点击用于验证移动热区`)
      plate.title = '点击热区跟随移动；本按钮不接触任何菜单或订单数据'
      plate.addEventListener('click', () => {
        plate.classList.add('is-clicked')
        status.textContent = `已点中移动测试盘 ${index + 1} · 热区与该主体同一 DOM 节点，无业务数据。`
        window.setTimeout(() => plate.classList.remove('is-clicked'), 600)
      })
      platesRoot.append(plate)
    }
  }

  const renderPlates = () => {
    const plates = [...platesRoot.children]
    const spacing = pathLength / plates.length
    plates.forEach((plate, index) => {
      const rawDistance = phase + index * spacing
      const distance = ((rawDistance % pathLength) + pathLength) % pathLength
      const point = pointAtDistance(distance)
      const tilt = Math.max(-2.5, Math.min(2.5, point.angle * 180 / Math.PI))
      const scale = 0.96 + Math.max(0, point.y - 535) / 1000
      plate.style.left = `${point.x}px`
      plate.style.top = `${point.y}px`
      plate.style.zIndex = String(100 + Math.round(point.y))
      plate.style.transform = `translate(-50%, -52%) rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(3)})`
      plate.dataset.position = `${point.x.toFixed(1)},${point.y.toFixed(1)}`
    })
  }

  const updateViewport = () => {
    const logicalWidth = VIEW_WIDTH[viewMode]
    const centerOffset = viewMode === 'center' ? (CANVAS.width - logicalWidth) / 2 : 0
    const availableWidth = Math.max(320, window.innerWidth - 32)
    const availableHeight = Math.max(250, window.innerHeight - document.querySelector('.prototype-header').getBoundingClientRect().height - 150)
    const scale = Math.min(availableWidth / logicalWidth, availableHeight / CANVAS.height, 1)
    const renderedWidth = logicalWidth * scale
    const renderedHeight = CANVAS.height * scale

    host.style.width = `${renderedWidth}px`
    host.style.height = `${renderedHeight}px`
    frame.style.width = `${renderedWidth}px`
    frame.style.height = `${renderedHeight}px`
    canvas.style.left = `${-centerOffset}px`
    canvas.style.transform = `scale(${scale})`
    host.classList.toggle('view-center', viewMode === 'center')
    caption.textContent = viewMode === 'full'
      ? `3840×1080 母版全景 · 当前浏览器按可用空间等比缩放显示 · 原图不裁切`
      : `1920×1080 中央视图 · 显示母版 x=960–2880 · 等比 1:1 内容裁窗，原图不拉伸`
    viewButtons.forEach((button) => {
      const active = button.dataset.view === viewMode
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-pressed', String(active))
    })
  }

  const effectiveReducedMotion = () => simulateReducedMotion || reduceMedia.matches
  const updateMotionControls = () => {
    motionToggle.textContent = paused ? '继续' : '暂停'
    motionToggle.setAttribute('aria-pressed', String(paused))
    directionToggle.textContent = direction > 0 ? '方向：左 → 右' : '方向：右 → 左'
    speedValue.value = String(speed)
    speedValue.textContent = String(speed)
    canvas.classList.toggle('is-reduced-motion', effectiveReducedMotion())
    const reduceNotice = effectiveReducedMotion() ? ' 减少动态模式：自动运动已停，盘子静态分布。' : ''
    status.textContent = `${paused ? '已暂停' : '运行中'} · ${direction > 0 ? '左→右' : '右→左'} · ${speed} px/s${reduceNotice}`
  }

  const tick = (time) => {
    frameId = window.requestAnimationFrame(tick)
    if (!lastFrame) lastFrame = time
    const delta = Math.min(100, Math.max(0, time - lastFrame))
    lastFrame = time
    if (!paused && !effectiveReducedMotion()) {
      phase = ((phase + direction * speed * delta / 1000) % pathLength + pathLength) % pathLength
    }
    renderPlates()
  }

  viewButtons.forEach((button) => button.addEventListener('click', () => {
    viewMode = button.dataset.view
    updateViewport()
  }))
  showGuides.addEventListener('change', () => canvas.classList.toggle('guides-hidden', !showGuides.checked))
  reducedToggle.addEventListener('change', () => {
    simulateReducedMotion = reducedToggle.checked
    updateMotionControls()
  })
  motionToggle.addEventListener('click', () => {
    paused = !paused
    updateMotionControls()
  })
  directionToggle.addEventListener('click', () => {
    direction *= -1
    updateMotionControls()
  })
  speedRange.addEventListener('input', () => {
    speed = Number(speedRange.value)
    updateMotionControls()
  })
  resetButton.addEventListener('click', () => {
    phase = 0
    renderPlates()
    status.textContent = '位置已重置：第一只测试盘从左侧画布外进入。'
  })
  window.addEventListener('resize', updateViewport)
  reduceMedia.addEventListener?.('change', updateMotionControls)

  buildPathSamples()
  drawRoute()
  createPlates()
  renderPlates()
  updateViewport()
  updateMotionControls()
  frameId = window.requestAnimationFrame(tick)

  window.themeV3Preview = {
    canvas: CANVAS,
    controlPoints,
    getPathLength: () => pathLength,
    getState: () => ({ viewMode, direction, speed, paused, reducedMotion: effectiveReducedMotion(), phase }),
    getPlatePositions: () => [...platesRoot.children].map((plate) => plate.dataset.position),
    stop: () => window.cancelAnimationFrame(frameId)
  }
})()
