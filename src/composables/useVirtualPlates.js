import { reactive, computed } from 'vue'

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
    containerWidth: 0,
    itemWidth,
    gap,
    renderBuffer: buffer
  })

  const displayItems = computed(() => {
    const rawOffset = displayOffset.value
    const step = virtualScrollState.itemWidth + virtualScrollState.gap
    
    // 计算相对于当前显示窗口的起始位置
    const containerWidth = virtualScrollState.containerWidth || window.innerWidth || 1920
    
    // 计算需要渲染的范围（相对于显示窗口）
    const leftBoundary = -rawOffset - (virtualScrollState.renderBuffer * step)
    const rightBoundary = -rawOffset + containerWidth + (virtualScrollState.renderBuffer * step)
    
    // 计算起始和结束的虚拟索引
    const startVirtualIndex = Math.floor(leftBoundary / step)
    const endVirtualIndex = Math.ceil(rightBoundary / step)
    
    const items = []
    for (let virtualIndex = startVirtualIndex; virtualIndex <= endVirtualIndex; virtualIndex++) {
      // 确保数据索引始终为正数
      const dataIndex = ((virtualIndex % data.length) + data.length) % data.length
      const item = data[dataIndex]
      
      // 每个项目相对于传送带的绝对位置
      const absolutePosition = virtualIndex * step
      
      items.push({
        ...item,
        virtualIndex,
        uniqueKey: `${item.id}-${virtualIndex}`,
        transform: `translateX(${absolutePosition}px)`
      })
    }
    
    // 调试信息已移除
    
    return items
  })

  return { virtualScrollState, displayItems }
}

