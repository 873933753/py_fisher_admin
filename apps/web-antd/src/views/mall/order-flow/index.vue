<script lang="ts" setup>
import OrderFlowListPanel from './components/OrderFlowListPanel.vue';
import { useOrderFlowManage } from './composables/useOrderFlowManage';

defineOptions({ name: 'MallOrderFlow' });

const {
  dataSource,
  filters,
  handleSearch,
  handleTableChange,
  loading,
  pagination,
  resetFilters,
  summary,
} = useOrderFlowManage();
</script>

<template>
  <div class="mall-order-flow-page">
    <OrderFlowListPanel
      v-model:end-date="filters.endDate"
      v-model:order-no="filters.orderNo"
      v-model:product-name="filters.productName"
      v-model:start-date="filters.startDate"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :summary="summary"
      @reset="resetFilters"
      @search="handleSearch"
      @table-change="handleTableChange"
    />
  </div>
</template>
