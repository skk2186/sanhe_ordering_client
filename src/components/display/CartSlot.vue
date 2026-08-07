<template>
  <div 
    class="cart-slot"
    :class="{ 'filled': item }"
    @click="handleClick"
  >
    <div v-if="!item" class="empty-slot">{{ $t('common.emptySlot') }}</div>
    
    <template v-else>
      <div 
        class="remove-btn" 
        @click.stop="$emit('remove', side, index)"
      >
        &times;
      </div>
      
      <div class="sushi-emoji">{{ item.emoji }}</div>
      <div class="sushi-name">{{ item.name }}</div>
      
      <div class="quantity-badge">{{ item.quantity }}</div>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: null
  },
  index: {
    type: Number,
    required: true
  },
  side: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['remove', 'select'])

const handleClick = () => {
  // 如果有商品，点击增加数量
  if (props.item) {
    emit('select', props.side, props.index)
  }
}
</script>

<style lang="scss" scoped>
.cart-slot {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px dashed #ccc;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: #FF7A00;
    background: rgba(255, 122, 0, 0.1);
  }

  &.filled {
    border: 2px solid #FF7A00;
    background: white;
    box-shadow: 0 4px 12px rgba(255, 122, 0, 0.2);
  }
}

.empty-slot {
  font-size: 12px;
  color: #999;
}

.sushi-emoji {
  font-size: 24px;
  margin-bottom: 2px;
}

.sushi-name {
  font-size: 8px;
  text-align: center;
  color: #666;
  line-height: 1;
}

.quantity-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.remove-btn {
  position: absolute;
  top: -5px;
  left: -5px;
  background: #666;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 10px;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.cart-slot.filled:hover .remove-btn {
  display: flex;
}

@media (max-width: 768px) {
  .cart-slot {
    width: 70px;
    height: 70px;
  }
}
</style>
