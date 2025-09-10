<template>
  <div class="bottom-center">
    <div class="center-layout">
      <div class="menu-btn left-menu" type="button" aria-label="菜单" @click="$emit('open-detail-menu')"></div>
      <div class="center-functions">
        <div class="function-row first-row">
          <div class="function-btn navigation-btn" type="button"
              aria-label="寿司导航-全屏搜索" @click="$emit('open-navigation')">
          </div>
          <div class="function-btn checkout-btn" type="button"
              aria-label="点餐记录-结账" @click="$emit('open-order-history')">
          </div>
        </div>
        <div class="function-row second-row">
          <div class="function-btn settings-btn" type="button" aria-label="设置变更"
              @click="$emit('open-settings')"></div>
          <div class="function-btn waiter-btn" type="button" aria-label="呼叫店员"
              @click="$emit('call-waiter')"></div>
        </div>
      </div>
      <div class="menu-btn right-menu" type="button" aria-label="菜单" @click="$emit('open-detail-menu')"></div>
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

