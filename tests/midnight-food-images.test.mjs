import assert from 'node:assert/strict'
import test from 'node:test'

import manifest from '../docs/theme-midnight-station-v2/PHASE_04R9_MENU_IMAGE_MANIFEST.json' with { type: 'json' }
import { getMidnightFoodImage } from '../src/utils/midnightFoodImages.js'

test('Midnight food image mapping is keyed by shop and product id', () => {
  assert.equal(
    getMidnightFoodImage({ id: 15, shopId: 2, image: '/old-drink.jpg' }),
    '/images/ui/midnight-station/foods/food-15.webp?v=r9-transparent'
  )
  assert.equal(
    getMidnightFoodImage({ productId: 24, image: '/old-toast.jpg' }),
    '/images/ui/midnight-station/foods/food-19.webp?v=r9-transparent'
  )
  assert.equal(
    getMidnightFoodImage({ id: 15, shopId: 3, image: '/other-shop.jpg' }),
    '/other-shop.jpg'
  )
})

test('unmapped or unresolved products preserve the original and use the Midnight fallback only when missing', () => {
  assert.equal(getMidnightFoodImage({ id: 27, image: '/old-33333.png' }, '/fallback.svg'), '/old-33333.png')
  assert.equal(getMidnightFoodImage({ id: 27 }, '/fallback.svg'), '/fallback.svg')
  assert.equal(manifest.products.find(product => product.productId === 27)?.generationStatus, 'NEEDS_REVIEW')
})

test('manifest keeps complete API coverage and explicit reuse for identical source images', () => {
  assert.equal(manifest.source.reportedTotal, 11)
  assert.equal(manifest.source.fetchedTotal, 11)
  const originalToast = manifest.products.find(product => product.productId === 19)
  const duplicateToast = manifest.products.find(product => product.productId === 24)
  assert.equal(duplicateToast?.sourceImageIdentifier, originalToast?.sourceImageIdentifier)
  assert.equal(duplicateToast?.newImagePath, originalToast?.newImagePath)
  assert.equal(duplicateToast?.reusedFromProductId, 19)
})
