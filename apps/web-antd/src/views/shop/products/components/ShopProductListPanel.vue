<script lang="ts" setup>
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';

import type { AdminShopProductApi } from '#/api/core/admin-shop-products';

import { computed } from 'vue';

import { Button, Input, Select, Switch, Table } from 'ant-design-vue';

import {
  MallListFilterField,
  MallListSearchCard,
  MallListTableCard,
} from '#/components/mall-list';

import {
  SHOP_PRODUCT_STATUS_ON,
  SHOP_PRODUCT_STATUS_OPTIONS,
} from '../constants';
import { formatPriceCents } from '../utils/price';
import ShopProductCoverCell from './ShopProductCoverCell.vue';

const props = defineProps<{
  dataSource: AdminShopProductApi.Product[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}>();

const emit = defineEmits<{
  add: [];
  delete: [row: AdminShopProductApi.Product];
  edit: [row: AdminShopProductApi.Product];
  reset: [];
  search: [];
  tableChange: [page: number, pageSize: number];
  toggleStatus: [row: AdminShopProductApi.Product, checked: boolean];
}>();

const keyword = defineModel<string>('keyword', { default: '' });
const statusFilter = defineModel<'' | AdminShopProductApi.ProductStatus>(
  'statusFilter',
  { default: '' },
);

const columns: TableColumnsType<AdminShopProductApi.Product> = [
  {
    title: '序号',
    key: 'index',
    width: 70,
    align: 'center',
  },
  {
    title: '商品 ID',
    dataIndex: 'id',
    key: 'id',
    width: 90,
    align: 'center',
  },
  {
    title: '主图',
    dataIndex: 'cover_url',
    key: 'cover_url',
    width: 80,
    align: 'center',
  },
  {
    title: '商品名称',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
    align: 'center',
    width: 200,
  },
  {
    title: '售价',
    dataIndex: 'price',
    key: 'price',
    width: 120,
    align: 'center',
  },
  {
    title: '库存',
    dataIndex: 'stock',
    key: 'stock',
    width: 90,
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
    title: '创建时间',
    dataIndex: 'create_time',
    key: 'create_time',
    width: 170,
    align: 'center',
  },
  {
    title: '操作',
    key: 'action',
    width: 140,
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

function handleStatusChange(
  row: AdminShopProductApi.Product,
  checked: boolean | number | string,
) {
  emit('toggleStatus', row, checked === true || checked === 1);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <MallListSearchCard>
      <template #filters>
        <MallListFilterField label="商品名称：">
          <Input
            v-model:value="keyword"
            allow-clear
            class="min-w-0 flex-1"
            placeholder="搜索商品名称"
            @press-enter="emit('search')"
          />
        </MallListFilterField>
        <MallListFilterField label="状态：">
          <Select
            v-model:value="statusFilter"
            allow-clear
            class="min-w-0 flex-1"
            :options="SHOP_PRODUCT_STATUS_OPTIONS"
            placeholder="全部"
          />
        </MallListFilterField>
      </template>
      <template #actions>
        <Button type="primary" @click="emit('search')">搜索</Button>
        <Button @click="emit('reset')">重置</Button>
      </template>
    </MallListSearchCard>

    <MallListTableCard>
      <template #header>
        <div class="text-base font-medium text-foreground">商品列表</div>
        <Button type="primary" @click="emit('add')">新增商品</Button>
      </template>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="tablePagination"
        row-key="id"
        :scroll="{ x: 1100 }"
        size="middle"
      >
        <template #bodyCell="{ column, index, record }">
          <template v-if="column.key === 'index'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <template v-else-if="column.key === 'cover_url'">
            <ShopProductCoverCell :src="record.cover_url" />
          </template>
          <template v-else-if="column.key === 'price'">
            {{ formatPriceCents(record.price) }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Switch
              :checked="record.status === SHOP_PRODUCT_STATUS_ON"
              checked-children="在售"
              un-checked-children="下架"
              @change="(checked) => handleStatusChange(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="flex justify-center gap-1">
              <Button
                size="small"
                type="link"
                @click="emit('edit', record as AdminShopProductApi.Product)"
              >
                编辑
              </Button>
              <Button
                danger
                size="small"
                type="link"
                @click="emit('delete', record as AdminShopProductApi.Product)"
              >
                删除
              </Button>
            </div>
          </template>
        </template>
      </Table>
    </MallListTableCard>
  </div>
</template>
