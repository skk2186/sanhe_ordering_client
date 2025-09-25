<template>
  <el-dialog
      v-model="visible"
      title="系统设置"
      width="1300px"
      center
  >
    <!-- 设置选项卡 -->
    <el-tabs v-model="activeTab" class="setting-tabs">
      <!-- 主题设置选项卡 -->
      <el-tab-pane label="主题设置" name="theme">
    <div class="theme-item">
      <div
          class="theme-card"
          v-for="(item, index) in themeItem"
          :key="item.key"
          @click="selectTheme(item)"
          :class="{ 'theme-card--active': selectedThemeKey === item.key }"
      >
        <!-- 选中状态标识 -->
        <div class="theme-card__check" v-if="selectedThemeKey === item.key">✓</div>
        <img :src="item.img" alt="主题背景" class="theme-card__img">
        <div class="theme-card__title">{{ item.title }}</div>
        <div class="theme-card__key">{{ item.key }}</div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 传送带设置选项卡 -->
      <el-tab-pane label="传送带设置" name="conveyor">
        <div class="conveyor-settings">
          <div class="setting-section">
            <h3 class="section-title">移动方向</h3>
            <div class="direction-options">
              <div
                  class="direction-card"
                  :class="{ 'direction-card--active': beltDirection === 'left' }"
                  @click="setBeltDirection('left')"
              >
                <div class="direction-icon">←</div>
                <div class="direction-label">向左移动</div>
                <div class="direction-desc">菜品从右向左滚动（默认）</div>
                <div class="direction-check" v-if="beltDirection === 'left'">✓</div>
              </div>
              
              <div
                  class="direction-card"
                  :class="{ 'direction-card--active': beltDirection === 'right' }"
                  @click="setBeltDirection('right')"
              >
                <div class="direction-icon">→</div>
                <div class="direction-label">向右移动</div>
                <div class="direction-desc">菜品从左向右滚动</div>
                <div class="direction-check" v-if="beltDirection === 'right'">✓</div>
              </div>
      </div>
    </div>
          
          <div class="setting-section">
            <h3 class="section-title">速度设置</h3>
            <div class="speed-control">
              <el-slider
                  v-model="beltSpeed"
                  :min="0.2"
                  :max="3"
                  :step="0.1"
                  :format-tooltip="formatSpeedTooltip"
                  @change="setBeltSpeed"
                  class="speed-slider"
              />
              <div class="speed-labels">
                <span>慢速</span>
                <span>中速</span>
                <span>快速</span>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" size="large">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ElDialog, ElTabs, ElTabPane, ElSlider } from "element-plus";
import { computed, ref, watchEffect } from "vue";

// 定义Props和Emits
const emit = defineEmits(['update:modelValue', 'theme-changed', 'belt-direction-changed', 'belt-speed-changed'])
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 支持父组件传入默认主题key
  defaultThemeKey: { type: String, default: "zhenxian" }
})

// 弹窗显示状态（双向绑定）
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

// 当前激活的选项卡
const activeTab = ref('theme')

// 主题数据（包含key）
const themeItem = [
  { title: "AI老头", img: "/images/background22.jpg", key: "ailaotou" },
  { title: "争鲜经典", img: "/images/background1.jpg", key: 'zhenxian'},
  { title: "蜡笔小新", img: "/images/background2.jpg", key: 'xiaoxin' }
]


// 2. 选中主题key：直接初始化为 "ailaotou"
const selectedThemeKey = ref("ailaotou");

// 传送带设置状态
const beltDirection = ref('left') // 'left' 或 'right'
const beltSpeed = ref(1) // 0.2-3 之间的速度值

// 3. 初始化函数：直接设置 data-theme 和传送带设置
const initTheme = () => {
  // 获取HTML根元素（<html>标签）
  const htmlRoot = document.documentElement;
  // 强制设置 data-theme 为 "ailaotou"
  htmlRoot.setAttribute("data-theme", selectedThemeKey.value);

  // （可选）同步初始化全局CSS变量（如背景图）
  const defaultTheme = themeItem.find(item => item.key === "ailaotou");
  if (defaultTheme) {
    htmlRoot.style.setProperty("--theme-bg", `url(${defaultTheme.img})`);
  }
};

// 初始化传送带设置
const initBeltSettings = () => {
  // 从本地存储加载传送带方向设置
  const savedDirection = localStorage.getItem('beltDirection')
  if (savedDirection && ['left', 'right'].includes(savedDirection)) {
    beltDirection.value = savedDirection
  }

  // 从本地存储加载传送带速度设置  
  const savedSpeed = localStorage.getItem('beltSpeed')
  if (savedSpeed) {
    const speed = parseFloat(savedSpeed)
    if (speed >= 0.2 && speed <= 3) {
      beltSpeed.value = speed
    }
  }
}


