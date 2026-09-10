<template>
  <div class="bottom-center" :class="{ 'is-midnight-station': themeKey === 'midnight-station' }">
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
defineProps({
  themeKey: { type: String, default: 'zhenxian' }
})

// 无需业务 props，事件由父级承接；themeKey 只负责视觉皮肤。
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

/* Midnight Station control console. The existing buttons and emitted events
   remain unchanged; only their presentation becomes a compact station desk. */
.bottom-center.is-midnight-station {
  background: var(--station-background-deep);
  border: 1px solid var(--station-border);
  border-radius: var(--station-radius-panel);
  box-shadow: var(--station-shadow-e1);

  .center-layout {
    gap: var(--station-space-2);
  }

  .menu-btn,
  .function-btn {
    position: relative;
    background-image: none;
    background-color: var(--station-surface);
    border: 1px solid var(--station-border);
    border-radius: var(--station-radius-control);
    box-shadow: var(--station-shadow-e0);
    transition: background-color var(--station-motion-fast) ease,
      border-color var(--station-motion-fast) ease,
      transform var(--station-motion-instant) ease,
      box-shadow var(--station-motion-fast) ease;

    &::after {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 100%;
      padding-inline: var(--station-space-2);
      color: var(--station-text-on-surface);
      font-family: var(--station-font-number);
      font-size: var(--station-size-ticket);
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: 0.08em;
      text-align: center;
      white-space: pre-line;
      transform: translate(-50%, -50%);
    }

    &:hover,
    &:focus-visible {
      background-color: var(--station-surface-elevated);
      border-color: var(--station-primary);
      box-shadow: var(--station-shadow-e1);
      transform: translateY(-1px);
    }

    &:active {
      background-color: var(--station-surface-muted);
      transform: translateY(1px);
      box-shadow: var(--station-shadow-pressed);
    }
  }

  .menu-btn {
    writing-mode: horizontal-tb;
    text-orientation: mixed;
  }

  .menu-btn::after { content: 'MENU'; }
  .navigation-btn::after { content: 'FIND\A SEARCH'; }
  .checkout-btn::after { content: 'LOG\A HISTORY'; }
  .settings-btn::after { content: 'SET\A UP'; }
  .waiter-btn::after { content: 'CALL\A STAFF'; }

  .settings-btn,
  .waiter-btn { background-color: var(--station-surface-muted); }

  .waiter-btn {
    border-color: var(--station-primary);
    &::after { color: var(--station-primary-strong); }
  }
}

</style>
