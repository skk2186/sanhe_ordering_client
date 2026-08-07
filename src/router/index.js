import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGlobalStore } from '@/stores/global'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import { routePreloader } from '@/utils/routePreloader'
import { t } from '@/i18n'

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
      titleKey: 'auth.bindTable',
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
      titleKey: 'auth.login',
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
      titleKey: 'auth.customerLogin',
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
      titleKey: 'menu.dishList',
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
      titleKey: 'common.conveyorSettings',
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
      titleKey: 'common.admin',
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
          titleKey: 'admin.dashboard',
          requiresAuth: true,
          requiresEmployee: true
        }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: lazyLoad('admin/Categories'),
        meta: {
          titleKey: 'admin.categories',
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
          titleKey: 'admin.menuItems',
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
          titleKey: 'admin.users',
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
      titleKey: 'errorPage.title',
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
  const pageTitle = to.meta.titleKey ? t(to.meta.titleKey) : ''
  document.title = pageTitle ? `${pageTitle} - ${t('menu.brand')}` : t('menu.brand')
  
  const authStore = useAuthStore()
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!authStore.isLoggedIn) {
      ElMessage.warning(t('auth.loginRequired'))
      next('/login')
      return
    }
    
    // 检查是否需要员工权限
    if (to.meta.requiresEmployee && !authStore.isEmployee) {
      ElMessage.error(t('auth.employeeRequired'))
      next('/menu')
      return
    }
    
    // 检查特定权限
    if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
      ElMessage.error(t('auth.permissionDenied'))
      next('/menu')
      return
    }
    
    // 检查角色权限
    if (to.meta.roles && !authStore.hasAnyRole(to.meta.roles)) {
      ElMessage.error(t('auth.roleDenied'))
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
  ElMessage.error(t('errors.loadFailed'))
  NProgress.done()
})

export default router
