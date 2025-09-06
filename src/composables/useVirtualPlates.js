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
    const currentOffset = Math.abs(displayOffset.value)
    const step = virtualScrollState.itemWidth + virtualScrollState.gap
    const startIndex = Math.floor(currentOffset / step)

    const containerWidth = virtualScrollState.containerWidth || window.innerWidth || 1920
    const visibleCount = Math.ceil(containerWidth / step) + virtualScrollState.renderBuffer * 2

    const items = []
    for (let i = 0; i < visibleCount; i++) {
      const dataIndex = (startIndex + i) % data.length
      const item = data[dataIndex]
      const virtualIndex = startIndex + i
      items.push({
        ...item,
        virtualIndex,
        uniqueKey: `${item.id}-${virtualIndex}`,
        transform: `translateX(${virtualIndex * step}px)`
      })
    }
    return items
  })

  return { virtualScrollState, displayItems }
}

