<script lang="ts" setup>
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';

import type { ProductFindPageApi } from '#/api/core/product';

import { computed } from 'vue';

import { Button, Input, Table } from 'ant-design-vue';

import {
  MallListFilterField,
  MallListSearchCard,
  MallListTableCard,
} from '#/components/mall-list';

import ProductListMainImgCell from './ProductListMainImgCell.vue';

const props = defineProps<{
  dataSource: ProductFindPageApi.ProductRecord[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}>();

const emit = defineEmits<{
  add: [];
  contactBuyer: [row: ProductFindPageApi.ProductRecord];
  delete: [row: ProductFindPageApi.ProductRecord];
  edit: [row: ProductFindPageApi.ProductRecord];
  reset: [];
  search: [];
  tableChange: [page: number, pageSize: number];
  viewReviews: [row: ProductFindPageApi.ProductRecord];
}>();

const keyword = defineModel<string>('keyword', { default: '' });

function formatFlag01(value: number | string | undefined) {
  return value === 1 || value === '1' ? '是' : '否';
}

const columns: TableColumnsType<ProductFindPageApi.ProductRecord> = [
  {
    title: '序号',
    key: 'index',
    width: 50,
    align: 'center',
  },
  {
    title: '商品Id',
    dataIndex: 'id',
    key: 'id',
    width: 140,
    ellipsis: true,
    align: 'center',
  },
  {
    title: '主图',
    dataIndex: 'mainImg',
    key: 'mainImg',
    width: 72,
    align: 'center',
  },
  {
    title: '商品名称',
    dataIndex: 'productName',
    key: 'productName',
    ellipsis: true,
    align: 'center',
    width: 200,
  },
  // {
  //   title: '副标题',
  //   dataIndex: 'productSubtitle',
  //   key: 'productSubtitle',
  //   ellipsis: true,
  //   align: 'center',
  // },
  {
    title: '售价',
    dataIndex: 'salePrice',
    key: 'salePrice',
    width: 130,
    align: 'center',
  },
  // {
  //   title: '原价',
  //   dataIndex: 'orgPrice',
  //   key: 'orgPrice',
  //   width: 90,
  //   align: 'center',
  // },
  {
    title: '库存',
    dataIndex: 'stock',
    key: 'stock',
    width: 80,
    align: 'center',
  },
  {
    title: '销量',
    dataIndex: 'salesVolume',
    key: 'salesVolume',
    width: 80,
    align: 'center',
  },
  {
    title: '是否多属性',
    dataIndex: 'isMultiAttr',
    key: 'isMultiAttr',
    width: 100,
    align: 'center',
  },
  {
    title: '近30天收藏量',
    dataIndex: 'followCount30Days',
    key: 'followCount30Days',
    width: 120,
    align: 'center',
  },
  {
    title: '是否热门',
    dataIndex: 'isHot',
    key: 'isHot',
    width: 90,
    align: 'center',
  },
  {
    title: '是否新品',
    dataIndex: 'isNew',
    key: 'isNew',
    width: 90,
    align: 'center',
  },
  {
    title: '近30天浏览量',
    dataIndex: 'browseCount30Days',
    key: 'browseCount30Days',
    width: 120,
    align: 'center',
  },
  { title: '操作', key: 'action', width: 260, fixed: 'right', align: 'center' },
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
        :scroll="{ x: 1500 }"
        size="middle"
      >
        <template #bodyCell="{ column, index, record }">
          <template v-if="column.key === 'index'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <template v-else-if="column.key === 'mainImg'">
            <ProductListMainImgCell :src="record.mainImg" />
          </template>
          <template v-else-if="column.key === 'isMultiAttr'">
            {{ formatFlag01(record.isMultiAttr) }}
          </template>
          <template v-else-if="column.key === 'isHot'">
            {{ formatFlag01(record.isHot) }}
          </template>
          <template v-else-if="column.key === 'isNew'">
            {{ formatFlag01(record.isNew) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="flex justify-center gap-1">
              <Button
                size="small"
                type="link"
                @click="
                  emit('edit', record as ProductFindPageApi.ProductRecord)
                "
              >
                编辑
              </Button>
              <Button
                size="small"
                type="link"
                @click="
                  emit(
                    'viewReviews',
                    record as ProductFindPageApi.ProductRecord,
                  )
                "
              >
                查看评论
              </Button>
              <Button
                size="small"
                type="link"
                @click="
                  emit(
                    'contactBuyer',
                    record as ProductFindPageApi.ProductRecord,
                  )
                "
              >
                回复用户
              </Button>
              <Button
                danger
                size="small"
                type="link"
                @click="
                  emit('delete', record as ProductFindPageApi.ProductRecord)
                "
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
