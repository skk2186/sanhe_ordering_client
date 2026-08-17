import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ASSISTANT_END_SESSION_HOTWORDS,
  ASSISTANT_ORDER_HOTWORDS,
  findAssistantRecommendations,
  getAssistantRecommendationBatch,
  getAssistantRecommendationListWidth,
  isAssistantEndSessionCommand,
  isAssistantPlaceOrderCommand,
  isAssistantRepeatLastCommand,
  isXiaoheWakePhrase,
  parseAssistantCommand,
  planAssistantCartAdditions
} from '../src/utils/assistantRecommendations.js'

const categories = [
  { id: 21, name: '握寿司' },
  { id: 28, name: '饮品甜品' },
  { id: 70, name: '主食汤品' },
  { id: 80, name: '炸物小食' }
]

const items = [
  { id: 29, name: '三文鱼握寿司', categoryId: 21, keyword: '三文鱼,握寿司', sales: 86, available: true },
  { id: 79, name: '玄米茶', categoryId: 28, storeInfo: '烘焙玄米与绿茶', keyword: '玄米茶,绿茶,茶饮', sales: 40, available: true },
  { id: 80, name: '蜂蜜柚子苏打', categoryId: 28, storeInfo: '柚子蜜与气泡水', keyword: '柚子苏打,气泡饮,饮品', sales: 60, available: true },
  { id: 81, name: '白桃气泡饮', categoryId: 28, storeInfo: '白桃果肉与气泡水', keyword: '白桃,气泡饮,饮品', sales: 55, available: true },
  { id: 82, name: '日式梅子酒', categoryId: 28, keyword: '梅子酒,酒饮', available: false }
]

const broadIntentItems = [
  { id: 101, name: '日式豚骨拉面', categoryId: 70, keyword: '豚骨拉面,叉烧,面', sales: 91, available: true },
  { id: 102, name: '海鲜乌冬面', categoryId: 70, keyword: '海鲜乌冬,乌冬面,主食', sales: 63, available: true },
  { id: 103, name: '肥牛乌冬面', categoryId: 70, keyword: '牛肉乌冬,肥牛,主食', sales: 58, available: true },
  { id: 104, name: '鳗鱼炒饭', categoryId: 70, keyword: '鳗鱼炒饭,米饭,主食', sales: 67, available: true },
  { id: 105, name: '天妇罗拼盘', categoryId: 80, keyword: '天妇罗,炸物', description: '轻薄面衣现点现炸', sales: 76, available: true },
  { id: 106, name: '黄瓜细卷', categoryId: 21, keyword: '黄瓜卷,素食', description: '爽脆黄瓜与芝麻醋饭，清淡解腻', sales: 35, available: true }
]

test('recognizes a context-only request to add one more of the last dish', () => {
  for (const transcript of ['再来一份', '小禾再来一个吧', '刚才点的再来一盘', '那个又给我来一份']) {
    assert.equal(isAssistantRepeatLastCommand(transcript), true, transcript)
    assert.deepEqual(parseAssistantCommand({ transcript, items }), {
      type: 'repeat_last',
      quantity: 1
    })
  }
})

test('does not treat a named dish or a different quantity as repeating the last dish', () => {
  for (const transcript of ['再来一份三文鱼握寿司', '三文鱼握寿司再来一份', '再来两份', '不要再来一份']) {
    assert.equal(isAssistantRepeatLastCommand(transcript), false, transcript)
  }

  assert.deepEqual(parseAssistantCommand({ transcript: '再来一份三文鱼握寿司', items }), {
    type: 'select',
    source: 'menu_name',
    item: items[0],
    quantity: 1
  })
})

test('recommends drink-category items without replacing the conveyor menu', () => {
  const result = findAssistantRecommendations({ items, categories, transcript: '我想喝点饮品' })
  assert.deepEqual(result.map((item) => item.id), [80, 81, 79])
})

test('ranks a concrete dish name first and excludes unavailable items', () => {
  const result = findAssistantRecommendations({ items, categories, transcript: '我要白桃气泡饮' })
  assert.equal(result[0]?.id, 81)
  assert.equal(result.some((item) => item.id === 82), false)
})

test('understands broad noodle requests and ignores incidental single-character description matches', () => {
  for (const transcript of ['我想吃点面', '来点面食', '有没有面条', '想吃汤面']) {
    const result = findAssistantRecommendations({ items: broadIntentItems, categories, transcript })
    assert.deepEqual(result.map((item) => item.id), [101, 102, 103])
    assert.equal(result.some((item) => item.id === 105), false)
  }
})

