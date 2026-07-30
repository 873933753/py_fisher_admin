<script lang="ts" setup>
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';

import type { PaypalApi } from '#/api/core/paypal';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Button, Input, Select, Table } from 'ant-design-vue';

import {
  MallListFilterField,
  MallListPage,
  MallListSearchCard,
  MallListTableCard,
} from '#/components/mall-list';

import {
  formatTransactionAmount,
  getTxnStatusLabel,
  getTxnTypeLabel,
  TXN_TYPE_FILTER_OPTIONS,
} from '../constants';

const props = defineProps<{
  dataSource: PaypalApi.TransactionRecord[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}>();

const emit = defineEmits<{
  detail: [row: PaypalApi.TransactionRecord];
  reset: [];
  search: [];
  tableChange: [page: number, pageSize: number];
}>();

const orderId = defineModel<string>('orderId', { default: '' });
const paypalOrderId = defineModel<string>('paypalOrderId', { default: '' });
const txnType = defineModel<PaypalApi.TxnTypeValue | undefined>('txnType');

const router = useRouter();

const columns: TableColumnsType<PaypalApi.TransactionRecord> = [
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 170,
    align: 'center',
  },
  {
    title: '交易类型',
    dataIndex: 'txnType',
    key: 'txnType',
    width: 110,
    align: 'center',
  },
  {
    title: '交易状态',
    dataIndex: 'txnStatus',
    key: 'txnStatus',
    width: 110,
    align: 'center',
  },
  {
    title: '金额',
    key: 'amount',
    width: 120,
    align: 'center',
  },
  {
    title: 'PayPal 订单号',
    dataIndex: 'paypalOrderId',
    key: 'paypalOrderId',
    width: 200,
    ellipsis: true,
    align: 'center',
  },
  {
    title: 'Capture ID',
    dataIndex: 'captureId',
    key: 'captureId',
    width: 180,
    ellipsis: true,
    align: 'center',
  },
  {
    title: 'Refund ID',
    dataIndex: 'refundId',
    key: 'refundId',
    width: 180,
    ellipsis: true,
    align: 'center',
  },
  {
    title: '商城订单 ID',
    dataIndex: 'orderId',
    key: 'orderId',
    width: 180,
    ellipsis: true,
    align: 'center',
  },
  { title: '操作', key: 'action', width: 110, fixed: 'right', align: 'center' },
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

function goOrderDetail(record: PaypalApi.TransactionRecord) {
  const id =
    record.orderId === undefined || record.orderId === null
      ? ''
      : String(record.orderId).trim();
  if (!id) {
    return;
  }
  router.push({
    name: 'MallOrderDetail',
    params: { id },
  });
}

function hasOrderLink(record: PaypalApi.TransactionRecord) {
  return (
    record.orderId !== undefined &&
    record.orderId !== null &&
    String(record.orderId).trim() !== ''
  );
}
</script>

<template>
  <MallListPage>
    <div class="flex flex-col gap-4">
      <MallListSearchCard>
        <template #filters>
          <MallListFilterField label="商城订单 ID：">
            <Input
              v-model:value="orderId"
              allow-clear
              class="min-w-0 flex-1"
              placeholder="请输入商城订单 ID"
              @press-enter="emit('search')"
            />
          </MallListFilterField>
          <MallListFilterField label="PayPal 订单号：">
            <Input
              v-model:value="paypalOrderId"
              allow-clear
              class="min-w-0 flex-1"
              placeholder="请输入 PayPal 订单号"
              @press-enter="emit('search')"
            />
          </MallListFilterField>
          <MallListFilterField label="交易类型：">
            <Select
              v-model:value="txnType"
              allow-clear
              class="min-w-0 flex-1"
              :options="TXN_TYPE_FILTER_OPTIONS"
              placeholder="全部"
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
          <div class="text-base font-medium text-foreground">订单流水列表</div>
        </template>
        <Table
          :columns="columns"
          :data-source="dataSource"
          :loading="loading"
          :pagination="tablePagination"
          row-key="id"
          :scroll="{ x: 1600 }"
          size="middle"
        >
          <template #bodyCell="{ column, record, text }">
            <template
              v-if="
                column.key === 'txnType' ||
                column.key === 'txnStatus' ||
                column.key === 'amount' ||
                column.key === 'orderId' ||
                column.key === 'orderNo' ||
                column.key === 'action'
              "
            >
              <template v-if="column.key === 'txnType'">
                {{
                  getTxnTypeLabel(
                    (record as PaypalApi.TransactionRecord).txnType,
                  )
                }}
              </template>
              <template v-else-if="column.key === 'txnStatus'">
                {{
                  getTxnStatusLabel(
                    (record as PaypalApi.TransactionRecord).txnStatus,
                  )
                }}
              </template>
              <template v-else-if="column.key === 'amount'">
                {{
                  formatTransactionAmount(
                    (record as PaypalApi.TransactionRecord).amount,
                    (record as PaypalApi.TransactionRecord).currency,
                  )
                }}
              </template>
              <template v-else-if="column.key === 'orderId'">
                <Button
                  v-if="hasOrderLink(record as PaypalApi.TransactionRecord)"
                  size="small"
                  type="link"
                  @click="goOrderDetail(record as PaypalApi.TransactionRecord)"
                >
                  {{ (record as PaypalApi.TransactionRecord).orderId }}
                </Button>
                <span v-else>—</span>
              </template>
              <template v-else-if="column.key === 'orderNo'">
                <Button
                  v-if="
                    hasOrderLink(record as PaypalApi.TransactionRecord) &&
                    (record as PaypalApi.TransactionRecord).orderNo
                  "
                  size="small"
                  type="link"
                  @click="goOrderDetail(record as PaypalApi.TransactionRecord)"
                >
                  {{ (record as PaypalApi.TransactionRecord).orderNo }}
                </Button>
                <span v-else>{{
                  (record as PaypalApi.TransactionRecord).orderNo ?? '—'
                }}</span>
              </template>
              <template v-else-if="column.key === 'action'">
                <Button
                  size="small"
                  type="link"
                  @click="emit('detail', record as PaypalApi.TransactionRecord)"
                >
                  查看详情
                </Button>
              </template>
            </template>
            <template v-else-if="column.key === 'captureId'">
              {{ text ?? '—' }}
            </template>
            <template v-else-if="column.key === 'refundId'">
              {{ text ?? '—' }}
            </template>
          </template>
        </Table>
      </MallListTableCard>
    </div>
  </MallListPage>
</template>
