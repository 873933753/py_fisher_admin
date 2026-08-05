<script lang="ts" setup>
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import type { AdminAuditApi } from '#/api/core/admin-audit';

import type { AuditSuccessFilterValue } from '../constants';

import { computed } from 'vue';

import {
  Button,
  RangePicker,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  MallListFilterField,
  MallListPage,
  MallListSearchCard,
  MallListTableCard,
} from '#/components/mall-list';

import {
  AUDIT_SUCCESS_FILTER_OPTIONS,
  displayAuditText,
  formatAuditUnixTime,
  getAuditSuccessLabel,
  getAuditSuccessTagColor,
} from '../constants';

const props = defineProps<{
  dataSource: AdminAuditApi.ListItem[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}>();

const emit = defineEmits<{
  detail: [row: AdminAuditApi.ListItem];
  reset: [];
  search: [];
  tableChange: [page: number, pageSize: number];
}>();

const success = defineModel<AuditSuccessFilterValue>('success', {
  default: '',
});
const startDate = defineModel<string>('startDate', { default: '' });
const endDate = defineModel<string>('endDate', { default: '' });

const successOptions = [...AUDIT_SUCCESS_FILTER_OPTIONS];

const columns: TableColumnsType<AdminAuditApi.ListItem> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
    align: 'center',
  },
  {
    title: '操作人',
    dataIndex: 'operator_name',
    key: 'operator_name',
    width: 140,
    align: 'center',
  },
  {
    title: '角色',
    dataIndex: 'operator_role',
    key: 'operator_role',
    width: 120,
    align: 'center',
  },
  {
    title: '模块',
    dataIndex: 'module',
    key: 'module',
    width: 100,
    align: 'center',
  },
  {
    title: '动作',
    dataIndex: 'action',
    key: 'action',
    width: 120,
    align: 'center',
  },
  {
    title: '方法',
    dataIndex: 'method',
    key: 'method',
    width: 90,
    align: 'center',
  },
  {
    title: '路径',
    dataIndex: 'path',
    key: 'path',
    width: 220,
    ellipsis: true,
  },
  {
    title: '是否成功',
    dataIndex: 'success',
    key: 'success',
    width: 100,
    align: 'center',
  },
  {
    title: '时间',
    dataIndex: 'create_time',
    key: 'create_time',
    width: 180,
    align: 'center',
  },
  {
    title: '操作',
    key: 'actionBtn',
    width: 90,
    fixed: 'right',
    align: 'center',
  },
];

const dateRange = computed({
  get(): [Dayjs, Dayjs] | undefined {
    if (startDate.value && endDate.value) {
      return [dayjs(startDate.value), dayjs(endDate.value)];
    }
    return undefined;
  },
  set(value: [Dayjs, Dayjs] | [Dayjs, Dayjs] | null | undefined) {
    if (value?.[0] && value?.[1]) {
      startDate.value = value[0].format('YYYY-MM-DD');
      endDate.value = value[1].format('YYYY-MM-DD');
      return;
    }
    startDate.value = '';
    endDate.value = '';
  },
});

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
          <MallListFilterField label="是否成功：">
            <Select
              v-model:value="success"
              class="min-w-0 flex-1"
              :options="successOptions"
              placeholder="全部"
            />
          </MallListFilterField>
          <MallListFilterField label="时间范围：">
            <RangePicker
              v-model:value="dateRange"
              allow-clear
              class="min-w-0 flex-1"
              format="YYYY-MM-DD"
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
          <div class="text-base font-medium text-foreground">操作审计日志</div>
        </template>
        <Table
          :columns="columns"
          :data-source="dataSource"
          :loading="loading"
          :pagination="tablePagination"
          row-key="id"
          :scroll="{ x: 1240 }"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'operator_name'">
              {{ displayAuditText(record.operator_name) }}
            </template>
            <template v-else-if="column.key === 'operator_role'">
              {{ displayAuditText(record.operator_role) }}
            </template>
            <template v-else-if="column.key === 'method'">
              {{ displayAuditText(record.method) }}
            </template>
            <template v-else-if="column.key === 'path'">
              {{ displayAuditText(record.path) }}
            </template>
            <template v-else-if="column.key === 'success'">
              <Tag :color="getAuditSuccessTagColor(record.success)">
                {{ getAuditSuccessLabel(record.success) }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'create_time'">
              {{ formatAuditUnixTime(record.create_time) }}
            </template>
            <template v-else-if="column.key === 'actionBtn'">
              <Button
                size="small"
                type="link"
                @click="emit('detail', record as AdminAuditApi.ListItem)"
              >
                详情
              </Button>
            </template>
          </template>
        </Table>
      </MallListTableCard>
    </div>
  </MallListPage>
</template>
