<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { PaypalApi } from '#/api/core/paypal';

import { computed } from 'vue';

import {
  Collapse,
  CollapsePanel,
  Descriptions,
  DescriptionsItem,
  Modal,
  Spin,
  Table,
} from 'ant-design-vue';

import { getTxnStatusLabel } from '../constants';

const props = defineProps<{
  data: null | PaypalApi.OrderDetailData;
  loading: boolean;
  open: boolean;
  paypalOrderId: string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const modalOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const captureColumns: TableColumnsType<PaypalApi.CaptureRecord> = [
  {
    title: 'Capture ID',
    dataIndex: 'id',
    key: 'id',
    width: 180,
    ellipsis: true,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    align: 'center',
  },
  { title: '金额', key: 'amount', width: 120, align: 'center' },
  {
    title: '最终收款',
    dataIndex: 'final_capture',
    key: 'final_capture',
    width: 100,
    align: 'center',
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    key: 'create_time',
    width: 180,
  },
  {
    title: '更新时间',
    dataIndex: 'update_time',
    key: 'update_time',
    width: 180,
  },
];

function formatMoney(amount?: PaypalApi.MoneyAmount) {
  if (!amount?.value) {
    return '—';
  }
  const currency = amount.currency_code?.trim();
  return currency ? `${amount.value} ${currency}` : amount.value;
}

function formatBoolean(value: boolean | undefined) {
  if (value === undefined) {
    return '—';
  }
  return value ? '是' : '否';
}

function formatJson(value: unknown) {
  if (value === undefined || value === null) {
    return '—';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const refundsJson = computed(() => formatJson(props.data?.refunds));
</script>

<template>
  <Modal
    v-model:open="modalOpen"
    :footer="null"
    title="PayPal 订单详情"
    width="960px"
  >
    <Spin :spinning="loading">
      <template v-if="data">
        <Descriptions bordered :column="2" size="small" title="订单信息">
          <DescriptionsItem label="PayPal 订单号">
            {{ data.id ?? paypalOrderId ?? '—' }}
          </DescriptionsItem>
          <DescriptionsItem label="状态">
            {{ getTxnStatusLabel(data.status) }}
          </DescriptionsItem>
          <DescriptionsItem label="Intent">
            {{ data.intent ?? '—' }}
          </DescriptionsItem>
          <DescriptionsItem label="金额">
            {{
              data.amount
                ? data.currency
                  ? `${data.amount} ${data.currency}`
                  : data.amount
                : '—'
            }}
          </DescriptionsItem>
          <DescriptionsItem label="创建时间">
            {{ data.createTime ?? '—' }}
          </DescriptionsItem>
          <DescriptionsItem label="更新时间">
            {{ data.updateTime ?? '—' }}
          </DescriptionsItem>
        </Descriptions>

        <div class="mt-4 text-sm font-medium text-foreground">Captures</div>
        <Table
          v-if="data.captures?.length"
          class="mt-2"
          :columns="captureColumns"
          :data-source="data.captures"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 900 }"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              {{ getTxnStatusLabel(record.status) }}
            </template>
            <template v-else-if="column.key === 'amount'">
              {{ formatMoney(record.amount) }}
            </template>
            <template v-else-if="column.key === 'final_capture'">
              {{ formatBoolean(record.final_capture) }}
            </template>
          </template>
        </Table>
        <div v-else class="mt-2 text-muted-foreground">—</div>

        <Collapse v-if="data.captures?.length" class="mt-4">
          <CollapsePanel
            v-for="(capture, index) in data.captures"
            :key="capture.id ?? index"
            :header="`Capture 明细 ${capture.id ?? index + 1}`"
          >
            <Descriptions bordered :column="1" size="small">
              <DescriptionsItem label="Seller Protection 状态">
                {{ capture.seller_protection?.status ?? '—' }}
              </DescriptionsItem>
              <DescriptionsItem label="争议类别">
                {{
                  capture.seller_protection?.dispute_categories?.join('、') ??
                  '—'
                }}
              </DescriptionsItem>
              <DescriptionsItem label="Gross Amount">
                {{
                  formatMoney(capture.seller_receivable_breakdown?.gross_amount)
                }}
              </DescriptionsItem>
              <DescriptionsItem label="PayPal Fee">
                {{
                  formatMoney(capture.seller_receivable_breakdown?.paypal_fee)
                }}
              </DescriptionsItem>
              <DescriptionsItem label="Net Amount">
                {{
                  formatMoney(capture.seller_receivable_breakdown?.net_amount)
                }}
              </DescriptionsItem>
            </Descriptions>
          </CollapsePanel>
        </Collapse>

        <div class="mt-4 text-sm font-medium text-foreground">Refunds</div>
        <pre
          v-if="data.refunds"
          class="mt-2 max-h-60 overflow-auto rounded border border-border bg-muted/30 p-3 text-xs"
          >{{ refundsJson }}</pre>
        <div v-else class="mt-2 text-muted-foreground">—</div>
      </template>
      <div v-else-if="!loading" class="py-8 text-center text-muted-foreground">
        暂无详情数据
      </div>
    </Spin>
  </Modal>
</template>
