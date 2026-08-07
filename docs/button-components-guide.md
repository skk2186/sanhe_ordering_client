# 按钮组件使用指南

## 概述

本指南介绍了寿司点餐系统中的按钮组件系统，包括基础按钮组件和专用按钮组件的使用方法。

## 组件列表

### 1. BaseButton - 基础按钮组件

通用的按钮组件，支持多种样式、尺寸和状态。

#### 基本用法

```vue
<template>
  <BaseButton type="primary" @click="handleClick">
    点击我
  </BaseButton>
</template>

<script setup>
import BaseButton from '@/components/common/BaseButton.vue'

const handleClick = () => {
  console.log('按钮被点击了')
}
</script>
```

#### Props 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | String | 'default' | 按钮类型：default, primary, secondary, success, warning, danger, info, text |
| size | String | 'medium' | 按钮尺寸：mini, small, medium, large, xl |
| shape | String | 'default' | 按钮形状：default, round, circle |
| variant | String | 'filled' | 按钮变体：filled, outlined, text, ghost |
| text | String | '' | 按钮文本 |
| icon | String/Object | null | 左侧图标 |
| iconRight | String/Object | null | 右侧图标 |
| disabled | Boolean | false | 禁用状态 |
| loading | Boolean | false | 加载状态 |
| block | Boolean | false | 块级按钮 |

#### 示例

```vue
<!-- 不同类型 -->
<BaseButton type="primary">主要按钮</BaseButton>
<BaseButton type="secondary">次要按钮</BaseButton>
<BaseButton type="success">成功按钮</BaseButton>
<BaseButton type="warning">警告按钮</BaseButton>
<BaseButton type="danger">危险按钮</BaseButton>

<!-- 不同尺寸 -->
<BaseButton size="mini">迷你</BaseButton>
<BaseButton size="small">小型</BaseButton>
<BaseButton size="medium">中等</BaseButton>
<BaseButton size="large">大型</BaseButton>
<BaseButton size="xl">超大</BaseButton>

<!-- 不同变体 -->
<BaseButton variant="filled">填充</BaseButton>
<BaseButton variant="outlined">轮廓</BaseButton>
<BaseButton variant="text">文本</BaseButton>
<BaseButton variant="ghost">幽灵</BaseButton>

<!-- 带图标 -->
<BaseButton :icon="SearchIcon">搜索</BaseButton>
<BaseButton :icon-right="ArrowRightIcon">下一步</BaseButton>

<!-- 状态 -->
<BaseButton loading>加载中</BaseButton>
<BaseButton disabled>禁用</BaseButton>
```

### 2. AddToCartButton - 加购按钮组件

专门用于商品加入购物车的按钮组件，支持数量控制。

#### 基本用法

```vue
<template>
  <AddToCartButton
    :quantity="cartQuantity"
    :item="dishItem"
    @add-to-cart="handleAddToCart"
    @quantity-change="handleQuantityChange"
  />
</template>

<script setup>
import AddToCartButton from '@/components/common/AddToCartButton.vue'

const cartQuantity = ref(0)
const dishItem = ref({ id: 1, name: '三文鱼寿司', price: 25 })

const handleAddToCart = (item) => {
  cartQuantity.value = 1
  console.log('添加到购物车:', item)
}

const handleQuantityChange = ({ item, quantity, action }) => {
  cartQuantity.value = quantity
  console.log(`${action}: ${item.name}, 数量: ${quantity}`)
}
</script>
```

#### Props 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| quantity | Number | 0 | 当前数量 |
| maxQuantity | Number | null | 最大数量限制 |
| size | String | 'medium' | 按钮尺寸 |
| loading | Boolean | false | 加载状态 |
| disabled | Boolean | false | 禁用状态 |
| soldOut | Boolean | false | 售完状态 |
| addText | String | '加入购物车' | 添加按钮文本 |
| item | Object | {} | 商品信息 |

### 3. FunctionButton - 功能按钮组件

用于各种功能操作的按钮组件。

#### 基本用法

```vue
<template>
  <FunctionButton
    function-type="menu"
    text="详细菜单"
    emoji="📋"
    @click="openMenu"
  />
</template>

<script setup>
import FunctionButton from '@/components/common/FunctionButton.vue'

const openMenu = () => {
  console.log('打开菜单')
}
</script>
```

#### Props 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| functionType | String | 'default' | 功能类型：menu, settings, navigation, order, checkout, call 等 |
| text | String | - | 按钮文本（必需） |
| icon | String/Object | null | 图标 |
| emoji | String | '' | 表情符号 |
| badge | String/Number | null | 徽章数字 |
| showArrow | Boolean | false | 显示右箭头 |

