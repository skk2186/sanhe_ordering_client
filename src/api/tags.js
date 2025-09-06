import { request } from '@/utils/request'

/**
 * 标签相关API
 * 对接后端菜品服务的标签管理接口
 */
export const tagsApi = {
  /**
   * 获取菜品的所有标签
   * @param {number} menuItemId - 菜品ID
   */
  getTagsByMenuItemId(menuItemId) {
    return request.get(`/menu-item-tags/menu-item/${menuItemId}`)
  },

  /**
   * 获取菜品的标签名称列表
   * @param {number} menuItemId - 菜品ID
   */
  getTagNamesByMenuItemId(menuItemId) {
    return request.get(`/menu-item-tags/menu-item/${menuItemId}/names`)
  },

  /**
   * 根据标签名称获取菜品ID列表
   * @param {string} tagName - 标签名称
   */
  getMenuItemIdsByTagName(tagName) {
    return request.get(`/menu-item-tags/tag/${tagName}/menu-items`)
  },

  /**
   * 根据多个标签名称获取菜品ID列表（交集）
   * @param {Array} tagNames - 标签名称数组
   */
  getMenuItemIdsByTagNames(tagNames) {
    return request.post('/menu-item-tags/tags/menu-items', tagNames)
  },

  /**
   * 获取所有标签名称
   */
  getAllTagNames() {
    return request.get('/menu-item-tags/names')
  },

  /**
   * 获取热门标签
   * @param {number} limit - 限制数量
   */
  getPopularTags(limit = 10) {
    return request.get('/menu-item-tags/popular', { limit })
  },

  /**
   * 获取标签使用统计
   */
  getTagUsageStatistics() {
    return request.get('/menu-item-tags/statistics')
  },

  /**
   * 为菜品添加标签
   * @param {number} menuItemId - 菜品ID
   * @param {string} tagName - 标签名称
   * @param {string} tagColor - 标签颜色
   */
  addTagToMenuItem(menuItemId, tagName, tagColor) {
    return request.post(`/menu-item-tags/menu-item/${menuItemId}`, {
      tagName,
      tagColor
    })
  },

  /**
   * 为菜品批量添加标签
   * @param {number} menuItemId - 菜品ID
   * @param {Array} tagNames - 标签名称数组
   * @param {string} defaultColor - 默认颜色
   */
  addTagsToMenuItem(menuItemId, tagNames, defaultColor) {
    return request.post(`/menu-item-tags/menu-item/${menuItemId}/batch`, {
      tagNames,
      defaultColor
    })
  },

  /**
   * 从菜品移除标签
   * @param {number} menuItemId - 菜品ID
   * @param {string} tagName - 标签名称
   */
  removeTagFromMenuItem(menuItemId, tagName) {
    return request.delete(`/menu-item-tags/menu-item/${menuItemId}/tag/${tagName}`)
  },

  /**
   * 移除菜品的所有标签
   * @param {number} menuItemId - 菜品ID
   */
  removeAllTagsFromMenuItem(menuItemId) {
    return request.delete(`/menu-item-tags/menu-item/${menuItemId}`)
  },

  /**
   * 更新菜品的标签列表
   * @param {number} menuItemId - 菜品ID
   * @param {Array} tagNames - 标签名称数组
   * @param {string} defaultColor - 默认颜色
   */
  updateMenuItemTags(menuItemId, tagNames, defaultColor) {
    return request.put(`/menu-item-tags/menu-item/${menuItemId}`, {
      tagNames,
      defaultColor
    })
  },

  /**
   * 检查菜品是否有指定标签
   * @param {number} menuItemId - 菜品ID
   * @param {string} tagName - 标签名称
   */
  hasTag(menuItemId, tagName) {
    return request.get(`/menu-item-tags/menu-item/${menuItemId}/has-tag/${tagName}`)
  },

  /**
   * 重命名标签
   * @param {string} oldTagName - 旧标签名称
   * @param {string} newTagName - 新标签名称
   */
  renameTag(oldTagName, newTagName) {
    return request.put(`/menu-item-tags/tag/${oldTagName}/rename`, {
      newTagName
    })
  },

  /**
   * 删除标签（从所有菜品中移除）
   * @param {string} tagName - 标签名称
   */
  deleteTag(tagName) {
    return request.delete(`/menu-item-tags/tag/${tagName}`)
  },

  /**
   * 清理未使用的标签
   */
  cleanupUnusedTags() {
    return request.post('/menu-item-tags/cleanup')
  }
}
