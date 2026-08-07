<template>
  <div class="search-button-container">
    <!-- 搜索按钮 -->
    <BaseButton
      :type="expanded ? 'primary' : 'default'"
      :variant="variant"
      :size="size"
      :shape="shape"
      :loading="loading"
      :disabled="disabled"
      @click="toggleSearch"
      class="search-toggle-btn"
      :class="{ 'search-expanded': expanded }"
    >
      <el-icon class="search-icon">
        <Search />
      </el-icon>
      <span v-if="!iconOnly" class="search-text">{{ displaySearchText }}</span>
    </BaseButton>
    
    <!-- 展开的搜索框 -->
    <Transition name="search-expand">
      <div v-if="expanded" class="search-input-container">
        <div class="search-input-wrapper">
          <el-icon class="input-search-icon">
            <Search />
          </el-icon>
          
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            :placeholder="displayPlaceholder"
            class="search-input"
            @keyup.enter="handleSearch"
            @keyup.esc="closeSearch"
            @blur="handleBlur"
          />
          
          <BaseButton
            v-if="searchQuery"
            type="text"
            size="small"
            shape="circle"
            @click="clearSearch"
            class="clear-btn"
          >
            <el-icon><Close /></el-icon>
          </BaseButton>
        </div>
        
        <!-- 搜索建议 -->
        <div v-if="suggestions.length > 0" class="search-suggestions">
          <div
            v-for="(suggestion, index) in suggestions"
            :key="index"
            class="suggestion-item"
            @click="selectSuggestion(suggestion)"
          >
            <el-icon><Search /></el-icon>
            <span>{{ suggestion }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import BaseButton from './BaseButton.vue'
// 图标已在 main.js 中全局注册，直接使用字符串名称

// Props定义
const props = defineProps({
  // 按钮尺寸
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['mini', 'small', 'medium', 'large', 'xl'].includes(value)
  },
  // 按钮形状
  shape: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'round', 'circle'].includes(value)
  },
  // 按钮变体
  variant: {
    type: String,
    default: 'outlined',
    validator: (value) => ['filled', 'outlined', 'text', 'ghost'].includes(value)
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 禁用状态
  disabled: {
    type: Boolean,
    default: false
  },
  // 只显示图标
  iconOnly: {
    type: Boolean,
    default: false
  },
  // 搜索按钮文本
  searchText: {
    type: String,
    default: '搜索'
  },
  // 输入框占位符
  placeholder: {
    type: String,
    default: '搜索寿司...'
  },
  // 搜索建议
  suggestions: {
    type: Array,
    default: () => []
  },
  // 初始搜索值
  modelValue: {
    type: String,
    default: ''
  },
  // 自动展开
  autoExpand: {
    type: Boolean,
    default: false
  }
})

// Emits定义
const emit = defineEmits(['update:modelValue', 'search', 'clear', 'suggestion-select'])

// 响应式数据
const expanded = ref(props.autoExpand)
const searchQuery = ref(props.modelValue)
const searchInput = ref(null)

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  searchQuery.value = newValue
})

// 监听searchQuery变化
watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue)
})

// 方法
const toggleSearch = async () => {
  if (props.disabled || props.loading) return
  
  expanded.value = !expanded.value
  
  if (expanded.value) {
    await nextTick()
    searchInput.value?.focus()
  }
}

const closeSearch = () => {
  expanded.value = false
  searchQuery.value = ''
  emit('update:modelValue', '')
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    emit('search', searchQuery.value.trim())
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  emit('update:modelValue', '')
  emit('clear')
  searchInput.value?.focus()
}

const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion
  emit('update:modelValue', suggestion)
  emit('suggestion-select', suggestion)
  emit('search', suggestion)
  expanded.value = false
}

const handleBlur = () => {
  // 延迟关闭，允许点击建议
  setTimeout(() => {
    if (!searchQuery.value) {
      expanded.value = false
    }
  }, 200)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.search-button-container {
  position: relative;
  display: inline-block;
}

.search-toggle-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.search-expanded {
    background: $primary-color;
    color: $white;
    border-color: $primary-color;
  }
  
  .search-icon {
    font-size: 1.2em;
    transition: transform 0.2s ease;
  }
  
  .search-text {
    margin-left: 4px;
  }
  
  &:hover .search-icon {
    transform: scale(1.1);
  }
}

.search-input-container {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: $white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba($primary-color, 0.2);
  overflow: hidden;
  z-index: 1000;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 8px;
}

.input-search-icon {
  color: $text-secondary;
  font-size: 18px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: $text-primary;
  background: transparent;
  
  &::placeholder {
    color: $text-disabled;
  }
}

.clear-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  min-height: 24px;
  color: $text-secondary;
  
  &:hover {
    color: $error-color;
    background: rgba($error-color, 0.1);
  }
}

.search-suggestions {
  border-top: 1px solid $light-gray;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba($primary-color, 0.05);
  }
  
  .el-icon {
    color: $text-secondary;
    font-size: 14px;
  }
  
  span {
    color: $text-primary;
    font-size: 14px;
  }
}

// 动画
.search-expand-enter-active,
.search-expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top center;
}

.search-expand-enter-from,
.search-expand-leave-to {
  opacity: 0;
  transform: scaleY(0.8) translateY(-10px);
}

.search-expand-enter-to,
.search-expand-leave-from {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}

// 响应式设计
@include mobile {
  .search-input-container {
    left: -50px;
    right: -50px;
    margin-top: 6px;
  }
  
  .search-input-wrapper {
    padding: 10px 14px;
  }
  
  .search-input {
    font-size: 16px; // 防止iOS缩放
  }
  
  .suggestion-item {
    padding: 10px 14px;
    
    span {
      font-size: 15px;
    }
  }
}

// 特殊形状适配
.search-toggle-btn.btn-circle {
  .search-text {
    display: none;
  }
}

// 大尺寸适配
.search-toggle-btn.btn-large,
.search-toggle-btn.btn-xl {
  .search-icon {
    font-size: 1.4em;
  }
}

// 小尺寸适配
.search-toggle-btn.btn-small,
.search-toggle-btn.btn-mini {
  .search-icon {
    font-size: 1em;
  }
  
  .search-text {
    font-size: 0.9em;
  }
}

// 自定义滚动条
.search-suggestions {
  @include custom-scrollbar(4px, rgba($medium-gray, 0.3), rgba($medium-gray, 0.6));
}
</style>
