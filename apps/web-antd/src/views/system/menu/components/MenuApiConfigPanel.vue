<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { MenuApiRow } from '../types';

import { computed } from 'vue';

import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Select,
  Spin,
  Table,
} from 'ant-design-vue';

import { MENU_API_METHOD_OPTIONS } from '../utils/menu-api';

const props = defineProps<{
  canEdit: boolean;
  editing: boolean;
  loading: boolean;
  saving: boolean;
}>();

const rows = defineModel<MenuApiRow[]>('rows', { required: true });

const emit = defineEmits<{
  addRow: [];
  cancel: [];
  edit: [];
  removeRow: [index: number];
  save: [];
}>();

const columns = computed<TableColumnsType<MenuApiRow>>(() => {
  const base: TableColumnsType<MenuApiRow> = [
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
  ];

  if (props.editing) {
    base.push({
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center',
    });
  }

  return base;
});

function displayCell(value: null | number | string | undefined) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value);
}
</script>

<template>
  <Card class="menu-api-config-panel" size="small">
    <template #title>接口配置</template>
    <template v-if="!editing && canEdit" #extra>
      <Button size="small" type="primary" @click="emit('edit')">编辑</Button>
    </template>

    <Alert
      v-if="editing"
      show-icon
      class="mb-4"
      type="warning"
      message="保存将全量同步该菜单接口池：已有行带 id 更新，新增行无 id，未提交的行将被删除；/** 仅匹配子路径（不含前缀本身）。"
    />

    <Spin :spinning="loading">
      <Table
        v-if="rows.length > 0"
        :columns="columns"
        :data-source="rows"
        :pagination="false"
        row-key="key"
        size="middle"
        :scroll="{ x: 800 }"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="!editing">
            <template v-if="column.key === 'method'">
              {{ displayCell(record.method) }}
            </template>
            <template v-else-if="column.key === 'path_pattern'">
              {{ displayCell(record.path_pattern) }}
            </template>
            <template v-else-if="column.key === 'remark'">
              {{ displayCell(record.remark) }}
            </template>
            <template v-else-if="column.key === 'sort'">
              {{ displayCell(record.sort) }}
            </template>
          </template>
          <template v-else>
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
        </template>
      </Table>
      <Empty
        v-else-if="!loading"
        :description="editing ? '暂无接口，可点击下方添加' : '暂无接口配置'"
      />
    </Spin>

    <template v-if="editing">
      <Button
        class="mt-4"
        :disabled="loading || saving"
        @click="emit('addRow')"
      >
        添加一行
      </Button>

      <div class="mt-4 flex justify-end gap-2">
        <Button :disabled="saving" @click="emit('cancel')">取消</Button>
        <Button :loading="saving" type="primary" @click="emit('save')">
          保存接口
        </Button>
      </div>
    </template>
  </Card>
</template>
