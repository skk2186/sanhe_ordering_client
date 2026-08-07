<template>
  <div class="table-binding">
    <!-- LINE FRIENDS 品牌标识 -->
    <div class="brand-header">
      <div class="line-logo">
        <img src="/images/line-friends-logo.svg" alt="LINE FRIENDS" class="logo-img">
        <h1 class="brand-title">金匠寿司 × LINE FRIENDS</h1>
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="binding-content">
      <!-- 桌号输入区域 -->
      <div class="table-input-section">
        <div class="input-container">
          <h2 class="input-title">{{ $t('auth.tableRequired') }}</h2>
          <p class="input-subtitle">{{ $t('auth.enterTable') }}</p>
          
          <div class="table-input-wrapper" :class="{ 'error': hasError, 'shake': isShaking }">
            <input 
              ref="tableInputRef"
              v-model="tableNumber"
              type="text" 
              :placeholder="$t('auth.tableExample')" 
              class="table-input-box"
              @input="handleInput"
              @keyup.enter="bindTable"
              maxlength="10"
            >
            <div class="input-icon">
              <el-icon><Location /></el-icon>
            </div>
          </div>
          
          <div class="error-message" v-if="errorMessage">
            {{ errorMessage }}
          </div>
          
          <button 
            class="bind-btn"
            :class="{ 'loading': isBinding }"
            :disabled="isBinding || !tableNumber.trim()"
            @click="bindTable"
          >
            <span v-if="!isBinding">{{ $t('auth.bindTable') }}</span>
            <span v-else>
              <el-icon class="loading-icon"><Loading /></el-icon>
              {{ $t('auth.binding') }}
            </span>
          </button>
        </div>
      </div>
      
      <!-- 角色插画区域 -->
      <div class="character-section">
        <div class="character-container" :class="{ 'celebrating': isSuccess }">
          <img 
            src="/images/brown-character.png" 
            :alt="$t('common.character')"
            class="character-img"
            :class="{ 'wave': isSuccess }"
          >
          <div class="character-bubble" v-if="showBubble">
            <p>{{ bubbleText }}</p>
          </div>
        </div>
        
        <!-- 装饰元素 -->
        <div class="decorations">
          <div class="floating-sushi sushi-1">🍣</div>
          <div class="floating-sushi sushi-2">🍤</div>
          <div class="floating-sushi sushi-3">🥢</div>
          <div class="sparkle sparkle-1">✨</div>
          <div class="sparkle sparkle-2">⭐</div>
        </div>
      </div>
    </div>
    
    <!-- 底部提示信息 -->
    <div class="footer-info">
      <div class="tips">
        <el-icon><InfoFilled /></el-icon>
        <span>{{ $t('auth.findTable') }}</span>
      </div>
      <div class="features">
        <div class="feature-item">
          <el-icon><Trophy /></el-icon>
          <span>{{ $t('display.plateProgress') }}</span>
        </div>
        <div class="feature-item">
          <el-icon><Star /></el-icon>
          <span>{{ $t('gacha.pointsReward') }}</span>
        </div>
        <div class="feature-item">
          <el-icon><Present /></el-icon>
          <span>{{ $t('gacha.grandReward') }}</span>
        </div>
      </div>
    </div>
    
    <!-- 成功动画遮罩 -->
    <div class="success-overlay" v-if="showSuccessOverlay">
      <div class="success-content">
        <div class="success-icon">
          <el-icon><SuccessFilled /></el-icon>
        </div>
        <h3>{{ $t('auth.bindSuccess') }}</h3>
        <p>{{ $t('auth.redirecting') }}</p>
        <div class="loading-bar">
          <div class="loading-progress" :style="{ width: loadingProgress + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/i18n'
// 图标已在 main.js 中全局注册，这里不再进行按需导入，避免打包命名导出差异导致错误
// 可直接在模板中使用 <el-icon><SuccessFilled /></el-icon> 等


const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

// 响应式数据
const tableInputRef = ref()
const tableNumber = ref('')
const isBinding = ref(false)
const hasError = ref(false)
const isShaking = ref(false)
const errorMessage = ref('')
const isSuccess = ref(false)
const showBubble = ref(false)
const bubbleText = ref('')
const showSuccessOverlay = ref(false)
const loadingProgress = ref(0)

// 方法
const handleInput = (event) => {
  // 自动转换为大写
  const value = event.target.value.toUpperCase()
  tableNumber.value = value
  
  // 清除错误状态
  if (hasError.value) {
    hasError.value = false
    errorMessage.value = ''
  }
}

