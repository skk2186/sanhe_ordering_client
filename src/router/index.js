import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGlobalStore } from '@/stores/global'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import { routePreloader } from '@/utils/routePreloader'

// 路由懒加载辅助函数 - 修复动态导入问题
const lazyLoad = (view) => {
  const viewMap = {
    'customer/TableBinding': () => import('@/views/customer/TableBinding.vue'),
    'auth/Login': () => import('@/views/auth/Login.vue'),
    'auth/CustomerLogin': () => import('@/views/auth/CustomerLogin.vue'),
    'menu/MenuHome': () => import('@/views/menu/MenuHome.vue'),
    'display/ConveyorBeltDisplay': () => import('@/views/display/ConveyorBeltDisplay.vue'),
    'admin/AdminLayout': () => import('@/views/admin/AdminLayout.vue'),
    'admin/Dashboard': () => import('@/views/admin/Dashboard.vue'),
    'admin/Categories': () => import('@/views/admin/Categories.vue'),
    'admin/MenuItems': () => import('@/views/admin/MenuItems.vue'),
    'admin/Users': () => import('@/views/admin/Users.vue'),
    'error/404': () => import('@/views/error/404.vue')
  }
  
  return viewMap[view] || (() => import('@/views/error/404.vue'))
}

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/display'
  },
  {
    path: '/table-binding',
    name: 'TableBinding',
    component: lazyLoad('customer/TableBinding'),
    meta: {
      title: '桌台绑定',
      requiresAuth: false,
      transition: 'fade',
      preload: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: lazyLoad('auth/Login'),
    meta: {
      title: '登录',
      requiresAuth: false,
      transition: 'fade',
      preload: true
    }
  },
  {
    path: '/customer-login',
    name: 'CustomerLogin',
    component: lazyLoad('auth/CustomerLogin'),
    meta: {
      title: '顾客登录',
      requiresAuth: false,
      transition: 'fade',
      preload: true
    }
  },
  {
    path: '/menu',
    name: 'Menu',
    component: lazyLoad('menu/MenuHome'),
    meta: {
      title: '菜品浏览',
      requiresAuth: false,
      transition: 'slide-left',
      preload: false
    }
  },
  {
    path: '/display',
    name: 'ConveyorBeltDisplay',
    component: lazyLoad('display/ConveyorBeltDisplay'),
    meta: {
      title: '传送带大屏显示',
      requiresAuth: false,
      transition: 'fade',
      preload: true,
      keepAlive: true
    }
  },
  {
    path: '/admin',
    component: lazyLoad('admin/AdminLayout'),
    meta: {
      title: '管理后台',
      requiresAuth: true,
      requiresEmployee: true,
      transition: 'slide-left',
      preload: false
    },
    children: [
      {
        path: '',
        name: 'Admin',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: lazyLoad('admin/Dashboard'),
        meta: {
          title: '仪表盘',
          requiresAuth: true,
          requiresEmployee: true
        }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: lazyLoad('admin/Categories'),
        meta: {
          title: '分类管理',
          requiresAuth: true,
          requiresEmployee: true,
          permission: 'menu:category:view'
        }
      },
      {
        path: 'menu-items',
        name: 'MenuItems',
        component: lazyLoad('admin/MenuItems'),
        meta: {
          title: '菜品管理',
          requiresAuth: true,
          requiresEmployee: true,
          permission: 'menu:item:view'
        }
      },
      {
        path: 'users',
        name: 'Users',
        component: lazyLoad('admin/Users'),
        meta: {
          title: '用户管理',
          requiresAuth: true,
          requiresEmployee: true,
          permission: 'user:view'
        }
      }
    ]
  },
  {
    path: '/404',
    name: 'NotFound',
    component: lazyLoad('error/404'),
    meta: {
      title: '页面不存在',
      requiresAuth: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 全局前置守卫
router.beforeEach(async (to, _from, next) => {
  // 开始进度条
  NProgress.start()
  
  // 设置页面标题
  const globalStore = useGlobalStore()
  document.title = to.meta.title 
    ? `${to.meta.title} - ${globalStore.appConfig.title}`
    : globalStore.appConfig.title
  
  const authStore = useAuthStore()
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!authStore.isLoggedIn) {
      ElMessage.warning('请先登录')
      next('/login')
      return
    }
    
    // 检查是否需要员工权限
    if (to.meta.requiresEmployee && !authStore.isEmployee) {
      ElMessage.error('需要员工权限')
      next('/menu')
      return
    }
    
    // 检查特定权限
    if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
      ElMessage.error('权限不足')
      next('/menu')
      return
    }
    
    // 检查角色权限
    if (to.meta.roles && !authStore.hasAnyRole(to.meta.roles)) {
      ElMessage.error('角色权限不足')
      next('/menu')
      return
    }
  }
  
  // 已登录用户访问登录页面，重定向到相应页面
  if (authStore.isLoggedIn && (to.path === '/login' || to.path === '/customer-login')) {
    if (authStore.isEmployee) {
      next('/admin')
    } else {
      next('/menu')
    }
    return
  }
  
  next()
})

// 全局后置守卫
router.afterEach((to, _from) => {
  // 结束进度条
  NProgress.done()
  
  // 暂时完全禁用预加载
  // if (to.meta?.preload) {
  //   setTimeout(() => {
  //     routePreloader.preloadCriticalRoutes(routes)
  //   }, 2000) // 2秒后开始预加载
  // }
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  ElMessage.error('页面加载失败，请刷新重试')
  NProgress.done()
})

export default router
