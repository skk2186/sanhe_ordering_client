<template>
  <div class="customer-login-container">
    <!-- 背景装饰 -->
    <div class="login-background">
      <div class="wave-decoration"></div>
      <div class="floating-elements">
        <div class="element" v-for="i in 8" :key="i"></div>
      </div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- 头部 -->
      <div class="login-header">
        <div class="logo">
          <el-icon size="56" color="#4ecdc4">
            <Bowl />
          </el-icon>
        </div>
        <h1 class="title">欢迎光临</h1>
        <p class="subtitle">请输入您的桌号开始点餐</p>
      </div>

      <!-- 桌号输入 -->
      <div class="table-input-section">
        <div class="table-number-display">
          <span class="table-label">桌号</span>
          <div class="table-number">{{ displayTableNumber }}</div>
        </div>

        <!-- 数字键盘 -->
        <div class="number-pad">
          <div class="number-row" v-for="row in numberPadRows" :key="row.join('')">
            <button
              v-for="num in row"
              :key="num"
              class="number-btn"
              :class="{ 'zero-btn': num === 0 }"
              @click="inputNumber(num)"
            >
              {{ num }}
            </button>
          </div>
          
          <div class="action-row">
            <button class="action-btn clear-btn" @click="clearInput">
              <el-icon><Delete /></el-icon>
              清除
            </button>
            <button class="action-btn backspace-btn" @click="backspace">
              <el-icon><Back /></el-icon>
            </button>
          </div>
        </div>

        <!-- 登录按钮 -->
        <el-button
          type="primary"
          size="large"
          class="login-button"
          :loading="loading"
          :disabled="!tableNumber"
          @click="handleCustomerLogin"
        >
          <el-icon class="mr-2"><Right /></el-icon>
          <span v-if="!loading">开始点餐</span>
          <span v-else>登录中...</span>
        </el-button>
      </div>

      <!-- 底部提示 -->
      <div class="login-footer">
        <div class="tips">
          <el-icon color="#4ecdc4"><InfoFilled /></el-icon>
          <span>请输入您桌子上的桌号，如有疑问请联系服务员</span>
        </div>
        
        <el-divider />
        
        <el-button
          type="info"
          plain
          size="default"
          @click="goToEmployeeLogin"
        >
          <el-icon class="mr-2"><User /></el-icon>
          员工登录
        </el-button>
      </div>
    </div>

    <!-- 装饰信息 -->
    <div class="decoration-info">
      <div class="info-item">
        <el-icon><Clock /></el-icon>
        <span>营业时间：10:00 - 22:00</span>
      </div>
      <div class="info-item">
        <el-icon><Phone /></el-icon>
        <span>服务热线：400-888-8888</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import {
  Bowl,
  Delete,
  Back,
  Right,
  InfoFilled,
  User,
  Clock,
  Phone
} from '@element-plus/icons-vue'

// 路由和状态
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const tableNumber = ref('')

// 数字键盘布局
const numberPadRows = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [0]
]

// 显示的桌号（格式化）
const displayTableNumber = computed(() => {
  return tableNumber.value || '请输入桌号'
})

// 输入数字
const inputNumber = (num) => {
  if (tableNumber.value.length >= 3) {
    ElMessage.warning('桌号最多3位数字')
    return
  }
  
  // 避免以0开头（除非就是0）
  if (tableNumber.value === '' && num === 0) {
    tableNumber.value = '0'
  } else if (tableNumber.value === '0' && num !== 0) {
    tableNumber.value = num.toString()
  } else {
    tableNumber.value += num.toString()
  }
}

// 退格
const backspace = () => {
  if (tableNumber.value.length > 0) {
    tableNumber.value = tableNumber.value.slice(0, -1)
  }
}

// 清除输入
const clearInput = () => {
  tableNumber.value = ''
}

// 处理顾客登录
const handleCustomerLogin = async () => {
  if (!tableNumber.value) {
    ElMessage.warning('请输入桌号')
    return
  }

  const tableNum = parseInt(tableNumber.value)
  if (tableNum < 1 || tableNum > 999) {
    ElMessage.warning('桌号范围为 1-999')
    return
  }

  try {
    loading.value = true
    
    // 调用顾客登录API
    await authStore.customerLogin(tableNum)
    
    // 登录成功，跳转到菜品页面
    router.push('/menu')
    
  } catch (error) {
    console.error('顾客登录失败:', error)
    // 错误信息已在store中处理
  } finally {
    loading.value = false
  }
}

// 跳转到员工登录
const goToEmployeeLogin = () => {
  router.push('/login')
}

