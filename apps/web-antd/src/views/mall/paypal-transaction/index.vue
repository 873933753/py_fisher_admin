<script lang="ts" setup>
import PaypalTransactionDetailModal from './components/PaypalTransactionDetailModal.vue';
import PaypalTransactionListPanel from './components/PaypalTransactionListPanel.vue';
import { usePaypalTransactionManage } from './composables/usePaypalTransactionManage';

defineOptions({ name: 'MallPaypalTransaction' });

const {
  dataSource,
  detailData,
  detailLoading,
  detailModalOpen,
  detailPaypalOrderId,
  filters,
  handleSearch,
  handleTableChange,
  loading,
  openDetail,
  pagination,
  resetFilters,
} = usePaypalTransactionManage();
</script>

<template>
  <div class="mall-paypal-transaction-page">
    <PaypalTransactionListPanel
      v-model:order-id="filters.orderId"
      v-model:paypal-order-id="filters.paypalOrderId"
      v-model:txn-type="filters.txnType"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @detail="openDetail"
      @reset="resetFilters"
      @search="handleSearch"
      @table-change="handleTableChange"
    />
    <PaypalTransactionDetailModal
      v-model:open="detailModalOpen"
      :data="detailData"
      :loading="detailLoading"
      :paypal-order-id="detailPaypalOrderId"
    />
  </div>
</template>
