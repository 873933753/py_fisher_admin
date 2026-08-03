<script lang="ts" setup>
import AdminFormModal from './components/AdminFormModal.vue';
import AdminListPanel from './components/AdminListPanel.vue';
import { useSystemAdminManage } from './composables/useSystemAdminManage';

defineOptions({ name: 'SystemAdmin' });

const {
  confirmDelete,
  currentAdminId,
  dataSource,
  disableRoleSelect,
  filters,
  formDetailLoading,
  formModalOpen,
  formMode,
  formState,
  formSubmitting,
  handleSearch,
  handleTableChange,
  loading,
  openAdd,
  openEdit,
  pagination,
  resetFilters,
  roleOptions,
  submitForm,
} = useSystemAdminManage();
</script>

<template>
  <div class="system-admin-page">
    <AdminListPanel
      v-model:keyword="filters.keyword"
      :current-admin-id="currentAdminId"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @add="openAdd"
      @delete="confirmDelete"
      @edit="openEdit"
      @reset="resetFilters"
      @search="handleSearch"
      @table-change="handleTableChange"
    />
    <AdminFormModal
      v-model:form-state="formState"
      v-model:open="formModalOpen"
      :current-admin-id="currentAdminId"
      :detail-loading="formDetailLoading"
      :disable-role-select="disableRoleSelect"
      :mode="formMode"
      :role-options="roleOptions"
      :submit-form="submitForm"
      :submitting="formSubmitting"
    />
  </div>
</template>
