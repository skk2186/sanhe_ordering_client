<template>
  <div class="plate-progress">
    <!-- 进度条容器 -->
    <div class="progress-container">
      <div class="progress-header">
        <div class="progress-title">
          <el-icon><Trophy /></el-icon>
          <span>{{ $t('display.plateProgress') }}</span>
        </div>
        <div class="progress-count">
          <span class="current">{{ currentPlates }}</span>
          <span class="separator">/</span>
          <span class="total">{{ targetPlates }}</span>
        </div>
      </div>
      
      <!-- 进度条主体 -->
      <div class="progress-bar" :class="{ 'completed': isCompleted, 'exploding': isExploding }">
        <div class="progress-track">
          <!-- 进度块 -->
          <div 
            v-for="index in targetPlates" 
            :key="index"
            class="progress-block"
            :class="getBlockClass(index)"
            :style="{ animationDelay: `${(index - 1) * 0.1}s` }"
          >
            <div class="block-inner">
              <el-icon v-if="index <= currentPlates"><Check /></el-icon>
              <span v-else>{{ index }}</span>
            </div>
          </div>
          
          <!-- 进度填充动画 -->
          <div 
            class="progress-fill" 
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
        
        <!-- 完成时的特效 -->
        <div class="completion-effects" v-if="showEffects">
          <div class="golden-particles">
            <div v-for="i in 12" :key="i" class="particle" :style="getParticleStyle(i)"></div>
          </div>
          <div class="explosion-ring"></div>
        </div>
      </div>
      
      <!-- 状态提示 -->
      <div class="progress-status">
        <div v-if="!isCompleted" class="remaining-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>{{ $t('display.remainingPlates', { count: remainingPlates }) }}</span>
        </div>
        <div v-else class="completed-tip">
          <el-icon><Star /></el-icon>
          <span>{{ $t('display.gachaEarned') }}</span>
        </div>
      </div>
    </div>
    
    <!-- 布朗熊提示动画 -->
    <div class="character-notification" v-if="showCharacterNotification" :class="{ 'show': characterVisible }">
      <div class="character-container">
        <img src="/images/brown-character-small.png" :alt="$t('common.character')" class="character-img">
        <div class="notification-bubble">
          <p>{{ notificationText }}</p>
          <div class="bubble-arrow"></div>
        </div>
      </div>
    </div>
    
    <!-- 扭蛋机触发按钮 -->
    <div class="gacha-trigger" v-if="isCompleted && !gachaUsed">
      <el-button 
        type="primary" 
        size="large"
        class="gacha-btn"
        @click="triggerGacha"
        :loading="gachaLoading"
      >
        <el-icon><Present /></el-icon>
        {{ $t('display.openGacha') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/i18n'
// 图标已在 main.js 中全局注册，这里不再进行按需导入

const props = defineProps({
  currentPlates: {
    type: Number,
    default: 0
  },
  targetPlates: {
    type: Number,
    default: 5
  },
  gachaUsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['gacha-trigger', 'progress-complete'])
const { t } = useI18n()

// 响应式数据
const isExploding = ref(false)
const showEffects = ref(false)
const showCharacterNotification = ref(false)
const characterVisible = ref(false)
const notificationText = ref('')
const gachaLoading = ref(false)

// 计算属性
const isCompleted = computed(() => props.currentPlates >= props.targetPlates)
const remainingPlates = computed(() => Math.max(0, props.targetPlates - props.currentPlates))
const progressPercentage = computed(() => (props.currentPlates / props.targetPlates) * 100)

// 方法
const getBlockClass = (index) => {
  const isActive = index <= props.currentPlates
  const isLast = index === props.currentPlates
  
  return {
    'active': isActive,
    'last-active': isLast && !isCompleted.value,
    'completed': isActive && isCompleted.value,
    'slide-in': isActive
  }
}

const getParticleStyle = (index) => {
  const angle = (index - 1) * 30 // 每个粒子间隔30度
  const radius = 60 + Math.random() * 40 // 随机半径
  
  return {
    '--angle': `${angle}deg`,
    '--radius': `${radius}px`,
    '--delay': `${index * 0.1}s`
  }
}

const triggerCompletionEffects = async () => {
  // 爆炸效果
  isExploding.value = true
  
  // 延迟显示粒子特效
  setTimeout(() => {
    showEffects.value = true
  }, 300)
  
  // 显示角色通知
  setTimeout(() => {
    showCharacterNotification.value = true
    notificationText.value = t('gacha.chance')
    
    nextTick(() => {
      characterVisible.value = true
    })
  }, 800)
  
  // 清理效果
  setTimeout(() => {
    isExploding.value = false
    showEffects.value = false
  }, 2000)
  
  // 隐藏角色通知
  setTimeout(() => {
    characterVisible.value = false
    setTimeout(() => {
      showCharacterNotification.value = false
    }, 300)
  }, 4000)
  
  // 触发完成事件
  emit('progress-complete')
}

const triggerGacha = async () => {
  gachaLoading.value = true
  
  try {
    // 模拟触发扭蛋机
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    emit('gacha-trigger')
    ElMessage.success(t('display.gachaOpened'))
  } catch (error) {
    ElMessage.error(t('display.gachaOpenFailed'))
  } finally {
    gachaLoading.value = false
  }
}

const showProgressNotification = (plates) => {
  if (plates === 0) return
  
  const messages = [
    t('display.plateOne'),
    t('display.plateTwo'),
    t('display.plateThree'),
    t('display.plateFour'),
    t('display.plateComplete')
  ]
  
  if (plates < props.targetPlates) {
    showCharacterNotification.value = true
    notificationText.value = messages[plates - 1] || t('display.plateMore', { count: plates })
    
    nextTick(() => {
      characterVisible.value = true
    })
    
    // 3秒后隐藏
    setTimeout(() => {
      characterVisible.value = false
      setTimeout(() => {
        showCharacterNotification.value = false
      }, 300)
    }, 3000)
  }
}

// 监听器
watch(() => props.currentPlates, (newVal, oldVal) => {
  if (newVal > oldVal) {
    // 显示进度通知
    showProgressNotification(newVal)
    
    // 检查是否完成
    if (newVal >= props.targetPlates && oldVal < props.targetPlates) {
      setTimeout(() => {
        triggerCompletionEffects()
      }, 500)
    }
  }
}, { immediate: false })
</script>

<style lang="scss" scoped>
.plate-progress {
  position: relative;
  background: rgba($white, 0.95);
  border-radius: $border-radius-card;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
  backdrop-filter: blur(10px);
}

.progress-container {
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;
    
    .progress-title {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      font-family: $font-family-title;
      font-size: $font-size-lg;
      font-weight: 600;
      color: $text-primary;
      
      .el-icon {
        color: #FFD700;
        font-size: $font-size-xl;
      }
    }
    
    .progress-count {
      font-size: $font-size-xl;
      font-weight: 600;
      
      .current {
        color: $primary-color;
      }
      
      .separator {
        color: $text-secondary;
        margin: 0 $spacing-xs;
      }
      
      .total {
        color: $text-secondary;
      }
    }
  }
}

.progress-bar {
  position: relative;
  margin-bottom: $spacing-md;
  
  &.exploding {
    .progress-track {
      animation: progressExplode 0.5s ease-out;
    }
  }
  
  .progress-track {
    display: flex;
    gap: $spacing-xs;
    position: relative;
    padding: $spacing-sm;
    background: #F0F0F0;
    border-radius: $border-radius-button;
    overflow: hidden;
    
    .progress-block {
      flex: 1;
      height: 4rem;
      background: #E0E0E0;
      border-radius: $border-radius-small;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all $transition-base;
      
      &.slide-in {
        animation: slideIn 0.5s ease-out;
      }
      
      &.active {
        background: linear-gradient(135deg, $primary-color, #FF9533);
        color: $white;
        box-shadow: 0 2px 8px rgba($primary-color, 0.3);
        
        .block-inner {
          animation: blockPulse 0.3s ease-out;
        }
      }
      
      &.last-active {
        animation: lastBlockGlow 1s ease-in-out infinite;
      }
      
      &.completed {
        background: linear-gradient(135deg, #FFD700, #FFA500);
        
        .el-icon {
          animation: checkBounce 0.5s ease-out;
        }
      }
      
      .block-inner {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: $font-size-sm;
      }
    }
    
    .progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: linear-gradient(90deg, 
        rgba($primary-color, 0.2), 
        rgba($primary-color, 0.1)
      );
      border-radius: $border-radius-button;
      transition: width 0.5s ease-out;
    }
  }
  
  .completion-effects {
    position: absolute;
    inset: 0;
    pointer-events: none;
    
    .golden-particles {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      
      .particle {
        position: absolute;
        width: 6px;
        height: 6px;
        background: #FFD700;
        border-radius: 50%;
        animation: particleExplode 1.5s ease-out forwards;
        
        &:nth-child(odd) {
          background: #FFA500;
        }
      }
    }
    
    .explosion-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 0;
      height: 0;
      border: 2px solid #FFD700;
      border-radius: 50%;
      animation: ringExpand 1s ease-out;
    }
  }
}

.progress-status {
  text-align: center;

  .remaining-tip,
  .completed-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    font-size: $font-size-sm;
    padding: $spacing-sm $spacing-md;
    border-radius: $border-radius-button;

    .el-icon {
      font-size: $font-size-base;
    }
  }

  .remaining-tip {
    background: rgba($info-color, 0.1);
    color: $info-color;

    .el-icon {
      color: $info-color;
    }
  }

  .completed-tip {
    background: rgba($success-color, 0.1);
    color: $success-color;
    animation: completedPulse 1s ease-in-out infinite;

    .el-icon {
      color: #FFD700;
      animation: starTwinkle 1s ease-in-out infinite;
    }
  }
}

.character-notification {
  position: fixed;
  bottom: 12rem;
  right: $spacing-lg;
  z-index: $z-index-popover;
  opacity: 0;
  transform: translateX(100%);
  transition: all $transition-base;

  &.show {
    opacity: 1;
    transform: translateX(0);
  }

  .character-container {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: $spacing-sm;

    .character-img {
      width: 6rem;
      height: 6rem;
      object-fit: contain;
      animation: characterBounce 2s ease-in-out infinite;
    }

    .notification-bubble {
      position: relative;
      background: $white;
      padding: $spacing-md;
      border-radius: $border-radius-card;
      box-shadow: $shadow-md;
      max-width: 20rem;

      p {
        margin: 0;
        font-size: $font-size-sm;
        color: $text-primary;
        font-weight: 500;
      }

      .bubble-arrow {
        position: absolute;
        bottom: -8px;
        left: $spacing-lg;
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid $white;
      }
    }
  }
}

.gacha-trigger {
  text-align: center;
  margin-top: $spacing-lg;

  .gacha-btn {
    height: 4.8rem;
    padding: 0 $spacing-xl;
    font-size: $font-size-lg;
    font-weight: 600;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    border: none;
    color: $text-primary;
    box-shadow: 0 4px 16px rgba(255, 215, 0, 0.4);
    animation: gachaPulse 2s ease-in-out infinite;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
    }

    .el-icon {
      font-size: $font-size-xl;
    }
  }
}

