<script lang="ts" setup>
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';

import type { AdminShopOrderApi } from '#/api/core/admin-shop-orders';

import { computed } from 'vue';

import { Button, Form, Input, Table, Tag } from 'ant-design-vue';

import {
  getShopOrderStatusLabel,
  getShopOrderStatusTagColor,
} from '../constants';
import { formatPriceCents } from '../../products/utils/price';

const props = defineProps<{
  dataSource: AdminShopOrderApi.OrderListItem[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}>();

const emit = defineEmits<{
  detail: [row: AdminShopOrderApi.OrderListItem];
  reset: [];
  search: [];
  tableChange: [page: number, pageSize: number];
}>();

const userId = defineModel<string>('userId', { default: '' });

const columns: TableColumnsType<AdminShopOrderApi.OrderListItem> = [
  {
    title: '序号',
    key: 'index',
    width: 70,
    align: 'center',
  },
  {
    title: '订单 ID',
    dataIndex: 'id',
    key: 'id',
    width: 100,
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
    width: 110,
    align: 'center',
  },
  {
    title: '总金额',
    dataIndex: 'total_amount',
    key: 'total_amount',
    width: 120,
    align: 'center',
  },
  {
    title: '下单时间',
    dataIndex: 'create_time',
    key: 'create_time',
    width: 180,
    align: 'center',
  },
  {
    title: '操作',
    key: 'action',
    width: 110,
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
      :scroll="{ x: 900 }"
      size="middle"
    >
      <template #bodyCell="{ column, index, record }">
        <template v-if="column.key === 'index'">
          {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
        </template>
        <template v-else-if="column.key === 'status'">
          <Tag :color="getShopOrderStatusTagColor(record.status)">
            {{ getShopOrderStatusLabel(record.status) }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'total_amount'">
          {{ formatPriceCents(record.total_amount) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Button
            size="small"
            type="link"
            @click="emit('detail', record as AdminShopOrderApi.OrderListItem)"
          >
            查看详情
          </Button>
        </template>
      </template>
    </Table>
  </div>
</template>
