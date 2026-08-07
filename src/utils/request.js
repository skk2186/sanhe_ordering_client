import axios from 'axios'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { t } from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { useGlobalStore } from '@/stores/global'
import { apiOptimizer } from '@/utils/apiOptimizer'
import router from '@/router'
import NProgress from 'nprogress'

// 创建axios实例
const service = axios.create({
  baseURL: '', // 空字符串，使用完整路径
  timeout: 30000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
    'tenant-id': 1
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


    return config
  },
  error => {

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
    if (data.code !== undefined && data.code !== 0) {
      const errorMessage = data.message || t('errors.requestFailed')

      // 特殊错误码处理
      switch (data.code) {
        case 401:
          handleUnauthorized()
          break
        case 403:
          ElMessage.error(t('auth.permissionDenied'))
          break
        case 404:
          ElMessage.error(t('errors.resourceNotFound'))
          break
        case 500:
          ElMessage.error(t('errors.serverError'))
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
          ElMessage.error(data?.message || t('errors.badRequest'))
          break
        case 401:
          handleUnauthorized()
          break
        case 403:
          ElMessage.error(t('auth.permissionDenied'))
          break
        case 404:
          ElMessage.error(t('errors.endpointNotFound'))
          break
        case 408:
          ElMessage.error(t('errors.timeout'))
          break
        case 500:
          ElMessage.error(t('errors.serverError'))
          break
        case 502:
          ElMessage.error(t('errors.gatewayError'))
          break
        case 503:
          ElMessage.error(t('errors.serviceUnavailable'))
          break
        case 504:
          ElMessage.error(t('errors.gatewayTimeout'))
          break
        default:
          ElMessage.error(data?.message || t('errors.requestStatus', { status }))
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error(t('errors.timeoutNetwork'))
    } else if (error.message === 'Network Error') {
      ElMessage.error(t('errors.networkFailed'))
    } else {
      ElMessage.error(t('errors.requestFailed'))
    }

    return Promise.reject(error)
  }
)

// 处理未授权
function handleUnauthorized() {
  const authStore = useAuthStore()

  ElMessageBox.confirm(
    t('auth.sessionExpired'),
    t('common.prompt'),
    {
      confirmButtonText: t('auth.loginAgain'),
      cancelButtonText: t('common.cancel'),
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
