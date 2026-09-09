import { request } from '@/utils/request'
import { replaceSeededMenuImage } from '@/utils/menuImageReplacements'

import service from '@/utils/request'

const BACKEND_FILE_PATH_PREFIX = '/admin-api/infra/file/'
const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')

export const normalizeProductImage = (value) => {
  const imageUrl = replaceSeededMenuImage(value)
  if (!imageUrl) return ''

  try {
    // 绝对外链（http/https 且带真实域名）直接返回，避免把 CDN 域名重写成本机地址。
    // 否则局域网客户端会把 localhost:48081 指向自己，导致菜品图片全部裂掉。
    if (/^https?:\/\//i.test(imageUrl.trim())) return imageUrl

    const parsedUrl = new URL(imageUrl, 'http://local.invalid')
    if (!parsedUrl.pathname.startsWith(BACKEND_FILE_PATH_PREFIX)) return imageUrl

    // 仅相对路径（如 /admin-api/infra/file/...）才需要拼接后端地址
    const filePath = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
    return API_BASE_URL ? `${API_BASE_URL}${filePath}` : filePath
  } catch {
    return imageUrl
  }
}

export const normalizeProduct = (product = {}) => {
  const productValues = product.productValue && typeof product.productValue === 'object'
    ? Object.entries(product.productValue)
    : []
  const selectedEntry = productValues.find(([, value]) => Number(value?.stock) > 0) || productValues[0]
  const [skuKey, selectedValue = {}] = selectedEntry || []
  const sku = String(selectedValue.sku || skuKey || product.attrInfo?.sku || '默认')
  const stock = Number(selectedValue.stock ?? product.stock ?? 0)
  const image = normalizeProductImage(selectedValue.image || product.image)

  return {
    ...product,
    id: Number(product.id),
    name: product.name || product.storeName || product.productName || '',
    storeName: product.storeName || product.name || product.productName || '',
    categoryId: Number(product.categoryId ?? product.cateId),
    cateId: Number(product.cateId ?? product.categoryId),
    price: Number(selectedValue.price ?? product.price ?? 0),
    image,
    sku,
    valueStr: sku,
    stock,
    available: stock > 0,
    selectedProductValue: {
      ...selectedValue,
      image
    }
  }
}

/**
 * 菜品相关API
 * 对接后端菜品服务的接口
 */
export const menuApi = {
  // ==================== 客户端API ====================
  /**
   * 获取店铺分类列表
   * @param {number} shopId - 店铺ID
   */
  getCategory(shopId) {
    return service.get('/app-api/product/getCategory', { params: { shopId } })
  },

  /**
   * 获取商品列表
   * @param {Object} params - 查询参数
   * @param {number} params.shopId - 店铺ID
   * @param {number} params.categoryId - 分类ID
   * @param {number} params.pageNo - 页码
   * @param {number} params.pageSize - 每页大小
   */
  async getProducts(params) {
    const response = await service.get('/app-api/product/getProducts', { params })
    if (response?.data?.list) {
      response.data.list = response.data.list.map(normalizeProduct)
    }
    return response
  },

  // ==================== 分类管理API ====================
  
  /**
   * 获取启用的分类列表
   */
  getEnabledCategories() {
    return request.get('/categories/enabled')
  },

  /**
   * 获取所有分类（包含菜品数量）
   */
  getAllCategoriesWithCount() {
    return request.get('/categories/with-count')
  },

  /**
   * 分页查询分类
   * @param {Object} params - 查询参数
   * @param {boolean} params.enabled - 是否启用
   * @param {number} params.page - 页码
   * @param {number} params.size - 每页大小
   * @param {string} params.sortBy - 排序字段
   * @param {string} params.sortDir - 排序方向
   */
  getCategories(params = {}) {
    return request.get('/categories', params)
  },

  /**
   * 根据ID获取分类
   * @param {number} id - 分类ID
   */
  getCategoryById(id) {
    return request.get(`/categories/${id}`)
  },

  /**
   * 创建分类
   * @param {Object} data - 分类数据
   */
  createCategory(data) {
    return request.post('/categories', data)
  },

  /**
   * 更新分类
   * @param {number} id - 分类ID
   * @param {Object} data - 分类数据
   */
  updateCategory(id, data) {
    return request.put(`/categories/${id}`, data)
  },

  /**
   * 删除分类
   * @param {number} id - 分类ID
   */
  deleteCategory(id) {
    return request.delete(`/categories/${id}`)
  },

  /**
   * 切换分类状态
   * @param {number} id - 分类ID
   */
  toggleCategoryStatus(id) {
    return request.put(`/categories/${id}/toggle-status`)
  },

  /**
   * 调整分类排序
   * @param {number} id - 分类ID
   * @param {number} sortOrder - 排序顺序
   */
  updateCategoryOrder(id, sortOrder) {
    return request.put(`/categories/${id}/order`, { sortOrder })
  },

  /**
   * 批量更新分类排序
   * @param {Array} categoryIds - 分类ID数组
   */
  batchUpdateCategoryOrder(categoryIds) {
    return request.put('/categories/batch/order', categoryIds)
  },

  /**
   * 检查分类名称是否存在
   * @param {string} name - 分类名称
   */
  checkCategoryName(name) {
    return request.get('/categories/check-name', { name })
  },

  /**
   * 检查分类是否可以删除
   * @param {number} id - 分类ID
   */
  canDeleteCategory(id) {
    return request.get(`/categories/${id}/can-delete`)
  },

  /**
   * 获取分类统计信息
   */
  getCategoryStatistics() {
    return request.get('/categories/statistics')
  },

  // ==================== 菜品管理API ====================

  /**
   * 根据分类获取可售菜品
   * @param {number} categoryId - 分类ID
   */
  getItemsByCategory(categoryId) {
    return request.get(`/menu-items/category/${categoryId}`)
  },

  /**
   * 获取所有可售菜品
   */
  getAllAvailableItems() {
    return request.get('/menu-items/available')
  },

  /**
   * 获取推荐菜品
   */
  getRecommendedItems() {
    return request.get('/menu-items/recommended')
  },

  /**
   * 获取新品菜品
   */
  getNewItems() {
    return request.get('/menu-items/new')
  },

  /**
   * 获取热门菜品
   * @param {number} limit - 限制数量
   */
  getPopularItems(limit = 10) {
    return request.get('/menu-items/popular', { limit })
  },

  /**
   * 搜索菜品
   * @param {Object} params - 搜索参数
   * @param {string} params.keyword - 关键词
   * @param {number} params.categoryId - 分类ID
   * @param {string} params.status - 状态
   * @param {number} params.minPrice - 最低价格
   * @param {number} params.maxPrice - 最高价格
   * @param {Array} params.tags - 标签列表
   * @param {number} params.page - 页码
   * @param {number} params.size - 每页大小
   * @param {string} params.sortBy - 排序字段
   * @param {string} params.sortDir - 排序方向
   */
  searchMenuItems(params = {}) {
    return request.get('/menu-items/search', params)
  },

  /**
   * 分页查询菜品
   * @param {Object} params - 查询参数
   */
  getMenuItems(params = {}) {
    return request.get('/menu-items', params)
  },

  /**
   * 根据ID获取菜品
   * @param {number} id - 菜品ID
   */
  getMenuItemById(id) {
    return request.get(`/menu-items/${id}`)
  },

  /**
   * 创建菜品
   * @param {Object} data - 菜品数据
   */
  createMenuItem(data) {
    return request.post('/menu-items', data)
  },

  /**
   * 更新菜品
   * @param {number} id - 菜品ID
   * @param {Object} data - 菜品数据
   */
  updateMenuItem(id, data) {
    return request.put(`/menu-items/${id}`, data)
  },

  /**
   * 删除菜品
   * @param {number} id - 菜品ID
   */
  deleteMenuItem(id) {
    return request.delete(`/menu-items/${id}`)
  },

  /**
   * 更新菜品状态
   * @param {number} id - 菜品ID
   * @param {string} status - 状态
   */
  updateMenuItemStatus(id, status) {
    return request.put(`/menu-items/${id}/status`, { status })
  },

  /**
   * 批量更新菜品状态
   * @param {Array} itemIds - 菜品ID数组
   * @param {string} status - 状态
   */
  batchUpdateMenuItemStatus(itemIds, status) {
    return request.put('/menu-items/batch/status', { itemIds, status })
  },

  /**
   * 调整菜品排序
   * @param {number} id - 菜品ID
   * @param {number} sortOrder - 排序顺序
   */
  updateMenuItemOrder(id, sortOrder) {
    return request.put(`/menu-items/${id}/order`, { sortOrder })
  },

  /**
   * 增加菜品销量
   * @param {number} id - 菜品ID
   * @param {number} count - 增加数量
   */
  increaseSalesCount(id, count) {
    return request.put(`/menu-items/${id}/sales`, { count })
  },

  /**
   * 批量增加菜品销量
   * @param {Object} salesData - 销量数据 {itemId: count}
   */
  batchIncreaseSalesCount(salesData) {
    return request.put('/menu-items/batch/sales', salesData)
  },

  /**
   * 检查菜品名称是否存在
   * @param {string} name - 菜品名称
   */
  checkMenuItemName(name) {
    return request.get('/menu-items/check-name', { name })
  },

  /**
   * 根据价格范围查找菜品
   * @param {number} minPrice - 最低价格
   * @param {number} maxPrice - 最高价格
   */
  getItemsByPriceRange(minPrice, maxPrice) {
    return request.get('/menu-items/price-range', { minPrice, maxPrice })
  },

  /**
   * 获取菜品统计信息
   */
  getMenuItemStatistics() {
    return request.get('/menu-items/statistics')
  },

  /**
   * 获取价格统计信息
   */
  getPriceStatistics() {
    return request.get('/menu-items/price-statistics')
  },

  // ==================== 文件上传API ====================

  /**
   * 上传菜品图片
   * @param {File} file - 图片文件
   */
  uploadMenuItemImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.upload('/files/menu-item-image', formData)
  },

  /**
   * 上传分类图标
   * @param {File} file - 图标文件
   */
  uploadCategoryIcon(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.upload('/files/category-icon', formData)
  },

  /**
   * 删除文件
   * @param {string} fileUrl - 文件URL
   */
  deleteFile(fileUrl) {
    return request.delete('/files', { fileUrl })
  },

  /**
   * 验证文件格式
   * @param {File} file - 文件
   */
  validateFile(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/files/validate', formData)
  },

  /**
   * 获取文件信息
   * @param {string} filePath - 文件路径
   */
  getFileInfo(filePath) {
    return request.get('/files/info', { filePath })
  },

  /**
   * 生成缩略图
   * @param {string} imagePath - 图片路径
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  generateThumbnail(imagePath, width = 300, height = 300) {
    return request.post('/files/thumbnail', { imagePath, width, height })
  },

  /**
   * 压缩图片
   * @param {string} imagePath - 图片路径
   * @param {number} quality - 压缩质量
   */
  compressImage(imagePath, quality = 0.8) {
    return request.post('/files/compress', { imagePath, quality })
  },

  /**
   * 批量上传菜品图片
   * @param {Array} files - 文件数组
   */
  batchUploadMenuItemImages(files) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    return request.upload('/files/batch/menu-item-images', formData)
  }
}
