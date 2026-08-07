import service from '@/utils/request'

export const orderApi = {
  syncCart(data) {
    return service.post('/app-api/order/sync-cart', data)
  },

  create(data) {
    return service.post('/app-api/order/create', data)
  },

  list(params) {
    return service.get('/app-api/order/list', { params })
  },

  getShop(params) {
    return service.get('/app-api/order/getShop', { params })
  },

  openDesk(params) {
    return service.get('/app-api/order/openDesk', { params })
  }
}
