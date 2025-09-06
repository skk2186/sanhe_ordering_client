<template>
  <el-dialog
    v-model="visible"
    title=""
    :width="dialogWidth"
    :show-close="false"
    class="gacha-dialog"
    center
  >
    <div class="gacha-machine">
      <!-- 扭蛋机动画 -->
      <div class="machine-container">
        <div class="machine-body">
          <div class="machine-top">
            <div class="coin-slot" :class="{ active: isPlaying }">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="display-screen">
              <div class="screen-content">
                <div v-if="!isPlaying && !reward" class="welcome-text">
                  <h3>恭喜获得扭蛋机会！</h3>
                  <p>点击按钮开始扭蛋</p>
                </div>
                <div v-else-if="isPlaying" class="playing-text">
                  <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p>扭蛋中...</p>
                </div>
                <div v-else-if="reward" class="reward-display">
                  <div class="reward-icon">
                    <img v-if="reward.image" :src="reward.image" :alt="reward.name" />
                    <el-icon v-else size="48" :color="reward.color">
                      <component :is="reward.icon" />
                    </el-icon>
                  </div>
                  <h4>{{ reward.name }}</h4>
                  <p>{{ reward.description }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="machine-middle">
            <div class="capsule-container">
              <div 
                v-for="(capsule, index) in capsules" 
                :key="index"
                class="capsule"
                :class="{ 
                  active: activeCapsule === index,
                  selected: selectedCapsule === index 
                }"
                :style="{ 
                  backgroundColor: capsule.color,
                  animationDelay: `${index * 0.1}s` 
                }"
              ></div>
            </div>
            
            <div class="machine-glass">
              <div class="glass-reflection"></div>
            </div>
          </div>
          
          <div class="machine-bottom">
            <div class="control-panel">
              <el-button
                type="primary"
                size="large"
                class="gacha-button"
                :disabled="isPlaying"
                :loading="isPlaying"
                @click="startGacha"
              >
                <el-icon v-if="!isPlaying"><Star /></el-icon>
                {{ isPlaying ? '扭蛋中...' : '开始扭蛋' }}
              </el-button>
            </div>
            
            <div class="output-tray">
              <div 
                v-if="reward" 
                class="reward-capsule"
                :style="{ backgroundColor: reward.capsuleColor }"
              >
                <div class="capsule-shine"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 装饰元素 -->
        <div class="decorations">
          <div class="star star-1"><el-icon><Star /></el-icon></div>
          <div class="star star-2"><el-icon><Star /></el-icon></div>
          <div class="star star-3"><el-icon><Star /></el-icon></div>
          <div class="confetti" v-if="showConfetti">
            <div v-for="i in 20" :key="i" class="confetti-piece"></div>
          </div>
        </div>
      </div>
      
      <!-- 奖励详情 -->
      <div v-if="reward" class="reward-details">
        <div class="reward-info">
          <h3>恭喜获得奖励！</h3>
          <div class="reward-item">
            <div class="reward-visual">
              <img v-if="reward.image" :src="reward.image" :alt="reward.name" />
              <el-icon v-else size="64" :color="reward.color">
                <component :is="reward.icon" />
              </el-icon>
            </div>
            <div class="reward-text">
              <h4>{{ reward.name }}</h4>
              <p>{{ reward.description }}</p>
              <div class="reward-value" v-if="reward.value">
                {{ reward.type === 'points' ? `+${reward.value}积分` : reward.value }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="action-buttons">
          <el-button @click="closeDialog">稍后使用</el-button>
          <el-button type="primary" @click="useReward" v-if="reward.canUse">
            立即使用
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Coin,
  Star,
  Gift,
  Trophy,
  Discount
} from '@element-plus/icons-vue'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible', 'reward'])

// 响应式数据
const isPlaying = ref(false)
const reward = ref(null)
const activeCapsule = ref(-1)
const selectedCapsule = ref(-1)
const showConfetti = ref(false)

// 扭蛋池配置
const rewardPool = [
  {
    id: 1,
    name: '积分奖励',
    description: '获得50积分',
    type: 'points',
    value: 50,
    probability: 0.4,
    color: '#FFD700',
    capsuleColor: '#FFD700',
    icon: 'Star',
    canUse: false
  },
  {
    id: 2,
    name: '优惠券',
    description: '满100减20优惠券',
    type: 'coupon',
    value: '满100减20',
    probability: 0.3,
    color: '#FF6B6B',
    capsuleColor: '#FF6B6B',
    icon: 'Discount',
    canUse: true
  },
  {
    id: 3,
    name: '免费寿司',
    description: '获得一份免费三文鱼寿司',
    type: 'item',
    value: '三文鱼寿司',
    probability: 0.2,
    color: '#4ECDC4',
    capsuleColor: '#4ECDC4',
    icon: 'Gift',
    canUse: true
  },
  {
    id: 4,
    name: '超级大奖',
    description: '获得会员升级券',
    type: 'special',
    value: '会员升级券',
    probability: 0.1,
    color: '#9B59B6',
    capsuleColor: '#9B59B6',
    icon: 'Trophy',
    canUse: true
  }
]

