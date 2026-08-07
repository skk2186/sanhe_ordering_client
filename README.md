# 回转寿司点餐系统 - 前端

一个基于 Vue 3 的现代化回转寿司数字点餐系统前端应用，采用创新的传送带交互设计，提供沉浸式的点餐体验。

## 🌟 项目特色

### 🎯 创新交互体验
- **沉浸式传送带显示**：真实还原回转寿司传送带效果，支持无缝循环滚动
- **智能双侧购物车**：根据点击位置智能分配到左右购物车，符合空间直觉
- **游戏化投碟系统**：满5个投碟获得扭蛋机会，增加互动乐趣
- **自由拖拽浏览**：无界大菜单支持任意方向拖动，突破传统菜单限制

### 🚀 技术亮点
- **Vue 3 + Composition API**：现代化响应式架构
- **虚拟滚动优化**：支持大量菜品数据流畅展示
- **智能拖拽引擎**：支持动量滚动和惯性效果
- **组件化设计**：高度模块化，易于维护和扩展
- **性能监控**：内置性能监控和优化工具

## 🛠️ 技术栈

### 核心框架
- **Vue 3.4.38** - 渐进式JavaScript框架，使用Composition API
- **Vite 6.0.0** - 下一代前端构建工具，提供极速开发体验
- **Vue Router 4.4.3** - 官方路由管理器
- **Pinia 2.2.2** - Vue的轻量级状态管理库

### UI与交互
- **Element Plus 2.8.1** - 企业级Vue组件库
- **@element-plus/icons-vue 2.3.1** - 图标库
- **SCSS** - CSS预处理器，支持变量和嵌套

### 开发工具
- **unplugin-auto-import** - 自动导入API和组件
- **unplugin-vue-components** - 组件按需导入
- **ESLint + Prettier** - 代码规范和格式化
- **Axios 1.7.7** - HTTP客户端
- **NProgress** - 页面加载进度条

## 🏗️ 系统架构

### 核心功能模块

#### 1. 传送带大屏显示系统 (`/display`)
```
核心特性：
- 无缝循环传送带滚动
- 智能拖拽交互 (支持鼠标和触摸)
- 动量滚动和惯性效果
- 双侧购物车系统
- 投碟进度追踪
- 虚拟滚动性能优化
```

#### 2. 菜单浏览系统 (`/menu`)
```
功能特色：
- 分类导航和搜索功能
- 菜品网格展示
- 实时筛选和排序
- 特色菜品轮播
- 移动端优化导航
```

#### 3. 用户认证系统
```
支持角色：
- 顾客登录 (桌号登录)
- 员工登录 (用户名+密码)
- 权限控制和会话管理
- 桌台绑定功能
```

#### 4. 管理后台系统 (`/admin`)
```
管理功能：
- 仪表盘和数据可视化
- 菜品和分类管理
- 用户和权限管理
- 订单状态跟踪
```

### 状态管理架构

```javascript
stores/
├── auth.js         # 用户认证和权限管理
├── cart.js         # 购物车状态管理
├── conveyor.js     # 传送带状态
├── global.js       # 全局应用状态
└── menu.js         # 菜品数据管理
```

### 组合式函数 (Composables)

```javascript
composables/
├── useCart.js                      # 购物车逻辑复用
├── useConveyorBelt.js             # 传送带核心逻辑
├── useConveyorLifecycle.js        # 传送带生命周期
├── useVirtualScrollOptimized.js   # 虚拟滚动优化
├── usePerformanceOptimization.js  # 性能优化
└── useImageLazyLoad.js            # 图片懒加载
```

## 📦 项目结构

