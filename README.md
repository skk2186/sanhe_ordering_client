# 回转寿司点餐系统 - 前端

基于 Vue 3 + Element Plus 的现代化回转寿司点餐系统前端应用。

## 🚀 技术栈

- **框架**: Vue 3 + Composition API
- **构建工具**: Vite 5
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP客户端**: Axios
- **样式**: SCSS
- **图标**: Element Plus Icons

## 📦 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API接口
│   │   └── auth.js        # 认证相关API
│   ├── assets/            # 资源文件
│   ├── components/        # 通用组件
│   ├── router/            # 路由配置
│   │   └── index.js       # 路由主文件
│   ├── stores/            # Pinia状态管理
│   │   ├── auth.js        # 认证状态
│   │   └── global.js      # 全局状态
│   ├── styles/            # 样式文件
│   │   ├── index.scss     # 主样式文件
│   │   ├── variables.scss # 样式变量
│   │   └── mixins.scss    # 样式混入
│   ├── utils/             # 工具函数
│   │   ├── index.js       # 通用工具
│   │   └── request.js     # HTTP请求封装
│   ├── views/             # 页面组件
│   │   ├── auth/          # 认证页面
│   │   │   ├── Login.vue  # 员工登录
│   │   │   └── CustomerLogin.vue # 顾客登录
│   │   └── error/         # 错误页面
│   │       └── 404.vue    # 404页面
│   ├── App.vue            # 根组件
│   └── main.js            # 应用入口
├── .env.development       # 开发环境配置
├── .env.production        # 生产环境配置
├── index.html             # HTML模板
├── package.json           # 项目配置
├── vite.config.js         # Vite配置
└── README.md              # 项目文档
```

## 🛠️ 开发指南

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
# 使用npm
npm install

# 使用yarn
yarn install
```

### 开发运行

```bash
# 启动开发服务器
npm run dev

# 或使用yarn
yarn dev
```

访问 http://localhost:3000

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 🔧 配置说明

### 环境变量

- `VITE_API_BASE_URL`: API基础URL
- `VITE_APP_TITLE`: 应用标题
- `VITE_USE_MOCK`: 是否使用Mock数据

### 代理配置

开发环境下，API请求会自动代理到后端服务：

```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

## 🎨 设计系统

### 主题色彩

- 主色调: `#ff6b6b` (寿司红)
- 辅助色: `#4ecdc4` (海洋绿)
- 强调色: `#ffe66d` (芥末黄)

### 响应式断点

- 移动端: `< 768px`
- 平板端: `768px - 992px`
- 桌面端: `> 992px`

## 🔐 认证系统

### 登录方式

1. **员工登录**: 用户名 + 密码
2. **顾客登录**: 桌号登录

### 权限控制

- 基于角色的权限控制 (RBAC)
- 路由级别权限验证
- 组件级别权限控制

### Token管理

- JWT Token自动刷新
- 安全的Token存储
- 登录状态持久化

## 📱 功能模块

### 已完成

- ✅ 项目基础架构
- ✅ 认证系统 (员工登录、顾客登录)
- ✅ 路由配置和权限控制
- ✅ 全局状态管理
- ✅ HTTP请求封装
- ✅ 错误处理机制

### 开发中

- 🚧 菜品浏览模块
- 🚧 购物车功能
- 🚧 管理后台

### 计划中

- 📋 订单管理
- 📋 支付集成
- 📋 实时通知

## 🔌 API集成

### 后端服务

- **用户服务**: `http://localhost:8081`
- **菜品服务**: `http://localhost:8082`
- **API网关**: `http://localhost:8080`

### 接口文档

详细的API接口文档请参考后端服务的Swagger文档。

## 🧪 测试

```bash
# 运行单元测试
npm run test

# 运行E2E测试
npm run test:e2e

# 代码覆盖率
npm run coverage
```

## 📝 代码规范

### ESLint配置

项目使用ESLint进行代码规范检查：

```bash
# 检查代码规范
npm run lint

# 自动修复
npm run lint:fix
```

### 提交规范

使用Conventional Commits规范：

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 🚀 部署

### Docker部署

```bash
# 构建镜像
docker build -t sushi-frontend .

# 运行容器
docker run -p 3000:80 sushi-frontend
```

### Nginx配置

```nginx
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
    }
}
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👥 团队

- **开发团队**: Sushi Team
- **版本**: 1.0.0
- **联系方式**: team@sushi-system.com

---

**Happy Coding! 🍣**
