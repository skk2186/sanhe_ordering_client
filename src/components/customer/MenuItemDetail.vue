<template>
  <el-dialog
    v-model="visible"
    :title="item?.name"
    width="90%"
    :max-width="600"
    center
    :show-close="false"
    class="menu-item-detail-dialog"
  >
    <div v-if="item" class="menu-item-detail">
      <!-- 菜品图片轮播 -->
      <div class="image-carousel">
        <el-carousel 
          :height="imageHeight"
          indicator-position="inside"
          arrow="hover"
        >
          <el-carousel-item v-for="(image, index) in item.images" :key="index">
            <img 
              :src="image" 
              :alt="item.name"
              class="carousel-image"
              @error="handleImageError"
            />
          </el-carousel-item>
        </el-carousel>
        
        <!-- 标签 -->
        <div class="item-badges">
          <span v-if="item.isNew" class="badge new-badge">{{ $t('menu.new') }}</span>
          <span v-if="item.recommended" class="badge recommended-badge">
            <el-icon><Star /></el-icon>
            {{ $t('menu.recommend') }}
          </span>
          <span v-if="item.discount" class="badge discount-badge">
            {{ item.discount }}折
          </span>
        </div>
      </div>

      <!-- 菜品信息 -->
      <div class="item-content">
        <div class="item-header">
          <h2 class="item-name">{{ item.name }}</h2>
          <div class="item-rating" v-if="item.rating">
            <el-rate 
              v-model="item.rating" 
              disabled 
              show-score 
              text-color="#ff9900"
              score-template="{value}"
            />
          <span class="rating-count">({{ $t('menu.rating', { count: item.reviewCount }) }})</span>
          </div>
        </div>

        <p class="item-description">{{ item.description }}</p>

        <!-- 营养信息 -->
        <div class="nutrition-info" v-if="item.nutrition">
          <h4>{{ $t('menu.nutrition') }}</h4>
          <div class="nutrition-grid">
            <div class="nutrition-item">
            <span class="label">{{ $t('menu.calories') }}</span>
              <span class="value">{{ item.nutrition.calories }}卡</span>
            </div>
            <div class="nutrition-item">
            <span class="label">{{ $t('menu.protein') }}</span>
              <span class="value">{{ item.nutrition.protein }}g</span>
            </div>
            <div class="nutrition-item">
            <span class="label">{{ $t('menu.fat') }}</span>
              <span class="value">{{ item.nutrition.fat }}g</span>
            </div>
            <div class="nutrition-item">
            <span class="label">{{ $t('menu.carbs') }}</span>
              <span class="value">{{ item.nutrition.carbs }}g</span>
            </div>
          </div>
        </div>

        <!-- 定制选项 -->
        <div class="customization-section" v-if="item.customizations?.length">
          <h4>{{ $t('menu.customization') }}</h4>
          <div 
            v-for="customization in item.customizations" 
            :key="customization.id"
            class="customization-group"
          >
            <div class="group-header">
              <span class="group-name">{{ customization.name }}</span>
                <span v-if="customization.required" class="required-tag">{{ $t('menu.required') }}</span>
            </div>
            
            <div class="options-list">
              <div 
                v-for="option in customization.options" 
                :key="option.id"
                class="option-item"
                :class="{ selected: isOptionSelected(customization.id, option.id) }"
                @click="toggleOption(customization, option)"
              >
                <div class="option-info">
                  <span class="option-name">{{ option.name }}</span>
                  <span v-if="option.price > 0" class="option-price">+¥{{ option.price }}</span>
                </div>
                <div class="option-control">
                  <el-radio 
                    v-if="customization.type === 'single'"
                    :model-value="getSelectedOption(customization.id)"
                    :label="option.id"
                    @change="selectSingleOption(customization.id, option.id)"
                  />
                  <el-checkbox 
                    v-else
                    :model-value="isOptionSelected(customization.id, option.id)"
                    @change="toggleMultipleOption(customization.id, option.id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 特殊要求 -->
        <div class="special-requests">
          <h4>{{ $t('menu.specialRequest') }}</h4>
          <el-input
            v-model="specialRequest"
            type="textarea"
            :rows="3"
            :placeholder="$t('menu.specialRequestPlaceholder')"
            maxlength="100"
            show-word-limit
          />
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <template #footer>
      <div class="dialog-footer">
        <div class="quantity-section">
          <span class="quantity-label">{{ $t('menu.quantity') }}</span>
          <div class="quantity-control">
            <el-button 
              size="large" 
              @click="decreaseQuantity"
              :disabled="quantity <= 1"
            >
              <el-icon><Minus /></el-icon>
            </el-button>
            <span class="quantity-display">{{ quantity }}</span>
            <el-button 
              size="large" 
              @click="increaseQuantity"
              :disabled="quantity >= 99"
            >
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div class="action-section">
          <div class="total-price">
            <span class="price-label">{{ $t('menu.subtotal') }}</span>
            <span class="price-value">¥{{ totalPrice }}</span>
          </div>
          <el-button 
            type="primary" 
            size="large"
            class="add-to-cart-btn"
            @click="addToCart"
            :disabled="!canAddToCart"
          >
          {{ $t('common.addToCart') }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/i18n'
import {
  Star,
  Plus,
  Minus
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:visible', 'add-to-cart'])
const { t } = useI18n()

// 响应式数据
const quantity = ref(1)
const selectedOptions = ref({})
const specialRequest = ref('')

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const imageHeight = computed(() => {
  return window.innerWidth < 768 ? '250px' : '300px'
})

const totalPrice = computed(() => {
  if (!props.item) return 0
  
  let basePrice = props.item.price
  let optionsPrice = 0
  
  // 计算定制选项价格
  Object.values(selectedOptions.value).forEach(options => {
    if (Array.isArray(options)) {
      options.forEach(optionId => {
        const option = findOptionById(optionId)
        if (option) optionsPrice += option.price
      })
    } else {
      const option = findOptionById(options)
      if (option) optionsPrice += option.price
    }
  })
  
  return (basePrice + optionsPrice) * quantity.value
})

const canAddToCart = computed(() => {
  if (!props.item) return false
  
  // 检查必选项是否都已选择
  if (props.item.customizations) {
    for (const customization of props.item.customizations) {
      if (customization.required && !selectedOptions.value[customization.id]) {
        return false
      }
    }
  }
  
  return true
})

// 方法
const increaseQuantity = () => {
  if (quantity.value < 99) {
    quantity.value++
  }
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const isOptionSelected = (customizationId, optionId) => {
  const selected = selectedOptions.value[customizationId]
  if (Array.isArray(selected)) {
    return selected.includes(optionId)
  }
  return selected === optionId
}

const getSelectedOption = (customizationId) => {
  return selectedOptions.value[customizationId]
}

const selectSingleOption = (customizationId, optionId) => {
  selectedOptions.value[customizationId] = optionId
}

const toggleMultipleOption = (customizationId, optionId) => {
  if (!selectedOptions.value[customizationId]) {
    selectedOptions.value[customizationId] = []
  }
  
  const options = selectedOptions.value[customizationId]
  const index = options.indexOf(optionId)
  
  if (index > -1) {
    options.splice(index, 1)
  } else {
    options.push(optionId)
  }
}

const toggleOption = (customization, option) => {
  if (customization.type === 'single') {
    selectSingleOption(customization.id, option.id)
  } else {
    toggleMultipleOption(customization.id, option.id)
  }
}

const findOptionById = (optionId) => {
  if (!props.item?.customizations) return null
  
  for (const customization of props.item.customizations) {
    const option = customization.options.find(opt => opt.id === optionId)
    if (option) return option
  }
  return null
}

const addToCart = () => {
  if (!canAddToCart.value) {
    ElMessage.warning(t('menu.requiredSelection'))
    return
  }
  
  const cartItem = {
    ...props.item,
    quantity: quantity.value,
    customizations: { ...selectedOptions.value },
    specialRequest: specialRequest.value,
    totalPrice: totalPrice.value
  }
  
  emit('add-to-cart', cartItem)
}

const handleImageError = (event) => {
  event.target.src = '/images/placeholder-dish.jpg'
}

const resetForm = () => {
  quantity.value = 1
  selectedOptions.value = {}
  specialRequest.value = ''
}

// 监听器
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetForm()
  }
})
</script>

