<template>
  <div class="menu-view-container" >
    <!-- 左侧分类导航 -->
    <div class="left-panel"  :style="'order: ' + (side === 'right' ? '1' : '0')">
      <div class="header">
        <img src="/images/line-friends-logo.svg" alt="Logo" class="logo" />
        争鲜寿司
      </div>
      <div class="category-list">
        <div
          v-for="category in localCategories"
          :key="category.id"
          class="category-item"
          :class="{ active: currentCategory && currentCategory.id === category.id }"
          @click="handleCategoryChange(category)"
        >
          {{ category.name }}
          <span v-if="category.id === 'special'"> > </span>
        </div>
      </div>
      <div class="footer">
        <el-button class="exit-btn" @click="$emit('close')">
          <img src="/images/exit.png" alt="" style="margin-right: 10px">
          退出
        </el-button>
      </div>
    </div>

    <div class="right-panel" :style="'order: ' + (side === 'right' ? '0' : '1')">
      <div class="pagination-panel">
        <div class="page-btn" @click="prevPage" :disabled="currentPage === 1">
          <div class="btn-icon"><img src="/images/next.png" alt=""  @dragstart.prevent @dragover.prevent></div>
          <div class="btn-text">上一页</div>
        </div>
        <div class="page-info">{{ currentPage }} / {{ totalPages }}</div>
        <div class="page-btn" @click="nextPage" :disabled="currentPage === totalPages">
          <div class="btn-icon"><img src="/images/next.png" alt="" style="transform: rotate(180deg)"  @dragstart.prevent @dragover.prevent></div>
          <div class="btn-text">下一页</div>
        </div>
      </div>

      <!-- 右侧菜品网格 -->
      <div class="main-panel">
        <div class="grid-container">
          <div
              v-for="item in paginatedItems"
              :key="item.id"
              class="dish-card"
              @click="onAddToCart(item)"
          >
            <div class="dish-image">
              <img :src="item.image || '/images/default-dish.jpg'" :alt="item.name" />
            </div>
            <div class="dish-info">
              <p class="dish-name">{{ item.name }}</p>
              <p class="dish-price">¥{{ item.price }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
    <!-- 中部分页控制 -->

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { sushiData, filterCategories } from '@/data/sushiData.js';
import { DArrowLeft, DArrowRight, SwitchButton } from '@element-plus/icons-vue';

const props = defineProps({
  side: {
    type: String,
    default: 'left'
  }
});

const emit = defineEmits(['close', 'add-to-cart']);

const currentPage = ref(1);
const pageSize = 8; // 2行4列，一页8个
const currentCategory = ref(filterCategories.find(c => c.id === 'special')); // 默认选中 “限定新品”

const localCategories = ref(filterCategories.filter(c => ['special', 'maki', 'sashimi', 'nigiri', 'hot'].includes(c.id)));

const filteredItems = computed(() => {
  if (!currentCategory.value || currentCategory.value.id === 'all') {
    return sushiData;
  }
  return sushiData.filter(item => item.category === currentCategory.value.id);
});

const totalPages = computed(() => Math.ceil(filteredItems.value.length / pageSize));

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredItems.value.slice(start, end);
});

const handleCategoryChange = (category) => {
  currentCategory.value = category;
  currentPage.value = 1;
};

const onAddToCart = (item) => {
  // 菜单组件不区分左右，由父组件决定
  emit('add-to-cart', item, props.side);
};

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++;
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--;
}
</script>

<style lang="scss" scoped>
// 这是作为一个独立的、非弹窗组件的样式，定位由父组件通过props或CSS控制
.menu-view-container {
  position: absolute;
  //bottom: -30px;
  top: -650px;
  left: -260px;
  width: 1300px;
  height: 600px;
  background-color: #fcf6e9;
  border-radius: 20px;
  border: 10px solid #fff;
  box-shadow: 0 0 40px rgba(0,0,0,0.3);
  display: flex;
  padding: 20px;
  gap: 20px;
  // position, top, left, z-index等由父组件控制
}

.left-panel {
  width: 200px;
  flex-shrink: 0;
  background-color: #d6eefb;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  padding: 10px;

  .header {
    font-size: 20px;
    font-weight: bold;
    padding: 15px 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    .logo {
      height: 24px;
    }
  }

  .category-list {
    flex: 1;
    overflow-y: auto;
  }

  .category-item {
    padding: 18px 15px;
    font-size: 18px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 10px;
    margin: 5px 0;
    transition: all 0.2s;
    border-bottom: 1px solid #c8e1f0;

    &:first-child {
      color: #f3a633;
      font-weight: bold;
    }

    &.active {
      background-color: #fff;
      font-weight: bold;
    }

    &:hover:not(.active) {
      background-color: rgba(255,255,0.5);
    }
  }

  .footer {
    padding-top: 15px;
    .exit-btn {
      width: 100%;
      height: 60px;
      font-size: 24px;
      font-weight: 600;
      background-color: #f3a633;
      color: #fff;
      border: none;
      border-radius: 10px;
    }
  }
}


.right-panel {
  display: flex;
  .pagination-panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 15px;
    width: 70px;

    .page-btn {
      width: 100%;
      height: 180px;
      background-color: #f3a633;
      display: flex; /* 横向拆分图标和文字 */
      align-items: center;
      justify-content: center;
      color: white;
      border: none;
      border-radius: 15px;
      font-size: 18px;
      font-weight: bold;
      flex-direction: column;
      user-select: none;
      .el-icon {
        font-size: 30px;
        margin-bottom: 10px;
      }
    }

    .page-info {
      font-weight: bold;
      font-size: 16px;
      background: #fff;
      padding: 8px 15px;
      border-radius: 20px;
    }
  }

  .main-panel {
    flex: 1;

    padding-left: 20px;

    .grid-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(2, 1fr); // 确保是两行
      gap: 20px;
      height: 100%;
      overflow-y: auto;
    }
  }

}

.dish-card {
  background: #fff;
  border-radius: 15px;
  border: 1px solid #eee;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  }

  .dish-image {
    height: 150px;
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .dish-info {
    padding: 10px;
    text-align: center;
    .dish-name {
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 5px 0;
    }
    .dish-price {
      font-size: 18px;
      font-weight: bold;
      color: #d9534f;
      margin: 0;
    }
  }
}
</style>
