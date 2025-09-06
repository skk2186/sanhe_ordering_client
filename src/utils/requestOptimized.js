import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useGlobalStore } from '@/stores/global'
import { apiOptimizer } from '@/utils/apiOptimizer'
import router from '@/router'
import NProgress from 'nprogress'

// 创建优化的axios实例
const service = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求ID生成器
let requestId = 0
const generateRequestId = () => ++requestId

// 活跃请求映射
const activeRequests = new Map()

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 生成请求ID
    config.requestId = generateRequestId()
    
    // 开发环境跳过某些请求
    if (import.meta.env.DEV && config.url?.includes('/auth/')) {
      console.log(`🚀 模拟API请求: ${config.method?.toUpperCase()} ${config.url}`)
      return config
    }
    
    // 开始进度条
    NProgress.start()
    
    // 设置全局加载状态
    const globalStore = useGlobalStore()
    globalStore.setLoading(true)
    
    // 添加认证token
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    
    // 记录活跃请求
    activeRequests.set(config.requestId, {
      url: config.url,
      method: config.method,
      timestamp: Date.now()
    })
    
    return config
  },
  error => {
    NProgress.done()
    const globalStore = useGlobalStore()
    globalStore.setLoading(false)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 清理活跃请求
    if (response.config.requestId) {
      activeRequests.delete(response.config.requestId)
    }
    
    // 结束进度条
    NProgress.done()
    
    // 设置全局加载状态
    const globalStore = useGlobalStore()
    if (activeRequests.size === 0) {
      globalStore.setLoading(false)
    }
    
    return response.data
  },
  error => {
    // 清理活跃请求
    if (error.config?.requestId) {
      activeRequests.delete(error.config.requestId)
    }
    
    // 结束进度条
    NProgress.done()
    
    // 设置全局加载状态
    const globalStore = useGlobalStore()
    if (activeRequests.size === 0) {
      globalStore.setLoading(false)
    }
    
    // 错误处理
    const { response } = error
    
    if (response) {
      switch (response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          const authStore = useAuthStore()
          authStore.logout()
          router.push('/login')
          break
        case 403:
          ElMessage.error('权限不足，无法访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(response.data?.message || '请求失败')
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('网络错误，请稍后重试')
    }
    
    return Promise.reject(error)
  }
)

/**
 * 优化的GET请求（支持缓存）
 */
export const get = (url, params = {}, options = {}) => {
  const { cache = true, ttl = 300000 } = options // 默认5分钟缓存
  
  if (cache) {
    const cacheKey = `GET:${url}:${JSON.stringify(params)}`
    return apiOptimizer.cachedRequest(
      cacheKey,
      () => service.get(url, { params }),
      ttl
    )
  }
  
  return service.get(url, { params })
}

/**
 * 优化的POST请求（支持去重）
 */
export const post = (url, data = {}, options = {}) => {
  const { dedupe = false } = options
  
  if (dedupe) {
    const dedupeKey = `POST:${url}:${JSON.stringify(data)}`
    return apiOptimizer.dedupeRequest(dedupeKey, () => service.post(url, data))
  }
  
  return service.post(url, data)
}

/**
 * PUT请求
 */
export const put = (url, data = {}) => {
  return service.put(url, data)
}

/**
 * DELETE请求
 */
export const del = (url, params = {}) => {
  return service.delete(url, { params })
}

/**
 * 批量请求
 */
export const batchRequest = (requests, options = {}) => {
  const { batchKey = 'default', delay = 100 } = options
  
  return apiOptimizer.batchRequest(
    batchKey,
    requests,
    (items) => Promise.all(items.map(req => service(req))),
    delay
  )
}

/**
 * 上传文件
 */
export const upload = (url, formData, onProgress) => {
  return service.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: onProgress
  })
}

/**
 * 下载文件
 */
export const download = (url, filename) => {
  return service.get(url, {
    responseType: 'blob'
  }).then(response => {
    const blob = new Blob([response])
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

/**
 * 取消所有请求
 */
export const cancelAllRequests = () => {
  activeRequests.clear()
  apiOptimizer.clearCache()
}

/**
 * 获取请求统计
 */
export const getRequestStats = () => {
  return {
    activeRequests: activeRequests.size,
    ...apiOptimizer.getCacheStats()
  }
}

export default service
