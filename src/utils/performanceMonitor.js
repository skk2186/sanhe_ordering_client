/**
 * 性能监控工具
 * 监控页面加载、组件渲染、API请求等性能指标
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.observers = []
    this.isEnabled = true
    this.reportInterval = 30000 // 30秒上报一次
    this.maxMetrics = 1000 // 最大存储指标数量
    
    this.init()
  }

  init() {
    if (!this.isEnabled) return

    // 监控页面加载性能
    this.observePageLoad()
    
    // 监控长任务
    this.observeLongTasks()
    
    // 监控资源加载
    this.observeResourceTiming()
    
    // 监控内存使用
    this.observeMemoryUsage()
    
    // 定期上报性能数据
    this.startReporting()
  }

  /**
   * 记录性能指标
   */
  recordMetric(name, value, type = 'timing', tags = {}) {
    const metric = {
      name,
      value,
      type,
      tags,
      timestamp: Date.now(),
      url: window.location.pathname
    }

    this.metrics.set(`${name}_${Date.now()}`, metric)
    
    // 限制存储数量
    if (this.metrics.size > this.maxMetrics) {
      const firstKey = this.metrics.keys().next().value
      this.metrics.delete(firstKey)
    }

    // 开发环境下输出到控制台
    if (import.meta.env.DEV) {
      console.log(`📊 Performance: ${name} = ${value}${type === 'timing' ? 'ms' : ''}`, tags)
    }
  }

  /**
   * 监控页面加载性能
   */
  observePageLoad() {
    if (!window.performance) return

    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.timing
        const navigation = performance.getEntriesByType('navigation')[0]

        // 记录关键时间点
        this.recordMetric('page_load_time', timing.loadEventEnd - timing.navigationStart)
        this.recordMetric('dom_ready_time', timing.domContentLoadedEventEnd - timing.navigationStart)
        this.recordMetric('first_paint', navigation?.responseStart - navigation?.requestStart || 0)
        
        // Web Vitals
        this.observeWebVitals()
      }, 0)
    })
  }

  /**
   * 监控Web Vitals
   */
  observeWebVitals() {
    // FCP (First Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fcp = entries.find(entry => entry.name === 'first-contentful-paint')
          if (fcp) {
            this.recordMetric('first_contentful_paint', fcp.startTime)
          }
        })
        fcpObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(fcpObserver)
      } catch (e) {
        console.warn('FCP observer failed:', e)
      }

      // LCP (Largest Contentful Paint)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          if (lastEntry) {
            this.recordMetric('largest_contentful_paint', lastEntry.startTime)
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn('LCP observer failed:', e)
      }

      // CLS (Cumulative Layout Shift)
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          }
          this.recordMetric('cumulative_layout_shift', clsValue)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (e) {
        console.warn('CLS observer failed:', e)
      }
    }
  }

  /**
   * 监控长任务
   */
  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('long_task', entry.duration, 'timing', {
              name: entry.name,
              startTime: entry.startTime
            })
          }
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.push(longTaskObserver)
      } catch (e) {
        console.warn('Long task observer failed:', e)
      }
    }
  }

  /**
   * 监控资源加载
   */
  observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 1000) { // 只记录超过1秒的资源
              this.recordMetric('slow_resource', entry.duration, 'timing', {
                name: entry.name,
                type: entry.initiatorType,
                size: entry.transferSize
              })
            }
          }
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)
      } catch (e) {
        console.warn('Resource observer failed:', e)
      }
    }
  }

  /**
   * 监控内存使用
   */
  observeMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory
        this.recordMetric('memory_used', memory.usedJSHeapSize, 'bytes')
        this.recordMetric('memory_total', memory.totalJSHeapSize, 'bytes')
        this.recordMetric('memory_limit', memory.jsHeapSizeLimit, 'bytes')
      }, 10000) // 每10秒检查一次
    }
  }

  /**
   * 记录组件渲染时间
   */
  measureComponent(componentName, renderFn) {
    const startTime = performance.now()
    
    return Promise.resolve(renderFn()).then(result => {
      const endTime = performance.now()
      this.recordMetric('component_render', endTime - startTime, 'timing', {
        component: componentName
      })
      return result
    })
  }

  /**
   * 记录API请求性能
   */
  measureAPI(apiName, requestFn) {
    const startTime = performance.now()
    
    return Promise.resolve(requestFn()).then(result => {
      const endTime = performance.now()
      this.recordMetric('api_request', endTime - startTime, 'timing', {
        api: apiName,
        status: 'success'
      })
      return result
    }).catch(error => {
      const endTime = performance.now()
      this.recordMetric('api_request', endTime - startTime, 'timing', {
        api: apiName,
        status: 'error'
      })
      throw error
    })
  }

  /**
   * 获取性能报告
   */
  getReport() {
    const metrics = Array.from(this.metrics.values())
    const now = Date.now()
    const last5Minutes = metrics.filter(m => now - m.timestamp < 300000)

    const report = {
      timestamp: now,
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      metrics: last5Minutes,
      summary: this.generateSummary(last5Minutes)
    }

    return report
  }

  /**
   * 生成性能摘要
   */
  generateSummary(metrics) {
    const summary = {}
    
    // 按类型分组
    const groups = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = []
      acc[metric.name].push(metric.value)
      return acc
    }, {})

    // 计算统计信息
    Object.keys(groups).forEach(name => {
      const values = groups[name]
      summary[name] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p95: this.percentile(values, 0.95)
      }
    })

    return summary
  }

  /**
   * 计算百分位数
   */
  percentile(arr, p) {
    const sorted = arr.slice().sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[index] || 0
  }

  /**
   * 开始定期上报
   */
  startReporting() {
    setInterval(() => {
      const report = this.getReport()
      
      // 发送到性能监控服务
      if (import.meta.env.PROD) {
        this.sendReport(report)
      }
      
      // 清理旧数据
      this.cleanOldMetrics()
    }, this.reportInterval)
  }

  /**
   * 发送性能报告
   */
  async sendReport(report) {
    try {
      // 这里可以发送到实际的监控服务
      console.log('📊 Performance Report:', report)
      
      // 示例：发送到监控API
      // await fetch('/api/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report)
      // })
    } catch (error) {
      console.warn('Failed to send performance report:', error)
    }
  }

  /**
   * 清理旧指标
   */
  cleanOldMetrics() {
    const now = Date.now()
    const oneHourAgo = now - 3600000
    
    for (const [key, metric] of this.metrics.entries()) {
      if (metric.timestamp < oneHourAgo) {
        this.metrics.delete(key)
      }
    }
  }

  /**
   * 销毁监控器
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics.clear()
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Vue插件
export function createPerformanceMonitor() {
  return {
    install(app) {
      app.config.globalProperties.$performance = performanceMonitor
      app.provide('performanceMonitor', performanceMonitor)
      
      // 全局错误处理
      app.config.errorHandler = (err, vm, info) => {
        performanceMonitor.recordMetric('vue_error', 1, 'count', {
          error: err.message,
          info
        })
        console.error('Vue Error:', err, info)
      }
    }
  }
}
