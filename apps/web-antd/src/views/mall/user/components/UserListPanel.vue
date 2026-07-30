<script lang="ts" setup>
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';

import type { AdminUserApi } from '#/api/core/admin-user';

import { computed } from 'vue';

import { Button, Input, Table, Tag } from 'ant-design-vue';

import {
  MallListFilterField,
  MallListPage,
  MallListSearchCard,
  MallListTableCard,
} from '#/components/mall-list';
import { UserDefaultAvatar } from '#/components/user-default-avatar';

import { getUserDisabledLabel, getUserDisabledTagColor } from '../constants';
import { formatCellText, hasAvatarUrl, USER_LIST_AVATAR_SIZE } from '../utils';

const props = defineProps<{
  dataSource: AdminUserApi.ListItem[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}>();

const emit = defineEmits<{
  delete: [row: AdminUserApi.ListItem];
  edit: [row: AdminUserApi.ListItem];
  reset: [];
  search: [];
  tableChange: [page: number, pageSize: number];
}>();

const keyword = defineModel<string>('keyword', { default: '' });

const columns: TableColumnsType<AdminUserApi.ListItem> = [
  {
    title: '头像',
    dataIndex: 'avatar',
    key: 'avatar',
    width: 88,
    align: 'center',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 200,
    ellipsis: true,
    align: 'center',
  },
  {
    title: '昵称',
    dataIndex: 'nickname',
    key: 'nickname',
    width: 140,
    ellipsis: true,
    align: 'center',
  },
  {
    title: '鱼豆',
    dataIndex: 'beans',
    key: 'beans',
    width: 100,
    align: 'center',
  },
  {
    title: '注册时间',
    dataIndex: 'create_time',
    key: 'create_time',
    width: 170,
    align: 'center',
  },
  {
    title: '更新时间',
    dataIndex: 'update_time',
    key: 'update_time',
    width: 170,
    align: 'center',
  },
  {
    title: '状态',
    dataIndex: 'is_disabled',
    key: 'is_disabled',
    width: 100,
    align: 'center',
  },
  { title: '操作', key: 'action', width: 140, fixed: 'right', align: 'center' },
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
  <MallListPage>
    <div class="flex flex-col gap-4">
      <MallListSearchCard>
        <template #filters>
          <MallListFilterField label="关键词：">
            <Input
              v-model:value="keyword"
              allow-clear
              class="min-w-0 flex-1"
              placeholder="请输入邮箱或昵称"
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
          <div class="text-base font-medium text-foreground">用户列表</div>
        </template>
        <Table
          :columns="columns"
          :data-source="dataSource"
          :loading="loading"
          :pagination="tablePagination"
          row-key="id"
          :scroll="{ x: 1130 }"
          size="middle"
        >
          <template #bodyCell="{ column, record, text }">
            <template v-if="column.key === 'avatar'">
              <div class="flex justify-center">
                <img
                  v-if="hasAvatarUrl(record.avatar)"
                  :src="record.avatar"
                  alt="avatar"
                  class="rounded-full object-cover"
                  :style="{
                    width: `${USER_LIST_AVATAR_SIZE}px`,
                    height: `${USER_LIST_AVATAR_SIZE}px`,
                  }"
                />
                <UserDefaultAvatar
                  v-else
                  :email="record.email"
                  :size="USER_LIST_AVATAR_SIZE"
                />
              </div>
            </template>
            <template v-else-if="column.key === 'nickname'">
              {{ formatCellText(text) }}
            </template>
            <template
              v-else-if="
                column.key === 'create_time' || column.key === 'update_time'
              "
            >
              {{ formatCellText(text) }}
            </template>
            <template v-else-if="column.key === 'is_disabled'">
              <Tag :color="getUserDisabledTagColor(record.is_disabled)">
                {{ getUserDisabledLabel(record.is_disabled) }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <div class="flex justify-center gap-1">
                <Button
                  size="small"
                  type="link"
                  @click="emit('edit', record as AdminUserApi.ListItem)"
                >
                  编辑
                </Button>
                <Button
                  danger
                  size="small"
                  type="link"
                  @click="emit('delete', record as AdminUserApi.ListItem)"
                >
                  删除
                </Button>
              </div>
            </template>
          </template>
        </Table>
      </MallListTableCard>
    </div>
  </MallListPage>
</template>
