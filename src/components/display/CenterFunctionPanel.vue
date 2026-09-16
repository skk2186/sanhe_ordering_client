<template>
  <div class="bottom-center" :style="midnightConsoleStyle">
    <img class="midnight-service-facility" src="/images/ui/midnight-station/service-console-v2.png" alt="" aria-hidden="true">
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
// The physical console is one image; all button rectangles use its normalized
// service positions so labels cannot drift independently from the equipment.
const MIDNIGHT_CONSOLE_ANCHORS = {
  leftMenu: { x: 10.5, y: 30, width: 16, height: 29 },
  navigation: { x: 27.4, y: 33, width: 16.2, height: 25 },
  history: { x: 44.4, y: 31.5, width: 24.2, height: 17 },
  settings: { x: 44.9, y: 48.5, width: 12.8, height: 20 },
  waiter: { x: 58.3, y: 47.5, width: 12.2, height: 21 },
  rightMenu: { x: 75.2, y: 30, width: 16, height: 29 }
}

const midnightConsoleStyle = Object.fromEntries(
  Object.entries(MIDNIGHT_CONSOLE_ANCHORS).flatMap(([name, rect]) => [
    [`--console-${name}-x`, `${rect.x}%`],
    [`--console-${name}-y`, `${rect.y}%`],
    [`--console-${name}-w`, `${rect.width}%`],
    [`--console-${name}-h`, `${rect.height}%`]
  ])
)

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

.midnight-service-facility { display: none; }

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
  position: relative;
  padding: 0;
  background: transparent;

  .midnight-service-facility {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
    user-select: none;
  }

  .center-layout { position: relative; z-index: 1; width: 100%; height: 100%; padding: 0; }
  .center-functions,
  .function-row { display: contents; }
  .menu-btn,
  .function-btn {
    position: absolute;
    box-sizing: border-box;
    border: 0;
    border-radius: 2px;
    color: #fff0c2;
    background: transparent;
    box-shadow: none;
    text-shadow: 0 2px 4px #07110f;
    font-family: inherit;
    font-size: clamp(17px, .95vw, 24px);
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: .04em;
    text-align: center;
  }
  .menu-btn {
    width: var(--console-leftMenu-w); height: var(--console-leftMenu-h); padding: 4px;
    color: #292316;
    text-shadow: 0 1px rgba(255, 255, 255, .35);
  }
  .left-menu { left: var(--console-leftMenu-x); top: var(--console-leftMenu-y); }
  .right-menu { left: var(--console-rightMenu-x); top: var(--console-rightMenu-y); width: var(--console-rightMenu-w); height: var(--console-rightMenu-h); }
  .navigation-btn { left: var(--console-navigation-x); top: var(--console-navigation-y); width: var(--console-navigation-w); height: var(--console-navigation-h); }
  .checkout-btn { left: var(--console-history-x); top: var(--console-history-y); width: var(--console-history-w); height: var(--console-history-h); font-size: clamp(15px, .82vw, 21px); }
  .settings-btn { left: var(--console-settings-x); top: var(--console-settings-y); width: var(--console-settings-w); height: var(--console-settings-h); font-size: clamp(14px, .76vw, 19px); }
  .waiter-btn {
    left: var(--console-waiter-x); top: var(--console-waiter-y); width: var(--console-waiter-w); height: var(--console-waiter-h);
    color: #fff1c8;
    padding: 0;
    font-size: clamp(14px, .76vw, 19px);
  }
  .menu-btn:hover,
  .function-btn:hover { transform: translateY(-2px); filter: drop-shadow(0 0 7px rgba(242, 201, 120, .8)); box-shadow: none; }
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
    padding: 0;
    .center-layout { height: 100%; }
    .menu-btn,
    .function-btn { font-size: clamp(13px, 1vw, 17px); }
    .checkout-btn { font-size: clamp(12px, .9vw, 15px); }
    .settings-btn { font-size: clamp(11px, .82vw, 14px); }
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
