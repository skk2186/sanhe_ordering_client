<template>
  <div class="bottom-center">
    <div class="center-layout">
      <button class="menu-btn left-menu" type="button" aria-label="菜单" @click="$emit('open-detail-menu')">菜单</button>
      <div class="center-functions">
        <div class="function-row first-row">
          <button class="function-btn navigation-btn" type="button"
              aria-label="寿司导航-全屏搜索" @click="$emit('open-navigation')">
            <span class="search-icon">🔍</span>
            <span class="btn-text">寿司导航<br/>全屏搜索</span>
          </button>
          <button class="function-btn checkout-btn" type="button"
              aria-label="点餐记录-结账" @click="$emit('open-order-history')">
            <span class="btn-text">点餐记录<br/>结账</span>
          </button>
        </div>
        <div class="function-row second-row">
          <button class="function-btn settings-btn" type="button" aria-label="设置变更"
              @click="$emit('open-settings')">设置变更</button>
          <button class="function-btn waiter-btn" type="button" aria-label="呼叫店员"
              @click="$emit('call-waiter')">呼叫店员</button>
        </div>
      </div>
      <button class="menu-btn right-menu" type="button" aria-label="菜单" @click="$emit('open-detail-menu')">菜单</button>
    </div>
  </div>
</template>

<script setup>
// 无需 props，事件由父级承接
defineEmits([
  'open-detail-menu',
  'open-navigation',
  'open-order-history',
  'open-settings',
  'call-waiter'
])
</script>

<style lang="scss" scoped>
@use '@/styles/conveyor-belt.scss';
</style>

