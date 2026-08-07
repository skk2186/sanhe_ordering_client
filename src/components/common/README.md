# 寿司点餐系统 - 按钮组件库

## 概述

这是一套专为寿司点餐系统设计的现代化按钮组件库，提供了完整的按钮解决方案，包括基础按钮、专用功能按钮和高级交互效果。

## 组件列表

### 1. BaseButton.vue - 基础按钮组件
通用的按钮组件，支持多种样式、尺寸和状态。

**特性：**
- 8种按钮类型（default, primary, secondary, success, warning, danger, info, text）
- 4种变体样式（filled, outlined, text, ghost）
- 5种尺寸（mini, small, medium, large, xl）
- 3种形状（default, round, circle）
- 完整的状态支持（loading, disabled, hover, active）
- 响应式设计和触摸友好

### 2. AddToCartButton.vue - 加购按钮组件
专门用于商品加入购物车的按钮组件。

**特性：**
- 智能数量控制器
- 售完状态显示
- 加载状态支持
- 数量限制功能
- 动画反馈效果

### 3. FunctionButton.vue - 功能按钮组件
用于各种功能操作的按钮组件。

**特性：**
- 预定义功能类型（menu, settings, order, checkout, call等）
- 支持图标和表情符号
- 徽章数字显示
- 右箭头指示器
- 渐变背景效果

### 4. CheckoutButton.vue - 结账按钮组件
专门用于结账操作的大型按钮组件。

**特性：**
- 订单信息显示
- 优惠金额计算
- 空购物车状态
- 处理中状态
- 发光动画效果

### 5. SearchButton.vue - 搜索按钮组件
可展开的搜索按钮组件。

**特性：**
- 点击展开搜索框
- 搜索建议支持
- 自动完成功能
- 清空搜索功能
- 响应式布局

## 样式系统

### 颜色主题
```scss
$primary-color: #FF7A00;    // 橙色主题
$secondary-color: #1E88E5;  // 蓝色辅助
$success-color: #4CAF50;    // 绿色成功
$warning-color: #FF9800;    // 橙色警告
$danger-color: #F44336;     // 红色危险
$info-color: #2196F3;       // 蓝色信息
```

### 尺寸规范
| 尺寸 | 高度 | 内边距 | 字体大小 | 使用场景 |
|------|------|--------|----------|----------|
| mini | 24px | 4px 8px | 12px | 紧凑空间 |
| small | 32px | 6px 12px | 13px | 卡片内按钮 |
| medium | 40px | 8px 16px | 14px | 常规按钮 |
| large | 48px | 12px 20px | 16px | 重要操作 |
| xl | 56px | 16px 24px | 18px | 主要CTA |

### 响应式断点
- **Mobile**: < 768px - 触摸友好，最小44px高度
- **Tablet**: 768px - 1024px - 平衡设计
- **Desktop**: > 1024px - 精确交互

## 动画效果

### 基础动画
- `pulse` - 脉冲效果
- `bounce` - 弹跳效果
- `shake` - 摇摆效果
- `glow` - 发光效果

### 悬停效果
- `hover-lift` - 悬停上升
- `hover-scale` - 悬停缩放
- `hover-glow` - 悬停发光
- `hover-rotate` - 图标旋转

### 点击效果
- `click-ripple` - 涟漪效果
- `click-scale` - 点击缩放
- `click-push` - 按压效果

## 使用示例

### 基础用法
```vue
<template>
  <!-- 基础按钮 -->
  <BaseButton type="primary" @click="handleClick">
    点击我
  </BaseButton>
  
  <!-- 加购按钮 -->
  <AddToCartButton
    :quantity="cartQuantity"
    :item="dishItem"
    @add-to-cart="addToCart"
    @quantity-change="updateQuantity"
  />
  
  <!-- 功能按钮 -->
  <FunctionButton
    function-type="call"
    text="呼叫服务"
    emoji="🔔"
    badge="3"
    @click="callService"
  />
  
  <!-- 结账按钮 -->
  <CheckoutButton
    :item-count="totalItems"
    :total-price="totalPrice"
    @checkout="handleCheckout"
  />
  
  <!-- 搜索按钮 -->
  <SearchButton
    v-model="searchQuery"
    :suggestions="suggestions"
    @search="handleSearch"
  />
</template>
```

### 高级用法
```vue
<template>
  <!-- 带动画效果的按钮 -->
  <BaseButton 
    type="primary"
    class="btn-hover-effects hover-lift btn-click-effects click-ripple"
    @click="handleClick"
  >
    动画按钮
  </BaseButton>
  
  <!-- 响应式按钮组 -->
  <div class="button-group">
    <BaseButton type="secondary">取消</BaseButton>
    <BaseButton type="primary">确认</BaseButton>
  </div>
  
  <!-- 浮动操作按钮 -->
  <div class="floating-action-button">
    <BaseButton
      type="primary"
      shape="circle"
      size="large"
      class="btn-animate glow"
    >
      +
    </BaseButton>
  </div>
</template>
```

## 集成指南

### 1. 导入组件
```javascript
import BaseButton from '@/components/common/BaseButton.vue'
import AddToCartButton from '@/components/common/AddToCartButton.vue'
import FunctionButton from '@/components/common/FunctionButton.vue'
import CheckoutButton from '@/components/common/CheckoutButton.vue'
import SearchButton from '@/components/common/SearchButton.vue'
```

### 2. 导入样式
```scss
@use '@/styles/button-responsive.scss';
@use '@/styles/button-animations.scss';
```

### 3. 替换现有按钮
将项目中的 `el-button` 逐步替换为对应的自定义按钮组件。

## 演示页面

- `/button-demo` - 完整的按钮组件展示
- `/integrated-demo` - 实际集成使用示例

## 最佳实践

1. **一致性** - 在整个应用中保持按钮风格一致
2. **层级** - 使用不同类型表示操作重要性
3. **状态** - 提供清晰的视觉反馈
4. **无障碍** - 确保键盘导航和屏幕阅读器支持
5. **性能** - 合理使用动画，避免过度效果

## 技术特性

- ✅ Vue 3 Composition API
- ✅ TypeScript 支持
- ✅ SCSS 模块化样式
- ✅ 响应式设计
- ✅ 触摸友好
- ✅ 无障碍访问
- ✅ 动画效果
- ✅ 主题定制

## 浏览器支持

- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

## 更新日志

### v1.0.0 (2024-08-20)
- 🎉 初始版本发布
- ✨ 5个核心按钮组件
- 🎨 完整的样式系统
- 📱 响应式设计支持
- 🎭 动画效果库
- 📚 完整文档和示例
