<template>
  <div v-if="visible" class="overlay" :class="{ 'is-midnight-station': themeKey === 'midnight-station' }" role="dialog" aria-modal="true" :aria-label="title || $t('common.orderHistory')">

    <!-- 表格容器 -->
    <div class="ordering-modal-frame">
      <div class="btn-container" v-for="(item, index) in ['left', 'right']" :style="'order:'+ (item === 'right' ? 3: 1) + ';'">
      <button type="button" class="scroll-btn uptop-btn" :aria-label="$t('order.backTop')" :title="$t('order.backTop')" @click="scrollToTop">
          <img alt="" src="/images/arrow1.png"  @dragstart.prevent @dragover.prevent>
        </button>
      <button type="button" class="scroll-btn up-btn" :aria-label="$t('order.up')" :title="$t('order.up')" @click="scrollUp">
          <img alt="" src="/images/arrow2.png"  @dragstart.prevent @dragover.prevent>
        </button>
      <button type="button" class="scroll-btn down-btn" :aria-label="$t('order.down')" :title="$t('order.down')" @click="scrollDown">
          <img alt="" src="/images/arrow2.png" style="transform: rotate(180deg)"  @dragstart.prevent @dragover.prevent>
        </button>
      <button type="button" class="scroll-btn downtop-btn" :aria-label="$t('order.bottom')" :title="$t('order.bottom')" @click="scrollToBottom">
          <img alt="" src="/images/arrow1.png" style="transform: rotate(180deg)"  @dragstart.prevent @dragover.prevent>
        </button>
      </div>

      <div class="ordering-modal" style="order: 2">
        <div class="table-container"  ref="tableContainer">
          <table class="order-table">
            <thead>
            <tr>
              <th>{{ $t('order.index') }}</th>
              <th>{{ $t('order.productName') }}</th>
              <th>{{ $t('order.category') }}</th>
              <th>{{ $t('menu.quantity') }}</th>
              <th>{{ $t('order.orderTime') }}</th>
              <th>{{ $t('order.deliveryStatus') }}</th>
              <th>{{ $t('order.amount') }}</th>
            </tr>
            </thead>
            <tr v-for="(item, index) in orderItems" :key="item.orderId || index">
              <td>{{ index + 1 }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.category }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.orderTime }}</td>
              <td>
            <span :class="['status', item.statusClass || 'delivered']">
              {{ item.status || $t('order.delivered') }}
            </span>
              </td>
              <td>¥{{ (item.price * item.quantity).toFixed(2) }}</td>
            </tr>
          </table>
          <div v-if="!orderItems.length" class="history-empty-state" role="status">
            <span class="history-empty-state__plate" aria-hidden="true"></span>
            <strong>{{ $t('order.empty') }}</strong>
            <span>{{ $t('common.orderHistory') }}</span>
          </div>

        </div>



        <div class="modal-footer">
          <div class="total-name">{{ $t('order.historyTotal') }}:</div>
          <div class="total-amount">
            ¥{{ totalAmount.toFixed(2) }}
          </div>
        </div>

        <div class="action-bar">
          <button class="close-btn" @click="closeModal">{{ $t('common.back') }}</button>
          <button class="call-btn" @click="$emit('call-waiter')">{{ $t('common.callWaiter') }}</button>
          <button class="deal-btn" @click="showDealImage">{{ $t('order.goCheckout') }}</button>
        </div>

      </div>


    </div>
  </div>


  <!-- 结账弹窗 -->
  <div v-if="dealImageVisible" class="overlay" :class="{ 'is-midnight-station': themeKey === 'midnight-station' }" role="dialog" aria-modal="true" :aria-label="$t('order.historyCheckout')">
    <div class="popup-content deal-popup">
      <div class="popup-message">
        <h2><span aria-hidden="true">¥</span> {{ $t('order.historyCheckout') }}</h2>
        <div class="deal-amount">¥{{ totalAmount.toFixed(2) }}</div>
        <p>{{ $t('order.historyAmount') }}</p>
      </div>
      <div class="deal-actions">
        <button class="confirm-deal" @click="confirmDeal">{{ $t('order.confirmCheckout') }}</button>
        <button class="close-popup" @click="hideDealImage">{{ $t('common.cancel') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref, nextTick} from 'vue'
import {ElMessage} from 'element-plus'
import { useI18n } from '@/i18n'

const props = defineProps({
  modelValue: {type: Boolean, default: false},
  items: {type: Array, default: () => []},
  title: {type: String, default: ''},
  themeKey: {type: String, default: 'zhenxian'}
})
const { t } = useI18n()
const emit = defineEmits(['update:modelValue', 'call-waiter'])

// 响应式数据
const tableContainer = ref(null)
const dealImageVisible = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

// 处理订单数据，添加状态信息
const orderItems = computed(() => {
  return (props.items || []).map((item, index) => {
    const statuses = [t('order.delivered'), t('order.preparing'), t('order.pending')]
    const statusClasses = ['delivered', 'preparing', 'pending']
    const statusIndex = index % statuses.length
    const name = item.name || item.storeName || item.productName || t('common.unknown')

    return {
      ...item,
      name,
      category: item.category || item.categoryName || getCategoryByName(name),
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      status: item.status || statuses[statusIndex],
      statusClass: item.statusClass || statusClasses[statusIndex]
    }
  })
})

// 根据商品名称推断分类
const getCategoryByName = (name) => {
  const normalizedName = String(name || '')
  if (normalizedName.includes('寿司') || normalizedName.includes('刺身')) return '寿司类'
  if (normalizedName.includes('拉面') || normalizedName.includes('乌冬')) return '拉面类'
  if (normalizedName.includes('天妇罗') || normalizedName.includes('炸')) return '炸物类'
  if (normalizedName.includes('饭') || normalizedName.includes('盖饭')) return '盖饭类'
  if (normalizedName.includes('冰淇淋') || normalizedName.includes('甜品')) return '甜品类'
  return '其他类'
}

const totalAmount = computed(() => {
  return (props.items || []).reduce((sum, item) => {
    return sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1))
  }, 0)
})

