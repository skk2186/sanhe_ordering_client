<template>
  <div 
    class="lazy-image-container"
    :class="{ 'loading': isLoading, 'error': hasError, 'loaded': isLoaded }"
  >
    <img
      ref="imageRef"
      :src="currentSrc"
      :alt="alt"
      :class="imageClass"
      @load="handleLoad"
      @error="handleError"
      v-show="!isLoading && !hasError"
    />
    
    <!-- 加载占位符 -->
    <div v-if="isLoading" class="placeholder">
      <div class="skeleton-loader"></div>
    </div>
    
    <!-- 错误占位符 -->
    <div v-if="hasError" class="error-placeholder">
      <el-icon><Picture /></el-icon>
      <span>{{ $t('common.imageLoadFailed') }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import { useImageLazyLoad } from '@/composables/useImageLazyLoad'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '/images/placeholder.jpg'
  },
  lazy: {
    type: Boolean,
    default: true
  },
  imageClass: {
    type: String,
    default: ''
  },
  preload: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['load', 'error'])

const imageRef = ref(null)
const isLoading = ref(true)
const hasError = ref(false)
const isLoaded = ref(false)

const { observeImage, unobserveImage, preloadImages } = useImageLazyLoad({
  placeholder: props.placeholder
})

// 当前显示的图片源
const currentSrc = computed(() => {
  if (hasError.value) return props.placeholder
  if (!props.lazy || isLoaded.value) return props.src
  return props.placeholder
})

// 处理图片加载成功
const handleLoad = () => {
  isLoading.value = false
  isLoaded.value = true
  hasError.value = false
  emit('load')
}

// 处理图片加载失败
const handleError = () => {
  isLoading.value = false
  hasError.value = true
  isLoaded.value = false
  emit('error')
}

// 开始加载图片
const startLoading = () => {
  if (props.lazy && imageRef.value) {
    // 设置data-src用于懒加载
    imageRef.value.dataset.src = props.src
    observeImage(imageRef.value)
  } else {
    // 直接加载
    isLoading.value = true
    const img = new Image()
    img.onload = () => {
      if (imageRef.value) {
        imageRef.value.src = props.src
        handleLoad()
      }
    }
    img.onerror = handleError
    img.src = props.src
  }
}

// 监听src变化
watch(() => props.src, (newSrc) => {
  if (newSrc) {
    isLoading.value = true
    hasError.value = false
    isLoaded.value = false
    startLoading()
  }
}, { immediate: true })

// 预加载
watch(() => props.preload, (shouldPreload) => {
  if (shouldPreload && props.src) {
    preloadImages([props.src])
  }
}, { immediate: true })

onMounted(() => {
  if (props.src) {
    startLoading()
  }
})

onUnmounted(() => {
  if (imageRef.value) {
    unobserveImage(imageRef.value)
  }
})
</script>

<style lang="scss" scoped>
.lazy-image-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
    
    &.loaded {
      opacity: 1;
    }
  }
  
  .placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;
  }
  
  .skeleton-loader {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  .error-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;
    color: #909399;
    font-size: 12px;
    
    .el-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
  }
}

@keyframes loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .lazy-image-container {
    .error-placeholder {
      font-size: 10px;
      
      .el-icon {
        font-size: 20px;
        margin-bottom: 4px;
      }
    }
  }
}
</style>