```
src/
├── components/                 # 组件库
│   ├── cart/                  # 购物车组件
│   │   ├── ConveyorShoppingCart.vue
│   │   └── ShoppingCart.vue
│   ├── display/               # 传送带显示组件
│   │   ├── ConveyorBeltContainer.vue
│   │   ├── ConveyorPlates.vue
│   │   ├── SushiPlate.vue
│   │   └── CartPanel.vue
│   ├── menu/                  # 菜单组件
│   │   ├── CategoryNavigation.vue
│   │   ├── MenuItemGrid.vue
│   │   ├── DishCard.vue
│   │   └── SushiNavigation.vue
│   ├── customer/              # 顾客功能组件
│   │   ├── MenuItemDetail.vue
│   │   ├── CartDrawer.vue
│   │   └── GachaMachine.vue
│   └── common/                # 通用组件
│       ├── BaseButton.vue
│       ├── LazyImage.vue
│       └── FunctionButton.vue
├── views/                     # 页面组件
│   ├── display/               # 大屏显示页面
│   │   └── ConveyorBeltDisplay.vue
│   ├── menu/                  # 菜单页面
│   │   └── MenuHome.vue
│   ├── admin/                 # 管理后台
│   │   ├── AdminLayout.vue
│   │   ├── Dashboard.vue
│   │   ├── Categories.vue
│   │   ├── MenuItems.vue
│   │   └── Users.vue
│   ├── auth/                  # 认证页面
│   │   ├── Login.vue
│   │   └── CustomerLogin.vue
│   ├── customer/              # 顾客功能页面
│   │   ├── TableBinding.vue
│   │   └── MenuView.vue
│   └── error/                 # 错误页面
│       └── 404.vue
├── stores/                    # Pinia状态管理
├── composables/               # 组合式函数
├── utils/                     # 工具函数
├── api/                       # API接口层
├── styles/                    # 样式文件
├── data/                      # 静态数据
└── router/                    # 路由配置
```

## 🚀 开发指南

### 环境要求

```bash
Node.js >= 16.0.0
npm >= 8.0.0 (推荐使用 npm)
```

### 快速开始

```bash
# 1. 克隆项目
git clone <repository-url>
cd sanhe_ordering_client

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 浏览器访问
# http://localhost:3000
```

### 开发脚本

```bash
# 开发环境
npm run dev              # 启动开发服务器

# 构建相关
npm run build           # 构建生产版本
npm run preview         # 预览构建结果

# 代码质量
npm run lint            # ESLint代码检查
npm run format          # Prettier代码格式化
```

### 开发环境配置

#### Vite配置特色
```javascript
// vite.config.js 核心配置
{
  // 自动导入配置
  plugins: [
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router', 'pinia']
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  
  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views')
      // ... 更多别名
    }
  },

  // 开发服务器
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080'  // API代理
    }
  }
}
```

## 🎯 功能演示

### 1. 传送带大屏体验
```
访问: http://localhost:3000/display
功能: 
- 拖拽传送带浏览寿司
- 点击寿司添加到购物车
- 双侧购物车管理
- 投碟进度追踪
```

### 2. 菜单浏览模式
```
访问: http://localhost:3000/menu  
功能:
- 传统菜单浏览
- 分类筛选搜索
- 菜品详情查看
```

### 3. 管理后台
```
访问: http://localhost:3000/admin
功能:
- 菜品分类管理
- 订单状态追踪  
- 用户权限管理
```

## 🔧 核心配置

### API代理配置
```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

### 环境变量示例
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_TITLE=回转寿司点餐系统
VITE_USE_MOCK=true

# .env.production  
VITE_API_BASE_URL=https://api.sushi.com
VITE_APP_TITLE=回转寿司点餐系统
VITE_USE_MOCK=false
```

### 路由权限控制
```javascript
// router/index.js 权限守卫
router.beforeEach(async (to, _from, next) => {
  // 认证检查
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
    return
  }
  
  // 员工权限检查
  if (to.meta.requiresEmployee && !authStore.isEmployee) {
    next('/menu')
    return
  }
  
  // 特定权限检查
  if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
    next('/menu')
    return
  }
  
  next()
})
```

## 📊 数据结构

