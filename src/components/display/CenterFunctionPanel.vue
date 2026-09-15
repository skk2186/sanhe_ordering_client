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
[data-theme="midnight-station"] .bottom-center {
  box-sizing: border-box;
  padding: 18px 22px 12px;
  background: url('/images/ui/midnight-station/platform-service-counter-v1.png') center / 105% 145% no-repeat;

  .center-layout { height: 178px; align-items: center; justify-content: space-between; gap: 14px; padding: 0; }
  .menu-btn,
  .function-btn {
    box-sizing: border-box;
    border: 2px solid #a87d3f;
    border-radius: 5px;
    color: #fff0c2;
    background: linear-gradient(145deg, #29483d, #122923 70%);
    box-shadow: inset 0 2px 0 rgba(255, 225, 153, .16), 0 5px 10px rgba(0, 0, 0, .32);
    font-family: inherit;
    font-size: clamp(17px, .95vw, 24px);
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: .04em;
    text-align: center;
  }
  .menu-btn {
    width: 112px; height: 146px; padding: 10px;
    writing-mode: vertical-rl; text-orientation: mixed;
  }
  .center-functions { height: 146px; gap: 8px; }
  .function-row { height: 69px; gap: 9px; }
  .first-row .function-btn,
  .second-row .function-btn { width: 250px; height: 69px; }
  .waiter-btn {
    color: #2a2417;
    background: linear-gradient(#efce83, #b88338);
    border-color: #f2cf7e;
  }
  .menu-btn:hover,
  .function-btn:hover { transform: translateY(-2px); border-color: #f2c978; box-shadow: inset 0 2px 0 rgba(255, 239, 190, .28), 0 8px 14px rgba(0, 0, 0, .42); }
  .menu-btn:active,
  .function-btn:active { transform: translateY(1px); }
  .menu-btn:focus-visible,
  .function-btn:focus-visible { outline: 3px solid #f2c978; outline-offset: 3px; }
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
  [data-theme="midnight-station"] .bottom-center {
    padding: 10px 12px 8px;
    background-size: 110% 142%;
    .center-layout { height: 150px; gap: 7px; }
    .menu-btn { width: clamp(58px, 4.1vw, 76px); height: 124px; font-size: clamp(14px, 1.05vw, 19px); }
    .center-functions { height: 124px; gap: 5px; }
    .function-row { height: 60px; gap: 5px; }
    .first-row .function-btn,
    .second-row .function-btn { width: auto; height: 60px; flex: 1 1 0; font-size: clamp(13px, .95vw, 18px); }
  }

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