// 滚动控制方法
const scrollToTop = () => {
  nextTick(() => {
    if (tableContainer.value) {
      tableContainer.value.scrollBy({
        top: 0,
        behavior: 'smooth'
      })
    }
  })
}

const scrollUp = () => {
  nextTick(() => {
    if (tableContainer.value) {
      tableContainer.value.scrollBy({
        top: -100,
        behavior: 'smooth'
      })
    }
  })
}

const scrollDown = () => {
  nextTick(() => {
    if (tableContainer.value) {
      tableContainer.value.scrollBy({
        top: 100,
        behavior: 'smooth'
      })
    }
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (tableContainer.value) {
      tableContainer.value.scrollTo({
        top: tableContainer.value.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}

// 弹窗控制方法
const closeModal = () => {
  visible.value = false
}


const showDealImage = () => {
  dealImageVisible.value = true
}

const hideDealImage = () => {
  dealImageVisible.value = false
}

const confirmDeal = () => {
  ElMessage.success(t('display.orderSuccess'))
  dealImageVisible.value = false
  visible.value = false
}
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  transform: translate(-50%, -50%);
  flex-direction: column;
  gap: 20px;
  user-select: none;
}

.btn-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0 60px;
}


.scroll-btn {
  width: 130px;
  height: 130px;
  border: 2px solid #333;
  background: #fff;
  cursor: pointer;
  border-radius: 8px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.scroll-btn:hover {
  background: linear-gradient(135deg, #fff5a0 0%, #ede896 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.scroll-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.action-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 1000px;
  display: flex;
  justify-content: center;
  gap: 90px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.close-btn {
  padding: 16px 48px;
  background-color: #fcfcc2;
  color: rgb(0, 0, 0);
  border: 2px solid black;
  cursor: pointer;
  font-size: 20px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: #f0f0a8;
  transform: translateY(-1px);
}

.call-btn {
  padding: 16px 48px;
  background-color: #fcfcc2;
  color: rgb(0, 0, 0);
  border: 2px solid black;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s ease;
}

.call-btn:hover {
  background-color: #f0f0a8;
  transform: translateY(-1px);
}

.deal-btn {
  padding: 16px 48px;
  background-color: #ff0415;
  color: rgb(255, 255, 255);
  border: 2px solid black;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s ease;
}

.deal-btn:hover {
  background-color: #e60312;
  transform: translateY(-1px);
}

.ordering-modal-frame {
  display: flex;

  align-content: center;
  align-items: center;
}

.ordering-modal {

}

.table-container {
  background: #fff;
  border-radius: 8px;
  width: 1000px;
  height: 600px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
  overflow-x: hidden; /* 避免水平滚动干扰 */
  position: relative; /* 确保定位上下文正确 */
}

.order-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 24px;
  border-spacing: 0;
  border: 1px solid black;
}

.order-table th {
  background-color: #ff1e00;
  color: white;
  padding: 12px 8px;
  text-align: center;
  font-weight: bold;
  border: 1px solid black;
  position: sticky;
  top: 0; /* 固定表头距离顶部的距离 */
  z-index: 1; /* 确保表头在内容上方 */
}

.order-table td {
  padding: 10px 8px;
  text-align: center;
  border-bottom: 1px solid #000000;
  border-right: 1px solid black;
}

.order-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.order-table tr:hover {
  background-color: #f0f8ff;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status.delivered {
  background-color: #d4edda;
  color: #155724;
}

.status.preparing {
  background-color: #fff3cd;
  color: #856404;
}

.status.pending {
  background-color: #f8d7da;
  color: #721c24;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding: 15px 20px;
  height: 60px;
  border-top: 1px solid #eee;
  background-color: #f8f9fa;
}

.total-name {
  font-size: 18px;
  font-weight: bold;
  color: #000000;
}

.total-amount {
  font-size: 18px;
  font-weight: bold;
  color: #ff1e00;
}

/* 弹窗样式 */
.popup-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  text-align: center;
  min-width: 400px;
}

.popup-message h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.popup-message p {
  margin: 0 0 30px 0;
  color: #666;
  font-size: 16px;
}

.deal-amount {
  font-size: 48px;
  font-weight: bold;
  color: #ff1e00;
  margin: 20px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.deal-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 30px;
}

.confirm-deal {
  padding: 12px 24px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.confirm-deal:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.close-popup {
  padding: 12px 24px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.close-popup:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.deal-popup .popup-content {
  min-width: 500px;
}

/* Midnight Station: ticket ledger surface. The history data and checkout
   events remain unchanged; only the material and hierarchy are themed. */
.overlay.is-midnight-station {
  background: rgba(14, 18, 17, 0.86);
  color: var(--station-text-on-surface);
  backdrop-filter: none;

  .ordering-modal-frame { gap: 18px; }

  .btn-container {
    gap: 10px;
    margin: 0;
  }

  .scroll-btn {
    width: 52px;
    height: 52px;
    border: 1px solid var(--station-border);
    border-radius: var(--station-radius-control);
    background: var(--station-surface-muted);
    box-shadow: none;
    transition: background-color var(--station-motion-fast) ease, transform var(--station-motion-instant) ease;

    &:hover,
    &:focus-visible { background: var(--station-surface-elevated); transform: none; }

    &:active { transform: translateY(1px); box-shadow: var(--station-shadow-pressed); }

    img { width: 24px; height: 24px; object-fit: contain; }
  }

  .ordering-modal {
    width: min(1000px, calc(100vw - 180px));
  }

  .table-container {
    width: 100%;
    height: min(600px, 58vh);
    background: var(--station-surface-elevated);
    border: 1px solid var(--station-border);
    border-radius: var(--station-radius-panel);
    box-shadow: var(--station-shadow-e2);
    scrollbar-color: var(--station-primary) var(--station-surface-muted);
  }

  .order-table {
    color: var(--station-text-on-surface);
    font-family: var(--station-font-ui);
    font-size: clamp(14px, 1vw, 20px);
    border: 0;

    th {
      color: var(--station-text-primary);
      background: var(--station-secondary);
      border-color: var(--station-border);
      font-family: var(--station-font-number);
      font-size: var(--station-size-ticket);
      letter-spacing: 0.04em;
    }

    td {
      border-color: var(--station-border);
      border-right: 0;
    }

    tr:nth-child(even) { background: rgba(216, 209, 194, 0.32); }
    tr:hover { background: var(--station-accent-soft); }
  }

  .status {
    display: inline-block;
    min-width: 64px;
    padding: 5px 8px;
    border-radius: var(--station-radius-ticket);
    font-family: var(--station-font-number);
    font-size: 11px;
    letter-spacing: 0.02em;
  }

  .status.delivered { color: var(--station-text-on-surface); background: rgba(142, 175, 120, 0.45); }
  .status.preparing { color: var(--station-text-on-surface); background: rgba(211, 154, 69, 0.42); }
  .status.pending { color: var(--station-text-primary); background: var(--station-primary-strong); }

  .history-empty-state {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 8px;
    color: var(--station-text-muted);
    font-family: var(--station-font-ui);

    strong { color: var(--station-text-on-surface); font-size: 20px; }
    span:last-child { font-size: 14px; }
  }

  .history-empty-state__plate {
    width: 78px;
    height: 48px;
    border: 2px solid var(--station-border);
    border-radius: 50%;
    background: var(--station-surface-muted);
    box-shadow: inset 0 -8px 0 rgba(32, 39, 37, 0.12);
  }

  .modal-footer {
    margin-top: 0;
    padding: 14px 18px;
    color: var(--station-text-on-surface);
    background: var(--station-surface);
    border-top: 1px solid var(--station-border);
  }

  .total-name,
  .total-amount { color: var(--station-text-on-surface); font-family: var(--station-font-number); }
  .total-amount { color: var(--station-primary-strong); }

  .action-bar {
    width: 100%;
    box-sizing: border-box;
    padding: 14px 16px;
    gap: 12px;
    background: var(--station-surface);
    border: 1px solid var(--station-border);
    border-radius: var(--station-radius-panel);
    box-shadow: var(--station-shadow-e1);
  }

  .close-btn,
  .call-btn,
  .deal-btn {
    min-width: 150px;
    min-height: 48px;
    padding: 10px 18px;
    color: var(--station-text-on-surface);
    background: var(--station-surface-muted);
    border: 1px solid var(--station-border);
    border-radius: var(--station-radius-control);
    font-family: var(--station-font-ui);
    font-size: var(--station-size-button);
    transition: background-color var(--station-motion-fast) ease, transform var(--station-motion-instant) ease;

    &:hover,
    &:focus-visible { background: var(--station-surface-elevated); transform: none; }
    &:active { transform: translateY(1px); }
  }

  .deal-btn { color: var(--station-text-primary); background: var(--station-primary); border-color: var(--station-accent); }

  .deal-popup .popup-content {
    min-width: min(500px, calc(100vw - 48px));
    padding: 30px;
    background: var(--station-surface-elevated);
    border: 1px solid var(--station-border);
    border-radius: var(--station-radius-panel);
    box-shadow: var(--station-shadow-e3);
  }

  .popup-message h2 { color: var(--station-text-on-surface); font-family: var(--station-font-brand); }
  .popup-message p { color: var(--station-text-muted); }
  .deal-amount { color: var(--station-primary-strong); text-shadow: none; font-family: var(--station-font-number); }
  .confirm-deal,
  .close-popup { min-height: 48px; border-radius: var(--station-radius-control); font-family: var(--station-font-ui); }
  .confirm-deal { background: var(--station-success); color: var(--station-text-on-surface); }
  .close-popup { background: var(--station-secondary); }
}

@media (max-width: 900px) {
  .overlay.is-midnight-station .ordering-modal { width: calc(100vw - 112px); }
  .overlay.is-midnight-station .ordering-modal-frame { gap: 8px; }
  .overlay.is-midnight-station .btn-container { margin: 0; }
  .overlay.is-midnight-station .action-bar { flex-wrap: wrap; gap: 8px; }
}

@media (prefers-reduced-motion: reduce) {
  .overlay.is-midnight-station .scroll-btn,
  .overlay.is-midnight-station .close-btn,
  .overlay.is-midnight-station .call-btn,
  .overlay.is-midnight-station .deal-btn { transition: none; }
}

</style>
