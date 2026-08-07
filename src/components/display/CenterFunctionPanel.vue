<template>
  <div class="bottom-center">
    <div class="center-layout">
      <div class="menu-btn left-menu" type="button" :aria-label="$t('common.menu')" @click="$emit('open-detail-menu', 'left')"></div>
      <div class="center-functions">
        <div class="function-row first-row">
          <div class="function-btn navigation-btn" type="button"
              :aria-label="$t('common.search')" @click="$emit('open-navigation')">
          </div>
          <div class="function-btn checkout-btn" type="button"
              :aria-label="$t('common.orderHistory')" @click="$emit('open-order-history')">
          </div>
        </div>
        <div class="function-row second-row">
          <div class="function-btn settings-btn" type="button" :aria-label="$t('common.systemSettings')"
              @click="$emit('open-settings')"></div>
          <div class="function-btn waiter-btn" type="button" :aria-label="$t('common.callWaiter')"
              @click="$emit('call-waiter')"></div>
        </div>
      </div>
      <div class="menu-btn right-menu" type="button" :aria-label="$t('common.menu')" @click="$emit('open-detail-menu', 'right')"></div>
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

[data-theme="ailaotou"] .bottom-center {
  background: url('/images/ui/a/cart_bg2.png');
}
[data-theme="zhenxian"] .bottom-center {
  background: url('/images/ui/b/cart_bg2.png') ;
}
[data-theme="xiaoxin"] .bottom-center {
  background: url('/images/ui/c/cart_bg2.png') ;
}

.bottom-center {
  flex: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 0; /* 只保留上下边距，移除左右边距 */
  height: 217px;
  width: 790px;

}

@media (min-width: 769px) and (max-width: 1920px) {
  .bottom-center {
    width: 100%;
    height: 170px;
    margin: 0;
    padding: 8px;
    background-size: 100% 100%;
  }

  .center-layout {
    width: 100%;
    height: 154px;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 0;
  }

  .menu-btn {
    width: clamp(64px, 4.25vw, 82px);
    height: clamp(116px, 7.3vw, 140px);
    flex: 0 0 auto;
    background-size: 100% 100%;
  }

  .center-functions {
    width: clamp(220px, 14.5vw, 280px);
    height: 144px;
    flex: 1 1 auto;
    min-width: 0;
    gap: 4px;
  }

  .function-row {
    height: 70px;
    flex: 1 1 0;
    gap: 6px;
  }

  .first-row .function-btn,
  .second-row .function-btn {
    width: auto;
    height: 100%;
    flex: 1 1 0;
    min-width: 0;
    background-size: 100% 100%;
  }
}

</style>
