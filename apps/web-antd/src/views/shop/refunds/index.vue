<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import ShopRefundListPanel from './components/ShopRefundListPanel.vue';
import ShopRefundRejectModal from './components/ShopRefundRejectModal.vue';
import { useShopRefundManage } from './composables/useShopRefundManage';

defineOptions({ name: 'ShopRefunds' });

const {
  closeReject,
  confirmApprove,
  dataSource,
  handleSearch,
  handleSync,
  handleTableChange,
  loading,
  openReject,
  orderNo,
  pagination,
  rejectOpen,
  rejectReason,
  rejectSubmitting,
  rejectingRow,
  resetFilters,
  statusFilter,
  submitReject,
  userId,
} = useShopRefundManage();
</script>

<template>
  <Page title="退款单列表">
    <ShopRefundListPanel
      v-model:user-id="userId"
      v-model:order-no="orderNo"
      v-model:status-filter="statusFilter"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @approve="confirmApprove"
      @reject="openReject"
      @reset="resetFilters"
      @search="handleSearch"
      @sync="handleSync"
      @table-change="handleTableChange"
    />

    <ShopRefundRejectModal
      v-model:open="rejectOpen"
      v-model:reject-reason="rejectReason"
      :refund-no="rejectingRow?.refund_no ?? ''"
      :submitting="rejectSubmitting"
      @cancel="closeReject"
      @submit="submitReject"
    />
  </Page>
</template>