test('expands other stable food-category aliases without mixing adjacent staple foods', () => {
  const rice = findAssistantRecommendations({ items: broadIntentItems, categories, transcript: '想吃点饭' })
  const fried = findAssistantRecommendations({ items: broadIntentItems, categories, transcript: '来点炸的' })

  assert.deepEqual(rice.map((item) => item.id), [104])
  assert.deepEqual(fried.map((item) => item.id), [105])
})

test('grounds vague rich and light preferences in real menu wording', () => {
  for (const transcript of ['想吃点油腻的', '来点重口的', '有没有浓郁一点的']) {
    const result = findAssistantRecommendations({ items: broadIntentItems, categories, transcript })
    assert.deepEqual(result.slice(0, 4).map((item) => item.id), [105, 101, 104, 103], transcript)
    assert.equal(result.some((item) => item.id === 106), false, transcript)
  }

  for (const transcript of ['想吃清淡一点的', '来点解腻的', '不要太油腻']) {
    const result = findAssistantRecommendations({ items: broadIntentItems, categories, transcript })
    assert.equal(result[0]?.id, 106, transcript)
    assert.equal(result.some((item) => item.id === 105), false, transcript)
  }
})

test('falls back to best sellers for genuinely open-ended recommendations', () => {
  for (const transcript of ['随便推荐几个', '有什么好吃的', '来点店里热门的']) {
    const result = findAssistantRecommendations({ items: broadIntentItems, categories, transcript })
    assert.deepEqual(result.slice(0, 3).map((item) => item.id), [101, 105, 104], transcript)
  }
})

test('selects the second recommendation and keeps the requested quantity', () => {
  const recommendations = items.slice(1, 4)
  const command = parseAssistantCommand({
    transcript: '我要第二个，来两杯',
    recommendations,
    items
  })

  assert.equal(command.type, 'select')
  assert.equal(command.item.id, 80)
  assert.equal(command.quantity, 2)
})

test('selects several numbered recommendations in one command', () => {
  const recommendations = items.slice(1, 4)
  const command = parseAssistantCommand({
    transcript: '我想要第一个、第二个和第三个',
    recommendations,
    items
  })

  assert.equal(command.type, 'select_many')
  assert.deepEqual(command.selections.map(({ item, quantity }) => [item.id, quantity]), [
    [79, 1],
    [80, 1],
    [81, 1]
  ])
})

test('keeps per-item quantities and de-duplicates repeated recommendation numbers', () => {
  const recommendations = items.slice(1, 4)
  const separateQuantities = parseAssistantCommand({
    transcript: '第一个来两份，第三个一份',
    recommendations,
    items
  })
  const sharedQuantity = parseAssistantCommand({
    transcript: '第一个、第二个、第三个各两份',
    recommendations,
    items
  })
  const deDuplicated = parseAssistantCommand({
    transcript: '第一个、第一个和第三个',
    recommendations,
    items
  })

  assert.deepEqual(separateQuantities.selections.map(({ item, quantity }) => [item.id, quantity]), [
    [79, 2],
    [81, 1]
  ])
  assert.deepEqual(sharedQuantity.selections.map(({ quantity }) => quantity), [2, 2, 2])
  assert.deepEqual(deDuplicated.selections.map(({ item }) => item.id), [79, 81])
})

test('preflights a multi-item cart addition without mutating carts or partially planning overflow', () => {
  const carts = {
    left: [{ id: 79, quantity: 3 }, null, null, null],
    right: [null, null, null, null]
  }
  const snapshot = structuredClone(carts)
  const additions = planAssistantCartAdditions({
    carts,
    selections: [
      { item: items[1], quantity: 2 },
      { item: items[2], quantity: 2 }
    ]
  })
  const overflow = planAssistantCartAdditions({
    carts: {
      left: [{ id: 79, quantity: 4 }],
      right: [{ id: 80, quantity: 3 }]
    },
    selections: [{ item: items[3], quantity: 2 }]
  })

  assert.equal(additions.length, 4)
  assert.deepEqual(carts, snapshot)
  assert.equal(overflow, null)
})

test('selects a named recommendation but keeps discovery requests as recommendations', () => {
  const recommendations = items.slice(1, 4)
  const selection = parseAssistantCommand({ transcript: '白桃气泡饮两杯', recommendations, items })
  const discovery = parseAssistantCommand({ transcript: '有没有白桃气泡饮', recommendations, items })

  assert.equal(selection.type, 'select')
  assert.equal(selection.item.id, 81)
  assert.equal(selection.quantity, 2)
  assert.equal(discovery.type, 'recommend')
})

