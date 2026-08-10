<script lang="ts" setup>
import { MallListPage } from '#/components/mall-list';

import ShopProductListPanel from './components/ShopProductListPanel.vue';
import { useShopProductManage } from './composables/useShopProductManage';

defineOptions({ name: 'ShopProducts' });

const {
  confirmDelete,
  confirmToggleStatus,
  dataSource,
  handleSearch,
  handleTableChange,
  keyword,
  loading,
  openAdd,
  openEdit,
  pagination,
  resetFilters,
  statusFilter,
} = useShopProductManage();
</script>

<template>
  <MallListPage>
    <ShopProductListPanel
      v-model:keyword="keyword"
      v-model:status-filter="statusFilter"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @add="openAdd"
      @delete="confirmDelete"
      @edit="openEdit"
      @reset="resetFilters"
      @search="handleSearch"
      @table-change="handleTableChange"
      @toggle-status="confirmToggleStatus"
    />
  </MallListPage>
</template>
