(() => {
  'use strict'

  const CANVAS = { width: 3840, height: 1080 }
  const VIEW_WIDTH = { full: 3840, center: 1920 }

  // Initial centerline fit follows the generated conveyor's visible belt surface.
  // The stage is vertically scaled to 84% around the canvas center to preserve the bottom UI zone.
  const stageScale = 0.84
  const stageOffsetY = CANVAS.height * (1 - stageScale) / 2
  const stagePoint = (x, y) => ({ x, y: stageOffsetY + y * stageScale })
  // Sampled from the shared rear/surface mask contours, then mapped through the vertical stage scale.
  const controlPoints = [
    stagePoint(-340, 350),
    stagePoint(0, 380),
    stagePoint(247, 416),
    stagePoint(548, 448),
    stagePoint(902, 473),
    stagePoint(1273, 491),
    stagePoint(1591, 502),
    stagePoint(1919, 510),
    stagePoint(2244, 502),
    stagePoint(2559, 491),
    stagePoint(2931, 473),
    stagePoint(3288, 448),
    stagePoint(3590, 416),
    stagePoint(3840, 380),
    stagePoint(4170, 350)
  ]
  const DISH_COUNT = 6
  const PLATE_RATIO = 210 / 340
  const SAMPLES_PER_SEGMENT = 48

  const host = document.querySelector('#viewport-host')
  const frame = document.querySelector('#viewport-frame')
  const canvas = document.querySelector('#scene-canvas')
  const platesRoot = document.querySelector('#moving-plates')
  const routePath = document.querySelector('#route-path')
  const controlPointRoot = document.querySelector('#control-points')
  const showGuides = document.querySelector('#show-guides')
  const backdropButtons = [...document.querySelectorAll('[data-backdrop]')]
  const layerView = document.querySelector('#layer-view')
  const showConveyorFront = document.querySelector('#show-conveyor-front')
  const reducedToggle = document.querySelector('#simulate-reduced-motion')
  const motionToggle = document.querySelector('#motion-toggle')
  const directionToggle = document.querySelector('#direction-toggle')
  const speedRange = document.querySelector('#speed-range')
  const speedValue = document.querySelector('#speed-value')
  const plateSizeRange = document.querySelector('#plate-size-range')
  const plateSizeValue = document.querySelector('#plate-size-value')
  const businessOverlay = document.querySelector('#business-overlay')
  const zoomValue = document.querySelector('#zoom-value')
  const focusButtons = [...document.querySelectorAll('[data-focus]')]
  const resetButton = document.querySelector('#reset-motion')
  const status = document.querySelector('#live-status')
  const caption = document.querySelector('#view-caption')
  const viewButtons = [...document.querySelectorAll('[data-view]')]
  const reduceMedia = window.matchMedia('(prefers-reduced-motion: reduce)')

  let viewMode = 'full'
  let backdropMode = 'production'
  let plateWidth = Number(plateSizeRange.value)
  let zoom = 1
  let panX = -1320
  let panY = -210
  let activeScale = 1
  let dragging = false
  let lastPointer = null
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
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
      title.textContent = `餐台缩放后的带面中心线试拟合：画布 (${Math.round(point.x)}, ${Math.round(point.y)}) px`
      circle.append(title)
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
      plate.setAttribute('aria-label', `测试餐盘 ${index + 1}；${plateWidth}×${Math.round(plateWidth * PLATE_RATIO)} 逻辑像素；调试形状，点击用于验证移动热区`)
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
    platesRoot.dataset.pathLength = pathLength.toFixed(1)
    platesRoot.dataset.spacing = spacing.toFixed(1)
    routePath.dataset.pathLength = pathLength.toFixed(1)
    plates.forEach((plate, index) => {
      const rawDistance = phase + index * spacing
      const distance = ((rawDistance % pathLength) + pathLength) % pathLength
      const point = pointAtDistance(distance)
      const tilt = Math.max(-1.2, Math.min(1.2, point.angle * 180 / Math.PI * 0.08))
      const centerDepth = Math.max(0, 1 - Math.abs(point.x - 1920) / 1920)
      const scale = 0.94 + centerDepth * 0.08
      const plateHeight = Math.round(plateWidth * PLATE_RATIO)
      plate.style.width = `${plateWidth}px`
      plate.style.height = `${plateHeight}px`
      plate.style.left = `${point.x}px`
      plate.style.top = `${point.y}px`
      plate.style.zIndex = String(100 + Math.round(point.y * 10))
      plate.style.transform = `translate(-50%, -52%) rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(3)})`
      plate.dataset.position = `${point.x.toFixed(1)},${point.y.toFixed(1)}`
      plate.dataset.logicalWidth = String(plateWidth)
      plate.dataset.logicalHeight = String(plateHeight)
      plate.dataset.spacing = spacing.toFixed(1)
      plate.setAttribute('aria-label', `测试餐盘 ${index + 1}；${plateWidth}×${plateHeight} 逻辑像素；调试形状，点击用于验证移动热区`)
    })
  }

  const updateViewport = () => {
    const logicalWidth = VIEW_WIDTH[viewMode] || CANVAS.width
    const localMode = viewMode === 'local'
    const centerOffset = viewMode === 'center' ? (CANVAS.width - logicalWidth) / 2 : 0
    const availableWidth = Math.max(320, window.innerWidth - 32)
    const availableHeight = Math.max(250, window.innerHeight - document.querySelector('.prototype-header').getBoundingClientRect().height - 150)
    const localWidth = Math.min(1440, availableWidth)
    const localHeight = Math.min(760, availableHeight)
    const scale = localMode ? zoom : Math.min(availableWidth / logicalWidth, availableHeight / CANVAS.height, 1)
    const renderedWidth = localMode ? localWidth : logicalWidth * scale
    const renderedHeight = localMode ? localHeight : CANVAS.height * scale

    host.style.width = `${renderedWidth}px`
    host.style.height = `${renderedHeight}px`
    frame.style.width = `${renderedWidth}px`
    frame.style.height = `${renderedHeight}px`
    canvas.style.left = localMode ? `${panX * scale}px` : `${-centerOffset * scale}px`
    canvas.style.top = localMode ? `${panY * scale}px` : '0px'
    canvas.style.transform = `scale(${scale})`
    host.classList.toggle('view-center', viewMode === 'center')
    host.classList.toggle('view-business', viewMode === 'business')
    host.classList.toggle('view-local', localMode)
    canvas.classList.toggle('guides-hidden', !showGuides.checked)
    canvas.classList.toggle('backdrop-reference', backdropMode === 'reference')
    canvas.classList.toggle('front-hidden', !showConveyorFront.checked)
    canvas.classList.remove('layer-view--background', 'layer-view--rear', 'layer-view--surface', 'layer-view--front')
    if (layerView.value !== 'composite') canvas.classList.add(`layer-view--${layerView.value}`)
    activeScale = scale
    zoomValue.textContent = `${Math.round(scale * 100)}%`
    const layerNames = { composite: '完整合成', background: '单看母背景', rear: '单看餐台后沿', surface: '单看传送带面', front: '单看餐台前缘' }
    const backdropName = backdropMode === 'reference' ? '原始参考' : '正式背景'
    caption.textContent = (viewMode === 'full'
      ? `3840×1080 全景 · 几何固定 · 当前显示缩放 ${Math.round(scale * 100)}%`
      : viewMode === 'center'
        ? `1920×1080 中央视图 · 母版 x=960–2880 · 当前显示缩放 ${Math.round(scale * 100)}%`
        : viewMode === 'business'
          ? `3840×1080 全景业务布局对照 · 底部三栏按 /display DOM 实测坐标 · 显示缩放 ${Math.round(scale * 100)}%`
          : `局部查看 · 场景逻辑像素缩放 ${Math.round(scale * 100)}% · 100% 表示 1 CSS px = 1 逻辑 px · 拖动画布平移`) + ` · ${backdropName} · ${layerNames[layerView.value]}`
    viewButtons.forEach((button) => {
      const active = button.dataset.view === viewMode
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-pressed', String(active))
    })
    backdropButtons.forEach((button) => {
      const active = button.dataset.backdrop === backdropMode
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-pressed', String(active))
    })
    canvas.classList.toggle('business-hidden', !businessOverlay.checked || (viewMode !== 'business' && viewMode !== 'full' && viewMode !== 'center'))
  }

  const effectiveReducedMotion = () => simulateReducedMotion || reduceMedia.matches
  const updateMotionControls = () => {
    motionToggle.textContent = paused ? '继续' : '暂停'
    motionToggle.setAttribute('aria-pressed', String(paused))
    directionToggle.textContent = direction > 0 ? '方向：左 → 右' : '方向：右 → 左'
    speedValue.value = String(speed)
    speedValue.textContent = String(speed)
    const plateHeight = Math.round(plateWidth * PLATE_RATIO)
    plateSizeValue.value = `${plateWidth}×${plateHeight}`
    plateSizeValue.textContent = `${plateWidth}×${plateHeight}`
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
  backdropButtons.forEach((button) => button.addEventListener('click', () => {
    backdropMode = button.dataset.backdrop
    updateViewport()
  }))
  layerView.addEventListener('change', updateViewport)
  showConveyorFront.addEventListener('change', updateViewport)
  showGuides.addEventListener('change', () => canvas.classList.toggle('guides-hidden', !showGuides.checked))
  businessOverlay.addEventListener('change', updateViewport)
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
  plateSizeRange.addEventListener('input', () => {
    plateWidth = Number(plateSizeRange.value)
    renderPlates()
    updateMotionControls()
  })
  document.querySelector('#zoom-in').addEventListener('click', () => {
    zoom = Math.min(2, Math.round((zoom + 0.1) * 10) / 10)
    viewMode = 'local'
    updateViewport()
  })
  document.querySelector('#zoom-out').addEventListener('click', () => {
    zoom = Math.max(0.25, Math.round((zoom - 0.1) * 10) / 10)
    viewMode = 'local'
    updateViewport()
  })
  focusButtons.forEach((button) => button.addEventListener('click', () => {
    viewMode = 'local'
    zoom = 1
    const targets = {
      plate: { x: 1920, y: 577 },
      curve: { x: 1920, y: 570 },
      console: { x: 1920, y: 970 }
    }
    const target = targets[button.dataset.focus]
    const width = Math.min(1440, Math.max(320, window.innerWidth - 32))
    const height = Math.min(760, Math.max(250, window.innerHeight - document.querySelector('.prototype-header').getBoundingClientRect().height - 150))
    panX = width / 2 - target.x
    panY = height / 2 - target.y
    updateViewport()
  }))
  document.querySelector('#pan-reset').addEventListener('click', () => {
    panX = -1320
    panY = -210
    updateViewport()
  })
  frame.addEventListener('pointerdown', (event) => {
    if (viewMode !== 'local' || event.target.closest('button')) return
    dragging = true
    lastPointer = { x: event.clientX, y: event.clientY }
    frame.setPointerCapture(event.pointerId)
  })
  frame.addEventListener('pointermove', (event) => {
    if (!dragging || !lastPointer) return
    panX += (event.clientX - lastPointer.x) / activeScale
    panY += (event.clientY - lastPointer.y) / activeScale
    lastPointer = { x: event.clientX, y: event.clientY }
    updateViewport()
  })
  frame.addEventListener('pointerup', () => { dragging = false; lastPointer = null })
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
    getState: () => ({ viewMode, backdropMode, layerView: layerView.value, frontVisible: showConveyorFront.checked, guidesVisible: showGuides.checked, direction, speed, paused, reducedMotion: effectiveReducedMotion(), phase }),
    getPlatePositions: () => [...platesRoot.children].map((plate) => plate.dataset.position),
    stop: () => window.cancelAnimationFrame(frameId)
  }
})()
