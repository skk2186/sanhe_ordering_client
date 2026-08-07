import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 图片懒加载组合函数
 * 使用Intersection Observer API实现高性能图片懒加载
 */
export function useImageLazyLoad(options = {}) {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    placeholder = '/images/placeholder.jpg'
  } = options

  const observer = ref(null)
  const loadedImages = new Set()

  // 创建Intersection Observer
  const createObserver = () => {
    if (!window.IntersectionObserver) return null

    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          const src = img.dataset.src
          
          if (src && !loadedImages.has(src)) {
            // 预加载图片
            const imageLoader = new Image()
            imageLoader.onload = () => {
              img.src = src
              img.classList.add('loaded')
              loadedImages.add(src)
              observer.value?.unobserve(img)
            }
            imageLoader.onerror = () => {
              img.src = placeholder
              img.classList.add('error')
              observer.value?.unobserve(img)
            }
            imageLoader.src = src
          }
        }
      })
    }, {
      rootMargin,
      threshold
    })
  }

  // 观察图片元素
  const observeImage = (imgElement) => {
    if (observer.value && imgElement) {
      observer.value.observe(imgElement)
    }
  }

  // 取消观察图片元素
  const unobserveImage = (imgElement) => {
    if (observer.value && imgElement) {
      observer.value.unobserve(imgElement)
    }
  }

  // 预加载指定图片列表
  const preloadImages = (imageUrls) => {
    imageUrls.forEach(url => {
      if (!loadedImages.has(url)) {
        const img = new Image()
        img.onload = () => loadedImages.add(url)
        img.src = url
      }
    })
  }

  onMounted(() => {
    observer.value = createObserver()
  })

  onUnmounted(() => {
    if (observer.value) {
      observer.value.disconnect()
    }
  })

  return {
    observeImage,
    unobserveImage,
    preloadImages,
    loadedImages: () => Array.from(loadedImages)
  }
}
