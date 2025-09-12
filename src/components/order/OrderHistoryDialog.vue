<template>
  <div v-if="visible" class="overlay">

    <!-- 表格容器 -->
    <div class="ordering-modal-frame">
      <div class="btn-container">
        <div class="scroll-btn uptop-btn" @click="scrollToTop" title="回到顶部">
          <img src="/images/arrow1.png" alt="">
        </div>
        <div class="scroll-btn up-btn" @click="scrollUp" title="向上">
          <img src="/images/arrow2.png" alt="">
        </div>
        <div class="scroll-btn down-btn" @click="scrollDown" title="向下">
          <img src="/images/arrow2.png" style="transform: rotate(180deg)" alt="">
        </div>
        <div class="scroll-btn downtop-btn" @click="scrollToBottom" title="到底部">
          <img src="/images/arrow1.png" style="transform: rotate(180deg)" alt="">
        </div>
      </div>
      <div class="ordering-modal">
        <div>
          <table class="order-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>商品名称</th>
                <th>商品分类</th>
                <th>数量</th>
                <th>下单时间</th>
                <th>送餐状态</th>
                <th>金额</th>
              </tr>
            </thead>
            <tbody class="table-container" ref="tableContainer">
            <tr v-for="(item, index) in orderItems" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.category || '寿司类' }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.orderTime || '未知时间' }}</td>
              <td>
                <span :class="['status', item.statusClass || 'delivered']">
                  {{ item.status || '已送达' }}
                </span>
              </td>
              <td>¥{{ (item.price * item.quantity).toFixed(2) }}</td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-footer">
          <div class="total-name">历史订单合计: </div>
          <div class="total-amount">
            ¥{{ totalAmount.toFixed(2) }}
          </div>
        </div>
      </div>
      <div class="btn-container">
        <div class="scroll-btn uptop-btn" @click="scrollToTop" title="回到顶部">
          <img src="/images/arrow1.png" alt="">
        </div>
        <div class="scroll-btn up-btn" @click="scrollUp" title="向上">
          <img src="/images/arrow2.png" alt="">
        </div>
        <div class="scroll-btn down-btn" @click="scrollDown" title="向下">
          <img src="/images/arrow2.png" style="transform: rotate(180deg)" alt="">
        </div>
        <div class="scroll-btn downtop-btn" @click="scrollToBottom" title="到底部">
          <img src="/images/arrow1.png" style="transform: rotate(180deg)" alt="">
        </div>
      </div>

    </div>

    <!-- 底部操作栏 -->
    <div class="action-bar">
      <button class="close-btn" @click="closeModal">返回</button>
      <button class="call-btn" @click="$emit('call-waiter')">呼叫店员</button>
      <button class="call-btn" @click="$emit('call-waiter')">呼叫店员</button>
      <button class="deal-btn" @click="showDealImage">前往记账/确认记账</button>
    </div>
  </div>

  <!-- 呼叫店员弹窗 -->

  <!-- 结账弹窗 -->
  <div v-if="dealImageVisible" class="overlay">
    <div class="popup-content deal-popup">
      <div class="popup-message">
        <h2>💰 历史订单结账</h2>
        <div class="deal-amount">¥{{ totalAmount.toFixed(2) }}</div>
        <p>这是您的历史订单总金额</p>
      </div>
      <div class="deal-actions">
        <button class="confirm-deal" @click="confirmDeal">确认结账</button>
        <button class="close-popup" @click="hideDealImage">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  title: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

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
    const statuses = ['已送达', '制作中', '待制作']
    const statusClasses = ['delivered', 'preparing', 'pending']
    const randomStatus = Math.floor(Math.random() * 3)

    return {
      ...item,
      category: item.category || getCategoryByName(item.name),
      status: statuses[randomStatus],
      statusClass: statusClasses[randomStatus]
    }
  })
})

// 根据商品名称推断分类
const getCategoryByName = (name) => {
  if (name.includes('寿司') || name.includes('刺身')) return '寿司类'
  if (name.includes('拉面') || name.includes('乌冬')) return '拉面类'
  if (name.includes('天妇罗') || name.includes('炸')) return '炸物类'
  if (name.includes('饭') || name.includes('盖饭')) return '盖饭类'
  if (name.includes('冰淇淋') || name.includes('甜品')) return '甜品类'
  return '其他类'
}

const totalAmount = computed(() => {
  return (props.items || []).reduce((sum, it) => sum + (it.price * (it.quantity || 1)), 0)
})

// 滚动控制方法
const scrollToTop = () => {
  nextTick(() => {
    if (tableContainer.value) {
      tableContainer.value.scrollTo({
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
  ElMessage.success('结账成功！感谢您的光临！')
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
  background-color: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  transform: translate(-50%, -50%);
  flex-direction: column;
  gap: 20px;
}
.btn-container{
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0 60px;
}


.scroll-btn {
  width: 100px;
  height: 70px;
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
  width: 960px;
  height: 80px;
  overflow: hidden;
  display: flex;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.close-btn {
  position: absolute;
  padding: 8px 16px;
  background-color: #fcfcc2;
  color: rgb(0, 0, 0);
  border: 2px solid black;
  cursor: pointer;
  width: 150px;
  height: 50px;
  font-size: 14px;
  left: 20%;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: #f0f0a8;
  transform: translateY(-1px);
}

.call-btn {
  position: absolute;
  padding: 8px 16px;
  background-color: #fcfcc2;
  color: rgb(0, 0, 0);
  border: 2px solid black;
  border-radius: 4px;
  cursor: pointer;
  width: 150px;
  height: 50px;
  font-size: 14px;
  left: 40%;
  transition: all 0.3s ease;
}

.call-btn:hover {
  background-color: #f0f0a8;
  transform: translateY(-1px);
}

.deal-btn {
  position: absolute;
  padding: 8px 16px;
  background-color: #ff0415;
  color: rgb(255, 255, 255);
  border: 2px solid black;
  border-radius: 4px;
  cursor: pointer;
  width: 250px;
  height: 50px;
  font-size: 14px;
  left: 60%;
  transition: all 0.3s ease;
}

.deal-btn:hover {
  background-color: #e60312;
  transform: translateY(-1px);
}

.ordering-modal-frame{
  display: flex;
  align-content: center;
  align-items: center;
}

.ordering-modal {
  background: white;
  border-radius: 8px;
  width: 1000px;
  height: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.table-container {
  overflow-y: auto;
  flex: 1;
  margin: 0;
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

</style>

