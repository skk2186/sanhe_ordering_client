import { reactive } from 'vue'
import { useCartStore } from '@/stores/cart.js'

// 全局单例状态
let globalCartState = null

export function useCart() {
  // 如果已经存在全局状态，直接返回
  if (globalCartState) {
    return globalCartState
  }

  // 创建全局单例状态
  const leftCart = reactive(Array(4).fill(null))
  const rightCart = reactive(Array(4).fill(null))
  
  // 获取 Pinia store 实例
  const cartStore = useCartStore()

  const cartOf = (side) => (side === 'left' ? leftCart : rightCart)

  const countOf = (side) => cartOf(side).reduce((total, item) => total + (item ? item.quantity : 0), 0)

  const add = (item, side = null, index = null) => {
    if (side && index !== null) {
      const cart = cartOf(side)
      if (!cart[index]) {
        // 检查该侧购物车总数量是否会超过4
        if (countOf(side) >= 4) {
          return { ok: false, reason: 'full' }
        }
        cart[index] = { ...item, quantity: 1 }
        return { ok: true, side, index }
      }
      return { ok: false, reason: 'occupied' }
    }

    // 如果指定了侧边，优先检查指定侧是否已存在相同商品
    if (side) {
      const cart = cartOf(side)
      for (let i = 0; i < 4; i++) {
        if (cart[i] && cart[i].id === item.id) {
          if (cart[i].quantity < 4 && countOf(side) < 4) {
            cart[i].quantity++
            return { ok: true, side, index: i, increased: true }
          } else {
            return { ok: false, reason: 'max_quantity' }
          }
        }
      }
      
      // 指定侧没有相同商品，尝试在指定侧添加新商品
      if (countOf(side) < 4) {
        for (let i = 0; i < 4; i++) {
          if (!cart[i]) {
            cart[i] = { ...item, quantity: 1 }
            return { ok: true, side, index: i }
          }
        }
      }
      
      // 指定侧已满，返回满载错误
      return { ok: false, reason: 'full' }
    }

    // 没有指定侧边时，按原逻辑处理
    // 首先检查是否已存在相同商品，如果存在则增加数量
    // 检查左侧购物车
    for (let i = 0; i < 4; i++) {
      if (leftCart[i] && leftCart[i].id === item.id) {
        if (leftCart[i].quantity < 4 && countOf('left') < 4) {
          leftCart[i].quantity++
          return { ok: true, side: 'left', index: i, increased: true }
        } else {
          return { ok: false, reason: 'max_quantity' }
        }
      }
    }
    // 检查右侧购物车
    for (let i = 0; i < 4; i++) {
      if (rightCart[i] && rightCart[i].id === item.id) {
        if (rightCart[i].quantity < 4 && countOf('right') < 4) {
          rightCart[i].quantity++
          return { ok: true, side: 'right', index: i, increased: true }
        } else {
          return { ok: false, reason: 'max_quantity' }
        }
      }
    }

    // 如果没有找到相同商品，则寻找空位添加新商品
    // 尝试左侧
    if (countOf('left') < 4) {
      for (let i = 0; i < 4; i++) {
        if (!leftCart[i]) {
          leftCart[i] = { ...item, quantity: 1 }
          return { ok: true, side: 'left', index: i }
        }
      }
    }
    // 尝试右侧
    if (countOf('right') < 4) {
      for (let i = 0; i < 4; i++) {
        if (!rightCart[i]) {
          rightCart[i] = { ...item, quantity: 1 }
          return { ok: true, side: 'right', index: i }
        }
      }
    }
    return { ok: false, reason: 'full' }
  }

  const remove = (side, index) => {
    const cart = cartOf(side)
    cart[index] = null
  }

  const increase = (side, index) => {
    const cart = cartOf(side)
    if (cart[index] && cart[index].quantity < 4 && countOf(side) < 4) {
      cart[index].quantity++
      return { ok: true }
    }
    return { ok: false, reason: 'max_quantity' }
  }

  const decrease = (side, index) => {
    const cart = cartOf(side)
    if (!cart[index]) return
    if (cart[index].quantity > 1) cart[index].quantity--
    else cart[index] = null
  }

  const clear = (side) => {
    const cart = cartOf(side)
    for (let i = 0; i < cart.length; i++) cart[i] = null
    syncToStore()
  }

  // 同步到 Pinia store
  const syncToStore = () => {
    // 将左右购物车的数据同步到全局 store
    const allItems = []
    
    // 收集左侧购物车数据
    leftCart.forEach((item, index) => {
      if (item) {
        allItems.push({
          ...item,
          cartSide: 'left',
          cartIndex: index
        })
      }
    })
    
    // 收集右侧购物车数据
    rightCart.forEach((item, index) => {
      if (item) {
        allItems.push({
          ...item,
          cartSide: 'right',
          cartIndex: index
        })
      }
    })
    
    // 更新 Pinia store
    cartStore.items = allItems
    cartStore.saveToStorage()
  }

  // 从 Pinia store 加载数据
  const loadFromStore = () => {
    cartStore.loadFromStorage()
    
    // 清空当前购物车
    leftCart.fill(null)
    rightCart.fill(null)
    
    // 从 store 恢复数据
    cartStore.items.forEach(item => {
      if (item.cartSide && typeof item.cartIndex === 'number') {
        const cart = item.cartSide === 'left' ? leftCart : rightCart
        if (item.cartIndex >= 0 && item.cartIndex < 4) {
          cart[item.cartIndex] = {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity
          }
        }
      }
    })
  }

  // 修改所有操作方法，添加同步
  const syncedAdd = (item, side = null, index = null) => {
    const result = add(item, side, index)
    if (result.ok) {
      syncToStore()
    }
    return result
  }

  const syncedRemove = (side, index) => {
    remove(side, index)
    syncToStore()
  }

  const syncedIncrease = (side, index) => {
    const result = increase(side, index)
    if (result.ok) {
      syncToStore()
    }
    return result
  }

  const syncedDecrease = (side, index) => {
    decrease(side, index)
    syncToStore()
  }

  // 初始化时加载数据
  loadFromStore()

  // 创建全局状态对象
  globalCartState = { 
    leftCart, 
    rightCart, 
    cartOf, 
    countOf, 
    add: syncedAdd, 
    remove: syncedRemove, 
    increase: syncedIncrease, 
    decrease: syncedDecrease, 
    clear,
    syncToStore,
    loadFromStore
  }

  return globalCartState
}