<style lang="scss" scoped>
.menu-item-detail-dialog {
  :deep(.el-dialog) {
    border-radius: $border-radius-card;
    overflow: hidden;
  }
  
  :deep(.el-dialog__header) {
    background: $primary-color;
    color: $white;
    padding: $spacing-md $spacing-lg;
    
    .el-dialog__title {
      font-size: $font-size-xl;
      font-weight: 600;
    }
  }
  
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.menu-item-detail {
  .image-carousel {
    position: relative;
    
    .carousel-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .item-badges {
      position: absolute;
      top: $spacing-sm;
      right: $spacing-sm;
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
      z-index: 10;
      
      .badge {
        padding: $spacing-xs $spacing-sm;
        border-radius: $border-radius-button;
        font-size: $font-size-xs;
        font-weight: 600;
        color: $white;
        display: flex;
        align-items: center;
        gap: 2px;
        
        &.new-badge {
          background: $error-color;
        }
        
        &.recommended-badge {
          background: linear-gradient(135deg, #FFD700, #FFA500);
        }
        
        &.discount-badge {
          background: $warning-color;
        }
      }
    }
  }
  
  .item-content {
    padding: $spacing-lg;
    
    .item-header {
      margin-bottom: $spacing-md;
      
      .item-name {
        font-size: $font-size-2xl;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: $spacing-xs;
      }
      
      .item-rating {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        
        .rating-count {
          font-size: $font-size-sm;
          color: $text-secondary;
        }
      }
    }
    
    .item-description {
      font-size: $font-size-base;
      color: $text-secondary;
      line-height: 1.6;
      margin-bottom: $spacing-lg;
    }
    
    .nutrition-info {
      margin-bottom: $spacing-lg;
      
      h4 {
        font-size: $font-size-lg;
        margin-bottom: $spacing-sm;
        color: $text-primary;
      }
      
      .nutrition-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: $spacing-sm;
        
        @include mobile {
          grid-template-columns: repeat(4, 1fr);
        }
        
        .nutrition-item {
          text-align: center;
          padding: $spacing-sm;
          background: $bg-secondary;
          border-radius: $border-radius-button;
          
          .label {
            display: block;
            font-size: $font-size-sm;
            color: $text-secondary;
            margin-bottom: 2px;
          }
          
          .value {
            display: block;
            font-size: $font-size-base;
            font-weight: 600;
            color: $primary-color;
          }
        }
      }
    }
    
    .customization-section {
      margin-bottom: $spacing-lg;
      
      h4 {
        font-size: $font-size-lg;
        margin-bottom: $spacing-md;
        color: $text-primary;
      }
      
      .customization-group {
        margin-bottom: $spacing-md;
        
        .group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: $spacing-sm;
          
          .group-name {
            font-size: $font-size-base;
            font-weight: 500;
            color: $text-primary;
          }
          
          .required-tag {
            background: $error-color;
            color: $white;
            padding: 2px $spacing-xs;
            border-radius: $border-radius-small;
            font-size: $font-size-xs;
          }
        }
        
        .options-list {
          .option-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: $spacing-sm;
            border: 1px solid $light-gray;
            border-radius: $border-radius-button;
            margin-bottom: $spacing-xs;
            cursor: pointer;
            transition: all $transition-fast;
            
            &:hover {
              border-color: $primary-color;
              background: rgba($primary-color, 0.05);
            }
            
            &.selected {
              border-color: $primary-color;
              background: rgba($primary-color, 0.1);
            }
            
            .option-info {
              flex: 1;
              
              .option-name {
                font-size: $font-size-base;
                color: $text-primary;
              }
              
              .option-price {
                font-size: $font-size-sm;
                color: $primary-color;
                font-weight: 500;
                margin-left: $spacing-xs;
              }
            }
          }
        }
      }
    }
    
    .special-requests {
      h4 {
        font-size: $font-size-lg;
        margin-bottom: $spacing-sm;
        color: $text-primary;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  background: $bg-secondary;
  
  .quantity-section {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    
    .quantity-label {
      font-size: $font-size-base;
      color: $text-primary;
    }
    
    .quantity-control {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      
      .el-button {
        width: 3.6rem;
        height: 3.6rem;
        border-radius: 50%;
      }
      
      .quantity-display {
        min-width: 3rem;
        text-align: center;
        font-size: $font-size-lg;
        font-weight: 600;
        color: $primary-color;
      }
    }
  }
  
  .action-section {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    
    .total-price {
      text-align: right;
      
      .price-label {
        display: block;
        font-size: $font-size-sm;
        color: $text-secondary;
      }
      
      .price-value {
        display: block;
        font-size: $font-size-xl;
        font-weight: 600;
        color: $primary-color;
      }
    }
    
    .add-to-cart-btn {
      min-width: 12rem;
      height: 4.4rem;
      font-size: $font-size-base;
      font-weight: 600;
    }
  }
}

// 响应式适配
@include mobile {
  .dialog-footer {
    flex-direction: column;
    gap: $spacing-md;
    
    .quantity-section,
    .action-section {
      width: 100%;
      justify-content: center;
    }
    
    .action-section {
      .add-to-cart-btn {
        flex: 1;
      }
    }
  }
}
</style>
