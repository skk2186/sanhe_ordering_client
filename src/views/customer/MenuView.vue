<template>
  <div
    ref="menuDialogRef"
    class="menu-view-container"
    :class="{ 'is-midnight-station': themeKey === 'midnight-station', [`is-${side}-menu`]: true }"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="`detail-menu-title-${side}`"
    tabindex="-1"
    @keydown="handleDialogKeydown"
  >


    <!-- 左侧分类导航 -->
    <div class="left-panel"  :style="'order: ' + (side === 'right' ? '1' : '0')">
      <div class="header" :id="`detail-menu-title-${side}`">
        <img src="/images/line-friends-logo.svg" alt="" class="logo" />
        <span class="station-menu-emblem" aria-hidden="true">03</span>
        <span>{{ $t('menu.brand') }}</span>
        <small>深夜点餐案内</small>
      </div>
      <div class="category-list">
    
          <button
            v-for="category in localCategories"
            :key="category.id"
            type="button"
            class="category-item"
            :class="{ active: currentCategory && currentCategory.id === category.id }"
            :aria-current="currentCategory && currentCategory.id === category.id ? 'true' : undefined"
            @click="handleCategoryChange(category)"
          >
            {{ category.name }}
          </button>
          <div v-if="localCategories.length === 0" class="empty-message">
            {{ $t('menu.noCategories') }}
          </div>
 
      </div>
      <div class="footer">
        <el-button class="exit-btn" @click="$emit('close')">
          <img src="/images/exit.png" alt="" style="margin-right: 10px">
          {{ $t('common.close') }}
        </el-button>
      </div>
    </div>

    <div class="right-panel" :style="'order: ' + (side === 'right' ? '0' : '1')">
      <div class="pagination-panel">
        <button type="button" class="page-btn" @click="prevPage" :disabled="currentPage === 1" :aria-label="$t('common.previousPage')">
          <div class="btn-icon"><img src="/images/next.png" alt=""  @dragstart.prevent @dragover.prevent></div>
          <div class="btn-text">{{ $t('common.previousPage') }}</div>
        </button>
        <div class="page-info">{{ currentPage }} / {{ totalPages }}</div>
        <button type="button" class="page-btn" @click="nextPage" :disabled="currentPage === totalPages" :aria-label="$t('common.nextPage')">
          <div class="btn-icon"><img src="/images/next.png" alt="" style="transform: rotate(180deg)"  @dragstart.prevent @dragover.prevent></div>
          <div class="btn-text">{{ $t('common.nextPage') }}</div>
        </button>
      </div>

      <!-- 右侧菜品网格 -->
      <div class="main-panel">

        <div class="grid-container" :class="{ 'is-refreshing': loading }" aria-live="polite" :aria-busy="loading">
          <button
            v-for="item in paginatedItems"
            :key="item.id"
            type="button"
            class="dish-card"
            :aria-label="`${item.storeName || item.name}，¥${item.price}，添加到${side === 'left' ? '左侧' : '右侧'}点菜区`"
            @click="onAddToCart(item)"
          >
            <div class="dish-image">
              <img :src="item.image || '/images/default-dish.jpg'" :alt="item.name || item.storeName" loading="lazy" decoding="async" />
              <span class="station-dish-card__route" aria-hidden="true">PLATFORM 03</span>
            </div>
            <div class="dish-info">
              <p class="dish-name">{{ item.storeName || item.name }}</p>
              <p class="dish-price">¥{{ item.price }}</p>
              <span class="station-dish-card__action" aria-hidden="true">＋ 加入</span>
            </div>
          </button>
        </div>
        <div v-if="loading || error || !paginatedItems || paginatedItems.length === 0" class="tigs-container" :class="{ 'is-overlay': paginatedItems && paginatedItems.length }">
          <LoadingSpinner v-if="loading" class="loading-container" />
          <div v-else-if="error" class="error-container" role="alert">
            <span>{{ error }}</span>
            <button type="button" class="retry-btn" @click="fetchProducts">{{ $t('common.refresh') }}</button>
          </div>
          <div v-else-if="!paginatedItems || paginatedItems.length === 0" class="empty-container">
              <span>{{ $t('menu.noDishes') }}</span>
          </div>
        </div>
      </div>

    </div>
    <!-- 中部分页控制 -->

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { menuApi } from '@/api/menu.js';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps({
  side: {
    type: String,
    default: 'left'
  },
  shopId: {
    type: Number,
    default: 2 // 默认店铺ID
  },
  themeKey: {
    type: String,
    default: 'zhenxian'
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
const menuDialogRef = ref(null);
let productRequestRevision = 0;

const handleDialogKeydown = (event) => {
  if (event.key === 'Escape') {
    emit('close');
    return;
  }
  if (event.key !== 'Tab') return;

  const focusable = [...(menuDialogRef.value?.querySelectorAll('button:not(:disabled), [tabindex="0"]') || [])];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

// 计算总页数
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)));

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
    error.value = t('errors.fetchCategories');
    console.error('获取分类失败:', err);
  } finally {
    loading.value = false;
  }
};

