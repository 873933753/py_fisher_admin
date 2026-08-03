<script lang="ts" setup>
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';

import type { AdminAdminApi } from '#/api/core/admin-admin';

import { computed } from 'vue';

import { Button, Input, Table, Tag } from 'ant-design-vue';

import {
  MallListFilterField,
  MallListPage,
  MallListSearchCard,
  MallListTableCard,
} from '#/components/mall-list';

import {
  formatAdminListRoleName,
  getAdminDisabledLabel,
  getAdminDisabledTagColor,
} from '../constants';

const props = defineProps<{
  currentAdminId: number;
  dataSource: AdminAdminApi.ListItem[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}>();

const emit = defineEmits<{
  add: [];
  delete: [row: AdminAdminApi.ListItem];
  edit: [row: AdminAdminApi.ListItem];
  reset: [];
  search: [];
  tableChange: [page: number, pageSize: number];
}>();

const keyword = defineModel<string>('keyword', { default: '' });

const columns: TableColumnsType<AdminAdminApi.ListItem> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
    align: 'center',
  },
  {
    title: '手机号',
    dataIndex: 'phone_number',
    key: 'phone_number',
    width: 160,
    align: 'center',
  },
  {
    title: '角色',
    dataIndex: 'role_name',
    key: 'role_name',
    width: 120,
    align: 'center',
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    key: 'create_time',
    width: 180,
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

function isCurrentAdmin(adminId: number) {
  return adminId > 0 && adminId === props.currentAdminId;
}
</script>

<template>
  <MallListPage>
    <div class="flex flex-col gap-4">
      <MallListSearchCard>
        <template #filters>
          <MallListFilterField label="手机号：">
            <Input
              v-model:value="keyword"
              allow-clear
              class="min-w-0 flex-1"
              placeholder="请输入手机号"
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
          <div class="flex items-center justify-between gap-3">
            <div class="text-base font-medium text-foreground">后台账号列表</div>
            <Button type="primary" @click="emit('add')">新建账号</Button>
          </div>
        </template>
        <Table
          :columns="columns"
          :data-source="dataSource"
          :loading="loading"
          :pagination="tablePagination"
          row-key="id"
          :scroll="{ x: 880 }"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'role_name'">
              {{ formatAdminListRoleName(record.role_name, record.role) }}
            </template>
            <template v-else-if="column.key === 'is_disabled'">
              <Tag :color="getAdminDisabledTagColor(record.is_disabled)">
                {{ getAdminDisabledLabel(record.is_disabled) }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <div class="flex justify-center gap-1">
                <Button
                  size="small"
                  type="link"
                  @click="emit('edit', record as AdminAdminApi.ListItem)"
                >
                  编辑
                </Button>
                <Button
                  danger
                  :disabled="isCurrentAdmin(record.id)"
                  size="small"
                  type="link"
                  @click="emit('delete', record as AdminAdminApi.ListItem)"
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
