import manifest from '../../docs/theme-midnight-station-v2/PHASE_04R9_MENU_IMAGE_MANIFEST.json' with { type: 'json' }

export const MIDNIGHT_DEFAULT_FOOD_IMAGE = '/images/ui/midnight-station/default-food.svg'

const MAPPED_STATUSES = new Set(['GENERATED_APPROVED', 'REUSED_IDENTICAL_SOURCE'])
const withAssetRevision = imagePath => (
  manifest.assetRevision ? `${imagePath}?v=${manifest.assetRevision}` : imagePath
)
const imageByProduct = new Map(
  manifest.products
    .filter(product => MAPPED_STATUSES.has(product.generationStatus) && product.newImagePath)
    .map(product => [`${product.shopId}:${product.productId}`, withAssetRevision(product.newImagePath)])
)

export const getMidnightFoodImage = (item, fallback = '') => {
  const productId = item?.productId ?? item?.id
  const shopId = Number(item?.shopId ?? item?.shop_id ?? item?.storeId ?? manifest.shopId)
  const mapped = imageByProduct.get(`${shopId}:${String(productId ?? '')}`)
  return mapped || item?.image || item?.imageUrl || item?.selectedProductValue?.image || fallback
}

export const isMidnightStationActive = () => (
  typeof document !== 'undefined'
  && document.documentElement?.dataset?.theme === 'midnight-station'
)