const bindTable = async () => {
  const tableNum = tableNumber.value.trim()
  
  if (!tableNum) {
    showError(t('auth.tableRequired'))
    return
  }
  
  // 验证桌号格式（字母+数字组合）
  const tablePattern = /^[A-Z]\d{1,2}$/
  if (!tablePattern.test(tableNum)) {
    showError(t('auth.tableFormat'))
    return
  }
  
  isBinding.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 模拟绑定成功
    const success = Math.random() > 0.2 // 80% 成功率
    
    if (success) {
      await handleBindingSuccess(tableNum)
    } else {
      throw new Error(t('auth.tableUnavailable'))
    }
    
  } catch (error) {
    showError(error.message || t('auth.bindFailed'))
  } finally {
    isBinding.value = false
  }
}

const handleBindingSuccess = async (tableNum) => {
  isSuccess.value = true
  
  // 显示成功气泡
  showBubble.value = true
  bubbleText.value = t('auth.welcomeTable', { table: tableNum })
  
  // 保存桌号信息
  authStore.setTableNumber(tableNum)
  
  // 延迟显示成功遮罩
  setTimeout(() => {
    showSuccessOverlay.value = true
    startLoadingAnimation()
  }, 2000)
}

const startLoadingAnimation = () => {
  const duration = 3000 // 3秒
  const interval = 50
  const increment = 100 / (duration / interval)
  
  const timer = setInterval(() => {
    loadingProgress.value += increment
    
    if (loadingProgress.value >= 100) {
      clearInterval(timer)
      // 跳转到菜单页面
      router.push('/menu')
    }
  }, interval)
}

const showError = (message) => {
  hasError.value = true
  errorMessage.value = message
  isShaking.value = true
  
  // 聚焦输入框
  nextTick(() => {
    tableInputRef.value?.focus()
  })
  
  // 清除抖动效果
  setTimeout(() => {
    isShaking.value = false
  }, 500)
}

// 组件挂载
onMounted(() => {
  // 自动聚焦输入框
  nextTick(() => {
    tableInputRef.value?.focus()
  })
  
  // 显示欢迎气泡
  setTimeout(() => {
    showBubble.value = true
    bubbleText.value = t('auth.welcomeJourney')
  }, 1000)
})
</script>

<style lang="scss" scoped>
.table-binding {
  min-height: 100vh;
  background: linear-gradient(135deg, #FF7A00 0%, #FFB366 50%, #FFF8F0 100%);
  display: flex;
  flex-direction: column;
  font-family: $font-family-body;
  position: relative;
  overflow: hidden;
}

.brand-header {
  padding: $spacing-xl $spacing-lg;
  text-align: center;
  
  .line-logo {
    .logo-img {
      height: 6rem;
      margin-bottom: $spacing-md;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    }
    
    .brand-title {
      font-family: $font-family-title;
      font-size: $font-size-2xl;
      color: $white;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      font-weight: 600;
    }
  }
}

.binding-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-2xl;
  padding: 0 $spacing-2xl;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.table-input-section {
  .input-container {
    background: rgba(255, 255, 255, 0.95);
    padding: $spacing-2xl;
    border-radius: $border-radius-card;
    box-shadow: $shadow-lg;
    backdrop-filter: blur(10px);
    text-align: center;
    
    .input-title {
      font-family: $font-family-title;
      font-size: $font-size-3xl;
      color: $text-primary;
      margin: 0 0 $spacing-sm 0;
      font-weight: 600;
    }
    
    .input-subtitle {
      color: $text-secondary;
      font-size: $font-size-base;
      margin: 0 0 $spacing-xl 0;
    }
    
    .table-input-wrapper {
      position: relative;
      margin-bottom: $spacing-md;
      
      &.error {
        .table-input-box {
          border-color: $error-color;
          box-shadow: 0 0 0 2px rgba($error-color, 0.2);
        }
      }
      
      &.shake {
        animation: shake 0.5s ease-in-out;
      }
      
      .table-input-box {
        width: 100%;
        height: 6rem;
        font-size: $font-size-2xl;
        text-align: center;
        border: 2px solid #E0E0E0;
        border-radius: $border-radius-button;
        background: $white;
        color: $text-primary;
        font-weight: 600;
        letter-spacing: 2px;
        transition: all $transition-base;
        
        &:focus {
          outline: none;
          border-color: $primary-color;
          box-shadow: 0 0 0 3px rgba($primary-color, 0.2);
        }
        
        &::placeholder {
          color: #BDBDBD;
          font-weight: normal;
        }
      }
      
      .input-icon {
        position: absolute;
        right: $spacing-md;
        top: 50%;
        transform: translateY(-50%);
        color: $text-secondary;
        font-size: $font-size-xl;
      }
    }
    
    .error-message {
      color: $error-color;
      font-size: $font-size-sm;
      margin-bottom: $spacing-md;
      text-align: center;
    }
    
    .bind-btn {
      width: 100%;
      height: 5.6rem;
      background: linear-gradient(135deg, $primary-color 0%, #FF9533 100%);
      color: $white;
      border: none;
      border-radius: $border-radius-button;
      font-size: $font-size-lg;
      font-weight: 600;
      cursor: pointer;
      transition: all $transition-base;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-sm;
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: $shadow-md;
      }
      
      &:active:not(:disabled) {
        transform: translateY(0);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      
      &.loading {
        .loading-icon {
          animation: spin 1s linear infinite;
        }
      }
    }
  }
}

.character-section {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .character-container {
    position: relative;
    text-align: center;

    &.celebrating {
      .character-img {
        animation: celebrate 2s ease-in-out;
      }
    }

    .character-img {
      width: 32rem;
      height: 32rem;
      object-fit: contain;
      filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2));
      transition: all $transition-base;

      &.wave {
        animation: wave 1s ease-in-out infinite;
      }
    }

    .character-bubble {
      position: absolute;
      top: -2rem;
      left: 50%;
      transform: translateX(-50%);
      background: $white;
      padding: $spacing-md $spacing-lg;
      border-radius: $border-radius-card;
      box-shadow: $shadow-md;
      max-width: 24rem;

      &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid $white;
      }

      p {
        margin: 0;
        color: $text-primary;
        font-size: $font-size-base;
        font-weight: 500;
      }
    }
  }

  .decorations {
    position: absolute;
    inset: 0;
    pointer-events: none;

    .floating-sushi {
      position: absolute;
      font-size: $font-size-3xl;
      animation: float 4s ease-in-out infinite;

      &.sushi-1 {
        top: 10%;
        left: 10%;
        animation-delay: 0s;
      }

      &.sushi-2 {
        top: 20%;
        right: 15%;
        animation-delay: 1.5s;
      }

      &.sushi-3 {
        bottom: 30%;
        left: 20%;
        animation-delay: 3s;
      }
    }

    .sparkle {
      position: absolute;
      font-size: $font-size-xl;
      color: #FFD700;
      animation: sparkle 2s ease-in-out infinite;

      &.sparkle-1 {
        top: 15%;
        right: 25%;
        animation-delay: 0.5s;
      }

      &.sparkle-2 {
        bottom: 25%;
        right: 10%;
        animation-delay: 2s;
      }
    }
  }
}

