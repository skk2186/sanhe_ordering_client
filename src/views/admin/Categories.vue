<template>
  <div class="categories-page">
    <div class="page-header">
      <h1>{{ $t('admin.categories') }}</h1>
      <div class="header-actions">
        <el-button
          type="primary"
          @click="showAddDialog = true"
          :icon="Plus"
        >
          {{ $t('admin.addCategory') }}
        </el-button>
        <el-button
          @click="refreshData"
          :loading="loading"
          :icon="Refresh"
        >
          {{ $t('common.refresh') }}
        </el-button>
      </div>
    </div>

    <div class="page-content">
      <el-card>
        <!-- 搜索和筛选 -->
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            :placeholder="$t('menu.searchCategory')"
            style="width: 300px"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="statusFilter"
            :placeholder="$t('menu.filterStatus')"
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option :label="$t('common.all')" value="" />
            <el-option :label="$t('common.enable')" value="enabled" />
            <el-option :label="$t('common.disable')" value="disabled" />
          </el-select>
        </div>

        <!-- 分类表格 -->
        <el-table
          :data="filteredCategories"
          :loading="loading"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" :label="$t('admin.categoryName')" min-width="150" />
          <el-table-column prop="description" :label="$t('admin.description')" min-width="200" />
          <el-table-column prop="sortOrder" :label="$t('admin.sort')" width="100" />
          <el-table-column prop="menuItemCount" :label="$t('admin.dishCount')" width="100" />
          <el-table-column :label="$t('admin.status')" width="100">
            <template #default="{ row }">
              <el-switch
                v-model="row.isEnabled"
                @change="handleStatusChange(row)"
                :loading="row.updating"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" :label="$t('admin.createdAt')" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('admin.actions')" width="200" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="editCategory(row)"
                :icon="Edit"
              >
                {{ $t('common.edit') }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="deleteCategory(row)"
                :icon="Delete"
              >
                {{ $t('common.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalCategories"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 添加/编辑分类对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingCategory ? $t('admin.editCategory') : $t('admin.addCategory')"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="100px"
      >
        <el-form-item :label="$t('admin.categoryName')" prop="name">
          <el-input v-model="categoryForm.name" :placeholder="$t('admin.enterCategory')" />
        </el-form-item>

        <el-form-item :label="$t('admin.description')" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            :placeholder="$t('admin.enterDescription')"
          />
        </el-form-item>

        <el-form-item :label="$t('admin.sort')" prop="sortOrder">
          <el-input-number
            v-model="categoryForm.sortOrder"
            :min="0"
            :max="999"
            :placeholder="$t('menu.sortValue')"
          />
        </el-form-item>

        <el-form-item :label="$t('admin.status')" prop="isEnabled">
          <el-switch
            v-model="categoryForm.isEnabled"
            :active-text="$t('common.enable')"
            :inactive-text="$t('common.disable')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button
          type="primary"
          @click="saveCategory"
          :loading="saving"
        >
          {{ editingCategory ? $t('common.update') : $t('common.add') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from '@/i18n'
import {
  Plus,
  Refresh,
  Search,
  Edit,
  Delete
} from '@element-plus/icons-vue'

const menuStore = useMenuStore()
const { t } = useI18n()

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const showAddDialog = ref(false)
const editingCategory = ref(null)
const searchKeyword = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const categoryFormRef = ref()

// 分类列表
const categories = ref([])
const totalCategories = ref(0)

// 表单数据
const categoryForm = ref({
  name: '',
  description: '',
  sortOrder: 0,
  isEnabled: true
})

// 表单验证规则
const categoryRules = computed(() => ({
  name: [
    { required: true, message: t('admin.enterCategory'), trigger: 'blur' },
    { min: 2, max: 20, message: t('admin.categoryLength'), trigger: 'blur' }
  ],
  description: [
    { max: 200, message: t('admin.descriptionLength'), trigger: 'blur' }
  ],
  sortOrder: [
    { required: true, message: t('admin.enterSort'), trigger: 'blur' },
    { type: 'number', min: 0, max: 999, message: t('admin.sortRange'), trigger: 'blur' }
  ]
}))

// 计算属性
const filteredCategories = computed(() => {
  let filtered = categories.value

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(category =>
      category.name.toLowerCase().includes(keyword) ||
      (category.description && category.description.toLowerCase().includes(keyword))
    )
  }

  // 状态筛选
  if (statusFilter.value) {
    const isEnabled = statusFilter.value === 'enabled'
    filtered = filtered.filter(category => category.isEnabled === isEnabled)
  }

  return filtered
})

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模拟数据
    const mockCategories = [
      {
        id: 1,
        name: '寿司类',
        description: '各种新鲜寿司',
        sortOrder: 1,
        isEnabled: true,
        menuItemCount: 25,
        createdAt: new Date('2024-01-01'),
        updating: false
      },
      {
        id: 2,
        name: '刺身类',
        description: '新鲜刺身拼盘',
        sortOrder: 2,
        isEnabled: true,
        menuItemCount: 18,
        createdAt: new Date('2024-01-02'),
        updating: false
      },
      {
        id: 3,
        name: '热菜类',
        description: '各种热菜和汤品',
        sortOrder: 3,
        isEnabled: false,
        menuItemCount: 32,
        createdAt: new Date('2024-01-03'),
        updating: false
      },
      {
        id: 4,
        name: '饮品类',
        description: '茶水、饮料等',
        sortOrder: 4,
        isEnabled: true,
        menuItemCount: 15,
        createdAt: new Date('2024-01-04'),
        updating: false
      }
    ]

    categories.value = mockCategories
    totalCategories.value = mockCategories.length

  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error(t('errors.fetchCategories'))
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchCategories()
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 状态切换
const handleStatusChange = async (category) => {
  category.updating = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    ElMessage.success(t('admin.categoryStatus', { status: category.isEnabled ? t('common.enable') : t('common.disable') }))
  } catch (error) {
    // 回滚状态
    category.isEnabled = !category.isEnabled
    ElMessage.error(t('admin.statusUpdateFailed'))
  } finally {
    category.updating = false
  }
}

// 编辑分类
const editCategory = (category) => {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    description: category.description || '',
    sortOrder: category.sortOrder,
    isEnabled: category.isEnabled
  }
  showAddDialog.value = true
}

// 删除分类
const deleteCategory = async (category) => {
  try {
    await ElMessageBox.confirm(
      t('admin.deleteCategoryConfirm', { name: category.name }),
      t('common.delete'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    // 从列表中移除
    const index = categories.value.findIndex(c => c.id === category.id)
    if (index !== -1) {
      categories.value.splice(index, 1)
      totalCategories.value--
    }

    ElMessage.success(t('admin.categoryDeleted'))
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('admin.deleteFailed'))
    }
  }
}

// 保存分类
const saveCategory = async () => {
  if (!categoryFormRef.value) return

  try {
    await categoryFormRef.value.validate()

    saving.value = true

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (editingCategory.value) {
      // 更新现有分类
      const index = categories.value.findIndex(c => c.id === editingCategory.value.id)
      if (index !== -1) {
        categories.value[index] = {
          ...categories.value[index],
          ...categoryForm.value
        }
      }
      ElMessage.success(t('admin.categoryUpdated'))
    } else {
      // 添加新分类
      const newCategory = {
        id: Date.now(),
        ...categoryForm.value,
        menuItemCount: 0,
        createdAt: new Date(),
        updating: false
      }
      categories.value.unshift(newCategory)
      totalCategories.value++
      ElMessage.success(t('admin.categoryAdded'))
    }

    showAddDialog.value = false
    resetForm()

  } catch (error) {
    console.error('保存分类失败:', error)
  } finally {
    saving.value = false
  }
}

// 重置表单
const resetForm = () => {
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    description: '',
    sortOrder: 0,
    isEnabled: true
  }
  if (categoryFormRef.value) {
    categoryFormRef.value.resetFields()
  }
}

// 格式化日期
const formatDate = (date) => {
  return new Intl.DateTimeFormat(document.documentElement.lang || 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// 组件挂载
onMounted(() => {
  fetchCategories()
})
</script>

<style lang="scss" scoped>
.categories-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h1 {
      margin: 0;
      color: #333;
      font-size: 24px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .page-content {
    .el-card {
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e4e7ed;
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e4e7ed;
  }

  // 表格样式优化
  :deep(.el-table) {
    .el-table__header {
      th {
        background-color: #f8f9fa;
        color: #333;
        font-weight: 600;
      }
    }

    .el-table__row {
      &:hover {
        background-color: rgba(64, 158, 255, 0.05);
      }
    }
  }

  // 对话框样式
  :deep(.el-dialog) {
    border-radius: 12px;

    .el-dialog__header {
      padding: 24px 24px 16px;
      border-bottom: 1px solid #e4e7ed;

      .el-dialog__title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
    }

    .el-dialog__body {
      padding: 24px;
    }

    .el-dialog__footer {
      padding: 16px 24px 24px;
      border-top: 1px solid #e4e7ed;
    }
  }

  // 表单样式
  .el-form {
    .el-form-item {
      margin-bottom: 24px;

      .el-form-item__label {
        font-weight: 500;
        color: #333;
      }
    }
  }
}
</style>