// 响应式设计
@media (max-width: $breakpoint-sm) {
  .plate-progress {
    padding: $spacing-md;
  }

  .progress-container {
    .progress-header {
      flex-direction: column;
      gap: $spacing-sm;
      text-align: center;

      .progress-title {
        font-size: $font-size-base;
      }

      .progress-count {
        font-size: $font-size-lg;
      }
    }
  }

  .progress-bar {
    .progress-track {
      .progress-block {
        height: 3.2rem;

        .block-inner {
          font-size: $font-size-xs;
        }
      }
    }
  }

  .character-notification {
    bottom: 8rem;
    right: $spacing-sm;

    .character-container {
      .character-img {
        width: 4.8rem;
        height: 4.8rem;
      }

      .notification-bubble {
        max-width: 16rem;
        padding: $spacing-sm;

        p {
          font-size: $font-size-xs;
        }
      }
    }
  }
}

// 动画定义
@keyframes slideIn {
  0% {
    transform: translateX(-20px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes blockPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes lastBlockGlow {
  0%, 100% {
    box-shadow: 0 2px 8px rgba($primary-color, 0.3);
  }
  50% {
    box-shadow: 0 4px 16px rgba($primary-color, 0.6);
  }
}

@keyframes checkBounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes progressExplode {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes particleExplode {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(cos(var(--angle)) * var(--radius)),
      calc(sin(var(--angle)) * var(--radius))
    ) scale(0);
    opacity: 0;
  }
}

@keyframes ringExpand {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}

@keyframes completedPulse {
  0%, 100% {
    background: rgba($success-color, 0.1);
  }
  50% {
    background: rgba($success-color, 0.2);
  }
}

@keyframes starTwinkle {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@keyframes characterBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes gachaPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 16px rgba(255, 215, 0, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
  }
}
</style>
