import { reactive, computed, onMounted, onUnmounted } from 'vue'

/**
 * 虚拟寿司盘列表计算
 * @param {Object} params
 * @param {Array} params.data - 数据源（寿司数组）
 * @param {Ref<number>} params.displayOffset - 水平偏移（像素）
 * @param {number} [params.itemWidth=200] - 每个盘子的宽度
 * @param {number} [params.gap=10] - 盘子之间的间隔
 * @param {number} [params.buffer=5] - 两侧缓冲渲染数量
 */
export function useVirtualPlates({ data, displayOffset, itemWidth = 200, gap = 10, buffer = 5 }) {
  const virtualScrollState = reactive({
    containerWidth: window.innerWidth * 2, // 初始设置为两倍窗口宽度，确保有足够的空间显示更多菜品
    itemWidth,
    gap,
    renderBuffer: buffer
  })

  // 监听窗口大小变化，更新containerWidth
  const handleResize = () => {
    virtualScrollState.containerWidth = window.innerWidth * 2
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
    handleResize() // 初始化containerWidth
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  const displayItems = computed(() => {
    const rawOffset = displayOffset.value
    const step = virtualScrollState.itemWidth + virtualScrollState.gap
    const data2 = data.value || []
    
    // 确保数据不为空
    if (data2.length === 0) {
      return []
    }

    // 计算容器宽度，确保有足够空间显示所有菜品
    const containerWidth = virtualScrollState.containerWidth || window.innerWidth * 2

    // 计算需要渲染的范围（相对于显示窗口）
    const leftBoundary = -rawOffset - (virtualScrollState.renderBuffer * step)
    const rightBoundary = -rawOffset + containerWidth + (virtualScrollState.renderBuffer * step)

    // 计算起始和结束的虚拟索引
    const startVirtualIndex = Math.floor(leftBoundary / step)
    const endVirtualIndex = Math.ceil(rightBoundary / step)
    
    const items = []
    for (let virtualIndex = startVirtualIndex; virtualIndex <= endVirtualIndex; virtualIndex++) {

      // 确保数据索引始终为正数
      const dataIndex = ((virtualIndex % data2.length) + data2.length) % data2.length
      const item = data2[dataIndex]

      // 每个项目相对于传送带的绝对位置
      const absolutePosition = virtualIndex * step
      if(!item) {
        continue
      }
      items.push({
        ...item,
        virtualIndex,
        uniqueKey: `${item.id}-${virtualIndex}`,
        transform: `translateX(${absolutePosition}px)`
      })
    }

    // 确保至少渲染一定数量的菜品
    const minItemsToRender = Math.min(30, data2.length * 2) // 最多渲染数据量的两倍，但不超过30个
    if (items.length < minItemsToRender) {
      // 如果渲染的项目不足，增加一些额外的项目
      const additionalItems = []
      const currentDataLength = data2.length
      for (let i = endVirtualIndex + 1; i <= endVirtualIndex + (minItemsToRender - items.length); i++) {
        const dataIndex = i % currentDataLength
        const item = data2[dataIndex]
        if (item) {
          const absolutePosition = i * step
          additionalItems.push({
            ...item,
            virtualIndex: i,
            uniqueKey: `${item.id}-${i}`,
            transform: `translateX(${absolutePosition}px)`
          })
        }
      }
      return [...items, ...additionalItems]
    }

    return items
  })

  return { virtualScrollState, displayItems }
}

