<template>
  <div class="menu-items-page">
    <div class="page-header">
      <h1>菜品管理</h1>
      <el-button type="primary">
        <el-icon><Plus /></el-icon>
        添加菜品
      </el-button>
    </div>
    
    <div class="page-content">
      <el-card>
        <div class="coming-soon">
          <el-icon size="64" color="#ccc">
            <Food />
          </el-icon>
          <h2>菜品管理功能开发中...</h2>
          <p>敬请期待</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { Plus, Food } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.menu-items-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h1 {
      margin: 0;
      color: #333;
    }
  }
  
  .coming-soon {
    text-align: center;
    padding: 60px 20px;
    
    h2 {
      margin: 20px 0 10px 0;
      color: #666;
    }
    
    p {
      color: #999;
      margin: 0;
    }
  }
}
</style>