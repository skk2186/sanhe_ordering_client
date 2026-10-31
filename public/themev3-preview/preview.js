(() => {
  'use strict'

  const CANVAS = { width: 3840, height: 1080 }
  const VIEW_WIDTH = { full: 3840, center: 1920 }

  // The nine measured centers follow the reference image's plate contact lane:
  // source y rises toward the center (closer to the guest), then recedes at both ends.
  // Mapping is x=480+sourceX*1.40625, y=sourceY*1.40625. Endpoints are offscreen.
  const controlPoints = [
    { x: -340, y: 552 },
    { x: 480, y: 547, sourceX: 0, sourceY: 389 },
    { x: 840, y: 537, sourceX: 256, sourceY: 382 },
    { x: 1200, y: 546, sourceX: 512, sourceY: 388 },
    { x: 1560, y: 563, sourceX: 768, sourceY: 400 },
    { x: 1920, y: 577, sourceX: 1024, sourceY: 410 },
    { x: 2280, y: 565, sourceX: 1280, sourceY: 402 },
    { x: 2640, y: 548, sourceX: 1536, sourceY: 390 },
    { x: 3000, y: 537, sourceX: 1792, sourceY: 382 },
    { x: 3360, y: 529, sourceX: 2048, sourceY: 376 },
    { x: 4170, y: 520 }
  ]
  const SIGN_WIDTH = 252
  const MOCK_PRODUCTS = [
    { id: 'mock-salmon', name: '炙烧三文鱼腹肉握寿司', price: 32, available: true, recommended: true },
    { id: 'mock-scallop', name: '北海道生食级帆立贝双贯寿司', price: 58.5, available: true, recommended: false },
    { id: 'mock-seasonal', name: '樱花季限定海鲜拼盘（特选组合）', price: 88, available: false, status: 'OFF_SHELF', recommended: false },
    { id: 'mock-egg', name: '玉子烧', price: 12, available: true, recommended: true }
  ]
  const PLATE_RATIO = 210 / 340
  const SAMPLES_PER_SEGMENT = 48
  const CAT_STATIONS = [
    {
      id: 'cat01', name: '切菜猫', image: '../images/ui/sakura-cat-sushi/cats/cat01-cut-approved.png',
      x: 600, y: 585, scale: 0.30, z: 22,
      note: '切菜猫工作组顺时针 6°，砧板前缘与左桌面长边平行，四脚落在桌面内。'
    },
    {
      id: 'cat02', name: '摆盘猫', image: '../images/ui/sakura-cat-sushi/cats/cat02-plate-approved.png',
      x: 1230, y: 665, scale: 0.28, z: 23,
      note: '站位靠近左台口前缘；台面可见纵深缩短，前沿遮住下身，保留双臂和寿司盘。'
    },
    {
      id: 'cat03', name: '端菜猫', image: '../images/ui/sakura-cat-sushi/cats/cat03-serve-approved.png',
      x: 2570, y: 665, scale: 0.28, z: 23,
      note: '站位靠近右台口前缘；镜像后向中央端碗，为向前递菜留出动作空间。'
    },
    {
      id: 'cat04', name: '炒菜猫', image: '../images/ui/sakura-cat-sushi/cats/cat04-cook-recessed.png',
      x: 3075, y: 595, scale: 0.29, z: 24,
      note: '锅与火压在局部嵌入式灶眼上，猫身完整站在后厨操作台后方。'
    }
  ]

  const host = document.querySelector('#viewport-host')
  const frame = document.querySelector('#viewport-frame')
  const canvas = document.querySelector('#scene-canvas')
  const platesRoot = document.querySelector('#moving-plates')
  const catsRoot = document.querySelector('#static-cats')
  const catGuidesRoot = document.querySelector('#cat-placement-guides')
  const catAdjustments = document.querySelector('#cat-adjustments')
  const catAdjustmentPanel = document.querySelector('#cat-adjustment-panel')
  const cleanSceneImage = document.querySelector('#clean-scene-reference')
  const cleanSceneStatus = document.querySelector('#clean-scene-status')
  const interimBackground = document.querySelector('#interim-background')
  const occluderImages = [...document.querySelectorAll('.workstation-occluder img')]
  const routePath = document.querySelector('#route-path')
  const controlPointRoot = document.querySelector('#control-points')
  const showGuides = document.querySelector('#show-guides')
  const sceneModeButtons = [...document.querySelectorAll('[data-scene-mode]')]
  const reducedToggle = document.querySelector('#simulate-reduced-motion')
  const motionToggle = document.querySelector('#motion-toggle')
  const directionToggle = document.querySelector('#direction-toggle')
  const speedRange = document.querySelector('#speed-range')
  const speedValue = document.querySelector('#speed-value')
  const plateSizeRange = document.querySelector('#plate-size-range')
  const plateSizeValue = document.querySelector('#plate-size-value')
  const signGapRange = document.querySelector('#sign-gap-range')
  const signGapValue = document.querySelector('#sign-gap-value')
  const unitMetrics = document.querySelector('#unit-metrics')
  const businessOverlay = document.querySelector('#business-overlay')
  const illustratedConsole = document.querySelector('.illustrated-console')
  const zoomValue = document.querySelector('#zoom-value')
  const focusButtons = [...document.querySelectorAll('[data-focus]')]
  const resetButton = document.querySelector('#reset-motion')
  const status = document.querySelector('#live-status')
  const caption = document.querySelector('#view-caption')
  const viewButtons = [...document.querySelectorAll('[data-view]')]
  const reduceMedia = window.matchMedia('(prefers-reduced-motion: reduce)')

  let viewMode = 'full'
  let sceneMode = 'composite'
  let plateWidth = Number(plateSizeRange.value)
  let signGap = Number(signGapRange.value)
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
  const catState = new Map(CAT_STATIONS.map((cat) => [cat.id, { ...cat, visible: true }]))

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
      if (Number.isFinite(point.sourceX)) {
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
        title.textContent = `原图盘心估测 (${point.sourceX}, ${point.sourceY}) → 3840 母版 (${Math.round(point.x)}, ${Math.round(point.y)}) px`
        circle.append(title)
      }
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
    MOCK_PRODUCTS.forEach((product) => {
      const unit = document.createElement('button')
      unit.type = 'button'
      unit.className = 'debug-unit'
      unit.dataset.productId = product.id
      unit.dataset.eventSemantic = 'dish-click'
      unit.setAttribute('aria-label', `${product.name}，价格 ${product.price} 元，${product.available ? '在售' : '售罄'}${product.recommended ? '，推荐' : ''}。餐盘与调试牌匾组合，按 Enter 或空格触发 dish-click。`)
      unit.title = '调试热区覆盖餐盘和牌匾；触发 dish-click mock 事件，不连接真实订单接口。'

      const plate = document.createElement('span')
      plate.className = 'debug-unit__plate'
      plate.setAttribute('aria-hidden', 'true')

      const sign = document.createElement('span')
      sign.className = 'debug-sign'
      sign.setAttribute('aria-hidden', 'true')
      const signTag = document.createElement('span')
      signTag.className = 'debug-sign__tag'
      signTag.textContent = '调试木牌 · 非正式素材'
      const name = document.createElement('span')
      name.className = 'debug-sign__name'
      name.textContent = product.name
      name.title = product.name
      const footer = document.createElement('span')
      footer.className = 'debug-sign__footer'
      const price = document.createElement('span')
      price.className = 'debug-sign__price'
      price.textContent = `¥${Number.isInteger(product.price) ? product.price : product.price.toFixed(2)}`
      const state = document.createElement('span')
      state.className = 'debug-sign__state'
      state.textContent = !product.available || product.status === 'OFF_SHELF'
        ? '售罄'
        : product.recommended ? '推荐' : 'mock'
      footer.append(price, state)
      sign.append(signTag, name, footer)
      unit.append(plate, sign)
      unit.classList.toggle('is-recommended', product.recommended)
      unit.classList.toggle('is-sold-out', !product.available || product.status === 'OFF_SHELF')
      unit.addEventListener('click', (originalEvent) => {
        const clickX = originalEvent.clientX || window.innerWidth / 2
        const side = clickX < window.innerWidth / 2 ? 'left' : 'right'
        unit.dispatchEvent(new CustomEvent('dish-click', {
          bubbles: true,
          detail: { item: product, originalEvent, side }
        }))
      })
      platesRoot.append(unit)
    })
  }

  const addCatRange = (card, cat, prop, label, min, max, step, digits = 0) => {
    const row = document.createElement('label')
    row.className = 'cat-control-row'
    const title = document.createElement('span')
    title.textContent = label
    const input = document.createElement('input')
    input.type = 'range'
    input.min = String(min)
    input.max = String(max)
    input.step = String(step)
    input.value = String(cat[prop])
    input.setAttribute('aria-label', `${cat.name} ${label}`)
    const output = document.createElement('output')
    output.value = Number(cat[prop]).toFixed(digits)
    output.textContent = output.value
    input.addEventListener('input', () => {
      const current = catState.get(cat.id)
      current[prop] = Number(input.value)
      output.value = Number(input.value).toFixed(digits)
      output.textContent = output.value
      renderCats()
    })
    row.append(title, input, output)
    card.append(row)
  }

  const createCats = () => {
    catsRoot.replaceChildren()
    catGuidesRoot.replaceChildren()
    catAdjustments.replaceChildren()
    CAT_STATIONS.forEach((station) => {
      const cat = catState.get(station.id)
      const image = document.createElement('img')
      image.className = `static-cat static-cat--${cat.id}`
      image.dataset.catId = cat.id
      image.src = cat.image
      image.alt = `${cat.name}静态角色素材，1122×1402透明 PNG；当前手臂与道具未拆分。`
      image.draggable = false
      image.title = cat.note
      catsRoot.append(image)

      const guide = document.createElement('div')
      guide.className = 'cat-placement-guide'
      guide.dataset.catId = cat.id
      const guideLabel = document.createElement('span')
      guideLabel.className = 'cat-placement-guide__label'
      const anchor = document.createElement('span')
      anchor.className = 'cat-placement-guide__anchor'
      guide.append(guideLabel, anchor)
      catGuidesRoot.append(guide)

      const card = document.createElement('fieldset')
      card.className = 'cat-adjustment-card'
      const legend = document.createElement('legend')
      legend.textContent = `${cat.name} · 静态`
      card.append(legend)
      const note = document.createElement('p')
      note.className = 'cat-role-note'
      note.textContent = cat.note
      card.append(note)
      addCatRange(card, cat, 'x', 'X 脚底锚点', 300, 3540, 10)
      addCatRange(card, cat, 'y', 'Y 脚底锚点', 120, 820, 5)
      addCatRange(card, cat, 'scale', '缩放', 0.15, 0.38, 0.01, 2)
      addCatRange(card, cat, 'z', '层级', 18, 40, 1)
      const visibleLabel = document.createElement('label')
      visibleLabel.className = 'cat-visible-control'
      const visibleInput = document.createElement('input')
      visibleInput.type = 'checkbox'
      visibleInput.checked = true
      visibleInput.setAttribute('aria-label', `显示${cat.name}`)
      visibleInput.addEventListener('change', () => {
        cat.visible = visibleInput.checked
        renderCats()
      })
      visibleLabel.append(visibleInput, document.createTextNode(`显示${cat.name}`))
      card.append(visibleLabel)
      catAdjustments.append(card)
    })
    renderCats()
  }

  const renderCats = () => {
    CAT_STATIONS.forEach((station) => {
      const cat = catState.get(station.id)
      const { x, y, scale } = cat
      const image = catsRoot.querySelector(`[data-cat-id="${cat.id}"]`)
      const guide = catGuidesRoot.querySelector(`[data-cat-id="${cat.id}"]`)
      const width = 1122 * scale
      const height = 1402 * scale
      image.style.left = `${x}px`
      image.style.top = `${y}px`
      image.style.width = `${width}px`
      image.style.zIndex = String(cat.z)
      image.style.transform = cat.id === 'cat01'
        ? 'translate(-50%, -100%) rotate(6deg)'
        : cat.id === 'cat03'
          ? 'translate(-50%, -100%) scaleX(-1)'
          : 'translate(-50%, -100%)'
      image.hidden = !cat.visible
      guide.style.left = `${x}px`
      guide.style.top = `${y}px`
      guide.style.width = `${width}px`
      guide.style.height = `${height}px`
      guide.style.zIndex = String(cat.z + 10)
      guide.hidden = !cat.visible
      guide.firstElementChild.textContent = `${cat.name} · ${x}, ${y} · ${Math.round(height)}px高 · z${cat.z}`
    })
  }

  platesRoot.addEventListener('dish-click', (event) => {
    const { item, side } = event.detail
    const unit = event.target
    platesRoot.querySelectorAll('.debug-unit.is-selected').forEach((selected) => selected.classList.remove('is-selected'))
    unit.classList.add('is-selected')
    if (!item.available || item.status === 'OFF_SHELF') {
      status.textContent = `dish-click → handleSushiClick(${item.id})：售罄提示；未加入购物盘（mock）。`
      return
    }
    status.textContent = `dish-click → handleSushiClick(${item.id})：测试加入${side === 'left' ? '左' : '右'}购物盘；mock only，未调用下单接口。`
  })

  const renderPlates = () => {
    const plates = [...platesRoot.children]
    const spacing = pathLength / plates.length
    const plateHeight = Math.round(plateWidth * PLATE_RATIO)
    const unitWidth = plateWidth + signGap + SIGN_WIDTH
    const maxUnitWidth = 380 + 64 + SIGN_WIDTH
    platesRoot.dataset.pathLength = pathLength.toFixed(1)
    platesRoot.dataset.spacing = spacing.toFixed(1)
    platesRoot.dataset.unitWidth = String(unitWidth)
    routePath.dataset.pathLength = pathLength.toFixed(1)
    unitMetrics.textContent = sceneMode === 'cats'
      ? '4 张透明静态角色 · 底图 2172×724（3:1）等比显示为 3240×1080 · 左右各留 300px'
      : `${plates.length} 个同步运动单元 · 弧长间距 ${Math.round(spacing)}px · 当前组合宽度 ${unitWidth}px · 当前净距约 ${Math.round(spacing - unitWidth)}px · 最大规格 ${maxUnitWidth}px 时仍不重叠`
    plates.forEach((plate, index) => {
      const rawDistance = phase + index * spacing
      const distance = ((rawDistance % pathLength) + pathLength) % pathLength
      const point = pointAtDistance(distance)
      const tilt = Math.max(-1.2, Math.min(1.2, point.angle * 180 / Math.PI * 0.08))
      const centerDepth = Math.max(0, 1 - Math.abs(point.x - 1920) / 1920)
      const scale = 0.94 + centerDepth * 0.08
      plate.style.width = `${unitWidth}px`
      plate.style.height = `${plateHeight}px`
      plate.style.left = `${point.x}px`
      plate.style.top = `${point.y}px`
      plate.style.zIndex = String(100 + Math.round(point.y * 10))
      plate.style.setProperty('--plate-width', `${plateWidth}px`)
      plate.style.setProperty('--plate-height', `${plateHeight}px`)
      plate.style.setProperty('--plate-pivot', `${plateWidth / 2}px`)
      plate.style.setProperty('--sign-gap', `${signGap}px`)
      plate.style.setProperty('--sign-width', `${SIGN_WIDTH}px`)
      plate.style.transform = `translate(${-plateWidth / 2}px, -50%) rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(3)})`
      plate.dataset.position = `${point.x.toFixed(1)},${point.y.toFixed(1)}`
      plate.dataset.logicalWidth = String(plateWidth)
      plate.dataset.logicalHeight = String(plateHeight)
      plate.dataset.spacing = spacing.toFixed(1)
      plate.dataset.unitWidth = String(unitWidth)
      plate.dataset.productName = MOCK_PRODUCTS[index].name
      plate.setAttribute('aria-label', `${MOCK_PRODUCTS[index].name}，${plateWidth}×${plateHeight} 餐盘 + ${signGap}px 间距 + ${SIGN_WIDTH}px 调试牌匾；点击或按键触发 dish-click`)
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
    canvas.classList.toggle('scene-mode-confirmed', sceneMode === 'confirmed')
    canvas.classList.toggle('scene-mode-background', sceneMode === 'background')
    canvas.classList.toggle('scene-mode-unit', sceneMode === 'unit')
    canvas.classList.toggle('scene-mode-cats', sceneMode === 'cats')
    canvas.classList.toggle('scene-mode-console', sceneMode === 'console')
    canvas.classList.toggle('scene-mode-composite', sceneMode === 'composite')
    document.body.classList.toggle('cat-mode-active', sceneMode === 'cats' || sceneMode === 'composite')
    catAdjustmentPanel.hidden = sceneMode !== 'cats' && sceneMode !== 'composite'
    sceneModeButtons.forEach((button) => {
      const active = button.dataset.sceneMode === sceneMode
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-pressed', String(active))
    })
    activeScale = scale
    zoomValue.textContent = `${Math.round(scale * 100)}%`
    const sceneLabel = sceneMode === 'confirmed'
      ? '已确认构图参考'
      : sceneMode === 'background' ? '本批审批干净背景'
        : sceneMode === 'cats' ? '新版猫咪工位 + 审批背景'
          : sceneMode === 'console' ? '三组审批点餐台插画'
            : sceneMode === 'composite' ? '审批素材完整静态合成' : '中性画布 · 餐盘—牌匾运动单元调试'
    caption.textContent = viewMode === 'full'
      ? `${sceneLabel} · 3840×1080 全景 · 显示缩放 ${Math.round(scale * 100)}%`
      : viewMode === 'center'
        ? `${sceneLabel} · 1920×1080 中央视图 x=960–2880 · 显示缩放 ${Math.round(scale * 100)}%`
        : viewMode === 'business'
          ? `中性画布 · 3840×1080 全景业务布局对照 · 底部三栏按 /display DOM 实测坐标 · 显示缩放 ${Math.round(scale * 100)}%`
          : `${sceneLabel} · 局部逻辑像素缩放 ${Math.round(scale * 100)}% · 100% 表示 1 CSS px = 1 逻辑 px · 拖动画布平移`
    viewButtons.forEach((button) => {
      const active = button.dataset.view === viewMode
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-pressed', String(active))
    })
    canvas.classList.toggle('business-hidden', sceneMode !== 'unit' || !businessOverlay.checked || (viewMode !== 'business' && viewMode !== 'full' && viewMode !== 'center'))
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
    signGapValue.value = String(signGap)
    signGapValue.textContent = String(signGap)
    canvas.classList.toggle('is-reduced-motion', effectiveReducedMotion())
    if (sceneMode === 'cats' || sceneMode === 'composite') {
      status.textContent = '静态工位合成：四只审批角色按新版工作台接触线摆位；手臂与道具仍是静态图。'
      unitMetrics.textContent = `4 张 1122×1402 透明角色 · 背景：${interimBackground.checked ? '3840×1080 临时插值增强' : '2365×665 原图等比显示'} · 三组审批点餐台仅供预览`
      return
    }
    if (sceneMode === 'console') {
      status.textContent = '独立透明插画点餐台：按钮文字与点击区域由 DOM 叠加；点击仅反馈 mock 事件。'
      unitMetrics.textContent = '三张 2172×724 原图 · 各等比显示 1020×340 · 3840×1080 逻辑画布'
      return
    }
    if (sceneMode === 'background') {
      status.textContent = `本批审批干净背景：${interimBackground.checked ? '临时 3840×1080 插值增强' : '2365×665 原图等比放大'}；请用 100% 局部检查清晰度。`
      unitMetrics.textContent = '保留原始图片 · 增强图只是插值预览，不是原生 3840 高清绘画。'
      return
    }
    const reduceNotice = effectiveReducedMotion() ? ' 减少动态模式：自动运动已停，盘子静态分布。' : ''
    status.textContent = `${sceneMode === 'confirmed' ? '确认构图静态参考' : '运动单元调试'} · ${paused ? '已暂停' : '运行中'} · ${direction > 0 ? '左→右' : '右→左'} · ${speed} px/s${reduceNotice}`
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
    if (viewMode === 'business') sceneMode = 'unit'
    updateViewport()
    updateMotionControls()
  }))
  sceneModeButtons.forEach((button) => button.addEventListener('click', () => {
    sceneMode = button.dataset.sceneMode
    if (sceneMode === 'confirmed' && viewMode === 'business') viewMode = 'full'
    updateViewport()
    updateMotionControls()
  }))
  showGuides.addEventListener('change', () => canvas.classList.toggle('guides-hidden', !showGuides.checked))
  businessOverlay.addEventListener('change', updateViewport)
  interimBackground.addEventListener('change', () => {
    const path = interimBackground.checked
      ? '../images/ui/sakura-cat-sushi/background/sakura-shop-clean-3840x1080-INTERIM-upscaled.png'
      : '../images/ui/sakura-cat-sushi/background/sakura-shop-clean-source.png'
    cleanSceneImage.src = path
    occluderImages.forEach((image) => { image.src = path })
    updateMotionControls()
  })
  illustratedConsole.addEventListener('click', (event) => {
    const button = event.target.closest('[data-preview-action]')
    if (!button) return
    status.textContent = `插画点餐台热区：${button.dataset.previewAction} · mock 点击反馈，未连接真实订单。`
  })
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
  signGapRange.addEventListener('input', () => {
    signGap = Number(signGapRange.value)
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
      plate: { x: 1920 + (signGap + SIGN_WIDTH) / 2, y: 577 },
      curve: { x: 1920, y: 570 },
      cats: { x: 1050, y: 350 },
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
  const reportCleanSceneLoaded = () => {
    const ratio = cleanSceneImage.naturalWidth / cleanSceneImage.naturalHeight
    cleanSceneStatus.textContent = `审批背景已加载：${cleanSceneImage.naturalWidth}×${cleanSceneImage.naturalHeight} · ${ratio.toFixed(3)}:1 原比例 · ${interimBackground.checked ? '插值增强预览' : '原始图等比预览'}`
    cleanSceneStatus.classList.remove('is-error')
  }
  const reportCleanSceneError = () => {
    cleanSceneStatus.textContent = '审批背景未加载：请检查本批 background/ 图片是否已导入。'
    cleanSceneStatus.classList.add('is-error')
  }
  cleanSceneImage.addEventListener('load', reportCleanSceneLoaded)
  cleanSceneImage.addEventListener('error', reportCleanSceneError)
  if (cleanSceneImage.complete) {
    if (cleanSceneImage.naturalWidth > 0) reportCleanSceneLoaded()
    else reportCleanSceneError()
  }

  buildPathSamples()
  drawRoute()
  createPlates()
  createCats()
  renderPlates()
  canvas.classList.toggle('guides-hidden', !showGuides.checked)
  updateViewport()
  updateMotionControls()
  frameId = window.requestAnimationFrame(tick)

  window.themeV3Preview = {
    canvas: CANVAS,
    controlPoints,
    getPathLength: () => pathLength,
    getState: () => ({ viewMode, sceneMode, direction, speed, paused, plateWidth, signGap, reducedMotion: effectiveReducedMotion(), phase }),
    getPlatePositions: () => [...platesRoot.children].map((unit) => unit.dataset.position),
    getUnits: () => [...platesRoot.children].map((unit) => ({ productId: unit.dataset.productId, productName: unit.dataset.productName, position: unit.dataset.position, unitWidth: unit.dataset.unitWidth, spacing: unit.dataset.spacing })),
    getCats: () => [...catState.values()].map(({ id, name, x, y, scale, z, visible, image }) => ({ id, name, x, y, scale, z, visible, image })),
    stop: () => window.cancelAnimationFrame(frameId)
  }
})()