// 获取商品列表
const fetchProducts = async () => {
  if (!currentCategory.value) return;

  const requestRevision = ++productRequestRevision;
  loading.value = true;
  error.value = '';
  try {
    const response = await menuApi.getProducts({
      shopId: props.shopId,
      categoryId: currentCategory.value.id,
      pageNo: currentPage.value,
      pageSize: pageSize
    });
    if (requestRevision !== productRequestRevision) return;
    if (response.code === 0 && response.data) {
      products.value = response.data.list || [];
      totalCount.value = response.data.total || 0;
    }
  } catch (err) {
    if (requestRevision !== productRequestRevision) return;
    error.value = t('errors.fetchProducts');
    console.error('获取商品失败:', err);
  } finally {
    if (requestRevision === productRequestRevision) loading.value = false;
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
  await nextTick();
  menuDialogRef.value?.focus({ preventScroll: true });
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
    display: flex;
    align-items: center;
    justify-content: center;
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
  flex: 1;
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
    display: flex;
    flex-direction: column;
    height: 100%;
    .tigs-container{
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    .grid-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(2, 1fr); // 确保是两行
      gap: 20px;
      height: 100%;
      overflow-y: auto;
    }

    // 确保LoadingSpinner在main-panel中居中

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

.category-item,
.page-btn,
.dish-card,
.retry-btn {
  font: inherit;
}

.page-btn:disabled {
  cursor: not-allowed;
  opacity: .48;
}

.main-panel { position: relative; }

.tigs-container {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tigs-container.is-overlay {
  background: rgba(252, 246, 233, .68);
  backdrop-filter: blur(2px);
}

.error-container,
.empty-container {
  display: grid;
  justify-items: center;
  gap: 14px;
  color: #62584d;
  font-size: 16px;
}

.retry-btn {
  min-width: 96px;
  min-height: 44px;
  padding: 8px 16px;
  color: #fff;
  background: #c5533f;
  border-radius: 8px;
}

.station-menu-emblem,
.station-dish-card__route,
.station-dish-card__action { display: none; }

/* Midnight Station menu: the existing two-pane flow becomes a station dining
   guide. The grid never unmounts while a page refreshes, so interaction state
   stays visually stable instead of flashing to an empty panel. */
.menu-view-container.is-midnight-station {
  position: fixed;
  inset: 50% auto auto 50%;
  width: min(1380px, calc(100vw - 32px));
  height: min(660px, calc(100vh - 32px));
  padding: 14px;
  gap: 14px;
  overflow: hidden;
  color: var(--station-text-primary);
  background:
    linear-gradient(120deg, rgba(211, 169, 78, .08), transparent 22% 78%, rgba(49, 88, 77, .18)),
    repeating-linear-gradient(0deg, transparent 0 43px, rgba(236, 229, 214, .035) 44px 45px),
    var(--station-background-deep);
  border: 1px solid var(--station-accent-line-strong);
  border-radius: 12px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, .72), inset 0 0 0 4px rgba(236, 229, 214, .035);
  transform: translate(-50%, -50%);
}

.menu-view-container.is-midnight-station::before,
.menu-view-container.is-midnight-station::after {
  position: absolute;
  z-index: 0;
  content: '';
  pointer-events: none;
}

.menu-view-container.is-midnight-station::before {
  left: 0;
  right: 0;
  top: 0;
  height: 7px;
  background: repeating-linear-gradient(135deg, var(--station-accent) 0 14px, #272f2b 14px 28px);
}

.menu-view-container.is-midnight-station::after {
  inset: auto 22px 10px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--station-accent-line-strong) 12% 88%, transparent);
}

.menu-view-container.is-midnight-station > * { position: relative; z-index: 1; }

.menu-view-container.is-midnight-station .left-panel {
  width: clamp(190px, 17vw, 240px);
  padding: 18px 12px 12px;
  color: var(--station-text-primary);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .04), transparent 28%),
    #18231f;
  border: 1px solid var(--station-border);
  border-radius: 8px 3px 3px 8px;
  box-shadow: inset -8px 0 16px rgba(0, 0, 0, .18);
}

