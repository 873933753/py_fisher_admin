<script lang="ts" setup>
import type { OrderListTabKey, OrderStatusFilterValue } from '../constants';

import type { OrderApi } from '#/api/core/order';

import { computed } from 'vue';

import { Button, Input, Select } from 'ant-design-vue';

import {
  MallListFilterField,
  MallListPage,
  MallListSearchCard,
  MallListTableCard,
} from '#/components/mall-list';

import {
  ORDER_LIST_TABS,
  ORDER_STATUS_OPTIONS,
  resolveOrderListTab,
} from '../constants';
import OrderCardList from './OrderCardList.vue';

defineProps<{
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
  reset: [];
  search: [];
  submitOrderReview: [order: OrderApi.OrderRecord];
  tabChange: [tab: OrderListTabKey];
  uploadLogistics: [order: OrderApi.OrderRecord];
  viewOrderReview: [order: OrderApi.OrderRecord];
}>();

const orderStatus = defineModel<OrderStatusFilterValue>('orderStatus');
const orderNo = defineModel<string>('orderNo', { default: '' });
const firstLastName = defineModel<string>('firstLastName', { default: '' });

const activeTab = computed(() => resolveOrderListTab(orderStatus.value));

function handleTabChange(tab: OrderListTabKey) {
  emit('tabChange', tab);
}
</script>

<template>
  <MallListPage>
    <div class="flex flex-col gap-4">
      <MallListSearchCard>
        <template #filters>
          <MallListFilterField label="订单状态：">
            <Select
              v-model:value="orderStatus"
              allow-clear
              class="min-w-0 flex-1"
              :options="ORDER_STATUS_OPTIONS"
              placeholder="全部"
            />
          </MallListFilterField>
          <MallListFilterField label="订单编号：">
            <Input
              v-model:value="orderNo"
              allow-clear
              class="min-w-0 flex-1"
              placeholder="请输入订单编号"
              @press-enter="emit('search')"
            />
          </MallListFilterField>
          <MallListFilterField label="买家姓名：">
            <Input
              v-model:value="firstLastName"
              allow-clear
              class="min-w-0 flex-1"
              placeholder="请输入买家姓名"
              @press-enter="emit('search')"
            />
          </MallListFilterField>
        </template>
        <template #actions>
          <Button type="primary" :loading="loading" @click="emit('search')">
            搜索
          </Button>
          <Button :disabled="loading" @click="emit('reset')">重置</Button>
        </template>
      </MallListSearchCard>

      <MallListTableCard>
        <template #header>
          <nav
            aria-label="订单列表筛选"
            class="flex flex-wrap items-center gap-x-8 gap-y-2"
          >
            <button
              v-for="tab in ORDER_LIST_TABS"
              :key="tab.key"
              type="button"
              class="border-b-2 pb-1 text-base transition-colors"
              :class="
                activeTab === tab.key
                  ? 'border-primary font-medium text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              "
              @click="handleTabChange(tab.key)"
            >
              {{ tab.label }}
            </button>
          </nav>
        </template>
        <OrderCardList
          :data-source="dataSource"
          :loading="loading"
          :pagination="pagination"
          @close-order="(order) => emit('closeOrder', order)"
          @contact-buyer="(order) => emit('contactBuyer', order)"
          @delete-seller-remark="(order) => emit('deleteSellerRemark', order)"
          @edit-logistics="(order) => emit('editLogistics', order)"
          @edit-seller-remark="(order) => emit('editSellerRemark', order)"
          @execute-refund="(order) => emit('executeRefund', order)"
          @manual-refund="(order) => emit('manualRefund', order)"
          @submit-order-review="(order) => emit('submitOrderReview', order)"
          @upload-logistics="(order) => emit('uploadLogistics', order)"
          @view-order-review="(order) => emit('viewOrderReview', order)"
          @page-change="(page, pageSize) => emit('pageChange', page, pageSize)"
        />
      </MallListTableCard>
    </div>
  </MallListPage>
</template>
