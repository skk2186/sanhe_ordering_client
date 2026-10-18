import manifest from '../../docs/theme-midnight-station-v2/PHASE_04R9_MENU_IMAGE_MANIFEST.json' with { type: 'json' }

export const MIDNIGHT_DEFAULT_FOOD_IMAGE = '/images/ui/midnight-station/default-food.svg'

const MAPPED_STATUSES = new Set(['GENERATED_APPROVED', 'REUSED_IDENTICAL_SOURCE'])
const presentationGeometry = manifest.presentationGeometry
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

// Anchor each existing image by its measured visible lower edge. The delivery
// body is 3:1, the cargo deck sits 38% from its top, and the square food frame
// spans 84% of body width. Per-asset ratios account for transparent margins.
export const getMidnightFoodAnchorBottom = (item, fallback = MIDNIGHT_DEFAULT_FOOD_IMAGE, renderedImage = '') => {
  const source = (renderedImage || getMidnightFoodImage(item, fallback) || fallback).split('?')[0]
  const assetName = source.slice(source.lastIndexOf('/') + 1)
  const contentBottom = presentationGeometry.contentBottomRatioByAsset[assetName]
    ?? presentationGeometry.contentBottomRatioByAsset['default-food.svg']
  const frameAspectRatio = assetName === 'default-food.svg'
    ? presentationGeometry.fallbackFrameAspectRatio
    : 1
  const frameHeightToVehicleHeight = (
    presentationGeometry.foodFrameWidthRatio
    * presentationGeometry.vehicleAspectRatio
    / frameAspectRatio
  )
  const bottom = (
    1 - presentationGeometry.cargoDeckTopRatio
    - frameHeightToVehicleHeight * (1 - contentBottom)
  )
  return `${(bottom * 100).toFixed(2)}%`
}

export const isMidnightStationActive = () => (
  typeof document !== 'undefined'
  && document.documentElement?.dataset?.theme === 'midnight-station'
)
