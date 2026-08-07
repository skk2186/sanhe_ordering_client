import { request } from '@/utils/request'

/**
 * 认证相关API
 * 对接后端用户服务的8个认证接口
 */
export const authApi = {
  /**
   * 员工登录
   * @param {Object} data - 登录数据
   * @param {string} data.username - 用户名
   * @param {string} data.password - 密码
   */
  login(data) {
    return request.post('/app-api/member/auth/login', data)
  },

  /**
   * 顾客桌号登录
   * @param {Object} data - 登录数据
   * @param {number} data.tableNumber - 桌号
   */
  customerLogin(data) {
    return request.post('/auth/customer-login', data)
  },

  /**
   * 刷新令牌
   * @param {Object} data - 刷新数据
   * @param {string} data.refreshToken - 刷新令牌
   */
  refreshToken(data) {
    return request.post('/app-api/member/auth/refresh-token', {}, {
      params: { refreshToken: data.refreshToken }
    })
  },

  /**
   * 用户登出
   */
  logout() {
    return request.post('/app-api/member/auth/logout')
  },

  /**
   * 验证令牌
   * @param {Object} data - 验证数据
   * @param {string} data.token - 访问令牌
   */
  validateToken(data) {
    return request.post('/auth/validate', data)
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser() {
    return request.get('/app-api/member/user/get')
  },

  /**
   * 检查权限
   * @param {Object} data - 权限数据
   * @param {string} data.permission - 权限代码
   */
  checkPermission(data) {
    return request.post('/auth/check-permission', data)
  },

  /**
   * 检查角色
   * @param {Object} data - 角色数据
   * @param {string} data.role - 角色代码
   */
  checkRole(data) {
    return request.post('/auth/check-role', data)
  }
}
