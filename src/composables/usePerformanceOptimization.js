import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { performanceMonitor } from '@/utils/performanceMonitor'

/**
 * 性能优化组合函数
 * 为Vue组件提供性能监控和优化功能
 */
export function usePerformanceOptimization(componentName) {
  const renderTime = ref(0)
  const isOptimized = ref(false)
  
  let renderStartTime = 0
  let frameId = null
  
  // 开始渲染计时
  const startRenderTiming = () => {
    renderStartTime = performance.now()
  }
  
  // 结束渲染计时
  const endRenderTiming = () => {
    if (renderStartTime > 0) {
      renderTime.value = performance.now() - renderStartTime
      performanceMonitor.recordMetric('component_render', renderTime.value, 'timing', {
        component: componentName
      })
      renderStartTime = 0
    }
  }
  
  // 优化渲染性能
  const optimizeRender = (callback) => {
    return new Promise((resolve) => {
      startRenderTiming()
      
      // 使用 requestAnimationFrame 优化渲染
      frameId = requestAnimationFrame(() => {
        nextTick(() => {
          try {
            const result = callback()
            endRenderTiming()
            resolve(result)
          } catch (error) {
            endRenderTiming()
            performanceMonitor.recordMetric('component_error', 1, 'count', {
              component: componentName,
              error: error.message
            })
            throw error
          }
        })
      })
    })
  }
  
  // 防抖函数
  const debounce = (func, delay = 300) => {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  }
  
  // 节流函数
  const throttle = (func, delay = 100) => {
    let lastCall = 0
    return (...args) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        return func.apply(this, args)
      }
    }
  }
  
  // 内存泄漏检测
  const checkMemoryLeak = () => {
    if ('memory' in performance) {
      const memory = performance.memory
      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
      
      if (memoryUsage > 0.8) {
        performanceMonitor.recordMetric('memory_warning', memoryUsage, 'ratio', {
          component: componentName
        })
        console.warn(`⚠️ 组件 ${componentName} 内存使用率过高: ${(memoryUsage * 100).toFixed(2)}%`)
      }
    }
  }
  
  // 组件挂载时开始监控
  onMounted(() => {
    startRenderTiming()
    
    // 检查内存使用
    setTimeout(checkMemoryLeak, 1000)
    
    nextTick(() => {
      endRenderTiming()
      isOptimized.value = true
    })
  })
  
  // 组件卸载时清理
  onUnmounted(() => {
    if (frameId) {
      cancelAnimationFrame(frameId)
    }
    
    performanceMonitor.recordMetric('component_unmount', 1, 'count', {
      component: componentName
    })
  })
  
  return {
    renderTime,
    isOptimized,
    optimizeRender,
    debounce,
    throttle,
    checkMemoryLeak
  }
}
