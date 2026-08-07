import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { menuApi } from '@/api/menu'
import { tagsApi } from '@/api/tags'
import { ElMessage } from 'element-plus'
import { t } from '@/i18n'

export const useMenuStore = defineStore('menu', () => {
  // 状态
  const categories = ref([])
  const menuItems = ref([])
  const currentCategory = ref(null)
  const searchResults = ref([])
  const popularTags = ref([])
  const allTags = ref([])
  
  // 加载状态
  const categoriesLoading = ref(false)
  const menuItemsLoading = ref(false)
  const searchLoading = ref(false)
  
  // 搜索条件
  const searchKeyword = ref('')
  const selectedTags = ref([])
  const priceRange = ref([0, 1000])
  
  // 计算属性
  const enabledCategories = computed(() => 
    categories.value.filter(cat => cat.isEnabled)
  )
  
  const availableMenuItems = computed(() =>
    menuItems.value.filter(item => item.status === 'AVAILABLE')
  )
  
  const recommendedItems = computed(() =>
    availableMenuItems.value.filter(item => item.isRecommended)
  )
  
  const newItems = computed(() =>
    availableMenuItems.value.filter(item => item.isNew)
  )
  
  const currentCategoryItems = computed(() => {
    if (!currentCategory.value) return availableMenuItems.value
    return availableMenuItems.value.filter(item => 
      item.categoryId === currentCategory.value.id
    )
  })
  
  // 获取启用的分类列表
  const fetchEnabledCategories = async () => {
    try {
      categoriesLoading.value = true
      const response = await menuApi.getEnabledCategories()
      categories.value = response.data || []
      
      // 如果没有选中分类，默认选择第一个
      if (!currentCategory.value && categories.value.length > 0) {
        currentCategory.value = categories.value[0]
      }
      
      return response
    } catch (error) {
      console.error('获取分类列表失败:', error)
      ElMessage.error(t('errors.fetchCategories'))
      throw error
    } finally {
      categoriesLoading.value = false
    }
  }
  
  // 获取所有可售菜品
  const fetchAllAvailableItems = async () => {
    try {
      menuItemsLoading.value = true
      const response = await menuApi.getAllAvailableItems()
      menuItems.value = response.data || []
      return response
    } catch (error) {
      console.error('获取菜品列表失败:', error)
      ElMessage.error(t('errors.fetchProducts'))
      throw error
    } finally {
      menuItemsLoading.value = false
    }
  }
  
  // 根据分类获取菜品
  const fetchItemsByCategory = async (categoryId) => {
    try {
      menuItemsLoading.value = true
      const response = await menuApi.getItemsByCategory(categoryId)
      
      // 更新对应分类的菜品
      const categoryItems = response.data || []
      
      // 合并到总菜品列表中，避免重复
      categoryItems.forEach(newItem => {
        const existingIndex = menuItems.value.findIndex(item => item.id === newItem.id)
        if (existingIndex >= 0) {
          menuItems.value[existingIndex] = newItem
        } else {
          menuItems.value.push(newItem)
        }
      })
      
      return response
    } catch (error) {
      console.error('获取分类菜品失败:', error)
      ElMessage.error(t('errors.fetchCategoryProducts'))
      throw error
    } finally {
      menuItemsLoading.value = false
    }
  }
  
  // 获取推荐菜品
  const fetchRecommendedItems = async () => {
    try {
      const response = await menuApi.getRecommendedItems()
      const recommendedItems = response.data || []
      
      // 合并到总菜品列表中
      recommendedItems.forEach(newItem => {
        const existingIndex = menuItems.value.findIndex(item => item.id === newItem.id)
        if (existingIndex >= 0) {
          menuItems.value[existingIndex] = newItem
        } else {
          menuItems.value.push(newItem)
        }
      })
      
      return response
    } catch (error) {
      console.error('获取推荐菜品失败:', error)
      throw error
    }
  }
  
  // 获取新品菜品
  const fetchNewItems = async () => {
    try {
      const response = await menuApi.getNewItems()
      const newItems = response.data || []
      
      // 合并到总菜品列表中
      newItems.forEach(newItem => {
        const existingIndex = menuItems.value.findIndex(item => item.id === newItem.id)
        if (existingIndex >= 0) {
          menuItems.value[existingIndex] = newItem
        } else {
          menuItems.value.push(newItem)
        }
      })
      
      return response
    } catch (error) {
      console.error('获取新品菜品失败:', error)
      throw error
    }
  }
  
  // 获取热门菜品
  const fetchPopularItems = async (limit = 10) => {
    try {
      const response = await menuApi.getPopularItems(limit)
      const popularItems = response.data || []
      
      // 合并到总菜品列表中
      popularItems.forEach(newItem => {
        const existingIndex = menuItems.value.findIndex(item => item.id === newItem.id)
        if (existingIndex >= 0) {
          menuItems.value[existingIndex] = newItem
        } else {
          menuItems.value.push(newItem)
        }
      })
      
      return response
    } catch (error) {
      console.error('获取热门菜品失败:', error)
      throw error
    }
  }
  
  // 搜索菜品
  const searchMenuItems = async (params = {}) => {
    try {
      searchLoading.value = true
      
      const searchParams = {
        keyword: searchKeyword.value,
        tags: selectedTags.value,
        minPrice: priceRange.value[0],
        maxPrice: priceRange.value[1],
        ...params
      }
      
      const response = await menuApi.searchMenuItems(searchParams)
      searchResults.value = response.data?.content || []
      
      return response
    } catch (error) {
      console.error('搜索菜品失败:', error)
      ElMessage.error(t('menu.searchFailed'))
      throw error
    } finally {
      searchLoading.value = false
    }
  }
  
  // 获取热门标签
  const fetchPopularTags = async (limit = 20) => {
    try {
      const response = await tagsApi.getPopularTags(limit)
      popularTags.value = response.data || []
      return response
    } catch (error) {
      console.error('获取热门标签失败:', error)
      throw error
    }
  }
  
  // 获取所有标签
  const fetchAllTags = async () => {
    try {
      const response = await tagsApi.getAllTagNames()
      allTags.value = response.data || []
      return response
    } catch (error) {
      console.error('获取标签列表失败:', error)
      throw error
    }
  }
  
  // 设置当前分类
  const setCurrentCategory = (category) => {
    currentCategory.value = category
    if (category) {
      fetchItemsByCategory(category.id)
    }
  }
  
  // 设置搜索关键词
  const setSearchKeyword = (keyword) => {
    searchKeyword.value = keyword
  }
  
  // 添加选中标签
  const addSelectedTag = (tag) => {
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag)
    }
  }
  
  // 移除选中标签
  const removeSelectedTag = (tag) => {
    const index = selectedTags.value.indexOf(tag)
    if (index > -1) {
      selectedTags.value.splice(index, 1)
    }
  }
  
  // 清除选中标签
  const clearSelectedTags = () => {
    selectedTags.value = []
  }
  
  // 设置价格范围
  const setPriceRange = (range) => {
    priceRange.value = range
  }
  
  // 清除搜索条件
  const clearSearchConditions = () => {
    searchKeyword.value = ''
    selectedTags.value = []
    priceRange.value = [0, 1000]
    searchResults.value = []
  }
  
  // 根据ID获取菜品
  const getMenuItemById = (id) => {
    return menuItems.value.find(item => item.id === id)
  }
  
  // 根据ID获取分类
  const getCategoryById = (id) => {
    return categories.value.find(cat => cat.id === id)
  }
  
  // 初始化菜品数据
  const initMenuData = async () => {
    try {
      await Promise.all([
        fetchEnabledCategories(),
        fetchAllAvailableItems(),
        fetchPopularTags()
      ])
      
      console.log('🍣 菜品数据初始化完成')
    } catch (error) {
      console.error('❌ 菜品数据初始化失败:', error)
    }
  }
  
  // 重置状态
  const reset = () => {
    categories.value = []
    menuItems.value = []
    currentCategory.value = null
    searchResults.value = []
    popularTags.value = []
    allTags.value = []
    categoriesLoading.value = false
    menuItemsLoading.value = false
    searchLoading.value = false
    clearSearchConditions()
  }
  
  return {
    // 状态
    categories,
    menuItems,
    currentCategory,
    searchResults,
    popularTags,
    allTags,
    categoriesLoading,
    menuItemsLoading,
    searchLoading,
    searchKeyword,
    selectedTags,
    priceRange,
    
    // 计算属性
    enabledCategories,
    availableMenuItems,
    recommendedItems,
    newItems,
    currentCategoryItems,
    
    // 方法
    fetchEnabledCategories,
    fetchAllAvailableItems,
    fetchItemsByCategory,
    fetchRecommendedItems,
    fetchNewItems,
    fetchPopularItems,
    searchMenuItems,
    fetchPopularTags,
    fetchAllTags,
    setCurrentCategory,
    setSearchKeyword,
    addSelectedTag,
    removeSelectedTag,
    clearSelectedTags,
    setPriceRange,
    clearSearchConditions,
    getMenuItemById,
    getCategoryById,
    initMenuData,
    reset
  }
})
