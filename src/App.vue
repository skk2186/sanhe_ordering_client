<template>
  <el-config-provider :locale="elementLocale">
    <div id="app" class="app-container">
      <router-view v-slot="{ Component, route }">
        <transition
          :name="route.meta.transition || 'fade'"
          mode="out-in"
          appear
        >
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>

      <div
        v-if="globalLoading"
        class="global-loading"
        v-loading="true"
        :element-loading-text="t('common.processing')"
        element-loading-background="rgba(0, 0, 0, 0.7)"
      ></div>
    </div>
  </el-config-provider>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import ja from 'element-plus/dist/locale/ja.mjs'
import { useGlobalStore } from '@/stores/global'
import { useI18n } from '@/i18n'

// 全局状态
const globalStore = useGlobalStore()
const globalLoading = computed(() => globalStore.loading)
const { t } = useI18n()
const route = useRoute()
const elementLocales = { 'zh-CN': zhCn, 'en-US': en, 'ja-JP': ja }
const elementLocale = computed(() => elementLocales[globalStore.language] || zhCn)

watchEffect(() => {
  const pageTitle = route.meta.titleKey ? t(route.meta.titleKey) : ''
  document.title = pageTitle ? `${pageTitle} - ${t('menu.brand')}` : t('menu.brand')
})

// 监听网络状态
window.addEventListener('online', () => {
  ElMessage.success(t('app.networkRestored'))
})

window.addEventListener('offline', () => {
  ElMessage.warning(t('app.networkLost'))
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
