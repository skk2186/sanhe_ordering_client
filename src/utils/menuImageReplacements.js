const SEEDED_MENU_IMAGE_REPLACEMENTS = Object.freeze({
  '/photo-1579871494447-9811cf80d66c': '/images/menu/generated/nigiri.webp',
  '/photo-1553621042-f6e147245754': '/images/menu/generated/gunkan.webp',
  '/photo-1617196034183-421b4917c92d': '/images/menu/generated/rolls.webp',
  '/photo-1579584425555-c3ce17fd4351': '/images/menu/generated/sashimi.webp',
  '/photo-1611143669185-af224c5e3252': '/images/menu/generated/aburi.webp',
  '/photo-1562802378-063ec186a863': '/images/menu/generated/sides.webp',
  '/photo-1569718212165-3a8278d5f624': '/images/menu/generated/mains.webp',
  '/photo-1607301405390-d831c242f59b': '/images/menu/generated/drinks-desserts.webp'
})

/** Replace only the known sushi seed image URLs with bundled menu artwork. */
export const replaceSeededMenuImage = (value) => {
  const imageUrl = String(value || '').trim()
  if (!imageUrl) return ''

  try {
    const parsedUrl = new URL(imageUrl, 'http://local.invalid')
    if (parsedUrl.hostname !== 'images.unsplash.com') return imageUrl
    return SEEDED_MENU_IMAGE_REPLACEMENTS[parsedUrl.pathname] || imageUrl
  } catch {
    return imageUrl
  }
}

