<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import ShopOrderListPanel from './components/ShopOrderListPanel.vue';
import { useShopOrderManage } from './composables/useShopOrderManage';

defineOptions({ name: 'ShopOrders' });

const {
  dataSource,
  handleSearch,
  handleTableChange,
  loading,
  openDetail,
  pagination,
  resetFilters,
  userId,
} = useShopOrderManage();
</script>

<template>
  <Page title="订单列表">
    <ShopOrderListPanel
      v-model:user-id="userId"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @detail="openDetail"
      @reset="resetFilters"
      @search="handleSearch"
      @table-change="handleTableChange"
    />
  </Page>
</template>