### 寿司菜品数据
```javascript
// src/data/sushiData.js
{
  id: 1,
  name: '三文鱼握寿司',
  emoji: '🍣',
  price: 25,
  category: 'nigiri',    // 分类: nigiri, sashimi, maki, hot
  image: '/img/抠图_315/10001.png'
}
```

### 购物车数据结构
```javascript
{
  id: 1,
  name: '三文鱼握寿司',
  price: 25,
  quantity: 2,
  cartSide: 'left',      // 购物车侧别
  cartIndex: 0,          // 购物车位置
  addedAt: '2023-01-01T00:00:00.000Z'
}
```

## 🎨 UI设计规范

### 主题色彩
```scss
// styles/variables.scss
$primary-color: #ff6b6b;      // 寿司红
$success-color: #4ecdc4;      // 海洋绿  
$warning-color: #ffe66d;      // 芥末黄
$error-color: #ff4757;        // 错误红
```

### 响应式断点
```scss
$screen-xs: 480px;    // 超小屏
$screen-sm: 576px;    // 小屏
$screen-md: 768px;    // 中屏
$screen-lg: 992px;    // 大屏
$screen-xl: 1200px;   // 超大屏
```

## 🔄 开发工作流

### Git提交规范
```bash
feat:     新功能
fix:      修复bug
docs:     文档更新
style:    代码格式调整
refactor: 代码重构
test:     测试相关
chore:    构建过程或辅助工具的变动
```

### 组件开发规范
```vue
<!-- 推荐的组件结构 -->
<template>
  <!-- 模板内容 -->
</template>

<script setup>
// 导入依赖
import { ref, computed, onMounted } from 'vue'

// 定义props
defineProps({
  // props定义
})

// 定义emits
defineEmits(['update:modelValue'])

// 组合式函数
// 响应式数据
// 计算属性  
// 方法
// 生命周期钩子
</script>

<style lang="scss" scoped>
// 组件样式
</style>
```

## 📈 性能优化

### 已实现的优化
- ✅ 路由懒加载
- ✅ 组件按需导入
- ✅ 虚拟滚动 (大数据列表)
- ✅ 图片懒加载
- ✅ 代码分包策略
- ✅ 缓存优化

### 构建优化配置
```javascript
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vue: ['vue', 'vue-router', 'pinia'],
        'element-plus': ['element-plus', '@element-plus/icons-vue'],
        utils: ['axios', 'nprogress']
      }
    }
  }
}
```

## 🚀 部署指南

### Docker部署
```dockerfile
# Dockerfile (项目根目录创建)
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### Nginx配置
```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 📋 开发状态

### ✅ 已完成功能
- 项目基础架构搭建
- 传送带大屏显示系统 (核心功能)
- 用户认证系统 (多角色登录)
- 购物车状态管理
- 路由配置和权限控制  
- 基础组件库
- 性能优化基础设施

### 🚧 开发中功能
- 菜品管理后台
- 订单管理系统
- 支付集成功能
- 实时通知系统
- 库存管理

### 📋 计划功能
- 数据统计报表
- 多语言支持
- PWA离线支持
- 微信小程序版本

## 🔗 相关文档

- [系统架构设计](./docs/01-系统架构设计.md)
- [API接口设计](./docs/02-API接口设计.md)
- [Vue前端开发指南](./docs/11-Vue前端开发指南.md)
- [开发路线图](./docs/14-开发路线图.md)
- [按钮组件指南](./docs/button-components-guide.md)

## 🤝 参与贡献

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📞 技术支持

- **项目文档**: [./docs/](./docs/)
- **问题反馈**: GitHub Issues
- **开发团队**: Sushi Development Team
- **项目版本**: 1.0.0

---

## 🎉 特别感谢

感谢所有参与项目开发的团队成员，以及开源社区提供的优秀技术方案。

**让我们一起打造最棒的数字化回转寿司体验！🍣**
