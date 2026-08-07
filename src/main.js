import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Element Plus
import ElementPlus from 'element-plus'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// 全局样式
import './styles/index.scss'

// NProgress
import 'nprogress/nprogress.css'

// Element Plus 图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 性能监控
import { createPerformanceMonitor } from '@/utils/performanceMonitor'
import { createRoutePreloader } from '@/utils/routePreloader'

import { useGlobalStore } from '@/stores/global'
import { useAuthStore } from '@/stores/auth'
import { i18n } from '@/i18n'

// 创建应用实例
const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 创建Pinia实例
const pinia = createPinia()

// 使用插件
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(ElementPlus, {
  locale: zhCn,
  size: 'default'
})
// 暂时禁用性能监控和路由预加载，避免启动问题
// app.use(createPerformanceMonitor())
// app.use(createRoutePreloader())

// 全局属性
app.config.globalProperties.$ELEMENT = {
  size: 'default'
}

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('全局错误:', err, info)
  ElMessage.error(i18n.t('app.systemError'))
}

// 初始化应用状态
async function initApp() {
  const globalStore = useGlobalStore()
  const authStore = useAuthStore()

  try {
    // 初始化全局状态
    globalStore.initApp()

    // 初始化认证状态
    await authStore.initAuth()

    console.log('🚀 应用初始化完成')
  } catch (error) {
    console.error('❌ 应用初始化失败:', error)
  }
}

// 挂载应用
app.mount('#app')

// 初始化应用状态
initApp()

// 移除加载动画
const loadingElement = document.getElementById('loading')
if (loadingElement) {
  setTimeout(() => {
    loadingElement.style.display = 'none'
  }, 500)
}