test('recognizes the Xiaohe wake phrase and common homophone transcripts', () => {
  assert.equal(isXiaoheWakePhrase('小禾，小禾'), true)
  assert.equal(isXiaoheWakePhrase('小何小何'), true)
  assert.equal(isXiaoheWakePhrase('我要小禾寿司'), false)
})

test('shows at most six recommendations per batch and wraps after the last batch', () => {
  const recommendations = Array.from({ length: 14 }, (_, index) => ({ id: index + 1 }))

  assert.deepEqual(getAssistantRecommendationBatch(recommendations, 0).map((item) => item.id), [1, 2, 3, 4, 5, 6])
  assert.deepEqual(getAssistantRecommendationBatch(recommendations, 1).map((item) => item.id), [7, 8, 9, 10, 11, 12])
  assert.deepEqual(getAssistantRecommendationBatch(recommendations, 2).map((item) => item.id), [13, 14])
  assert.deepEqual(getAssistantRecommendationBatch(recommendations, 3).map((item) => item.id), [1, 2, 3, 4, 5, 6])
})

test('recognizes natural requests for another recommendation batch', () => {
  for (const transcript of ['换一批', '再换一批', '下一批', '还有别的吗', '看看其他的']) {
    const command = parseAssistantCommand({ transcript, recommendations: items, items })
    assert.equal(command.type, 'next_batch')
  }
})

test('recognizes explicit all-cart ordering commands without accepting negative or help requests', () => {
  for (const transcript of [
    '小禾，帮我下单',
    '我要下订单',
    '就这些，下单吧',
    '把这些菜都下单',
    '提交全部订单',
    '小禾，帮我下载',
    '我要下载',
    '把这些菜都下载',
    '阿玛下单',
    '环境噪音下单吧'
  ]) {
    assert.equal(isAssistantPlaceOrderCommand(transcript), true)
    assert.equal(parseAssistantCommand({ transcript, recommendations: items, items }).type, 'order_all')
  }

  for (const transcript of [
    '不要下单',
    '先不下单',
    '取消下单',
    '这些菜要怎么下单',
    '不要下载',
    '取消下载',
    '这些菜要怎么下载',
    '阿玛不要下单',
    '能不能下单',
    '下单怎么操作',
    '可以下单吗',
    '下单不要了'
  ]) {
    assert.equal(isAssistantPlaceOrderCommand(transcript), false)
    assert.notEqual(parseAssistantCommand({ transcript, recommendations: items, items }).type, 'order_all')
  }
})

test('recognizes explicit conversation-ending phrases without overriding an order command', () => {
  for (const transcript of [
    '好了',
    '不用了',
    '先不用了',
    '先这样',
    '休息吧',
    '小禾先休息',
    '退下',
    '退下吧',
    '你先退下吧',
    '让它退下吧',
    '你可以退下了',
    '小禾去休息吧',
    '请进入休眠吧',
    '先待命',
    '去睡觉吧',
    '没事了',
    '不用管我了',
    '暂时不用你了'
  ]) {
    assert.equal(isAssistantEndSessionCommand(transcript), true)
    assert.equal(parseAssistantCommand({ transcript, recommendations: items, items }).type, 'end_session')
  }

  for (const transcript of ['不要退下', '你先别休息', '不能让小禾退下', '你不要休眠']) {
    assert.equal(isAssistantEndSessionCommand(transcript), false)
    assert.notEqual(parseAssistantCommand({ transcript, recommendations: items, items }).type, 'end_session')
  }

  assert.equal(parseAssistantCommand({
    transcript: '就这些，帮我下单',
    recommendations: items,
    items
  }).type, 'order_all')
})

test('provides common sleep commands as recognition hotwords', () => {
  assert.deepEqual(ASSISTANT_END_SESSION_HOTWORDS, [
    '退下',
    '退下吧',
    '先退下',
    '去休息吧',
    '先不用了',
    '进入休眠',
    '先待命'
  ])
})

test('provides fixed order phrases as recognition hotwords', () => {
  assert.deepEqual(ASSISTANT_ORDER_HOTWORDS, [
    '下单',
    '帮我下单',
    '全部下单',
    '提交订单',
    '再来一份',
    '再来一个'
  ])
})

test('sizes the recommendation list from the visible item count and caps it at six', () => {
  assert.equal(getAssistantRecommendationListWidth(0), 0)
  assert.equal(getAssistantRecommendationListWidth(1), 224)
  assert.equal(getAssistantRecommendationListWidth(2), 458)
  assert.equal(getAssistantRecommendationListWidth(6), 1394)
  assert.equal(getAssistantRecommendationListWidth(9), 1394)
})
