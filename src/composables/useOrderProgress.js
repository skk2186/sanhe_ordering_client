import { ref } from 'vue'

export function useOrderProgress() {
  const plateProgress = ref(0)
  const PROGRESS_PER_PLATE = 10 // 每碟进度 10%

  const applyOrder = (cartItems) => {
    const plateCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
    const delta = plateCount * PROGRESS_PER_PLATE
    plateProgress.value = Math.min(plateProgress.value + delta, 100)
    const reachedReward = plateProgress.value >= 100
    return { delta, reachedReward }
  }

  const resetLater = (ms = 2000) => {
    setTimeout(() => {
      plateProgress.value = 0
    }, ms)
  }

  return { plateProgress, applyOrder, resetLater }
}

