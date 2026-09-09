/**
 * 招牌菜介绍素材映射。
 * 事件槽位第二位的触发物和吊挂介绍屏都从这里取素材：
 * - productIds 命中商品 ID 时直接匹配（后端 ID 变动后在这里维护）；
 * - nameKeywords 按菜品名包含关键字兜底，方便素材先行、ID 后补。
 * 触发物只在能解析出素材时才渲染，避免出现点了没反应的死按钮。
 */
export const PROMO_CONTENT = [
  {
    id: 'tuna',
    productIds: [],
    nameKeywords: ['金枪鱼', '金槍魚', '吞拿鱼', 'マグロ', 'tuna'],
    triggerImage: '/images/ui/promo/tuna.png',
    posterImage: '/images/ui/promo/tuna-poster.png',
    videoSrc: '/images/videos/promo/tuna-video.mp4'
  }
]

const PROMO_FALLBACK_CLOSE_DELAY = 12000

export const findPromoForItem = (item) => {
  if (!item) return null
  const productId = String(item.id ?? item.productId ?? '')
  const name = String(item.name || item.storeName || item.productName || '').toLowerCase()
  return PROMO_CONTENT.find((promo) => {
    if (promo.productIds?.map(String).includes(productId)) return true
    return (promo.nameKeywords || []).some((keyword) => keyword && name.includes(keyword.toLowerCase()))
  }) || null
}

export { PROMO_FALLBACK_CLOSE_DELAY }
