<script lang="ts" setup>
import AuditDetailModal from './components/AuditDetailModal.vue';
import AuditListPanel from './components/AuditListPanel.vue';
import { useSystemAuditManage } from './composables/useSystemAuditManage';

defineOptions({ name: 'SystemAudit' });

const {
  closeDetail,
  dataSource,
  detailData,
  detailLoading,
  detailModalOpen,
  filters,
  handleSearch,
  handleTableChange,
  loading,
  openDetail,
  pagination,
  resetFilters,
} = useSystemAuditManage();
</script>

<template>
  <div class="system-audit-page">
    <AuditListPanel
      v-model:end-date="filters.endDate"
      v-model:start-date="filters.startDate"
      v-model:success="filters.success"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @detail="openDetail"
      @reset="resetFilters"
      @search="handleSearch"
      @table-change="handleTableChange"
    />
    <AuditDetailModal
      v-model:open="detailModalOpen"
      :data="detailData"
      :loading="detailLoading"
      @close="closeDetail"
    />
  </div>
</template>
