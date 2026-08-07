<template>
  <div class="users-management">
    <div class="page-header">
      <h1>{{ $t('admin.users') }}</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        {{ $t('admin.addUser') }}
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.username"
            :placeholder="$t('menu.searchUsername')"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.role" :placeholder="$t('menu.roleFilter')" clearable @change="handleSearch">
            <el-option :label="$t('common.all')" value="" />
            <el-option :label="$t('admin.manager')" value="manager" />
            <el-option :label="$t('admin.cashier')" value="cashier" />
            <el-option :label="$t('admin.chef')" value="chef" />
            <el-option :label="$t('admin.customer')" value="customer" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch">{{ $t('common.search') }}</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 用户列表 -->
    <div class="table-section">
      <el-table
        :data="userList"
        :loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" :label="$t('admin.username')" width="150" />
        <el-table-column prop="role" :label="$t('admin.role')" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tableNumber" :label="$t('cart.table')" width="100">
          <template #default="{ row }">
            {{ row.tableNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" :label="$t('admin.createdAt')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" :label="$t('admin.updatedAt')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.actions')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editMode ? $t('admin.editUser') : $t('admin.addUser')"
      width="500px"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="80px"
      >
        <el-form-item :label="$t('admin.username')" prop="username">
          <el-input v-model="userForm.username" :placeholder="$t('menu.username')" />
        </el-form-item>
        <el-form-item :label="$t('admin.password')" prop="password" v-if="!editMode">
          <el-input v-model="userForm.password" type="password" :placeholder="$t('menu.password')" />
        </el-form-item>
        <el-form-item :label="$t('admin.role')" prop="role">
          <el-select v-model="userForm.role" :placeholder="$t('menu.chooseRole')">
            <el-option :label="$t('admin.manager')" value="manager" />
            <el-option :label="$t('admin.cashier')" value="cashier" />
            <el-option :label="$t('admin.chef')" value="chef" />
            <el-option :label="$t('admin.customer')" value="customer" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('cart.table')" prop="tableNumber" v-if="userForm.role === 'customer'">
          <el-input-number v-model="userForm.tableNumber" :min="1" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

// 响应式数据
const loading = ref(false)
const showAddDialog = ref(false)
const editMode = ref(false)
const userList = ref([])

// 搜索表单
const searchForm = reactive({
  username: '',
  role: ''
})

// 分页数据
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 用户表单
const userForm = reactive({
  id: null,
  username: '',
  password: '',
  role: '',
  tableNumber: null
})

// 表单验证规则
const userFormRules = computed(() => ({
  username: [
    { required: true, message: t('auth.username'), trigger: 'blur' },
    { min: 3, max: 20, message: t('auth.usernameLength'), trigger: 'blur' }
  ],
  password: [
    { required: true, message: t('auth.password'), trigger: 'blur' },
    { min: 6, max: 20, message: t('auth.passwordLength'), trigger: 'blur' }
  ],
  role: [
    { required: true, message: t('menu.chooseRole'), trigger: 'change' }
  ]
}))

// 表单引用
const userFormRef = ref()

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取用户列表
    // const response = await userApi.getUsers({
    //   page: pagination.page,
    //   size: pagination.size,
    //   username: searchForm.username,
    //   role: searchForm.role
    // })
    
    // 模拟数据
    const mockData = {
      items: [
        {
          id: 1,
          username: 'admin',
          role: 'manager',
          tableNumber: null,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z'
        },
        {
          id: 2,
          username: 'cashier01',
          role: 'cashier',
          tableNumber: null,
          createdAt: '2024-01-02T10:00:00Z',
          updatedAt: '2024-01-02T10:00:00Z'
        },
        {
          id: 3,
          username: 'chef01',
          role: 'chef',
          tableNumber: null,
          createdAt: '2024-01-03T10:00:00Z',
          updatedAt: '2024-01-03T10:00:00Z'
        }
      ],
      total: 3
    }
    
    userList.value = mockData.items
    pagination.total = mockData.total
  } catch (error) {
    ElMessage.error(t('admin.fetchUsersFailed'))
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  fetchUsers()
}

// 分页处理
const handleSizeChange = (val) => {
  pagination.size = val
  fetchUsers()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchUsers()
}

// 编辑用户
const handleEdit = (row) => {
  editMode.value = true
  Object.assign(userForm, row)
  showAddDialog.value = true
}

// 删除用户
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？`,
      t('common.delete'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )
    
    // TODO: 调用API删除用户
    // await userApi.deleteUser(row.id)
    
    ElMessage.success(t('admin.deleteSuccess'))
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('admin.deleteFailed'))
      console.error('删除用户失败:', error)
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await userFormRef.value.validate()
    
    // TODO: 调用API保存用户
    if (editMode.value) {
      // await userApi.updateUser(userForm.id, userForm)
      ElMessage.success(t('admin.updateSuccess'))
    } else {
      // await userApi.createUser(userForm)
      ElMessage.success(t('admin.createSuccess'))
    }
    
    showAddDialog.value = false
    resetForm()
    fetchUsers()
  } catch (error) {
    if (error !== false) { // 表单验证失败时error为false
      ElMessage.error(editMode.value ? t('admin.updateFailed') : t('admin.createFailed'))
      console.error('保存用户失败:', error)
    }
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(userForm, {
    id: null,
    username: '',
    password: '',
    role: '',
    tableNumber: null
  })
  editMode.value = false
  userFormRef.value?.resetFields()
}

// 获取角色标签类型
const getRoleTagType = (role) => {
  const typeMap = {
    manager: 'danger',
    cashier: 'warning',
    chef: 'success',
    customer: 'info'
  }
  return typeMap[role] || 'info'
}

// 获取角色文本
const getRoleText = (role) => {
  const textMap = {
    manager: t('admin.manager'),
    cashier: t('admin.cashier'),
    chef: t('admin.chef'),
    customer: t('admin.customer')
  }
  return textMap[role] || role
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString(document.documentElement.lang || 'zh-CN')
}

// 监听对话框关闭
const handleDialogClose = () => {
  resetForm()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchUsers()
})
</script>

<style lang="scss" scoped>
.users-management {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h1 {
      margin: 0;
      color: #303133;
    }
  }
  
  .search-section {
    margin-bottom: 20px;
    padding: 20px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .table-section {
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .pagination-section {
    padding: 20px;
    display: flex;
    justify-content: center;
  }
}
</style>
