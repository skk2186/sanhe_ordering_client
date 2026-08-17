import assert from 'node:assert/strict'
import test from 'node:test'

import { replaceSeededMenuImage } from '../src/utils/menuImageReplacements.js'

const seededImages = [
  ['photo-1579871494447-9811cf80d66c', 'nigiri.webp'],
  ['photo-1553621042-f6e147245754', 'gunkan.webp'],
  ['photo-1617196034183-421b4917c92d', 'rolls.webp'],
  ['photo-1579584425555-c3ce17fd4351', 'sashimi.webp'],
  ['photo-1611143669185-af224c5e3252', 'aburi.webp'],
  ['photo-1562802378-063ec186a863', 'sides.webp'],
  ['photo-1569718212165-3a8278d5f624', 'mains.webp'],
  ['photo-1607301405390-d831c242f59b', 'drinks-desserts.webp']
]

test('replaces every sushi seed image with its bundled menu artwork', () => {
  seededImages.forEach(([photoId, fileName]) => {
    const source = `https://images.unsplash.com/${photoId}?w=800&q=80`
    assert.equal(replaceSeededMenuImage(source), `/images/menu/generated/${fileName}`)
  })
})

test('preserves backend files and unrelated external images', () => {
  const backendImage = '/admin-api/infra/file/4/get/test.jpg'
  const unrelatedUnsplash = 'https://images.unsplash.com/photo-not-in-the-seed?w=800&q=80'

  assert.equal(replaceSeededMenuImage(backendImage), backendImage)
  assert.equal(replaceSeededMenuImage(unrelatedUnsplash), unrelatedUnsplash)
  assert.equal(replaceSeededMenuImage(''), '')
})
