import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { ElMessage } from 'element-plus'
import { t } from '@/i18n'

export const useCartStore = defineStore('cart', () => {
  // 状态
  const items = ref([])
  const tableNumber = ref(null)
  const orderNote = ref('')
  
  // 计算属性
  const totalItems = computed(() => 
    items.value.reduce((total, item) => total + item.quantity, 0)
  )
  
  const totalAmount = computed(() =>
    items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  )
  
  const isEmpty = computed(() => items.value.length === 0)
  
  const itemsGroupedByCategory = computed(() => {
    const grouped = {}
    items.value.forEach(item => {
      const categoryName = item.categoryName || t('common.other')
      if (!grouped[categoryName]) {
        grouped[categoryName] = []
      }
      grouped[categoryName].push(item)
    })
    return grouped
  })
  
  // 添加商品到购物车
  const addItem = (menuItem, quantity = 1) => {
    try {
      if (!menuItem || !menuItem.id) {
        throw new Error(t('cart.invalidItem'))
      }
      
      if (quantity <= 0) {
        throw new Error(t('cart.invalidQuantity'))
      }
      
      // 兼容传送带购物车，不检查 status
      if (menuItem.status && menuItem.status !== 'AVAILABLE') {
        throw new Error(t('menu.notAvailable'))
      }
      
      const existingItem = items.value.find(item => item.id === menuItem.id)
      
      if (existingItem) {
        // 如果商品已存在，增加数量
        existingItem.quantity += quantity
        ElMessage.success(t('cart.quantityUpdated', { name: menuItem.name }))
      } else {
        // 添加新商品 - 兼容传送带数据结构
        const cartItem = {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          image: menuItem.image || menuItem.imageUrl, // 兼容不同的图片字段
          categoryId: menuItem.categoryId,
          categoryName: menuItem.categoryName,
          description: menuItem.description,
          tags: menuItem.tags || [],
          quantity: quantity,
          addedAt: new Date().toISOString(),
          // 传送带专用字段
          cartSide: menuItem.cartSide,
          cartIndex: menuItem.cartIndex
        }
        
        items.value.push(cartItem)
        ElMessage.success(t('menu.addedToCart', { name: menuItem.name }))
      }
      
      // 保存到本地存储
      saveToStorage()
      
    } catch (error) {
      console.error('添加商品到购物车失败:', error)
      ElMessage.error(error.message || t('menu.addFailed'))
    }
  }
  
  // 移除商品
  const removeItem = (itemId) => {
    try {
      const index = items.value.findIndex(item => item.id === itemId)
      if (index > -1) {
        const removedItem = items.value.splice(index, 1)[0]
        ElMessage.success(t('cart.itemRemoved', { name: removedItem.name }))
        saveToStorage()
      }
    } catch (error) {
      console.error('移除商品失败:', error)
      ElMessage.error(t('menu.removeFailed'))
    }
  }
  
  // 更新商品数量
  const updateQuantity = (itemId, quantity) => {
    try {
      if (quantity <= 0) {
        removeItem(itemId)
        return
      }
      
      const item = items.value.find(item => item.id === itemId)
      if (item) {
        item.quantity = quantity
        saveToStorage()
      }
    } catch (error) {
      console.error('更新数量失败:', error)
      ElMessage.error(t('cart.updateFailed'))
    }
  }
  
  // 增加商品数量
  const increaseQuantity = (itemId) => {
    const item = items.value.find(item => item.id === itemId)
    if (item) {
      updateQuantity(itemId, item.quantity + 1)
    }
  }
  
  // 减少商品数量
  const decreaseQuantity = (itemId) => {
    const item = items.value.find(item => item.id === itemId)
    if (item) {
      updateQuantity(itemId, item.quantity - 1)
    }
  }
  
  // 清空购物车
  const clearCart = () => {
    items.value = []
    orderNote.value = ''
    saveToStorage()
    ElMessage.success(t('cart.cleared'))
  }
  
  // 设置桌号
  const setTableNumber = (number) => {
    tableNumber.value = number
    saveToStorage()
  }
  
  // 设置订单备注
  const setOrderNote = (note) => {
    orderNote.value = note
    saveToStorage()
  }
  
  // 获取商品数量
  const getItemQuantity = (itemId) => {
    const item = items.value.find(item => item.id === itemId)
    return item ? item.quantity : 0
  }
  
  // 检查商品是否在购物车中
  const hasItem = (itemId) => {
    return items.value.some(item => item.id === itemId)
  }
  
  // 获取购物车摘要
  const getCartSummary = () => {
    return {
      totalItems: totalItems.value,
      totalAmount: totalAmount.value,
      itemCount: items.value.length,
      tableNumber: tableNumber.value,
      orderNote: orderNote.value
    }
  }
  
  // 验证购物车
  const validateCart = () => {
    const errors = []
    
    if (isEmpty.value) {
      errors.push(t('cart.emptyWarning'))
    }
    
    if (!tableNumber.value) {
      errors.push(t('cart.tableRequired'))
    }
    
    // 检查商品是否仍然可用
    items.value.forEach(item => {
      if (!item.id || !item.name || !item.price) {
        errors.push(t('cart.incompleteItem', { name: item.name || t('common.unknown') }))
      }
      
      if (item.quantity <= 0) {
        errors.push(t('cart.invalidItemQuantity', { name: item.name }))
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  // 保存到本地存储
  const saveToStorage = () => {
    try {
      const cartData = {
        items: items.value,
        tableNumber: tableNumber.value,
        orderNote: orderNote.value,
        updatedAt: new Date().toISOString()
      }
      
      localStorage.setItem('sushi-cart', JSON.stringify(cartData))
      console.log('🛒 购物车数据已保存到本地存储')
    } catch (error) {
      console.error('保存购物车到本地存储失败:', error)
    }
  }
  
  // 从本地存储加载
  const loadFromStorage = () => {
    try {
      const cartData = localStorage.getItem('sushi-cart')
      if (cartData) {
        const parsed = JSON.parse(cartData)
        items.value = parsed.items || []
        tableNumber.value = parsed.tableNumber || null
        orderNote.value = parsed.orderNote || ''
        
        console.log('🛒 购物车数据已从本地存储加载')
      }
    } catch (error) {
      console.error('从本地存储加载购物车失败:', error)
      // 清除损坏的数据
      localStorage.removeItem('sushi-cart')
    }
  }
  
  // 初始化购物车
  const initCart = () => {
    const authStore = useAuthStore()
    
    // 如果是顾客登录，设置桌号
    if (authStore.isCustomer && authStore.user?.tableNumber) {
      setTableNumber(authStore.user.tableNumber)
    }
    
    // 从本地存储加载数据
    loadFromStorage()
    
    console.log('🛒 购物车初始化完成')
  }
  
  // 重置购物车
  const reset = () => {
    items.value = []
    tableNumber.value = null
    orderNote.value = ''
    localStorage.removeItem('sushi-cart')
  }
  
  // 创建订单数据
  const createOrderData = () => {
    const validation = validateCart()
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }
    
    return {
      tableNumber: tableNumber.value,
      items: items.value.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price,
        note: ''
      })),
      totalAmount: totalAmount.value,
      orderNote: orderNote.value,
      orderTime: new Date().toISOString()
    }
  }
  
  return {
    // 状态
    items,
    tableNumber,
    orderNote,
    
    // 计算属性
    totalItems,
    totalAmount,
    isEmpty,
    itemsGroupedByCategory,
    
    // 方法
    addItem,
    removeItem,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    setTableNumber,
    setOrderNote,
    getItemQuantity,
    hasItem,
    getCartSummary,
    validateCart,
    saveToStorage,
    loadFromStorage,
    initCart,
    reset,
    createOrderData
  }
})
