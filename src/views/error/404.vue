<template>
  <div class="error-container">
    <div class="error-content">
      <!-- 404图标 -->
      <div class="error-icon">
        <el-icon size="120" color="#ff6b6b">
          <WarningFilled />
        </el-icon>
      </div>

      <!-- 错误信息 -->
      <div class="error-info">
        <h1 class="error-code">404</h1>
        <h2 class="error-title">{{ $t('errorPage.title') }}</h2>
        <p class="error-description">
          {{ $t('errorPage.description') }}
          <br>
          {{ $t('errorPage.suggestion') }}
        </p>
      </div>

      <!-- 操作按钮 -->
      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome">
          <el-icon class="mr-2"><HomeFilled /></el-icon>
          {{ $t('common.home') }}
        </el-button>
        
        <el-button size="large" @click="goBack">
          <el-icon class="mr-2"><Back /></el-icon>
          {{ $t('common.back') }}
        </el-button>
      </div>

      <!-- 建议链接 -->
      <div class="error-suggestions">
        <h3>{{ $t('errorPage.maybeWant') }}</h3>
        <div class="suggestion-links">
          <el-link 
            v-if="!authStore.isLoggedIn" 
            type="primary" 
            @click="$router.push('/login')"
          >
            {{ $t('auth.employeeLogin') }}
          </el-link>
          
          <el-link 
            v-if="!authStore.isLoggedIn" 
            type="primary" 
            @click="$router.push('/customer-login')"
          >
            {{ $t('auth.customerLogin') }}
          </el-link>
          
          <el-link 
            v-if="authStore.isLoggedIn && authStore.isEmployee" 
            type="primary" 
            @click="$router.push('/admin')"
          >
            {{ $t('common.admin') }}
          </el-link>
          
          <el-link 
            v-if="authStore.isLoggedIn" 
            type="primary" 
            @click="$router.push('/menu')"
          >
            {{ $t('menu.dishList') }}
          </el-link>
        </div>
      </div>
    </div>

    <!-- 装饰元素 -->
    <div class="decoration">
      <div class="floating-sushi" v-for="i in 5" :key="i"></div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { WarningFilled, HomeFilled, Back } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

// 返回首页
const goHome = () => {
  if (authStore.isLoggedIn) {
    if (authStore.isEmployee) {
      router.push('/admin')
    } else {
      router.push('/menu')
    }
  } else {
    router.push('/login')
  }
}

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goHome()
  }
}
</script>

<style lang="scss" scoped>
.error-container {
  position: relative;
  width: 100%;
  height: 100vh;
  @include flex-center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
}

.error-content {
  text-align: center;
  z-index: 2;
  max-width: 600px;
  padding: 40px;

  @include mobile {
    padding: 20px;
  }
}

.error-icon {
  margin-bottom: 30px;
  animation: bounce 2s infinite;
}

.error-info {
  margin-bottom: 40px;

  .error-code {
    font-size: 120px;
    font-weight: 700;
    color: $sushi-primary;
    margin: 0;
    line-height: 1;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);

    @include mobile {
      font-size: 80px;
    }
  }

  .error-title {
    font-size: 32px;
    font-weight: 600;
    color: $text-color-primary;
    margin: 20px 0 16px;

    @include mobile {
      font-size: 24px;
    }
  }

  .error-description {
    font-size: $font-size-md;
    color: $text-color-secondary;
    line-height: 1.6;
    margin: 0;
  }
}

.error-actions {
  @include flex-center;
  gap: 16px;
  margin-bottom: 40px;

  @include mobile {
    flex-direction: column;
    
    .el-button {
      width: 200px;
    }
  }
}

.error-suggestions {
  .suggestion-links {
    @include flex-center;
    gap: 20px;
    margin-top: 16px;

    @include mobile {
      flex-direction: column;
      gap: 12px;
    }
  }

  h3 {
    font-size: $font-size-lg;
    color: $text-color-regular;
    margin-bottom: 16px;
  }
}

.decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;

  .floating-sushi {
    position: absolute;
    width: 40px;
    height: 40px;
    background: $sushi-primary;
    border-radius: 50%;
    opacity: 0.1;
    animation: float-decoration 20s linear infinite;

    &:nth-child(1) {
      top: 10%;
      left: 10%;
      animation-delay: 0s;
    }

    &:nth-child(2) {
      top: 20%;
      right: 10%;
      animation-delay: 4s;
    }

    &:nth-child(3) {
      bottom: 30%;
      left: 20%;
      animation-delay: 8s;
    }

    &:nth-child(4) {
      bottom: 20%;
      right: 20%;
      animation-delay: 12s;
    }

    &:nth-child(5) {
      top: 50%;
      left: 5%;
      animation-delay: 16s;
    }
  }
}

// 动画
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes float-decoration {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
  100% {
    transform: translateY(0) rotate(360deg);
  }
}

// 深色模式适配
.dark {
  .error-container {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  }

  .error-info {
    .error-title {
      color: white;
    }

    .error-description {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .error-suggestions h3 {
    color: rgba(255, 255, 255, 0.8);
  }
}
</style>
