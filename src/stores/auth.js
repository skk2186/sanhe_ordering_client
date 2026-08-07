import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { t } from '@/i18n'
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

const backendTestAuthEnabled = import.meta.env.DEV && import.meta.env.VITE_USE_BACKEND_TEST_AUTH === 'true'
const testMemberId = Number(import.meta.env.VITE_TEST_MEMBER_ID || 24)
const testDeskNumber = import.meta.env.VITE_DESK_NUMBER || 'Y1'

const createBackendTestUser = (table = testDeskNumber) => ({
  id: testMemberId,
  tableNumber: String(table),
  role: 'CUSTOMER',
  name: `测试桌 ${table}`,
  permissions: ['menu:read', 'order:create'],
  roles: ['CUSTOMER']
})

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(backendTestAuthEnabled ? `test${testMemberId}` : (Cookies.get('token') || ''))
  const refreshToken = ref(Cookies.get('refreshToken') || '')
  const user = ref(backendTestAuthEnabled ? createBackendTestUser() : null)
  const permissions = ref(user.value?.permissions || [])
  const roles = ref(user.value?.roles || [])
  const tableNumber = ref(backendTestAuthEnabled
    ? testDeskNumber
    : (localStorage.getItem('tableNumber') || ''))
  
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

  const setBackendTestAuth = (table = testDeskNumber) => {
    const testUser = createBackendTestUser(table)
    setToken(`test${testMemberId}`, '')
    setUser(testUser)
    setTableNumber(String(table))
    localStorage.setItem('auth-token', token.value)
    localStorage.setItem('auth-user', JSON.stringify(testUser))
  }
  
  // 模拟登录方法（开发时使用）
  const login = async (credentials) => {
    try {
      if (backendTestAuthEnabled) {
        setBackendTestAuth()
        ElMessage.success(t('auth.loginSuccess'))
        return
      }
      
      const response = await authApi.login({
        mobile: credentials.mobile || credentials.username,
        password: credentials.password
      })
      const authData = response.data
      const userInfo = {
        ...(authData.userInfo || {}),
        id: authData.userId,
        role: 'CUSTOMER'
      }
      setToken(authData.accessToken, authData.refreshToken)
      setUser(userInfo)
      localStorage.setItem('auth-token', authData.accessToken)
      localStorage.setItem('auth-user', JSON.stringify(userInfo))
      
      ElMessage.success(t('auth.loginSuccess'))
      
    } catch (error) {
      console.error('登录失败:', error)
      ElMessage.error(error.message || t('auth.loginFailed'))
      throw error
    }
  }
  
  // 模拟顾客登录
  const customerLogin = async (tableNumber) => {
    try {
      if (backendTestAuthEnabled) {
        setBackendTestAuth(tableNumber || testDeskNumber)
        ElMessage.success(t('auth.tableLoginSuccess', { table: tableNumber }))
        return
      }
      
      // 生产环境调用真实API
      const response = await authApi.customerLogin({ tableNumber })
      
      user.value = response.data.user
      token.value = response.data.token
      
      localStorage.setItem('auth-token', response.data.token)
      localStorage.setItem('auth-user', JSON.stringify(response.data.user))
      
      ElMessage.success(t('auth.loginSuccess'))
      
    } catch (error) {
      console.error('顾客登录失败:', error)
      ElMessage.error(error.message || t('auth.loginFailed'))
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
      if (token.value && !backendTestAuthEnabled) {
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
      
      ElMessage.success(t('auth.logoutSuccess'))
    }
  }
  
  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      if (backendTestAuthEnabled) {
        setBackendTestAuth(tableNumber.value || testDeskNumber)
        return { code: 0, data: user.value }
      }
      const response = await authApi.getCurrentUser()
      setUser({ ...response.data, role: 'CUSTOMER' })
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
      if (backendTestAuthEnabled) return true
      await authApi.getCurrentUser()
      return true
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
    if (backendTestAuthEnabled) {
      setBackendTestAuth(tableNumber.value || testDeskNumber)
      return
    }
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
