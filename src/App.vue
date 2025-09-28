<template>
  <div id="app" class="app-container">
    <!-- 路由视图 -->
    <router-view v-slot="{ Component, route }">
      <transition
        :name="route.meta.transition || 'fade'"
        mode="out-in"
        appear
      >
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>

    <!-- 全局加载遮罩 -->
    <div
      v-if="globalLoading"
      class="global-loading"
      v-loading="true"
      element-loading-text="处理中...22"
      element-loading-background="rgba(0, 0, 0, 0.7)"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGlobalStore } from '@/stores/global'

// 全局状态
const globalStore = useGlobalStore()
const globalLoading = computed(() => globalStore.loading)

// 监听网络状态
window.addEventListener('online', () => {
  ElMessage.success('网络连接已恢复')
})

window.addEventListener('offline', () => {
  ElMessage.warning('网络连接已断开')
})
</script>

<style lang="scss">
.app-container {
  width: 100%;
  min-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

// 路由过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from {
  transform: translateX(-100%);
}

.slide-right-leave-to {
  transform: translateX(100%);
}

// 全局加载遮罩
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

// 响应式设计
@media (max-width: 768px) {
  .app-container {
    font-size: 14px;
  }
}
</style>
