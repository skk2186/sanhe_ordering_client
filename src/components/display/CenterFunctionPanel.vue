<template>
  <div class="bottom-center" :class="{ 'is-midnight-station': themeKey === 'midnight-station' }">
    <span v-if="themeKey === 'midnight-station'" class="station-console-label" aria-hidden="true">STATION SERVICE · 03</span>
    <div class="center-layout">
      <button class="menu-btn left-menu" type="button" :aria-label="$t('common.menu')" @click="$emit('open-detail-menu', 'left', $event)">
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
      <button class="menu-btn right-menu" type="button" :aria-label="$t('common.menu')" @click="$emit('open-detail-menu', 'right', $event)">
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
  position: relative;
  padding-top: 22px;
  background:
    radial-gradient(circle at 50% 110%, rgba(211, 169, 78, .15), transparent 46%),
    linear-gradient(180deg, #17211e, var(--station-background-deep));
  border: 1px solid var(--station-border);
  border-radius: var(--station-radius-panel);
  box-shadow: inset 0 3px 0 rgba(211, 169, 78, .13), var(--station-shadow-e1);

  &::before,
  &::after {
    position: absolute;
    bottom: 10px;
    width: 26px;
    height: 26px;
    content: '';
    border: 1px solid rgba(211, 169, 78, .42);
    border-radius: 50%;
    background: radial-gradient(circle, var(--station-accent) 0 12%, #27342f 14% 48%, #0b100e 50%);
    box-shadow: 0 0 12px rgba(211, 169, 78, .12);
    pointer-events: none;
  }
  &::before { left: 10px; }
  &::after { right: 10px; }

  .station-console-label {
    position: absolute;
    top: 6px;
    left: 50%;
    color: var(--station-accent);
    font-family: var(--station-font-number);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .14em;
    transform: translateX(-50%);
    white-space: nowrap;
  }

  .center-layout {
    gap: var(--station-space-2);
    height: calc(100% - 10px);
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
      transform: scale(0.96);
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
    box-shadow: inset 0 1px 0 rgba(247, 242, 232, .08), 0 3px 0 rgba(0, 0, 0, .28);

    &::after { color: var(--station-text-primary); }
  }

  .menu-btn {
    background:
      linear-gradient(155deg, rgba(255, 255, 255, .08), transparent 42%),
      var(--station-secondary);
    border-radius: 8px 3px 8px 3px;
  }
  .left-menu { transform: rotate(-.6deg); }
  .right-menu { transform: rotate(.6deg); }
  .function-btn:nth-child(2) { border-radius: 3px 8px 3px 8px; }
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