.menu-view-container.is-midnight-station .header {
  min-height: 76px;
  padding: 8px 8px 16px;
  display: grid;
  grid-template-columns: 42px 1fr;
  align-content: center;
  gap: 2px 10px;
  color: var(--station-text-primary);
  border-bottom: 1px solid var(--station-accent-line);
  font-family: var(--station-font-brand);
  font-size: 22px;
  line-height: 1.15;
}

.menu-view-container.is-midnight-station .header .logo { display: none; }
.menu-view-container.is-midnight-station .header small {
  grid-column: 2;
  color: var(--station-text-secondary);
  font-family: var(--station-font-number);
  font-size: 10px;
  letter-spacing: .12em;
}
.menu-view-container.is-midnight-station .station-menu-emblem {
  grid-row: 1 / span 2;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  color: #161d1a;
  background: var(--station-accent);
  border-radius: 50% 50% 50% 8px;
  font-family: var(--station-font-number);
  font-size: 15px;
  font-weight: 800;
}

.menu-view-container.is-midnight-station .category-list {
  padding: 10px 2px;
  scrollbar-color: var(--station-accent) #111815;
}

.menu-view-container.is-midnight-station .category-item {
  width: 100%;
  min-height: 48px;
  margin: 4px 0;
  padding: 9px 13px;
  color: var(--station-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-inline-start: 3px solid rgba(109, 119, 107, .65);
  border-radius: 3px 8px 8px 3px;
  font-size: 15px;
  text-align: start;
  transition-property: color, background-color, border-color, transform;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(.2, 0, 0, 1);
}

.menu-view-container.is-midnight-station .category-item:nth-child(3n + 2) { transform: translateX(5px); }
.menu-view-container.is-midnight-station .category-item.active {
  color: var(--station-text-on-surface);
  background: var(--station-surface);
  border-color: var(--station-accent);
  border-inline-start-color: var(--station-primary);
  box-shadow: 0 5px 12px rgba(0, 0, 0, .24);
}
.menu-view-container.is-midnight-station .category-item:hover:not(.active) { background: rgba(236, 229, 214, .08); }
.menu-view-container.is-midnight-station .category-item:focus-visible,
.menu-view-container.is-midnight-station button:focus-visible {
  outline: 2px solid var(--station-accent);
  outline-offset: 2px;
}

.menu-view-container.is-midnight-station .footer { padding-top: 10px; border-top: 1px dashed var(--station-border); }
.menu-view-container.is-midnight-station .footer .exit-btn {
  min-height: 52px;
  color: var(--station-text-primary);
  background: var(--station-primary);
  border: 1px solid var(--station-accent);
  border-radius: 5px;
  font-size: 17px;
}
.menu-view-container.is-midnight-station .footer .exit-btn img { filter: brightness(0) invert(1); }

.menu-view-container.is-midnight-station .right-panel {
  min-width: 0;
  padding: 10px;
  gap: 12px;
  background:
    radial-gradient(circle at 88% 10%, rgba(211, 169, 78, .12), transparent 26%),
    rgba(236, 229, 214, .045);
  border: 1px solid rgba(109, 119, 107, .68);
  border-radius: 3px 8px 8px 3px;
}

.menu-view-container.is-midnight-station .pagination-panel {
  width: 82px;
  gap: 12px;
}
.menu-view-container.is-midnight-station .pagination-panel .page-btn {
  width: 72px;
  min-height: 132px;
  color: var(--station-text-primary);
  background: linear-gradient(180deg, #3d6258, #263f38);
  border: 1px solid var(--station-accent-line);
  border-radius: 5px 5px 12px 5px;
  font-family: var(--station-font-ui);
  font-size: 14px;
  transition: transform 120ms cubic-bezier(.2, 0, 0, 1), filter 120ms ease;
}
.menu-view-container.is-midnight-station .pagination-panel .page-btn:active:not(:disabled) { transform: scale(.96); }
.menu-view-container.is-midnight-station .pagination-panel .page-btn img { width: 38px; filter: sepia(1) saturate(.5) brightness(1.8); }
.menu-view-container.is-midnight-station .pagination-panel .page-info {
  color: var(--station-text-on-surface);
  background: var(--station-surface);
  border: 1px solid var(--station-accent);
  border-radius: 3px;
  font-family: var(--station-font-number);
  font-variant-numeric: tabular-nums;
}

.menu-view-container.is-midnight-station .main-panel { padding-inline-start: 0; }
.menu-view-container.is-midnight-station .grid-container {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 14px;
  overflow: auto;
  transition: opacity 150ms ease, filter 150ms ease;
}
.menu-view-container.is-midnight-station .grid-container.is-refreshing { opacity: .68; filter: saturate(.7); }

.menu-view-container.is-midnight-station .dish-card {
  position: relative;
  width: auto;
  min-width: 0;
  min-height: 0;
  color: var(--station-text-on-surface);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, .58), transparent 32%),
    var(--station-surface);
  border: 1px solid #877d69;
  border-radius: 10px 4px 10px 4px;
  box-shadow: 0 8px 0 #766d5c, 0 13px 19px rgba(0, 0, 0, .3);
  text-align: start;
  transition: transform 150ms cubic-bezier(.2, 0, 0, 1), box-shadow 150ms ease, border-color 150ms ease;
}
.menu-view-container.is-midnight-station .dish-card:nth-child(4n + 2) { transform: translateY(4px) rotate(.35deg); }
.menu-view-container.is-midnight-station .dish-card:nth-child(4n + 3) { transform: translateY(-2px) rotate(-.3deg); }
.menu-view-container.is-midnight-station .dish-card:hover { border-color: var(--station-accent); transform: translateY(-4px); box-shadow: 0 10px 0 #766d5c, 0 18px 24px rgba(0, 0, 0, .38); }
.menu-view-container.is-midnight-station .dish-card:active { transform: scale(.96); }
.menu-view-container.is-midnight-station .dish-card .dish-image {
  height: min(17vh, 150px);
  margin: 8px 8px 0;
  overflow: hidden;
  background: #d6cbb6;
  border: 1px solid rgba(32, 39, 37, .36);
  border-radius: 7px 2px 7px 2px;
}
.menu-view-container.is-midnight-station .dish-card .dish-image img { object-fit: cover; }
.menu-view-container.is-midnight-station .station-dish-card__route {
  position: absolute;
  left: 6px;
  top: 6px;
  display: block;
  padding: 3px 5px;
  color: var(--station-text-primary);
  background: rgba(21, 26, 25, .82);
  border-radius: 2px;
  font-family: var(--station-font-number);
  font-size: 8px;
  letter-spacing: .08em;
}
.menu-view-container.is-midnight-station .dish-card .dish-info {
  position: relative;
  min-height: 64px;
  padding: 9px 70px 8px 10px;
  text-align: start;
}
.menu-view-container.is-midnight-station .dish-card .dish-name {
  overflow: hidden;
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.menu-view-container.is-midnight-station .dish-card .dish-price {
  color: var(--station-primary-strong);
  font-family: var(--station-font-number);
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}
.menu-view-container.is-midnight-station .station-dish-card__action {
  position: absolute;
  right: 8px;
  bottom: 10px;
  min-width: 54px;
  min-height: 32px;
  display: grid;
  place-items: center;
  color: var(--station-text-primary);
  background: var(--station-primary);
  border-radius: 3px;
  font-size: 12px;
  font-weight: 700;
}

.menu-view-container.is-midnight-station .tigs-container.is-overlay {
  border-radius: 6px;
  background: rgba(14, 18, 17, .55);
  backdrop-filter: blur(3px);
}
.menu-view-container.is-midnight-station .empty-container,
.menu-view-container.is-midnight-station .error-container {
  color: var(--station-text-primary);
  background: rgba(14, 18, 17, .86);
  border: 1px solid var(--station-border);
  border-radius: 6px;
  padding: 18px 22px;
}
.menu-view-container.is-midnight-station .retry-btn { background: var(--station-primary); }

@media (max-width: 900px) {
  .menu-view-container.is-midnight-station { height: calc(100vh - 20px); width: calc(100vw - 20px); padding: 10px; }
  .menu-view-container.is-midnight-station .left-panel { width: 160px; }
  .menu-view-container.is-midnight-station .grid-container { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: none; }
  .menu-view-container.is-midnight-station .pagination-panel { width: 64px; }
  .menu-view-container.is-midnight-station .pagination-panel .page-btn { width: 56px; min-height: 112px; font-size: 12px; }
}

@media (max-width: 600px) {
  .menu-view-container.is-midnight-station { flex-direction: column; overflow-y: auto; }
  .menu-view-container.is-midnight-station .left-panel { width: 100%; min-height: 154px; padding: 10px; }
  .menu-view-container.is-midnight-station .header { min-height: 54px; }
  .menu-view-container.is-midnight-station .category-list { display: flex; gap: 6px; overflow-x: auto; }
  .menu-view-container.is-midnight-station .category-item { width: auto; min-width: max-content; transform: none; }
  .menu-view-container.is-midnight-station .footer { position: absolute; top: 10px; right: 10px; border: 0; padding: 0; }
  .menu-view-container.is-midnight-station .footer .exit-btn { width: 48px; min-height: 44px; overflow: hidden; font-size: 0; }
  .menu-view-container.is-midnight-station .footer .exit-btn img { width: 24px; margin: 0 !important; }
  .menu-view-container.is-midnight-station .right-panel { min-height: 480px; flex-direction: column; }
  .menu-view-container.is-midnight-station .pagination-panel { width: 100%; flex-direction: row; order: 2; }
  .menu-view-container.is-midnight-station .pagination-panel .page-btn { width: auto; min-height: 48px; flex: 1; flex-direction: row; gap: 6px; }
  .menu-view-container.is-midnight-station .pagination-panel .page-btn img { width: 24px; }
  .menu-view-container.is-midnight-station .grid-container { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (prefers-reduced-motion: reduce) {
  .menu-view-container.is-midnight-station *,
  .menu-view-container.is-midnight-station *::before,
  .menu-view-container.is-midnight-station *::after { transition: none !important; animation: none !important; }
}
</style>
