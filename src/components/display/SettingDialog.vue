<template>
  <el-dialog
      v-model="visible"
      title="主题设置"
      width="1300px"
      center
  >
    <!-- 主题选择列表 -->
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

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" size="large">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ElDialog } from "element-plus";
import { computed, ref, watchEffect } from "vue";

// 定义Props和Emits
const emit = defineEmits(['update:modelValue', 'theme-changed'])
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

// 主题数据（包含key）
const themeItem = [
  { title: "AI老头", img: "/images/background22.jpg", key: "ailaotou" },
  { title: "争鲜经典", img: "/images/background1.jpg", key: 'zhenxian'},
  { title: "蜡笔小新", img: "/images/background2.jpg", key: 'xiaoxin' }
]


// 2. 选中主题key：直接初始化为 "ailaotou"
const selectedThemeKey = ref("ailaotou");

// 3. 初始化函数：直接设置 data-theme
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


// 选中主题逻辑
const selectTheme = (item) => {
  selectedThemeKey.value = item.key;
  emit('theme-changed', item); // 向父组件发送完整主题信息
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

// 组件初始化时加载主题
initTheme()
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
</style>
