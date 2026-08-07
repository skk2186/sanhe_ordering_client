import { onMounted, onUnmounted, nextTick } from 'vue'

export function useConveyorLifecycle({ beltTrackRef, virtualScrollState, belt }) {
  let resizeObserver = null
  const updateWidth = () => {
    if (beltTrackRef?.value) {
      virtualScrollState.containerWidth = beltTrackRef.value.offsetWidth || 0
    }
  }

  onMounted(() => {
    nextTick(() => {
      updateWidth()
      belt.start()
      // 监听容器尺寸变化
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(() => updateWidth())
        if (beltTrackRef.value) resizeObserver.observe(beltTrackRef.value)
      } else {
        // 回退方案：window resize
        window.addEventListener('resize', updateWidth)
      }
    })
  })

  onUnmounted(() => {
    belt.stop()
    if (resizeObserver) {
      try { resizeObserver.disconnect() } catch {}
      resizeObserver = null
    } else {
      window.removeEventListener('resize', updateWidth)
    }
  })
}

