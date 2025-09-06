import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { ElMessage } from 'element-plus'
// import Cookies from 'js-cookie'

// 简单的Cookie操作函数
const Cookies = {
  set(name, value, options = {}) {
    let cookieString = `${name}=${value}`
    if (options.expires) {
      const date = new Date()
      date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000))
      cookieString += `; expires=${date.toUTCString()}`
    }
    cookieString += '; path=/'
    document.cookie = cookieString
  },

  get(name) {
    const nameEQ = name + "="
    const ca = document.cookie.split(';')
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  },

  remove(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  }
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(Cookies.get('token') || '')
  const refreshToken = ref(Cookies.get('refreshToken') || '')
  const user = ref(null)
  const permissions = ref([])
  const roles = ref([])
  const tableNumber = ref(localStorage.getItem('tableNumber') || '')
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isEmployee = computed(() => user.value?.role !== 'CUSTOMER')
  const isCustomer = computed(() => user.value?.role === 'CUSTOMER')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isManager = computed(() => user.value?.role === 'MANAGER')
  const isWaiter = computed(() => user.value?.role === 'WAITER')
  const isChef = computed(() => user.value?.role === 'CHEF')
  
  // 设置令牌
  const setToken = (newToken, newRefreshToken) => {
    token.value = newToken
    refreshToken.value = newRefreshToken
    
    // 保存到Cookie
    Cookies.set('token', newToken, { expires: 7 })
    Cookies.set('refreshToken', newRefreshToken, { expires: 30 })
  }
  
  // 设置用户信息
  const setUser = (userInfo) => {
    user.value = userInfo
    permissions.value = userInfo.permissions || []
    roles.value = userInfo.roles || []
  }
  
  // 模拟登录方法（开发时使用）
  const login = async (credentials) => {
    try {
      // 开发环境模拟登录
      if (import.meta.env.DEV) {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 模拟登录成功
        const mockUser = {
          id: 1,
          username: credentials.username,
          name: '管理员',
          role: 'ADMIN',
          permissions: ['menu:read', 'menu:write', 'order:read', 'order:write']
        }
        
        const mockToken = 'mock-jwt-token-' + Date.now()
        
        // 设置用户信息和token
        user.value = mockUser
        token.value = mockToken
        
        // 保存到本地存储
        localStorage.setItem('auth-token', mockToken)
        localStorage.setItem('auth-user', JSON.stringify(mockUser))
        
        ElMessage.success('登录成功')
        return
      }
      
      // 生产环境调用真实API
      const response = await request.post('/auth/login', credentials)
      
      user.value = response.data.user
      token.value = response.data.token
      
      localStorage.setItem('auth-token', response.data.token)
      localStorage.setItem('auth-user', JSON.stringify(response.data.user))
      
      ElMessage.success('登录成功')
      
    } catch (error) {
      console.error('登录失败:', error)
      ElMessage.error(error.message || '登录失败')
      throw error
    }
  }
  
  // 模拟顾客登录
  const customerLogin = async (tableNumber) => {
    try {
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const mockCustomer = {
          id: tableNumber,
          tableNumber,
          role: 'CUSTOMER',
          name: `桌号${tableNumber}`,
          permissions: ['menu:read', 'order:create']
        }
        
        const mockToken = 'mock-customer-token-' + tableNumber + '-' + Date.now()
        
        user.value = mockCustomer
        token.value = mockToken
        
        localStorage.setItem('auth-token', mockToken)
        localStorage.setItem('auth-user', JSON.stringify(mockCustomer))
        
        ElMessage.success(`桌号${tableNumber}登录成功`)
        return
      }
      
      // 生产环境调用真实API
      const response = await request.post('/auth/customer-login', { tableNumber })
      
      user.value = response.data.user
      token.value = response.data.token
      
      localStorage.setItem('auth-token', response.data.token)
      localStorage.setItem('auth-user', JSON.stringify(response.data.user))
      
      ElMessage.success('登录成功')
      
    } catch (error) {
      console.error('顾客登录失败:', error)
      ElMessage.error(error.message || '登录失败')
      throw error
    }
  }
  
  // 刷新令牌
  const refreshTokenAction = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error('没有刷新令牌')
      }
      
      const response = await authApi.refreshToken({ refreshToken: refreshToken.value })
      const { token: newToken, refreshToken: newRefreshToken } = response.data
      
      setToken(newToken, newRefreshToken)
      return response
    } catch (error) {
      console.error('刷新令牌失败:', error)
      logout()
      throw error
    }
  }
  
  // 登出
  const logout = async () => {
    try {
      if (token.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      // 清除状态
      token.value = ''
      refreshToken.value = ''
      user.value = null
      permissions.value = []
      roles.value = []
      
      // 清除Cookie
      Cookies.remove('token')
      Cookies.remove('refreshToken')
      
      ElMessage.success('已退出登录')
    }
  }
  
  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser()
      setUser(response.data)
      return response
    } catch (error) {
      console.error('获取用户信息失败:', error)
      logout()
      throw error
    }
  }
  
  // 验证令牌
  const validateToken = async () => {
    try {
      const response = await authApi.validateToken()
      return response.data
    } catch (error) {
      console.error('令牌验证失败:', error)
      logout()
      return false
    }
  }
  
  // 检查权限
  const hasPermission = (permission) => {
    if (!permission) return true
    if (isAdmin.value) return true
    return permissions.value.includes(permission)
  }
  
  // 检查多个权限（任一）
  const hasAnyPermission = (permissionList) => {
    if (!permissionList || permissionList.length === 0) return true
    if (isAdmin.value) return true
    return permissionList.some(permission => permissions.value.includes(permission))
  }
  
  // 检查多个权限（全部）
  const hasAllPermissions = (permissionList) => {
    if (!permissionList || permissionList.length === 0) return true
    if (isAdmin.value) return true
    return permissionList.every(permission => permissions.value.includes(permission))
  }
  
  // 检查角色
  const hasRole = (role) => {
    if (!role) return true
    return roles.value.includes(role) || user.value?.role === role
  }
  
  // 检查多个角色（任一）
  const hasAnyRole = (roleList) => {
    if (!roleList || roleList.length === 0) return true
    return roleList.some(role => hasRole(role))
  }
  
  // 初始化认证状态
  const initAuth = async () => {
    if (token.value) {
      try {
        await getCurrentUser()
      } catch (error) {
        console.error('初始化认证状态失败:', error)
        logout()
      }
    }
  }

  // 桌号相关方法
  const setTableNumber = (number) => {
    tableNumber.value = number
    localStorage.setItem('tableNumber', number)
  }

  const clearTableNumber = () => {
    tableNumber.value = ''
    localStorage.removeItem('tableNumber')
  }

  const getTableNumber = () => {
    return tableNumber.value
  }
  
  return {
    // 状态
    token,
    refreshToken,
    user,
    permissions,
    roles,
    tableNumber,

    // 计算属性
    isLoggedIn,
    isEmployee,
    isCustomer,
    isAdmin,
    isManager,
    isWaiter,
    isChef,

    // 方法
    setToken,
    setUser,
    login,
    customerLogin,
    refreshTokenAction,
    logout,
    getCurrentUser,
    validateToken,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    initAuth,

    // 桌号相关方法
    setTableNumber,
    clearTableNumber,
    getTableNumber
  }
})