### 4. CheckoutButton - 结账按钮组件

专门用于结账操作的按钮组件。

#### 基本用法

```vue
<template>
  <CheckoutButton
    :item-count="totalItems"
    :total-price="totalPrice"
    :discount="discountAmount"
    @checkout="handleCheckout"
  />
</template>

<script setup>
import CheckoutButton from '@/components/common/CheckoutButton.vue'

const totalItems = ref(3)
const totalPrice = ref(75.50)
const discountAmount = ref(5.50)

const handleCheckout = (orderData) => {
  console.log('结账数据:', orderData)
}
</script>
```

### 5. SearchButton - 搜索按钮组件

可展开的搜索按钮组件。

#### 基本用法

```vue
<template>
  <SearchButton
    v-model="searchQuery"
    :suggestions="searchSuggestions"
    @search="handleSearch"
  />
</template>

<script setup>
import SearchButton from '@/components/common/SearchButton.vue'

const searchQuery = ref('')
const searchSuggestions = ref(['三文鱼', '金枪鱼', '鳗鱼'])

const handleSearch = (query) => {
  console.log('搜索:', query)
}
</script>
```

## 样式系统

### 颜色主题

- **Primary**: #FF7A00 (橙色主题)
- **Secondary**: #1E88E5 (蓝色辅助)
- **Success**: #4CAF50 (绿色成功)
- **Warning**: #FF9800 (橙色警告)
- **Danger**: #F44336 (红色危险)
- **Info**: #2196F3 (蓝色信息)

### 尺寸规范

| 尺寸 | 高度 | 内边距 | 字体大小 |
|------|------|--------|----------|
| mini | 24px | 4px 8px | 12px |
| small | 32px | 6px 12px | 13px |
| medium | 40px | 8px 16px | 14px |
| large | 48px | 12px 20px | 16px |
| xl | 56px | 16px 24px | 18px |

### 响应式断点

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 动画效果

### 基础动画类

```vue
<!-- 脉冲效果 -->
<BaseButton class="btn-animate pulse">脉冲按钮</BaseButton>

<!-- 弹跳效果 -->
<BaseButton class="btn-animate bounce">弹跳按钮</BaseButton>

<!-- 摇摆效果 -->
<BaseButton class="btn-animate shake">摇摆按钮</BaseButton>

<!-- 发光效果 -->
<BaseButton class="btn-animate glow">发光按钮</BaseButton>
```

### 悬停效果类

```vue
<!-- 上升效果 -->
<BaseButton class="btn-hover-effects hover-lift">悬停上升</BaseButton>

<!-- 缩放效果 -->
<BaseButton class="btn-hover-effects hover-scale">悬停缩放</BaseButton>

<!-- 发光效果 -->
<BaseButton class="btn-hover-effects hover-glow">悬停发光</BaseButton>
```

### 点击效果类

```vue
<!-- 涟漪效果 -->
<BaseButton class="btn-click-effects click-ripple">涟漪效果</BaseButton>

<!-- 按压效果 -->
<BaseButton class="btn-click-effects click-push">按压效果</BaseButton>
```

## 最佳实践

### 1. 按钮层级

- **Primary**: 用于主要操作（如"立即结账"）
- **Secondary**: 用于次要操作（如"查看详情"）
- **Default**: 用于一般操作（如"取消"）

### 2. 尺寸选择

- **Mobile**: 建议使用 medium 或 large 尺寸
- **Desktop**: 可以使用 small 到 large 尺寸
- **触摸设备**: 最小 44px 高度

### 3. 图标使用

- 使用有意义的图标
- 保持图标风格一致
- 图标 + 文字组合更清晰

### 4. 状态管理

```vue
<template>
  <BaseButton
    :loading="isSubmitting"
    :disabled="!isFormValid"
    @click="submitForm"
  >
    {{ isSubmitting ? '提交中...' : '提交' }}
  </BaseButton>
</template>
```

### 5. 无障碍访问

- 提供清晰的按钮文本
- 使用适当的颜色对比度
- 支持键盘导航
- 添加 aria-label 属性

```vue
<BaseButton
  aria-label="添加三文鱼寿司到购物车"
  :icon="ShoppingCartIcon"
>
  加入购物车
</BaseButton>
```

## 注意事项

1. **性能优化**: 避免过度使用动画效果
2. **兼容性**: 在老旧设备上禁用复杂动画
3. **一致性**: 保持整个应用的按钮风格一致
4. **测试**: 在不同设备和浏览器上测试按钮效果
5. **用户体验**: 提供清晰的视觉反馈
