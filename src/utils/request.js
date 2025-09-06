import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useGlobalStore } from '@/stores/global'
import { apiOptimizer } from '@/utils/apiOptimizer'
import router from '@/router'
import NProgress from 'nprogress'

// 创建axios实例
const service = axios.create({
  baseURL: '/api', // API网关地址
  timeout: 30000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
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
    
    // 添加请求ID用于追踪
    config.headers['X-Request-ID'] = generateRequestId()
    
    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }
    
    console.log(`🚀 API请求: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data
    })
    
    return config
  },
  error => {
    NProgress.done()
    const globalStore = useGlobalStore()
    globalStore.setLoading(false)
    
    console.error('❌ 请求配置错误:', error)
    ElMessage.error('请求配置错误')
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 结束进度条
    NProgress.done()
    
    // 关闭全局加载状态
    const globalStore = useGlobalStore()
    globalStore.setLoading(false)
    
    const { data, config } = response
    
    console.log(`✅ API响应: ${config.method?.toUpperCase()} ${config.url}`, data)
    
    // 检查业务状态码
    if (data.code !== undefined && data.code !== 200) {
      const errorMessage = data.message || '请求失败'
      
      // 特殊错误码处理
      switch (data.code) {
        case 401:
          handleUnauthorized()
          break
        case 403:
          ElMessage.error('权限不足')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(errorMessage)
      }
      
      return Promise.reject(new Error(errorMessage))
    }
    
    return data
  },
  error => {
    // 结束进度条
    NProgress.done()
    
    // 关闭全局加载状态
    const globalStore = useGlobalStore()
    globalStore.setLoading(false)
    
    console.error('❌ API响应错误:', error)
    
    const { response, config } = error
    
    if (response) {
      const { status, data } = response
      
      switch (status) {
        case 400:
          ElMessage.error(data?.message || '请求参数错误')
          break
        case 401:
          handleUnauthorized()
          break
        case 403:
          ElMessage.error('权限不足，无法访问')
          break
        case 404:
          ElMessage.error('请求的接口不存在')
          break
        case 408:
          ElMessage.error('请求超时，请稍后重试')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        case 502:
          ElMessage.error('网关错误')
          break
        case 503:
          ElMessage.error('服务暂不可用')
          break
        case 504:
          ElMessage.error('网关超时')
          break
        default:
          ElMessage.error(data?.message || `请求失败 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else if (error.message === 'Network Error') {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error('请求失败，请稍后重试')
    }
    
    return Promise.reject(error)
  }
)

// 处理未授权
function handleUnauthorized() {
  const authStore = useAuthStore()
  
  ElMessageBox.confirm(
    '登录状态已过期，请重新登录',
    '系统提示',
    {
      confirmButtonText: '重新登录',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    authStore.logout()
    router.push('/login')
  }).catch(() => {
    // 用户取消，不做处理
  })
}

// 生成请求ID
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

// 请求方法封装
export const request = {
  get(url, params = {}, config = {}) {
    return service.get(url, { params, ...config })
  },
  
  post(url, data = {}, config = {}) {
    return service.post(url, data, config)
  },
  
  put(url, data = {}, config = {}) {
    return service.put(url, data, config)
  },
  
  delete(url, config = {}) {
    return service.delete(url, config)
  },
  
  upload(url, formData, config = {}) {
    return service.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    })
  }
}

export default service

