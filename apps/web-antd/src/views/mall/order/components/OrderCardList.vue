<script lang="ts" setup>
import type { PaginationProps } from 'ant-design-vue';

import type { OrderApi } from '#/api/core/order';

import { computed } from 'vue';

import { Empty, Pagination, Spin } from 'ant-design-vue';

import OrderCard from './OrderCard.vue';

const props = defineProps<{
  dataSource: OrderApi.OrderRecord[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}>();

const emit = defineEmits<{
  closeOrder: [order: OrderApi.OrderRecord];
  contactBuyer: [order: OrderApi.OrderRecord];
  deleteSellerRemark: [order: OrderApi.OrderRecord];
  editLogistics: [order: OrderApi.OrderRecord];
  editSellerRemark: [order: OrderApi.OrderRecord];
  executeRefund: [order: OrderApi.OrderRecord];
  manualRefund: [order: OrderApi.OrderRecord];
  pageChange: [page: number, pageSize: number];
  submitOrderReview: [order: OrderApi.OrderRecord];
  uploadLogistics: [order: OrderApi.OrderRecord];
  viewOrderReview: [order: OrderApi.OrderRecord];
}>();

const listPagination = computed<PaginationProps>(() => ({
  current: props.pagination.current,
  pageSize: props.pagination.pageSize,
  total: props.pagination.total,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
  onChange: (page, pageSize) => {
    emit('pageChange', page, pageSize);
  },
}));

function orderRowKey(order: OrderApi.OrderRecord) {
  return order.orderId || order.orderNo;
}
</script>

<template>
  <Spin :spinning="loading">
    <div v-if="dataSource.length > 0" class="flex flex-col gap-4">
      <OrderCard
        v-for="order in dataSource"
        :key="orderRowKey(order)"
        :order="order"
        @close-order="(item) => emit('closeOrder', item)"
        @contact-buyer="(item) => emit('contactBuyer', item)"
        @delete-seller-remark="(item) => emit('deleteSellerRemark', item)"
        @edit-logistics="(item) => emit('editLogistics', item)"
        @edit-seller-remark="(item) => emit('editSellerRemark', item)"
        @execute-refund="(item) => emit('executeRefund', item)"
        @manual-refund="(item) => emit('manualRefund', item)"
        @submit-order-review="(order) => emit('submitOrderReview', order)"
        @upload-logistics="(item) => emit('uploadLogistics', item)"
        @view-order-review="(order) => emit('viewOrderReview', order)"
      />
      <div class="flex justify-end pt-1">
        <Pagination v-bind="listPagination" />
      </div>
    </div>
    <Empty v-else-if="!loading" class="py-16" description="暂无订单" />
  </Spin>
</template>
