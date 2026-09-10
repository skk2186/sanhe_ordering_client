<template>
  <div class="bottom-center" :class="{ 'is-midnight-station': themeKey === 'midnight-station' }">
    <div class="center-layout">
      <button class="menu-btn left-menu" type="button" :aria-label="$t('common.menu')" @click="$emit('open-detail-menu', 'left')">
        <el-icon class="function-glyph" aria-hidden="true"><Menu /></el-icon>
        <span class="function-label">{{ $t('common.menu') }}</span>
      </button>
      <div class="center-functions">
        <div class="function-row first-row">
          <button class="function-btn navigation-btn" type="button"
              :aria-label="$t('common.search')" @click="$emit('open-navigation')">
            <el-icon class="function-glyph" aria-hidden="true"><Search /></el-icon>
            <span class="function-label">{{ $t('common.search') }}</span>
          </button>
          <button class="function-btn checkout-btn" type="button"
              :aria-label="$t('common.orderHistory')" @click="$emit('open-order-history')">
            <el-icon class="function-glyph" aria-hidden="true"><Tickets /></el-icon>
            <span class="function-label">{{ $t('common.orderHistory') }}</span>
          </button>
        </div>
        <div class="function-row second-row">
          <button class="function-btn settings-btn" type="button" :aria-label="$t('common.systemSettings')"
              @click="$emit('open-settings')">
            <el-icon class="function-glyph" aria-hidden="true"><Setting /></el-icon>
            <span class="function-label">{{ $t('common.systemSettings') }}</span>
          </button>
          <button class="function-btn waiter-btn" type="button" :aria-label="$t('common.callWaiter')"
              @click="$emit('call-waiter')">
            <el-icon class="function-glyph" aria-hidden="true"><Bell /></el-icon>
            <span class="function-label">{{ $t('common.callWaiter') }}</span>
          </button>
        </div>
      </div>
      <button class="menu-btn right-menu" type="button" :aria-label="$t('common.menu')" @click="$emit('open-detail-menu', 'right')">
        <el-icon class="function-glyph" aria-hidden="true"><Menu /></el-icon>
        <span class="function-label">{{ $t('common.menu') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { Bell, Menu, Search, Setting, Tickets } from '@element-plus/icons-vue'

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

.menu-btn,
.function-btn {
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  cursor: pointer;
}

.function-glyph,
.function-label { display: none; }

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
    appearance: none;
    transition: background-color var(--station-motion-fast) ease,
      border-color var(--station-motion-fast) ease,
      transform var(--station-motion-instant) ease,
      box-shadow var(--station-motion-fast) ease;

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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .function-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .function-glyph {
    display: inline-flex;
    color: var(--station-accent);
    font-size: 24px;
    line-height: 1;
  }

  .function-label {
    display: block;
    max-width: 100%;
    padding-inline: 4px;
    color: var(--station-text-primary);
    font-family: var(--station-font-ui);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.2;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .settings-btn,
  .waiter-btn { background-color: var(--station-surface-muted); }

  .waiter-btn {
    border-color: var(--station-primary);
    &::after { color: var(--station-primary-strong); }
  }

  .menu-btn,
  .function-btn {
    background-color: var(--station-paper-ghost);
    box-shadow: none;

    &::after { color: var(--station-text-primary); }
  }

  .menu-btn { background-color: var(--station-secondary); }
  .function-btn:hover,
  .function-btn:focus-visible {
    background-color: var(--station-surface);
    .function-glyph,
    .function-label { color: var(--station-text-on-surface); }
  }
}

@media (min-width: 1921px) {
  .bottom-center.is-midnight-station {
    .function-glyph { font-size: 28px; }
    .function-label { font-size: 16px; }
  }
}

</style>
