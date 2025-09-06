<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="login-background">
      <div class="bg-decoration"></div>
      <div class="floating-sushi">
        <div class="sushi-item" v-for="i in 6" :key="i"></div>
      </div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- 头部 -->
      <div class="login-header">
        <div class="logo">
          <el-icon size="48" color="#ff6b6b">
            <Shop />
          </el-icon>
        </div>
        <h1 class="title">回转寿司系统</h1>
        <p class="subtitle">员工登录</p>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            <span v-if="!loading">登录</span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 底部链接 -->
      <div class="login-footer">
        <el-divider>
          <span class="divider-text">其他登录方式</span>
        </el-divider>
        
        <el-button
          type="info"
          plain
          size="large"
          class="customer-login-btn"
          @click="goToCustomerLogin"
        >
          <el-icon class="mr-2"><User /></el-icon>
          顾客登录
        </el-button>
      </div>
    </div>

    <!-- 版本信息 -->
    <div class="version-info">
      <span>版本 {{ appConfig.version }}</span>
      <span class="separator">|</span>
      <span>{{ appConfig.author }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGlobalStore } from '@/stores/global'
import { ElMessage } from 'element-plus'
import { Shop, User, Lock } from '@element-plus/icons-vue'

// 路由和状态
const router = useRouter()
const authStore = useAuthStore()
const globalStore = useGlobalStore()
const { appConfig } = globalStore

// 表单引用
const loginFormRef = ref()

// 响应式数据
const loading = ref(false)
const rememberMe = ref(false)

// 登录表单
const loginForm = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    // 表单验证
    await loginFormRef.value.validate()
    
    loading.value = true
    
    // 调用登录API
    await authStore.login(loginForm)
    
    // 登录成功，跳转到管理后台
    router.push('/admin')
    
  } catch (error) {
    console.error('登录失败:', error)
    // 错误信息已在store中处理
  } finally {
    loading.value = false
  }
}

// 跳转到顾客登录
const goToCustomerLogin = () => {
  router.push('/customer-login')
}

// 组件挂载
onMounted(() => {
  // 如果已登录，直接跳转
  if (authStore.isLoggedIn) {
    if (authStore.isEmployee) {
      router.push('/admin')
    } else {
      router.push('/menu')
    }
  }
  
  // 开发环境自动填充
  if (import.meta.env.DEV) {
    loginForm.username = 'admin'
    loginForm.password = 'admin123'
  }
})
</script>

<style lang="scss" scoped>
.login-container {
  position: relative;
  width: 100%;
  height: 100vh;
  @include flex-center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;

  .bg-decoration {
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: float 20s ease-in-out infinite;
  }

  .floating-sushi {
    position: absolute;
    width: 100%;
    height: 100%;

    .sushi-item {
      position: absolute;
      width: 30px;
      height: 30px;
      background: $primary-color;
      border-radius: 50%;
      opacity: 0.1;
      animation: float-sushi 15s linear infinite;

      &:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
      &:nth-child(2) { top: 20%; left: 80%; animation-delay: 2s; }
      &:nth-child(3) { top: 60%; left: 20%; animation-delay: 4s; }
      &:nth-child(4) { top: 80%; left: 70%; animation-delay: 6s; }
      &:nth-child(5) { top: 40%; left: 90%; animation-delay: 8s; }
      &:nth-child(6) { top: 70%; left: 5%; animation-delay: 10s; }
    }
  }
}

.login-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow-lg;
  margin: 20px;

  @include mobile {
    max-width: 350px;
    padding: 30px 20px;
    margin: 10px;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 30px;

  .logo {
    margin-bottom: 16px;
  }

  .title {
    font-size: $font-size-xxl;
    font-weight: 600;
    color: $text-color-primary;
    margin-bottom: 8px;
  }

  .subtitle {
    font-size: $font-size-md;
    color: $text-color-secondary;
    margin: 0;
  }
}

.login-form {
  .login-options {
    @include flex-between;
    width: 100%;
  }

  .login-button {
    width: 100%;
    height: 48px;
    font-size: $font-size-md;
    font-weight: 500;
    border-radius: $border-radius;
    background: linear-gradient(135deg, $primary-color 0%, #ff5252 100%);
    border: none;

    &:hover {
      background: linear-gradient(135deg, #ff5252 0%, $primary-color 100%);
      transform: translateY(-1px);
      box-shadow: $box-shadow;
    }
  }
}

.login-footer {
  margin-top: 30px;

  .divider-text {
    font-size: $font-size-sm;
    color: $text-color-secondary;
  }

  .customer-login-btn {
    width: 100%;
    height: 44px;
    margin-top: 16px;
    border-color: $sushi-secondary;
    color: $sushi-secondary;

    &:hover {
      background-color: $sushi-secondary;
      border-color: $sushi-secondary;
      color: white;
    }
  }
}

.version-info {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: $font-size-xs;
  color: rgba(255, 255, 255, 0.7);
  z-index: 2;

  .separator {
    margin: 0 8px;
  }
}

// 动画
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

@keyframes float-sushi {
  0% { transform: translateY(100vh) rotate(0deg); }
  100% { transform: translateY(-100px) rotate(360deg); }
}

// 深色模式适配
.dark {
  .login-card {
    background: rgba(30, 30, 30, 0.95);
    color: white;
  }
}
</style>