// 键盘事件处理
const handleKeydown = (event) => {
  const key = event.key
  
  if (key >= '0' && key <= '9') {
    event.preventDefault()
    inputNumber(parseInt(key))
  } else if (key === 'Backspace') {
    event.preventDefault()
    backspace()
  } else if (key === 'Delete' || key === 'Escape') {
    event.preventDefault()
    clearInput()
  } else if (key === 'Enter') {
    event.preventDefault()
    handleCustomerLogin()
  }
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
  
  // 监听键盘事件
  document.addEventListener('keydown', handleKeydown)
  
  // 开发环境自动填充
  if (import.meta.env.DEV) {
    tableNumber.value = '1'
  }
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.customer-login-container {
  position: relative;
  width: 100%;
  height: 100vh;
  @include flex-center;
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;

  .wave-decoration {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 200px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120'%3E%3Cpath d='M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E") no-repeat;
    background-size: cover;
    animation: wave 3s ease-in-out infinite;
  }

  .floating-elements {
    position: absolute;
    width: 100%;
    height: 100%;

    .element {
      position: absolute;
      width: 20px;
      height: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      animation: float-element 12s linear infinite;

      &:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
      &:nth-child(2) { top: 20%; left: 80%; animation-delay: 1.5s; }
      &:nth-child(3) { top: 60%; left: 20%; animation-delay: 3s; }
      &:nth-child(4) { top: 80%; left: 70%; animation-delay: 4.5s; }
      &:nth-child(5) { top: 40%; left: 90%; animation-delay: 6s; }
      &:nth-child(6) { top: 70%; left: 5%; animation-delay: 7.5s; }
      &:nth-child(7) { top: 30%; left: 50%; animation-delay: 9s; }
      &:nth-child(8) { top: 90%; left: 40%; animation-delay: 10.5s; }
    }
  }
}

.login-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 450px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow-lg;
  margin: 20px;

  @include mobile {
    max-width: 380px;
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
    font-size: 28px;
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

.table-input-section {
  .table-number-display {
    text-align: center;
    margin-bottom: 30px;

    .table-label {
      display: block;
      font-size: $font-size-sm;
      color: $text-color-secondary;
      margin-bottom: 8px;
    }

    .table-number {
      font-size: 36px;
      font-weight: 600;
      color: $sushi-secondary;
      min-height: 50px;
      @include flex-center;
      border: 2px dashed $border-color-light;
      border-radius: $border-radius;
      padding: 10px;
      background: $bg-color-light;
    }
  }

  .number-pad {
    margin-bottom: 30px;

    .number-row {
      @include flex-center;
      gap: 12px;
      margin-bottom: 12px;

      .number-btn {
        width: 60px;
        height: 60px;
        border: none;
        border-radius: $border-radius;
        background: white;
        color: $text-color-primary;
        font-size: 20px;
        font-weight: 500;
        cursor: pointer;
        transition: all $transition-base;
        box-shadow: $box-shadow-sm;

        &:hover {
          background: $sushi-secondary;
          color: white;
          transform: translateY(-2px);
          box-shadow: $box-shadow;
        }

        &:active {
          transform: translateY(0);
        }

        &.zero-btn {
          width: 132px;
        }
      }
    }

    .action-row {
      @include flex-center;
      gap: 12px;

      .action-btn {
        flex: 1;
        height: 50px;
        border: none;
        border-radius: $border-radius;
        font-size: $font-size-sm;
        cursor: pointer;
        transition: all $transition-base;
        @include flex-center;
        gap: 4px;

        &.clear-btn {
          background: $color-warning;
          color: white;

          &:hover {
            background: darken($color-warning, 10%);
          }
        }

        &.backspace-btn {
          background: $color-info;
          color: white;

          &:hover {
            background: darken($color-info, 10%);
          }
        }
      }
    }
  }

  .login-button {
    width: 100%;
    height: 56px;
    font-size: $font-size-lg;
    font-weight: 500;
    border-radius: $border-radius;
    background: linear-gradient(135deg, $sushi-secondary 0%, #44a08d 100%);
    border: none;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #44a08d 0%, $sushi-secondary 100%);
      transform: translateY(-2px);
      box-shadow: $box-shadow-lg;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.login-footer {
  margin-top: 30px;
  text-align: center;

  .tips {
    @include flex-center;
    gap: 8px;
    font-size: $font-size-sm;
    color: $text-color-secondary;
    margin-bottom: 20px;
    padding: 12px;
    background: rgba($sushi-secondary, 0.1);
    border-radius: $border-radius;
  }
}

.decoration-info {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  @include flex-center;
  gap: 30px;

  @include mobile {
    flex-direction: column;
    gap: 10px;
  }

  .info-item {
    @include flex-center;
    gap: 6px;
    font-size: $font-size-xs;
    color: rgba(255, 255, 255, 0.8);
  }
}

// 动画
@keyframes wave {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-50px); }
}

@keyframes float-element {
  0% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
  50% { opacity: 0.3; }
  100% { transform: translateY(-20px) rotate(360deg); opacity: 0.1; }
}

// 深色模式适配
.dark {
  .login-card {
    background: rgba(30, 30, 30, 0.95);
    color: white;
  }

  .table-number-display .table-number {
    background: rgba(40, 40, 40, 0.8);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .number-btn {
    background: rgba(40, 40, 40, 0.8);
    color: white;
  }
}
</style>
