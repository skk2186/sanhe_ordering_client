<template>
  <div class="bottom-center">
    <div class="center-layout">
      <div class="menu-btn left-menu" type="button" :aria-label="$t('common.menu')" @click="$emit('open-detail-menu', 'left')"><span class="forest-menu-label"><span>打开</span><span>商品菜单</span></span></div>
      <div class="center-functions">
        <div class="function-row first-row">
          <div class="function-btn navigation-btn" type="button"
              :aria-label="$t('common.search')" @click="$emit('open-navigation')">
            <img class="forest-function-icon" src="/images/ui/b/forest-icon-navigation.svg" alt="" aria-hidden="true"><span class="forest-function-label">寿司导航</span>
          </div>
          <div class="function-btn checkout-btn" type="button"
              :aria-label="$t('common.orderHistory')" @click="$emit('open-order-history')">
            <img class="forest-function-icon" src="/images/ui/b/forest-icon-record.svg" alt="" aria-hidden="true"><span class="forest-function-label">点餐记录</span>
          </div>
        </div>
        <div class="function-row second-row">
          <div class="function-btn settings-btn" type="button" :aria-label="$t('common.systemSettings')"
              @click="$emit('open-settings')"><img class="forest-function-icon" src="/images/ui/b/forest-icon-settings.svg" alt="" aria-hidden="true"><span class="forest-function-label">设置变更</span></div>
          <div class="function-btn waiter-btn" type="button" :aria-label="$t('common.callWaiter')"
              @click="$emit('call-waiter')"><img class="forest-function-icon" src="/images/ui/b/forest-icon-waiter.svg" alt="" aria-hidden="true"><span class="forest-function-label">呼叫店员</span></div>
        </div>
      </div>
      <div class="menu-btn right-menu" type="button" :aria-label="$t('common.menu')" @click="$emit('open-detail-menu', 'right')"><span class="forest-menu-label"><span>打开</span><span>商品菜单</span></span></div>
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
  background: url('/images/ui/b/forest-center-base.svg') center / 100% 100% no-repeat;
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

.forest-menu-label,
.forest-function-icon,
.forest-function-label { display: none; }

[data-theme="zhenxian"] .bottom-center {
  .menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 65px 18px 17px;
    background: url('/images/ui/b/forest-menu-sign.svg') center / 100% 100% no-repeat;
    box-shadow: none;
  }
  .forest-menu-label {
    display: block;
    color: #624631;
    font-size: 19px;
    font-weight: 800;
    line-height: 1.15;
    text-align: center;
    writing-mode: horizontal-tb;
  }
  .forest-menu-label span {
    display: block;
  }
  .function-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 8px 14px;
    background: url('/images/ui/b/forest-action-button.svg') center / 100% 100% no-repeat;
    box-shadow: none;
  }
  .function-btn:hover { background: url('/images/ui/b/forest-action-button.svg') center / 100% 100% no-repeat; box-shadow: none; filter: brightness(1.04); }
  .forest-function-icon { display: block; width: 43px; height: 43px; flex: none; }
  .forest-function-label {
    display: block;
    color: #5d432f;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.1;
    white-space: nowrap;
  }
}

@media (min-width: 769px) and (max-width: 1920px) {
  [data-theme="zhenxian"] .bottom-center {
    .menu-btn { padding: 46px 6px 9px; }
    .forest-menu-label { font-size: 11px; }
    .function-btn { gap: 3px; padding: 4px; }
    .forest-function-icon { width: 24px; height: 24px; }
    .forest-function-label { font-size: clamp(11px, .9vw, 15px); }
  }
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
