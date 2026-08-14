/**
 * 统一语音识别文本和菜单字段的比较格式。
 * 这里只移除不影响语义的空白、标点并转换大小写，不做同音词纠正；
 * 具体业务同音词应放在对应命令解析器中，避免污染商品名称匹配。
 */
export const normalizeAssistantText = (value) => String(value || '')
  .toLowerCase()
  .replace(/[\s，。！？、,.!?；;：“”‘’'"\-]/g, '')

export const ASSISTANT_RECOMMENDATION_BATCH_SIZE = 6

export const ASSISTANT_ORDER_HOTWORDS = Object.freeze([
  '下单',
  '帮我下单',
  '全部下单',
  '提交订单'
])

export const ASSISTANT_END_SESSION_HOTWORDS = Object.freeze([
  '退下',
  '退下吧',
  '先退下',
  '去休息吧',
  '先不用了',
  '进入休眠',
  '先待命'
])

/** 根据卡片数量计算推荐栏宽度，最多只展示一批六张卡片。 */
export const getAssistantRecommendationListWidth = (
  count,
  cardWidth = 224,
  gap = 10
) => {
  const safeCount = Math.min(
    ASSISTANT_RECOMMENDATION_BATCH_SIZE,
    Math.max(0, Math.floor(Number(count) || 0))
  )
  if (!safeCount) return 0
  return (safeCount * cardWidth) + ((safeCount - 1) * gap)
}

// 把顾客常用的宽泛说法映射到菜单中更常见的名称、分类和标签词。
// 这里只维护稳定的餐饮同类词，不推断“清淡”“适合儿童”等依赖门店标注的属性。
const ASSISTANT_FOOD_CONCEPTS = Object.freeze([
  { aliases: ['面', '面食', '面条', '汤面'], targets: ['拉面', '乌冬', '荞麦', '炒面', '面'] },
  { aliases: ['饭', '米饭', '饭类'], targets: ['炒饭', '盖饭', '丼', '米饭', '饭'] },
  { aliases: ['喝的', '饮料', '饮品'], targets: ['饮品', '茶', '果汁', '苏打', '气泡饮', '酒'] },
  { aliases: ['炸', '炸物', '油炸', '炸的'], targets: ['炸物', '油炸', '天妇罗', '炸'] },
  { aliases: ['生鱼片'], targets: ['刺身', '生鱼片'] },
  { aliases: ['甜点', '甜食'], targets: ['甜品', '甜点', '蛋糕', '冰淇淋', '布丁'] }
])

/**
 * 获取循环分页后的推荐批次。
 * 批次索引允许为负数或超过总批次数，便于“换一批”循环回到开头。
 */
export const getAssistantRecommendationBatch = (
  items = [],
  batchIndex = 0,
  batchSize = ASSISTANT_RECOMMENDATION_BATCH_SIZE
) => {
  const safeItems = Array.isArray(items) ? items : []
  const safeSize = Math.max(1, Math.floor(Number(batchSize) || ASSISTANT_RECOMMENDATION_BATCH_SIZE))
  const batchCount = Math.max(1, Math.ceil(safeItems.length / safeSize))
  const numericIndex = Math.floor(Number(batchIndex) || 0)
  const safeIndex = ((numericIndex % batchCount) + batchCount) % batchCount
  const start = safeIndex * safeSize
  return safeItems.slice(start, start + safeSize)
}

/**
 * 在真正修改购物车前，为一次语音批量选择生成完整的落位计划。
 *
 * 规划阶段使用购物车快照模拟左右两侧容量，并优先选择剩余空间更多的一侧。
 * 任意一件商品无法放入时返回 null，从而保证调用方不会只加入半批商品。
 * 返回值按单件展开，调用方可复用现有的单件 addToCart 流程。
 */
export const planAssistantCartAdditions = ({ selections = [], carts = {}, capacity = 4 }) => {
  const sides = ['left', 'right']
  const safeCapacity = Math.max(1, Math.floor(Number(capacity) || 4))
  const simulatedCarts = Object.fromEntries(sides.map((side) => {
    const cart = (Array.isArray(carts[side]) ? carts[side] : [])
      .slice(0, safeCapacity)
      .map((item) => item ? { id: item.id, quantity: Number(item.quantity) || 1 } : null)
    while (cart.length < safeCapacity) cart.push(null)
    return [side, cart]
  }))
  const countSimulated = (side) => simulatedCarts[side]
    .reduce((total, item) => total + (item?.quantity || 0), 0)
  const additions = []

  for (const selection of selections) {
    const quantity = Math.min(safeCapacity, Math.max(1, Number(selection.quantity) || 1))
    for (let count = 0; count < quantity; count += 1) {
      const candidates = sides.map((side) => {
        const cart = simulatedCarts[side]
        const existingIndex = cart.findIndex((entry) => entry?.id === selection.item.id)
        const existing = existingIndex >= 0 ? cart[existingIndex] : null
        const remaining = safeCapacity - countSimulated(side)
        return {
          side,
          cart,
          existing,
          remaining,
          canAdd: remaining > 0 && (!existing || existing.quantity < safeCapacity)
        }
      }).filter((candidate) => candidate.canAdd)
        // 剩余容量相同时保持 left、right 的稳定顺序，避免同一指令随机换边。
        .sort((a, b) => b.remaining - a.remaining)

      const target = candidates[0]
      if (!target) return null
      if (target.existing) target.existing.quantity += 1
      else target.cart[target.cart.findIndex((entry) => !entry)] = { id: selection.item.id, quantity: 1 }
      additions.push({ item: selection.item, side: target.side })
    }
  }

  return additions
}

/** 判断识别结果是否包含小禾的常见唤醒词及 ASR 同音变体。 */
export const isXiaoheWakePhrase = (value) => {
  const text = normalizeAssistantText(value)
  return /小禾小禾|小何小何|晓禾晓禾|小和小和/.test(text)
}

/**
 * 从自然口语中提取可用于模糊搜索的词片段。
 * 先去掉“我想吃”“推荐”等意图词，再补充 2 到 4 字子串，以兼容识别结果
 * 和后端商品关键词粒度不一致的情况。
 */
const extractAssistantSubject = (value) => normalizeAssistantText(value)
    .replace(/我想吃|我想喝|我想要|帮我找|帮我搜|查一下|搜索一下|有没有|想吃|想喝|找一下|给我来|推荐|来点|来一些|我要|请给我|帮我/g, '')
    .replace(/^点(?=[\u4e00-\u9fa5])/, '')
    .replace(/一点|一些|几个|几款|一份|一杯|一个|点儿|的|吧|呢|啊|呀/g, '')

export const extractAssistantTerms = (value) => {
  const normalized = extractAssistantSubject(value)

  const segments = normalized.match(/[\u4e00-\u9fa5a-z0-9]{2,}/g) || []
  const terms = new Set(segments)
  // “面、饭、鱼、茶”等单字在餐饮场景有明确含义。只在整段清理后剩一个字时保留，
  // 后续匹配也不会用单字扫描长描述，避免“面衣”等偶然文本造成误推荐。
  if (/^[\u4e00-\u9fa5]$/.test(normalized)) terms.add(normalized)
  segments.forEach((segment) => {
    const maxLength = Math.min(4, segment.length)
    for (let length = 2; length <= maxLength; length += 1) {
      for (let start = 0; start <= segment.length - length; start += 1) {
        terms.add(segment.slice(start, start + length))
      }
    }
  })
  return [...terms]
}

const findAssistantFoodConcepts = (value) => {
  const subject = extractAssistantSubject(value)
  if (!subject) return []

  return ASSISTANT_FOOD_CONCEPTS.filter(({ aliases }) => aliases.some((alias) => (
    alias.length === 1 ? subject === alias : subject.includes(alias)
  )))
}

/**
 * 根据名称、分类、关键词、描述和标签对可售商品进行相关度排序。
 * 名称精确匹配权重最高；同分商品再按销量排序，结果本身不负责分页。
 */
export const findAssistantRecommendations = ({ items = [], categories = [], transcript = '' }) => {
  const query = normalizeAssistantText(transcript)
  if (!query) return []

  const intentWords = extractAssistantTerms(query)
  const foodConcepts = findAssistantFoodConcepts(query)
  if (!intentWords.length && !foodConcepts.length) return []
  const categoryNames = new Map(categories.map((category) => [
    Number(category.id),
    normalizeAssistantText(category.name || '')
  ]))

  return items
    .filter((item) => item.available !== false)
    .map((item) => {
      const name = normalizeAssistantText(item.name || item.storeName)
      const categoryName = categoryNames.get(Number(item.categoryId ?? item.cateId)) || ''
      const keywordText = normalizeAssistantText(item.keyword)
      const tagText = normalizeAssistantText(
        Array.isArray(item.tags) ? item.tags.map((tag) => tag.name || tag).join(' ') : ''
      )
      const descriptionText = normalizeAssistantText([
        item.storeInfo,
        item.description,
        item.introduction
      ].filter(Boolean).join(' '))

      let score = 0
      // 名称匹配必须明显高于普通关键词命中，避免描述较长的商品反超直呼菜名。
      if (name && query === name) score += 200
      else if (name && query.includes(name)) score += 120
      else if (name && name.includes(query)) score += 100

      intentWords.forEach((word) => {
        const weight = Math.min(word.length, 4)
        if (name.includes(word)) score += weight * 12
        if (categoryName.includes(word)) score += weight * 9
        if (keywordText.includes(word) || tagText.includes(word)) score += weight * 7
        if (word.length > 1 && descriptionText.includes(word)) score += weight * 3
      })

      foodConcepts.forEach(({ targets }) => targets.forEach((target) => {
        const normalizedTarget = normalizeAssistantText(target)
        if (name.includes(normalizedTarget)) score += 48
        if (categoryName.includes(normalizedTarget)) score += 38
        if (keywordText.includes(normalizedTarget) || tagText.includes(normalizedTarget)) score += 30
        if (normalizedTarget.length > 1 && descriptionText.includes(normalizedTarget)) score += 12
      }))
      if (item.keyword && query.includes(normalizeAssistantText(item.keyword))) score += 30

      return { item, score, sales: Number(item.sales) || 0 }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.sales - a.sales)
    .map((entry) => entry.item)
}

const spokenNumbers = {
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6
}

const toSpokenNumber = (value) => {
  const numeric = Number(value)
  if (Number.isInteger(numeric)) return numeric
  return spokenNumbers[value] || null
}

/** 解析“一份、两盘、3个”等数量表达；单次最多加入四件。 */
export const parseAssistantQuantity = (transcript) => {
  const text = String(transcript || '')
  const match = text.match(/(?<!第)([一二两三四1234])(?:份|杯|盘|盒|碗|瓶|个)/)
  return match ? Math.min(4, Math.max(1, toSpokenNumber(match[1]) || 1)) : 1
}

const assistantOrdinalPattern = /第([一二两三四五六123456])(?:个|款|道|杯)?|([一二两三四五六123456])号/g

/**
 * 提取一句话中的所有推荐序号，同时保留原文位置供后续切分各自数量。
 * 相同序号只保留第一次，防止 ASR 重复词导致同一商品被重复加入。
 */
export const parseAssistantOrdinals = (transcript) => {
  const text = String(transcript || '')
  const matches = [...text.matchAll(assistantOrdinalPattern)]
  const seen = new Set()
  return matches.flatMap((match) => {
    const ordinal = toSpokenNumber(match[1] || match[2])
    const index = ordinal ? ordinal - 1 : null
    if (index === null || seen.has(index)) return []
    seen.add(index)
    return [{ index, offset: match.index, length: match[0].length }]
  })
}

export const parseAssistantOrdinal = (transcript) => parseAssistantOrdinals(transcript)[0]?.index ?? null

// 把“第一个两份、第三个一份”拆成可直接执行的选择项；句尾共享数量优先应用到整批。
const parseAssistantOrdinalSelections = (transcript, recommendations) => {
  const text = String(transcript || '')
  const ordinals = parseAssistantOrdinals(text)
  const sharedQuantityMatch = text.match(/各([一二两三四1234])(?:份|杯|盘|盒|碗|瓶|个)/)
  const sharedQuantity = sharedQuantityMatch
    ? Math.min(4, Math.max(1, toSpokenNumber(sharedQuantityMatch[1]) || 1))
    : null

  return ordinals.map((ordinal, position) => {
    const segmentStart = ordinal.offset + ordinal.length
    const segmentEnd = ordinals[position + 1]?.offset ?? text.length
    const segment = text.slice(segmentStart, segmentEnd)
    const quantity = sharedQuantity ?? parseAssistantQuantity(segment)
    return {
      index: ordinal.index,
      item: recommendations[ordinal.index] || null,
      quantity
    }
  })
}

const findNamedItem = (items, query) => items
  .filter((item) => item.available !== false)
  .map((item) => ({
    item,
    name: normalizeAssistantText(item.name || item.storeName)
  }))
  .filter((entry) => entry.name && query.includes(entry.name))
  .sort((a, b) => b.name.length - a.name.length)[0]?.item || null

/** 判断用户是否要求切换下一批推荐。 */
export const isAssistantNextBatchCommand = (value) => {
  const query = normalizeAssistantText(value)
  return /换一批|下一批|换一组|再换|还有别的|还有其他|看看别的|看看其他|再推荐/.test(query)
}

/**
 * 判断是否是明确的“提交现有购物车”指令。
 * 先修正“下订单/下载”等常见同音结果，再排除否定句和询问句，避免误下单。
 */
export const isAssistantPlaceOrderCommand = (value) => {
  const query = normalizeAssistantText(value)
    .replace(/^小禾(?:小禾)?/, '')
    .replace(/下订单|下载/g, '下单')
  const negativeIntent = /(?:不要|不用|别|取消|先不|暂时不|不需要|不想).*下单/.test(query)
    || /下单.*(?:不要|不用|取消|先不|算了)/.test(query)
  const questionIntent = /(?:怎么|如何|有没有|是否|能不能|可不可以).*下单/.test(query)
    || /下单.*(?:怎么|如何|操作|按钮|在哪里|在哪)/.test(query)
    || /下单(?:吗|呢)$/.test(query)
  if (!query || negativeIntent || questionIntent) {
    return false
  }

  // ASR 可能在有效指令前附带无法消除的环境噪声词，只要句尾仍是明确的“下单”即可执行。
  return /下单(?:吧|了|啊|呀|嘛|哦)?$/.test(query)
    || /(?:请)?提交(?:全部)?订单(?:吧|了)?$/.test(query)
}

/** 判断用户是否明确结束当前连续点餐会话。 */
export const isAssistantEndSessionCommand = (value) => {
  const query = normalizeAssistantText(value).replace(/^小禾(?:小禾)?/, '')
  if (/^(?:好了|好啦|行了|可以了|没事了|不用了|先不用了|先这样|就这样|就这些|没别的了|没有了|不用管我了)$/.test(query)) {
    return true
  }

  const sleepAction = '(?:退下|休息|歇会|歇一下|待命|休眠|睡觉)'
  const negativeSleepIntent = new RegExp(`(?:不要|别|不许|不能)(?:让)?(?:它|你|小禾)?(?:可以)?(?:先|暂时|去|进入)?${sleepAction}`)
  if (negativeSleepIntent.test(query)) return false

  return new RegExp(`^(?:麻烦|请)?(?:(?:让)?(?:它|你|小禾))?(?:可以)?(?:先|暂时|去|进入)?${sleepAction}(?:一下|吧|了)?$`).test(query)
    || /^(?:暂时|先)?不用(?:你|小禾)了?$/.test(query)
}

/**
 * 将一条识别文本归类为页面可以执行的稳定命令对象。
 * 优先级依次为：提交订单、换批、结束会话、序号选择、菜名选择、重新推荐。
 * 先处理高风险的完整指令，可避免“全部下单”被普通商品搜索吞掉。
 */
export const parseAssistantCommand = ({ transcript = '', recommendations = [], items = [] }) => {
  const query = normalizeAssistantText(transcript)
  const quantity = parseAssistantQuantity(transcript)
  const ordinalSelections = parseAssistantOrdinalSelections(transcript, recommendations)

  if (isAssistantPlaceOrderCommand(query)) {
    return { type: 'order_all' }
  }

  if (isAssistantNextBatchCommand(query)) {
    return { type: 'next_batch' }
  }

  if (isAssistantEndSessionCommand(query)) {
    return { type: 'end_session' }
  }

  if (ordinalSelections.length > 1) {
    return {
      type: 'select_many',
      source: 'ordinal',
      selections: ordinalSelections
    }
  }

  if (ordinalSelections.length === 1) {
    const [selection] = ordinalSelections
    return {
      type: 'select',
      source: 'ordinal',
      ...selection
    }
  }

  const discoveryIntent = /推荐|有没有|有哪些|有什么|帮我找|搜索|想吃|想喝|适合/.test(query)
  const orderIntent = /我要|我选|就要|来一|来两|来三|来四|给我来|加入|加到|放到|选择/.test(query)
  const recommendedItem = findNamedItem(recommendations, query)
  if (recommendedItem && !discoveryIntent) {
    return { type: 'select', source: 'recommendation_name', item: recommendedItem, quantity }
  }

  if (orderIntent) {
    const menuItem = findNamedItem(items, query)
    if (menuItem) return { type: 'select', source: 'menu_name', item: menuItem, quantity }
  }

  return { type: 'recommend', quantity: 1 }
}