// 选中主题逻辑
const selectTheme = (item) => {
  selectedThemeKey.value = item.key;
  emit('theme-changed', item); // 向父组件发送完整主题信息
}

// 设置传送带移动方向
const setBeltDirection = (direction) => {
  beltDirection.value = direction
  localStorage.setItem('beltDirection', direction)
  emit('belt-direction-changed', direction)
}

// 设置传送带速度
const setBeltSpeed = (speed) => {
  beltSpeed.value = speed
  localStorage.setItem('beltSpeed', speed.toString())
  emit('belt-speed-changed', speed)
}

// 格式化速度提示
const formatSpeedTooltip = (value) => {
  if (value < 0.5) return '慢速'
  if (value < 1.5) return '中速'
  if (value < 2.5) return '快速'
  return '极速'
}

// 监听主题变化，更新全局状态
watchEffect(() => {
  if (selectedThemeKey.value) {
    // 找到当前选中的主题完整信息
    const selectedTheme = themeItem.find(item => item.key === selectedThemeKey.value);

    if (selectedTheme) {
      // 设置全局CSS变量（包含key和背景图）
      document.documentElement.style.setProperty('--theme-key', selectedThemeKey.value);
      document.documentElement.style.setProperty('--theme-bg', `url(${selectedTheme.img})`);
      document.documentElement.setAttribute("data-theme", selectedThemeKey.value);
      // 存储主题key到本地存储
      localStorage.setItem('selectedThemeKey', selectedThemeKey.value);
    }
  }
})

// 取消按钮逻辑
const handleCancel = () => {
  visible.value = false
}

// 组件初始化时加载设置
initTheme()
initBeltSettings()
</script>

<style lang="scss">
// 全局CSS变量定义
:root {
  --theme-key: "zhenxian"; // 默认主题key
  --theme-bg: url("/images/background1.jpg"); // 默认背景图
  --theme-active-color: #409EFF; // 选中主题的高亮色
}

.theme-item {
  display: flex;
  gap: 30px;
  align-content: center;
  flex-flow: wrap;
  padding: 20px 0;
}

// 主题卡片样式
.theme-card {
  position: relative;
  width: 200px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 10px;
  border-radius: 8px;

  // 主题图片
  &__img {
    width: 100%;
    height: 140px;
    object-fit: cover;
    border-radius: 4px;
    border: 2px solid transparent;
    transition: border-color 0.3s ease;
  }

  // 主题标题
  &__title {
    text-align: center;
    font-size: 18px;
    margin-top: 8px;
    color: #333;
    transition: color 0.3s ease;
  }

  // 主题key显示（可选）
  &__key {
    text-align: center;
    font-size: 12px;
    color: #666;
    margin-top: 4px;
    background: #f5f5f5;
    border-radius: 4px;
    padding: 2px 0;
  }

  // 选中状态标识
  &__check {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 24px;
    height: 24px;
    background-color: var(--theme-active-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  // 选中状态样式
  &--active {
    background-color: rgba(64, 158, 255, 0.1);

    & .theme-card__img {
      border-color: var(--theme-active-color);
    }

    & .theme-card__title {
      color: var(--theme-active-color);
      font-weight: 500;
    }
  }

  // 鼠标悬停效果
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

// 传送带设置样式
.conveyor-settings {
  .setting-section {
    margin-bottom: 40px;
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;
    }
  }
}

// 方向选择卡片
.direction-options {
  display: flex;
  gap: 20px;
  margin-top: 15px;
}

.direction-card {
  position: relative;
  flex: 1;
  max-width: 280px;
  padding: 24px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;

  .direction-icon {
    font-size: 48px;
    color: #666;
    text-align: center;
    margin-bottom: 12px;
    transition: all 0.3s ease;
  }

  .direction-label {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    text-align: center;
    margin-bottom: 8px;
  }

  .direction-desc {
    font-size: 14px;
    color: #666;
    text-align: center;
    line-height: 1.5;
  }

  .direction-check {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    background: var(--theme-active-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 16px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  }

  &--active {
    border-color: var(--theme-active-color);
    background: rgba(64, 158, 255, 0.05);

    .direction-icon {
      color: var(--theme-active-color);
    }

    .direction-label {
      color: var(--theme-active-color);
    }
  }
}

// 速度控制样式
.speed-control {
  .speed-slider {
    margin: 20px 0;
  }

  .speed-labels {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #666;
    margin-top: 10px;
  }
}

// 选项卡样式优化
.setting-tabs {
  .el-tabs__header {
    margin-bottom: 30px;
  }

  .el-tabs__nav-wrap {
    &::after {
      background-color: #f0f0f0;
    }
  }

  .el-tabs__item {
    font-size: 16px;
    font-weight: 500;
    
    &.is-active {
      color: var(--theme-active-color);
    }
  }

  .el-tabs__active-bar {
    background-color: var(--theme-active-color);
  }
}
</style>
