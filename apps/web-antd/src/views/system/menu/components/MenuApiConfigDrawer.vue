<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { MenuApiRow } from '../types';

import { Alert, Button, Drawer, Input, InputNumber, Select, Spin, Table } from 'ant-design-vue';

import { MENU_API_METHOD_OPTIONS } from '../utils/menu-api';

defineProps<{
  loading: boolean;
  menuLabel: string;
  saving: boolean;
}>();

const open = defineModel<boolean>('open', { default: false });
const rows = defineModel<MenuApiRow[]>('rows', { required: true });

const emit = defineEmits<{
  addRow: [];
  close: [];
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

function handleClose() {
  open.value = false;
  emit('close');
}
</script>

<template>
  <Drawer
    v-model:open="open"
    :destroy-on-close="true"
    :mask-closable="!saving"
    title="接口配置"
    width="760"
    @close="emit('close')"
  >
    <div class="flex h-full flex-col gap-4">
      <div class="text-sm text-muted-foreground">
        当前菜单：{{ menuLabel || '—' }}
      </div>

      <Alert
        show-icon
        type="warning"
        message="保存将全量覆盖该菜单已有接口绑定。"
      />

      <Spin :spinning="loading" class="min-h-0 flex-1">
        <Table
          :columns="columns"
          :data-source="rows"
          :pagination="false"
          row-key="key"
          size="middle"
          :scroll="{ x: 640 }"
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

      <Button :disabled="loading || saving" @click="emit('addRow')">
        添加一行
      </Button>

      <div class="flex justify-end gap-2 border-t border-border pt-4">
        <Button :disabled="saving" @click="handleClose">取消</Button>
        <Button :disabled="loading" :loading="saving" type="primary" @click="emit('save')">
          保存
        </Button>
      </div>
    </div>
  </Drawer>
</template>