.footer-info {
  padding: $spacing-lg $spacing-2xl $spacing-xl;
  text-align: center;

  .tips {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    color: rgba($white, 0.9);
    font-size: $font-size-sm;
    margin-bottom: $spacing-lg;

    .el-icon {
      font-size: $font-size-base;
    }
  }

  .features {
    display: flex;
    justify-content: center;
    gap: $spacing-xl;

    .feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-xs;
      color: rgba($white, 0.9);
      font-size: $font-size-sm;

      .el-icon {
        font-size: $font-size-xl;
        color: #FFD700;
      }
    }
  }
}

.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-index-modal;
  backdrop-filter: blur(4px);

  .success-content {
    background: $white;
    padding: $spacing-2xl;
    border-radius: $border-radius-card;
    text-align: center;
    max-width: 40rem;
    width: 90%;

    .success-icon {
      font-size: 6rem;
      color: $success-color;
      margin-bottom: $spacing-lg;

      .el-icon {
        animation: successPulse 1s ease-in-out;
      }
    }

    h3 {
      font-family: $font-family-title;
      font-size: $font-size-2xl;
      color: $text-primary;
      margin: 0 0 $spacing-md 0;
      font-weight: 600;
    }

    p {
      color: $text-secondary;
      font-size: $font-size-base;
      margin: 0 0 $spacing-xl 0;
    }

    .loading-bar {
      width: 100%;
      height: 4px;
      background: #E0E0E0;
      border-radius: 2px;
      overflow: hidden;

      .loading-progress {
        height: 100%;
        background: linear-gradient(90deg, $primary-color, #FF9533);
        border-radius: 2px;
        transition: width 0.1s ease-out;
      }
    }
  }
}

// 响应式设计
@media (max-width: $breakpoint-md) {
  .binding-content {
    grid-template-columns: 1fr;
    gap: $spacing-xl;
    padding: 0 $spacing-lg;

    .character-section {
      order: -1;

      .character-img {
        width: 24rem;
        height: 24rem;
      }
    }
  }

  .footer-info {
    .features {
      gap: $spacing-lg;
    }
  }
}

@media (max-width: $breakpoint-xs) {
  .brand-header {
    padding: $spacing-lg;

    .brand-title {
      font-size: $font-size-xl;
    }
  }

  .table-input-section {
    .input-container {
      padding: $spacing-lg;

      .input-title {
        font-size: $font-size-2xl;
      }

      .table-input-box {
        height: 5rem;
        font-size: $font-size-xl;
      }

      .bind-btn {
        height: 4.8rem;
      }
    }
  }

  .character-section {
    .character-img {
      width: 20rem;
      height: 20rem;
    }
  }
}

// 动画定义
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

@keyframes celebrate {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-2deg); }
  50% { transform: scale(1.05) rotate(2deg); }
  75% { transform: scale(1.1) rotate(-1deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}

@keyframes sparkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes successPulse {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>
