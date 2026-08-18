<script lang="ts" setup>
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';

import type { AdminShopRefundApi } from '#/api/core/admin-shop-refunds';

import { computed } from 'vue';

import { Button, Form, Input, Select, Table, Tag } from 'ant-design-vue';

import {
  formatEmptyText,
  formatPriceYuan,
} from '#/views/shop/products/utils/price';

import {
  canApproveShopRefund,
  canRejectShopRefund,
  canSyncShopRefund,
  getShopRefundStatusLabel,
  getShopRefundStatusTagColor,
  SHOP_REFUND_STATUS_OPTIONS,
} from '../constants';

const props = defineProps<{
  dataSource: AdminShopRefundApi.RefundListItem[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}>();

const emit = defineEmits<{
  approve: [row: AdminShopRefundApi.RefundListItem];
  reject: [row: AdminShopRefundApi.RefundListItem];
  reset: [];
  search: [];
  sync: [row: AdminShopRefundApi.RefundListItem];
  tableChange: [page: number, pageSize: number];
}>();

const userId = defineModel<string>('userId', { default: '' });
const orderNo = defineModel<string>('orderNo', { default: '' });
const statusFilter = defineModel<'' | AdminShopRefundApi.RefundStatus>(
  'statusFilter',
  { default: '' },
);

const columns: TableColumnsType<AdminShopRefundApi.RefundListItem> = [
  {
    title: '序号',
    key: 'index',
    width: 70,
    align: 'center',
  },
  {
    title: '工单号',
    dataIndex: 'refund_no',
    key: 'refund_no',
    width: 240,
    align: 'center',
  },
  {
    title: '订单号',
    dataIndex: 'order_no',
    key: 'order_no',
    width: 220,
    align: 'center',
  },
  {
    title: '用户 ID',
    dataIndex: 'user_id',
    key: 'user_id',
    width: 100,
    align: 'center',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 150,
    align: 'center',
  },
  {
    title: '申请金额',
    dataIndex: 'amount',
    key: 'amount',
    width: 120,
    align: 'center',
  },
  {
    title: '申请原因',
    dataIndex: 'reason',
    key: 'reason',
    ellipsis: true,
    width: 180,
    align: 'center',
  },
  {
    title: '拒绝原因',
    dataIndex: 'reject_reason',
    key: 'reject_reason',
    ellipsis: true,
    width: 180,
    align: 'center',
  },
  {
    title: '申请时间',
    dataIndex: 'create_time',
    key: 'create_time',
    width: 180,
    align: 'center',
  },
  {
    title: '审批时间',
    dataIndex: 'reviewed_at',
    key: 'reviewed_at',
    width: 180,
    align: 'center',
  },
  {
    title: '操作',
    key: 'action',
    width: 160,
    fixed: 'right',
    align: 'center',
  },
];

const tablePagination = computed<TablePaginationConfig>(() => ({
  current: props.pagination.current,
  pageSize: props.pagination.pageSize,
  total: props.pagination.total,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
  onChange: (page, pageSize) => {
    emit('tableChange', page, pageSize);
  },
}));
</script>

<template>
  <div class="flex flex-col gap-4">
    <Form layout="inline" class="flex flex-wrap gap-y-3">
      <Form.Item label="用户 ID">
        <Input
          v-model:value="userId"
          allow-clear
          class="w-[200px]"
          placeholder="请输入用户 ID"
          @press-enter="emit('search')"
        />
      </Form.Item>
      <Form.Item label="订单号">
        <Input
          v-model:value="orderNo"
          allow-clear
          class="w-[220px]"
          placeholder="请输入订单号"
          @press-enter="emit('search')"
        />
      </Form.Item>
      <Form.Item label="工单状态">
        <Select
          v-model:value="statusFilter"
          allow-clear
          class="w-[200px]"
          :options="SHOP_REFUND_STATUS_OPTIONS"
          placeholder="全部"
        />
      </Form.Item>
      <Form.Item>
        <div class="flex gap-2">
          <Button type="primary" @click="emit('search')">查询</Button>
          <Button @click="emit('reset')">重置</Button>
        </div>
      </Form.Item>
    </Form>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="tablePagination"
      row-key="id"
      :scroll="{ x: 1810 }"
      size="middle"
    >
      <template #bodyCell="{ column, index, record }">
        <template v-if="column.key === 'index'">
          {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
        </template>
        <template v-else-if="column.key === 'status'">
          <Tag :color="getShopRefundStatusTagColor(record.status)">
            {{ getShopRefundStatusLabel(record.status) }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'amount'">
          {{ formatPriceYuan(record.amount) }}
        </template>
        <template v-else-if="column.key === 'reason'">
          {{ formatEmptyText(record.reason) }}
        </template>
        <template v-else-if="column.key === 'reject_reason'">
          {{ formatEmptyText(record.reject_reason) }}
        </template>
        <template v-else-if="column.key === 'reviewed_at'">
          {{ formatEmptyText(record.reviewed_at) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <div
            v-if="
              canApproveShopRefund(record.status) ||
              canRejectShopRefund(record.status) ||
              canSyncShopRefund(record.status)
            "
            class="flex justify-center gap-1"
          >
            <Button
              v-if="canApproveShopRefund(record.status)"
              size="small"
              type="link"
              @click="
                emit('approve', record as AdminShopRefundApi.RefundListItem)
              "
            >
              同意
            </Button>
            <Button
              v-if="canRejectShopRefund(record.status)"
              danger
              size="small"
              type="link"
              @click="
                emit('reject', record as AdminShopRefundApi.RefundListItem)
              "
            >
              拒绝
            </Button>
            <Button
              v-if="canSyncShopRefund(record.status)"
              size="small"
              type="link"
              @click="emit('sync', record as AdminShopRefundApi.RefundListItem)"
            >
              同步
            </Button>
          </div>
          <span v-else class="text-muted-foreground">—</span>
        </template>
      </template>
    </Table>
  </div>
</template>