// 扭蛋机胶囊
const capsules = ref([
  { color: '#FFD700' },
  { color: '#FF6B6B' },
  { color: '#4ECDC4' },
  { color: '#9B59B6' },
  { color: '#FFD700' },
  { color: '#FF6B6B' },
  { color: '#4ECDC4' },
  { color: '#9B59B6' }
])

// 计算属性
const dialogWidth = computed(() => {
  return window.innerWidth <= 768 ? '90%' : '500px'
})

// 方法
const startGacha = async () => {
  if (isPlaying.value) return
  
  isPlaying.value = true
  reward.value = null
  showConfetti.value = false
  
  // 胶囊旋转动画
  let currentIndex = 0
  const rotationInterval = setInterval(() => {
    activeCapsule.value = currentIndex % capsules.value.length
    currentIndex++
  }, 100)
  
  // 模拟扭蛋过程
  setTimeout(() => {
    clearInterval(rotationInterval)
    
    // 根据概率选择奖励
    const randomValue = Math.random()
    let cumulativeProbability = 0
    
    for (const rewardItem of rewardPool) {
      cumulativeProbability += rewardItem.probability
      if (randomValue <= cumulativeProbability) {
        reward.value = { ...rewardItem }
        break
      }
    }
    
    // 选中对应颜色的胶囊
    const rewardCapsuleIndex = capsules.value.findIndex(
      capsule => capsule.color === reward.value.capsuleColor
    )
    selectedCapsule.value = rewardCapsuleIndex >= 0 ? rewardCapsuleIndex : 0
    activeCapsule.value = -1
    
    isPlaying.value = false
    showConfetti.value = true
    
    // 播放音效（如果有的话）
    playRewardSound()
    
    // 触发奖励事件
    emit('reward', reward.value)
    
  }, 3000) // 3秒扭蛋动画
}

const playRewardSound = () => {
  // 播放奖励音效
  try {
    const audio = new Audio('/sounds/gacha-reward.mp3')
    audio.volume = 0.3
    audio.play().catch(() => {
      // 忽略音频播放错误
    })
  } catch (error) {
    // 忽略音频相关错误
  }
}

const useReward = () => {
  ElMessage.success(`已使用：${reward.value.name}`)
  closeDialog()
}

const closeDialog = () => {
  emit('update:visible', false)
  
  // 重置状态
  setTimeout(() => {
    isPlaying.value = false
    reward.value = null
    activeCapsule.value = -1
    selectedCapsule.value = -1
    showConfetti.value = false
  }, 300)
}

// 监听器
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    closeDialog()
  }
})
</script>

