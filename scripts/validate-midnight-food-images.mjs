import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(scriptDirectory, '..')
const manifestPath = path.join(repositoryRoot, 'docs/theme-midnight-station-v2/PHASE_04R9_MENU_IMAGE_MANIFEST.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const approvedStatuses = new Set(['GENERATED_APPROVED', 'REUSED_IDENTICAL_SOURCE'])
const products = manifest.products

assert.equal(products.length, manifest.source.reportedTotal, '商品清单必须覆盖接口报告总数')
assert.equal(products.length, manifest.source.fetchedTotal, '商品清单必须与分页抓取数一致')
assert.equal(manifest.source.allPagesVerified, true, '必须标记已遍历全部分页')

const productKeys = new Set()
const uniqueAssetPaths = new Set()
let mappedProducts = 0
let totalBytes = 0

const readImageDimensions = (buffer) => {
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF', 'WebP must have RIFF header')
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP', 'WebP must have WEBP signature')

  let offset = 12
  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString('ascii', offset, offset + 4)
    const chunkSize = buffer.readUInt32LE(offset + 4)
    const dataOffset = offset + 8

    if (chunkType === 'VP8X' && chunkSize >= 10) {
      const width = 1 + buffer[dataOffset + 4] + (buffer[dataOffset + 5] << 8) + (buffer[dataOffset + 6] << 16)
      const height = 1 + buffer[dataOffset + 7] + (buffer[dataOffset + 8] << 8) + (buffer[dataOffset + 9] << 16)
      return { width, height }
    }

    if (chunkType === 'VP8L' && chunkSize >= 5 && buffer[dataOffset] === 0x2f) {
      const b1 = buffer[dataOffset + 1]
      const b2 = buffer[dataOffset + 2]
      const b3 = buffer[dataOffset + 3]
      const b4 = buffer[dataOffset + 4]
      const width = 1 + b1 + ((b2 & 0x3f) << 8)
      const height = 1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10)
      return { width, height }
    }

    if (chunkType === 'VP8 ' && chunkSize >= 10) {
      const width = buffer.readUInt16LE(dataOffset + 6) & 0x3fff
      const height = buffer.readUInt16LE(dataOffset + 8) & 0x3fff
      return { width, height }
    }

    offset = dataOffset + chunkSize + (chunkSize % 2)
  }

  throw new Error('WebP image dimensions not found')
}

for (const product of products) {
  const key = `${product.shopId}:${product.productId}`
  assert.equal(productKeys.has(key), false, `商品重复: ${key}`)
  productKeys.add(key)

  if (!product.newImagePath) {
    assert.equal(product.generationStatus, 'NEEDS_REVIEW', `${key} 无图时必须标为待审核`)
    continue
  }

  assert.equal(approvedStatuses.has(product.generationStatus), true, `${key} 映射状态未审核`)
  assert.match(product.newImagePath, /^\/images\/ui\/midnight-station\/foods\/food-\d+\.webp$/)
  mappedProducts += 1
  const isNewAsset = !uniqueAssetPaths.has(product.newImagePath)
  uniqueAssetPaths.add(product.newImagePath)

  const relativeFile = product.newImagePath.replace(/^\//, '').split('/').join(path.sep)
  const filePath = path.resolve(repositoryRoot, 'public', relativeFile.replace(/^images[\\/]/, 'images/'))
  const buffer = await readFile(filePath)
  const info = await stat(filePath)
  const { width, height } = readImageDimensions(buffer)
  assert.equal(width, 1024, `${product.newImagePath} width must be 1024`)
  assert.equal(height, 1024, `${product.newImagePath} height must be 1024`)
  assert.ok(info.size > 0, `${product.newImagePath} is empty`)
  if (isNewAsset) totalBytes += info.size

  if (product.generationStatus === 'REUSED_IDENTICAL_SOURCE') {
    const reused = products.find(entry => entry.productId === product.reusedFromProductId && entry.shopId === product.shopId)
    assert.ok(reused, `${key} reuse source is missing`)
    assert.equal(product.sourceImageIdentifier, reused.sourceImageIdentifier, `${key} must share the exact original image`)
    assert.equal(product.newImagePath, reused.newImagePath, `${key} must reuse its source image asset`)
  }
}

assert.equal(mappedProducts, manifest.summary.mappedProductCount, '映射商品数必须与清单汇总一致')
assert.equal(uniqueAssetPaths.size, manifest.summary.uniqueGeneratedAssetCount, '唯一资源数必须与清单汇总一致')

console.log(JSON.stringify({
  products: products.length,
  generatedAssets: uniqueAssetPaths.size,
  mappedProducts,
  needsReview: products.filter(product => product.generationStatus === 'NEEDS_REVIEW').length,
  totalBytes
}, null, 2))
