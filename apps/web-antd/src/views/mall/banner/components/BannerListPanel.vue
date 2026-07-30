<script lang="ts" setup>
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';

import type { SysHomeFeedApi } from '#/api/core/sysHomeFeed';

import { computed } from 'vue';

import { Button, Input, Table } from 'ant-design-vue';

import {
  MallListFilterField,
  MallListSearchCard,
  MallListTableCard,
} from '#/components/mall-list';

import {
  formatListIsScroll,
  formatListProductCount,
} from '../utils/bannerList';
import BannerListBannerPreviewCell from './BannerListBannerPreviewCell.vue';

const props = defineProps<{
  dataSource: SysHomeFeedApi.HomeFeedRecord[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}>();

const emit = defineEmits<{
  add: [];
  delete: [row: SysHomeFeedApi.HomeFeedRecord];
  edit: [row: SysHomeFeedApi.HomeFeedRecord];
  reset: [];
  search: [];
  tableChange: [page: number, pageSize: number];
}>();

const titleKeyword = defineModel<string>('titleKeyword', { default: '' });

const columns: TableColumnsType<SysHomeFeedApi.HomeFeedRecord> = [
  {
    title: '序号',
    key: 'index',
    width: 70,
    align: 'center',
  },
  {
    title: '轮播图Id',
    dataIndex: 'id',
    key: 'id',
    width: 180,
    ellipsis: true,
    align: 'center',
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
    align: 'center',
  },
  {
    title: '类型',
    dataIndex: 'feedTypeName',
    key: 'feedTypeName',
    width: 120,
    align: 'center',
  },
  {
    title: '排序',
    dataIndex: 'sortNum',
    key: 'sortNum',
    width: 80,
    align: 'center',
  },
  {
    title: '是否轮播',
    key: 'isScroll',
    width: 100,
    align: 'center',
  },
  {
    title: '商品数量',
    key: 'productCount',
    width: 100,
    align: 'center',
  },
  {
    title: '轮播图',
    key: 'bannerFile',
    width: 200,
    align: 'center',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 180,
    align: 'center',
  },
  { title: '操作', key: 'action', width: 160, fixed: 'right', align: 'center' },
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
        <MallListFilterField label="标题：">
          <Input
            v-model:value="titleKeyword"
            allow-clear
            class="min-w-0 flex-1"
            placeholder="搜索标题"
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
        <div class="text-base font-medium text-foreground">轮播图列表</div>
        <Button type="primary" @click="emit('add')">新增</Button>
      </template>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="tablePagination"
        row-key="id"
        :scroll="{ x: 1390 }"
        size="middle"
      >
        <template #bodyCell="{ column, index, record }">
          <template v-if="column.key === 'index'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <template v-else-if="column.key === 'isScroll'">
            {{ formatListIsScroll(record as SysHomeFeedApi.HomeFeedRecord) }}
          </template>
          <template v-else-if="column.key === 'productCount'">
            {{
              formatListProductCount(record as SysHomeFeedApi.HomeFeedRecord)
            }}
          </template>
          <template v-else-if="column.key === 'bannerFile'">
            <BannerListBannerPreviewCell
              :banner-file="record.bannerFile"
              :feed-type="record.feedType"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="flex justify-center gap-1">
              <Button
                size="small"
                type="link"
                @click="emit('edit', record as SysHomeFeedApi.HomeFeedRecord)"
              >
                编辑
              </Button>
              <Button
                danger
                size="small"
                type="link"
                @click="emit('delete', record as SysHomeFeedApi.HomeFeedRecord)"
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
