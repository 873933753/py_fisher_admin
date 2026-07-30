<script lang="ts" setup>
import UserFormModal from './components/UserFormModal.vue';
import UserListPanel from './components/UserListPanel.vue';
import { useMallUserManage } from './composables/useMallUserManage';

defineOptions({ name: 'MallUser' });

const {
  confirmDelete,
  dataSource,
  editDetailLoading,
  editFormState,
  editModalOpen,
  editSubmitting,
  filters,
  handleSearch,
  handleTableChange,
  loading,
  openEdit,
  pagination,
  resetFilters,
  submitEdit,
} = useMallUserManage();
</script>

<template>
  <div class="mall-user-page">
    <UserListPanel
      v-model:keyword="filters.keyword"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @delete="confirmDelete"
      @edit="openEdit"
      @reset="resetFilters"
      @search="handleSearch"
      @table-change="handleTableChange"
    />
    <UserFormModal
      v-model:form-state="editFormState"
      v-model:open="editModalOpen"
      :detail-loading="editDetailLoading"
      :submit-update="submitEdit"
      :submitting="editSubmitting"
    />
  </div>
</template>
