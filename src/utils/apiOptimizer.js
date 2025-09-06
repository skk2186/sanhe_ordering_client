/**
 * API请求优化工具
 * 提供请求缓存、去重、批量处理等功能
 */

class APIOptimizer {
  constructor() {
    this.cache = new Map()
    this.pendingRequests = new Map()
    this.batchQueue = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
  }

  /**
   * 缓存GET请求
   * @param {string} key - 缓存键
   * @param {Function} requestFn - 请求函数
   * @param {number} ttl - 缓存时间(毫秒)
   */
  async cachedRequest(key, requestFn, ttl = this.cacheTimeout) {
    // 检查缓存
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data
    }

    // 检查是否有相同的请求正在进行
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)
    }

    // 发起新请求
    const promise = requestFn().then(data => {
      // 缓存结果
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      })
      
      // 清理pending请求
      this.pendingRequests.delete(key)
      
      return data
    }).catch(error => {
      // 清理pending请求
      this.pendingRequests.delete(key)
      throw error
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * 批量请求处理
   * @param {string} batchKey - 批量键
   * @param {Array} items - 请求项目
   * @param {Function} batchFn - 批量处理函数
   * @param {number} delay - 延迟时间(毫秒)
   */
  batchRequest(batchKey, items, batchFn, delay = 100) {
    return new Promise((resolve, reject) => {
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, {
          items: [],
          promises: [],
          timer: null
        })
      }

      const batch = this.batchQueue.get(batchKey)
      batch.items.push(...items)
      batch.promises.push({ resolve, reject })

      // 清除之前的定时器
      if (batch.timer) {
        clearTimeout(batch.timer)
      }

      // 设置新的定时器
      batch.timer = setTimeout(async () => {
        const allItems = [...batch.items]
        const allPromises = [...batch.promises]
        
        // 清理批量队列
        this.batchQueue.delete(batchKey)

        try {
          const results = await batchFn(allItems)
          allPromises.forEach(({ resolve }) => resolve(results))
        } catch (error) {
          allPromises.forEach(({ reject }) => reject(error))
        }
      }, delay)
    })
  }

  /**
   * 请求去重
   * @param {string} key - 请求键
   * @param {Function} requestFn - 请求函数
   */
  dedupeRequest(key, requestFn) {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 清理所有缓存
   */
  clearCache() {
    this.cache.clear()
    this.pendingRequests.clear()
    this.batchQueue.clear()
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      batchQueues: this.batchQueue.size
    }
  }
}

export const apiOptimizer = new APIOptimizer()

// 定期清理过期缓存
setInterval(() => {
  apiOptimizer.cleanExpiredCache()
}, 60000) // 每分钟清理一次
