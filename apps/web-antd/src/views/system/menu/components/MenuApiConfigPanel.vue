<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { MenuApiRow } from '../types';

import { Alert, Button, Card, Input, InputNumber, Select, Spin, Table } from 'ant-design-vue';

import { MENU_API_METHOD_OPTIONS } from '../utils/menu-api';

defineProps<{
  loading: boolean;
  saveDisabled: boolean;
  saveDisabledReason?: string;
  saving: boolean;
}>();

const rows = defineModel<MenuApiRow[]>('rows', { required: true });

const emit = defineEmits<{
  addRow: [];
  removeRow: [index: number];
  save: [];
}>();

const columns: TableColumnsType<MenuApiRow> = [
  {
    title: 'Method',
    dataIndex: 'method',
    key: 'method',
    width: 140,
  },
  {
    title: 'Path Pattern',
    dataIndex: 'path_pattern',
    key: 'path_pattern',
  },
  {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark',
    width: 180,
  },
  {
    title: 'Sort',
    dataIndex: 'sort',
    key: 'sort',
    width: 100,
    align: 'center',
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    align: 'center',
  },
];
</script>

<template>
  <Card class="menu-api-config-panel" size="small" title="接口配置">
    <Alert
      show-icon
      class="mb-4"
      type="warning"
      message="保存将全量覆盖该菜单已有接口绑定。"
    />

    <Spin :spinning="loading">
      <Table
        :columns="columns"
        :data-source="rows"
        :pagination="false"
        row-key="key"
        size="middle"
        :scroll="{ x: 800 }"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'method'">
            <Select
              v-model:value="record.method"
              class="w-full"
              :options="[...MENU_API_METHOD_OPTIONS]"
            />
          </template>
          <template v-else-if="column.key === 'path_pattern'">
            <Input
              v-model:value="record.path_pattern"
              allow-clear
              placeholder="如 /admin/users 或 /admin/users/**"
            />
          </template>
          <template v-else-if="column.key === 'remark'">
            <Input
              v-model:value="record.remark"
              allow-clear
              :maxlength="255"
              placeholder="接口用途说明"
            />
          </template>
          <template v-else-if="column.key === 'sort'">
            <InputNumber
              v-model:value="record.sort"
              class="w-full"
              :min="0"
              :precision="0"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <Button
              danger
              :disabled="saving"
              size="small"
              type="link"
              @click="emit('removeRow', index)"
            >
              删除
            </Button>
          </template>
        </template>
      </Table>
    </Spin>

    <Button
      class="mt-4"
      :disabled="loading || saving"
      @click="emit('addRow')"
    >
      添加一行
    </Button>

    <div class="mt-4 flex justify-end">
      <Button
        :disabled="loading || saveDisabled"
        :loading="saving"
        :title="saveDisabledReason"
        type="primary"
        @click="emit('save')"
      >
        保存接口
      </Button>
    </div>
  </Card>
</template>
