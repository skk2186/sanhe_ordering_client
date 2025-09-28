<template>
  <div class="menu-view-container">
    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <!-- 左侧分类导航 -->
    <div class="left-panel"  :style="'order: ' + (side === 'right' ? '1' : '0')">
      <div class="header">
        <img src="/images/line-friends-logo.svg" alt="Logo" class="logo" />
        争鲜寿司
      </div>
      <div class="category-list">
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>
        <div v-else>
          <div
            v-for="category in localCategories"
            :key="category.id"
            class="category-item"
            :class="{ active: currentCategory && currentCategory.id === category.id }"
            @click="handleCategoryChange(category)"
          >
            {{ category.name }}
          </div>
          <div v-if="localCategories.length === 0" class="empty-message">
            暂无分类
          </div>
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
          <div v-if="loading" class="loading-container">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
          </div>
          <div v-else-if="paginatedItems.length === 0" class="empty-container">
            <span>暂无商品</span>
          </div>
          <div v-else>
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

    </div>
    <!-- 中部分页控制 -->

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { menuApi } from '@/api/menu.js';

const props = defineProps({
  side: {
    type: String,
    default: 'left'
  },
  shopId: {
    type: Number,
    default: 2 // 默认店铺ID
  }    
});

const emit = defineEmits(['close', 'add-to-cart']);

const currentPage = ref(1);
const pageSize = 8; // 2行4列，一页8个
const currentCategory = ref(null);
const localCategories = ref([]);
const products = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const error = ref('');

// 计算总页数
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize));

// 计算当前页的商品
const paginatedItems = computed(() => {
  // 由于后端API已经做了分页，这里直接返回products
  return products.value;
});

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await menuApi.getCategory(props.shopId);
    if (response.code === 0 && response.data) {
      localCategories.value = response.data;
      // 默认选中第一个分类
      if (localCategories.value.length > 0 && !currentCategory.value) {
        currentCategory.value = localCategories.value[0];
      }
    }
  } catch (err) {
    error.value = '获取分类失败';
    console.error('获取分类失败:', err);
  } finally {
    loading.value = false;
  }
};

// 获取商品列表
const fetchProducts = async () => {
  if (!currentCategory.value) return;
  
  loading.value = true;
  error.value = '';
  try {
    const response = await menuApi.getProducts({
      shopId: props.shopId,
      categoryId: currentCategory.value.id,
      pageNo: currentPage.value,
      pageSize: pageSize
    });
    if (response.code === 0 && response.data) {
      products.value = response.data.list || [];
      totalCount.value = response.data.total || 0;
    }
  } catch (err) {
    error.value = '获取商品失败';
    console.error('获取商品失败:', err);
  } finally {
    loading.value = false;
  }
};

// 切换分类
const handleCategoryChange = (category) => {
  currentCategory.value = category;
  currentPage.value = 1;
  fetchProducts();
};

// 添加到购物车
const onAddToCart = (item) => {
  // 菜单组件不区分左右，由父组件决定
  emit('add-to-cart', item, props.side);
};

// 下一页
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchProducts();
  }
}

// 上一页
function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchProducts();
  }
}

// 初始化数据
onMounted(async () => {
  await fetchCategories();
  if (currentCategory.value) {
    await fetchProducts();
  }
});
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
  z-index: 99;
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

    &.active {
      background-color: #fff;
      font-weight: bold;
    }

    &:hover:not(.active) {
      background-color: rgba(255,255,255,0.5);
    }
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    
    .loading-spinner {
      width: 30px;
      height: 30px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: #f3a633;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 10px;
    }
  }
  
  .empty-message {
    text-align: center;
    padding: 20px;
    color: #999;
  }
  
  .error-message {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #f44336;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 100;
  }
  
  .empty-container {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #999;
    font-size: 18px;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
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
  width: 217px;
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
