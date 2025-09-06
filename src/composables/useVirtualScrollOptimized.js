import { ref, computed, watch } from 'vue'

/**
 * 优化的虚拟滚动组合函数
 * 使用更高效的算法和缓存策略
 */
export function useVirtualScrollOptimized(options) {
  const {
    data,
    displayOffset,
    itemWidth = 200,
    gap = 10,
    buffer = 3, // 减少缓冲区大小
    containerWidth = 1200
  } = options

  // 缓存计算结果
  const cache = new Map()
  const lastOffset = ref(0)
  const lastDataLength = ref(0)

  // 计算可见区域的项目
  const visibleItems = computed(() => {
    const offset = displayOffset.value
    const dataLength = data.length
    
    // 如果数据没有变化且偏移量变化很小，使用缓存
    const cacheKey = `${Math.floor(offset / 50)}_${dataLength}`
    if (cache.has(cacheKey) && 
        Math.abs(offset - lastOffset.value) < 10 && 
        dataLength === lastDataLength.value) {
      return cache.get(cacheKey)
    }

    const itemTotalWidth = itemWidth + gap
    const totalWidth = itemTotalWidth * dataLength
    
    // 计算可见范围
    const startIndex = Math.floor(Math.abs(offset) / itemTotalWidth) - buffer
    const endIndex = Math.ceil((Math.abs(offset) + containerWidth) / itemTotalWidth) + buffer
    
    // 生成显示项目（支持无限循环）
    const items = []
    for (let i = startIndex; i <= endIndex; i++) {
      const dataIndex = ((i % dataLength) + dataLength) % dataLength
      const position = i * itemTotalWidth
      
      items.push({
        ...data[dataIndex],
        virtualIndex: i,
        position,
        key: `${dataIndex}_${i}` // 优化的key生成
      })
    }

    // 缓存结果
    cache.set(cacheKey, items)
    
    // 清理旧缓存（保持缓存大小）
    if (cache.size > 10) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    lastOffset.value = offset
    lastDataLength.value = dataLength
    
    return items
  })

  // 监听数据变化，清理缓存
  watch(() => data.length, () => {
    cache.clear()
  })

  return {
    displayItems: visibleItems,
    clearCache: () => cache.clear()
  }
}
