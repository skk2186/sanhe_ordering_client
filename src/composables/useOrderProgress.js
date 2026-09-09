import { onUnmounted, ref } from 'vue'

export function useOrderProgress() {
  const plateProgress = ref(0)
  const PROGRESS_PER_PLATE = 10 // 每碟进度 10%
  let resetTimer = null

  const applyOrder = (cartItems) => {
    const plateCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
    const delta = plateCount * PROGRESS_PER_PLATE
    const previousProgress = plateProgress.value
    plateProgress.value = Math.min(plateProgress.value + delta, 100)
    // 只在本轮首次跨过 100% 时发放资格，避免进度已满后再次下单重复触发。
    const reachedReward = previousProgress < 100 && plateProgress.value >= 100
    return { delta, reachedReward }
  }

  const clearResetTimer = () => {
    if (resetTimer) {
      clearTimeout(resetTimer)
      resetTimer = null
    }
  }

  const reset = () => {
    clearResetTimer()
    plateProgress.value = 0
  }

  const resetLater = (ms = 2000) => {
    clearResetTimer()
    resetTimer = setTimeout(reset, ms)
  }

  onUnmounted(clearResetTimer)

  return { plateProgress, applyOrder, reset, resetLater, clearResetTimer }
}
