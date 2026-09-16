<template>
  <div class="bottom-center">
    <div class="center-layout">
      <button class="menu-btn left-menu" type="button" :aria-label="$t('common.menu')" :title="$t('common.menu')" @click="$emit('open-detail-menu', 'left')">
        <span>{{ $t('common.menu') }}</span>
      </button>
      <div class="center-functions">
        <div class="function-row first-row">
          <button class="function-btn navigation-btn" type="button" :aria-label="$t('common.search')" :title="$t('common.search')" @click="$emit('open-navigation')">
            <span>{{ $t('common.search') }}</span>
          </button>
          <button class="function-btn checkout-btn" type="button" :aria-label="$t('common.orderHistory')" :title="$t('common.orderHistory')" @click="$emit('open-order-history')">
            <span>{{ $t('common.orderHistory') }}</span>
          </button>
        </div>
        <div class="function-row second-row">
          <button class="function-btn settings-btn" type="button" :aria-label="$t('common.systemSettings')" :title="$t('common.systemSettings')"
              @click="$emit('open-settings')"><span>{{ $t('common.systemSettings') }}</span></button>
          <button class="function-btn waiter-btn" type="button" :aria-label="$t('common.callWaiter')" :title="$t('common.callWaiter')"
              @click="$emit('call-waiter')"><span>{{ $t('common.callWaiter') }}</span></button>
        </div>
      </div>
      <button class="menu-btn right-menu" type="button" :aria-label="$t('common.menu')" :title="$t('common.menu')" @click="$emit('open-detail-menu', 'right')">
        <span>{{ $t('common.menu') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
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
/* Existing themes have labels baked into their assets; do not print them twice. */
.menu-btn, .function-btn { border: 0; background-color: transparent; padding: 0; }
.menu-btn span, .function-btn span { visibility: hidden; }
[data-theme="midnight-station"] .bottom-center {
  background: transparent;
  .menu-btn { background: #d6c5a0; color: #25251e; font-size: 30px; }
  .first-row .function-btn, .second-row .function-btn { background: #17342d; color: #fff1c8; font-size: 26px; }
  .menu-btn, .function-btn { padding: 12px; border: 1px solid #b79152; border-radius: 3px; font-family: inherit; font-weight: 800; line-height: 1.3; background-size: 100% 100%; }
  .menu-btn span, .function-btn span { visibility: visible; }
  .waiter-btn { background: #64492a !important; }
  button:focus-visible { outline: 3px solid #ffe0a0; outline-offset: 3px; }
  button:hover { filter: brightness(1.15); }
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

@media (min-width: 769px) and (max-width: 1920px) {
  [data-theme="midnight-station"] .bottom-center {
    .menu-btn { font-size: 23px; }
    .first-row .function-btn, .second-row .function-btn { font-size: 20px; }
    .menu-btn, .function-btn { padding: 5px; }
  }
}
</style>