<style lang="scss" scoped>
.gacha-dialog {
  :deep(.el-dialog) {
    border-radius: $border-radius-card;
    overflow: hidden;
  }
  
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.gacha-machine {
  padding: $spacing-lg;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: $white;
  text-align: center;
}

.machine-container {
  position: relative;
  max-width: 300px;
  margin: 0 auto $spacing-lg;
}

.machine-body {
  background: linear-gradient(145deg, #e6e6e6, #ffffff);
  border-radius: $border-radius-card;
  box-shadow: 
    20px 20px 60px #bebebe,
    -20px -20px 60px #ffffff;
  overflow: hidden;
}

.machine-top {
  padding: $spacing-lg;
  background: linear-gradient(145deg, #f0f0f0, #cacaca);
  
  .coin-slot {
    width: 4rem;
    height: 4rem;
    background: #333;
    border-radius: 50%;
    margin: 0 auto $spacing-md;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFD700;
    transition: all $transition-base;
    
    &.active {
      animation: coinInsert 0.5s ease-in-out;
    }
  }
  
  .display-screen {
    height: 8rem;
    background: #000;
    border-radius: $border-radius-button;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      animation: screenGlow 2s infinite;
    }
    
    .screen-content {
      color: #00FF00;
      font-family: 'Courier New', monospace;
      
      h3 {
        font-size: $font-size-base;
        margin-bottom: $spacing-xs;
      }
      
      h4 {
        font-size: $font-size-lg;
        margin-bottom: $spacing-xs;
        color: #FFD700;
      }
      
      p {
        font-size: $font-size-sm;
        margin: 0;
      }
      
      .loading-dots {
        display: flex;
        justify-content: center;
        gap: 4px;
        margin-bottom: $spacing-sm;
        
        span {
          width: 6px;
          height: 6px;
          background: #00FF00;
          border-radius: 50%;
          animation: loadingDots 1.4s infinite ease-in-out both;
          
          &:nth-child(1) { animation-delay: -0.32s; }
          &:nth-child(2) { animation-delay: -0.16s; }
        }
      }
      
      .reward-display {
        .reward-icon {
          margin-bottom: $spacing-sm;
          
          img {
            width: 4rem;
            height: 4rem;
            border-radius: 50%;
          }
        }
      }
    }
  }
}

.machine-middle {
  position: relative;
  height: 12rem;
  background: linear-gradient(145deg, #f0f0f0, #cacaca);
  
  .capsule-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-xs;
    z-index: 1;
    
    .capsule {
      width: 2.4rem;
      height: 3.6rem;
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      position: relative;
      transition: all $transition-base;
      box-shadow: 
        inset 0 2px 4px rgba(255,255,255,0.3),
        0 2px 8px rgba(0,0,0,0.2);
      
      &::before {
        content: '';
        position: absolute;
        top: 10%;
        left: 20%;
        width: 60%;
        height: 30%;
        background: rgba(255,255,255,0.4);
        border-radius: 50%;
        filter: blur(2px);
      }
      
      &.active {
        animation: capsuleBounce 0.5s ease-in-out;
        transform: scale(1.1);
      }
      
      &.selected {
        animation: capsuleSelected 1s ease-in-out;
        box-shadow: 
          0 0 20px currentColor,
          inset 0 2px 4px rgba(255,255,255,0.3);
      }
    }
  }
  
  .machine-glass {
    position: absolute;
    inset: $spacing-sm;
    background: rgba(255,255,255,0.1);
    border-radius: $border-radius-button;
    backdrop-filter: blur(2px);
    
    .glass-reflection {
      position: absolute;
      top: 10%;
      left: 10%;
      width: 30%;
      height: 60%;
      background: linear-gradient(135deg, rgba(255,255,255,0.3), transparent);
      border-radius: $border-radius-button;
    }
  }
}

.machine-bottom {
  padding: $spacing-lg;
  background: linear-gradient(145deg, #e6e6e6, #ffffff);
  
  .control-panel {
    margin-bottom: $spacing-md;
    
    .gacha-button {
      width: 100%;
      height: 5rem;
      font-size: $font-size-lg;
      font-weight: 600;
      border-radius: $border-radius-button;
      background: linear-gradient(145deg, #FF6B6B, #FF5252);
      border: none;
      color: $white;
      box-shadow: 
        0 4px 15px rgba(255, 107, 107, 0.4),
        inset 0 2px 4px rgba(255,255,255,0.2);
      transition: all $transition-base;
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 
          0 6px 20px rgba(255, 107, 107, 0.6),
          inset 0 2px 4px rgba(255,255,255,0.2);
      }
      
      &:active:not(:disabled) {
        transform: translateY(0);
      }
      
      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
  }
  
  .output-tray {
    height: 4rem;
    background: #333;
    border-radius: $border-radius-button;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    
    .reward-capsule {
      width: 2rem;
      height: 3rem;
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      position: relative;
      animation: capsuleDrop 1s ease-out;
      
      .capsule-shine {
        position: absolute;
        inset: 2px;
        background: linear-gradient(135deg, rgba(255,255,255,0.4), transparent);
        border-radius: inherit;
      }
    }
  }
}

.decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  
  .star {
    position: absolute;
    color: #FFD700;
    animation: starTwinkle 2s infinite;
    
    &.star-1 {
      top: 10%;
      left: 10%;
      animation-delay: 0s;
    }
    
    &.star-2 {
      top: 20%;
      right: 15%;
      animation-delay: 0.7s;
    }
    
    &.star-3 {
      bottom: 30%;
      left: 20%;
      animation-delay: 1.4s;
    }
  }
  
  .confetti {
    position: absolute;
    inset: 0;
    
    .confetti-piece {
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--confetti-color, #FFD700);
      animation: confettiFall 3s linear infinite;
      
      @for $i from 1 through 20 {
        &:nth-child(#{$i}) {
          left: #{random(100)}%;
          animation-delay: #{random(2000)}ms;
          --confetti-color: #{nth((#FFD700, #FF6B6B, #4ECDC4, #9B59B6, #95E1D3), random(5))};
        }
      }
    }
  }
}

.reward-details {
  background: $white;
  color: $text-primary;
  padding: $spacing-lg;
  border-radius: $border-radius-card $border-radius-card 0 0;
  
  .reward-info {
    text-align: center;
    margin-bottom: $spacing-lg;
    
    h3 {
      font-size: $font-size-xl;
      color: $primary-color;
      margin-bottom: $spacing-md;
    }
    
    .reward-item {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-md;
      background: $bg-accent;
      border-radius: $border-radius-button;
      
      .reward-visual {
        flex-shrink: 0;
        
        img {
          width: 6rem;
          height: 6rem;
          border-radius: 50%;
        }
      }
      
      .reward-text {
        flex: 1;
        text-align: left;
        
        h4 {
          font-size: $font-size-lg;
          margin-bottom: $spacing-xs;
        }
        
        p {
          color: $text-secondary;
          margin-bottom: $spacing-xs;
        }
        
        .reward-value {
          font-size: $font-size-base;
          font-weight: 600;
          color: $primary-color;
        }
      }
    }
  }
  
  .action-buttons {
    display: flex;
    gap: $spacing-sm;
    
    .el-button {
      flex: 1;
      height: 4.4rem;
      font-size: $font-size-base;
    }
  }
}

// 动画定义
@keyframes coinInsert {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); background: #FFD700; }
  100% { transform: scale(1); }
}

@keyframes screenGlow {
  0%, 100% { left: -100%; }
  50% { left: 100%; }
}

@keyframes loadingDots {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@keyframes capsuleBounce {