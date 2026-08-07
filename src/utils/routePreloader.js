/**
 * 路由预加载工具
 * 根据路由配置自动预加载关键页面
 */

class RoutePreloader {
  constructor() {
    this.preloadedRoutes = new Set()
    this.preloadQueue = []
    this.isPreloading = false
  }

  /**
   * 预加载指定路由
   * @param {Function} componentLoader - 组件加载函数
   * @param {string} routeName - 路由名称
   * @param {number} priority - 优先级 (1-10, 数字越大优先级越高)
   */
  preloadRoute(componentLoader, routeName, priority = 5) {
    if (this.preloadedRoutes.has(routeName)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.preloadQueue.push({
        loader: componentLoader,
        name: routeName,
        priority,
        resolve,
        reject
      })

      // 按优先级排序
      this.preloadQueue.sort((a, b) => b.priority - a.priority)

      if (!this.isPreloading) {
        this.processQueue()
      }
    })
  }

  /**
   * 处理预加载队列
   */
  async processQueue() {
    if (this.preloadQueue.length === 0) {
      this.isPreloading = false
      return
    }

    this.isPreloading = true
    const item = this.preloadQueue.shift()

    try {
      // 使用 requestIdleCallback 在空闲时预加载
      if (window.requestIdleCallback) {
        window.requestIdleCallback(async () => {
          await this.loadComponent(item)
          this.processQueue()
        })
      } else {
        // 降级方案
        setTimeout(async () => {
          await this.loadComponent(item)
          this.processQueue()
        }, 100)
      }
    } catch (error) {
      console.warn(`预加载路由 ${item.name} 失败:`, error)
      item.reject(error)
      this.processQueue()
    }
  }

  /**
   * 加载组件
   */
  async loadComponent(item) {
    try {
      await item.loader()
      this.preloadedRoutes.add(item.name)
      item.resolve()
      if (import.meta.env.DEV) {
        console.log(`✅ 路由 ${item.name} 预加载完成`)
      }
    } catch (error) {
      // 静默处理预加载失败，不影响用户体验
      if (import.meta.env.DEV) {
        console.warn(`❌ 路由 ${item.name} 预加载失败:`, error)
      }
      item.reject(error)
    }
  }

  /**
   * 预加载关键路由
   * @param {Array} routes - 路由配置数组
   */
  preloadCriticalRoutes(routes) {
    routes.forEach(route => {
      if (route.meta?.preload) {
        const priority = route.meta.preload === true ? 5 : route.meta.preload
        this.preloadRoute(route.component, route.name, priority)
      }

      // 递归处理子路由
      if (route.children) {
        this.preloadCriticalRoutes(route.children)
      }
    })
  }

  /**
   * 清理预加载缓存
   */
  clearCache() {
    this.preloadedRoutes.clear()
    this.preloadQueue = []
  }
}

export const routePreloader = new RoutePreloader()

/**
 * 路由预加载插件
 */
export function createRoutePreloader() {
  return {
    install(app) {
      app.config.globalProperties.$preloader = routePreloader
      app.provide('routePreloader', routePreloader)
    }
  }
}
