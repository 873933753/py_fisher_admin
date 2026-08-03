<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { AdminRbacApi } from '#/api/core/admin-rbac';

import { Button, Table } from 'ant-design-vue';

import { MallListPage, MallListTableCard } from '#/components/mall-list';

import { formatRoleLabel, isSuperAdminRole } from '../constants';

defineProps<{
  loading: boolean;
  roles: AdminRbacApi.RoleItem[];
}>();

const emit = defineEmits<{
  add: [];
  configAccess: [role: AdminRbacApi.RoleItem];
  delete: [role: AdminRbacApi.RoleItem];
  edit: [role: AdminRbacApi.RoleItem];
}>();

const columns: TableColumnsType<AdminRbacApi.RoleItem> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
    align: 'center',
  },
  {
    title: '角色码',
    dataIndex: 'code',
    key: 'code',
    width: 180,
    align: 'center',
  },
  {
    title: '角色名称',
    dataIndex: 'name',
    key: 'name',
    width: 180,
    align: 'center',
  },
  {
    title: '操作',
    key: 'action',
    width: 220,
    fixed: 'right',
    align: 'center',
  },
];
</script>

<template>
  <MallListPage>
    <MallListTableCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="text-base font-medium text-foreground">角色列表</div>
          <Button type="primary" @click="emit('add')">新建角色</Button>
        </div>
      </template>
      <Table
        :columns="columns"
        :data-source="roles"
        :loading="loading"
        :pagination="false"
        row-key="code"
        :scroll="{ x: 720 }"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            {{ formatRoleLabel(record.name) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="flex justify-center gap-1">
              <Button
                size="small"
                type="link"
                @click="emit('configAccess', record as AdminRbacApi.RoleItem)"
              >
                授权配置
              </Button>
              <template v-if="!isSuperAdminRole(record.code)">
                <Button
                  size="small"
                  type="link"
                  @click="emit('edit', record as AdminRbacApi.RoleItem)"
                >
                  编辑
                </Button>
                <Button
                  danger
                  size="small"
                  type="link"
                  @click="emit('delete', record as AdminRbacApi.RoleItem)"
                >
                  删除
                </Button>
              </template>
            </div>
          </template>
        </template>
      </Table>
    </MallListTableCard>
  </MallListPage>
</template>
