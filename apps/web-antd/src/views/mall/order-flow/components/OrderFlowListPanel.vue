<script lang="ts" setup>
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import type { OrderApi } from '#/api/core/order';

import { computed } from 'vue';

import { Button, Image, Input, RangePicker, Table } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  MallListFilterField,
  MallListPage,
  MallListSearchCard,
  MallListTableCard,
} from '#/components/mall-list';
import {
  formatMoneyAmount,
  formatSpecData,
} from '#/views/mall/order/constants';

import { getOrderFlowBuyerName, getOrderFlowItemQuantity } from '../constants';

const props = defineProps<{
  dataSource: OrderApi.OrderFlowRecord[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  summary: OrderApi.OrderFlowSummary;
}>();

const emit = defineEmits<{
  reset: [];
  search: [];
  tableChange: [page: number, pageSize: number];
}>();

const startDate = defineModel<string>('startDate', { required: true });
const endDate = defineModel<string>('endDate', { required: true });
const orderNo = defineModel<string>('orderNo', { default: '' });
const productName = defineModel<string>('productName', { default: '' });

const columns: TableColumnsType<OrderApi.OrderFlowRecord> = [
  {
    title: '支付时间',
    dataIndex: 'payTime',
    key: 'payTime',
    width: 170,
    align: 'center',
  },
  {
    title: '订单状态',
    dataIndex: 'orderStatusName',
    key: 'orderStatusName',
    width: 110,
    align: 'center',
  },
  {
    title: '商品总价',
    key: 'totalProductAmount',
    width: 120,
    align: 'center',
  },
  {
    title: '优惠金额',
    key: 'totalDiscountAmount',
    width: 120,
    align: 'center',
  },
  {
    title: '实付金额',
    key: 'orderFinalPayAmount',
    width: 120,
    align: 'center',
  },
  {
    title: '退款金额',
    key: 'orderRefundedAmount',
    width: 120,
    align: 'center',
  },
  {
    title: '净收入',
    key: 'orderNetIncome',
    width: 120,
    align: 'center',
  },
  {
    title: '订单编号',
    dataIndex: 'orderNo',
    key: 'orderNo',
    width: 200,
    ellipsis: true,
    align: 'center',
  },
  { title: '操作', key: 'action', width: 110, fixed: 'right', align: 'center' },
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

function formatRecordAmount(
  amount: null | number | string | undefined,
  currency?: string,
) {
  return formatMoneyAmount(amount, currency);
}
</script>

<template>
  <MallListPage>
    <div class="flex flex-col gap-4">
      <MallListSearchCard>
        <template #filters>
          <MallListFilterField label="日期范围：">
            <RangePicker
              v-model:value="dateRange"
              allow-clear
              class="min-w-0 flex-1"
              format="YYYY-MM-DD"
            />
          </MallListFilterField>
          <MallListFilterField label="订单号：">
            <Input
              v-model:value="orderNo"
              allow-clear
              class="min-w-0 flex-1"
              placeholder="请输入订单号"
              @press-enter="emit('search')"
            />
          </MallListFilterField>
          <MallListFilterField label="商品名称：">
            <Input
              v-model:value="productName"
              allow-clear
              class="min-w-0 flex-1"
              placeholder="请输入商品名称"
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
          <div class="text-base font-medium text-foreground">订单流水列表</div>
        </template>

        <div
          class="mb-4 flex flex-wrap items-center gap-x-8 gap-y-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
        >
          <span>
            总收入：
            <span class="font-semibold text-foreground">
              {{ formatRecordAmount(summary.totalIncome) }}
            </span>
          </span>
          <span>
            总退款：
            <span class="font-semibold text-foreground">
              {{ formatRecordAmount(summary.totalRefunded) }}
            </span>
          </span>
          <span>
            总净收入：
            <span class="font-semibold text-foreground">
              {{ formatRecordAmount(summary.totalNet) }}
            </span>
          </span>
        </div>

        <Table
          :columns="columns"
          :data-source="dataSource"
          :loading="loading"
          :pagination="tablePagination"
          row-key="orderId"
          :scroll="{ x: 1400 }"
          size="middle"
        >
          <template #expandedRowRender="{ record }">
            <div
              class="rounded-lg border border-border/60 bg-muted/20 px-4 py-4"
            >
              <div class="mb-3 text-sm text-muted-foreground">
                买家：{{ getOrderFlowBuyerName(record.orderItemList) }} · 共
                {{ getOrderFlowItemQuantity(record.orderItemList) }} 件商品
              </div>

              <div
                v-if="record.orderItemList?.length"
                class="overflow-x-auto rounded border border-border bg-background"
              >
                <table class="w-full min-w-[640px] text-sm">
                  <thead class="border-b border-border bg-muted/40">
                    <tr>
                      <th
                        class="px-3 py-2 text-left font-medium text-foreground"
                      >
                        商品
                      </th>
                      <th
                        class="w-20 px-3 py-2 text-center font-medium text-foreground"
                      >
                        数量
                      </th>
                      <th
                        class="w-28 px-3 py-2 text-center font-medium text-foreground"
                      >
                        单价
                      </th>
                      <th
                        class="w-28 px-3 py-2 text-center font-medium text-foreground"
                      >
                        小计
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in record.orderItemList"
                      :key="item.myOrderItemId"
                      class="border-b border-border/60 last:border-b-0"
                    >
                      <td class="px-3 py-3">
                        <div class="flex min-w-0 items-start gap-3">
                          <div
                            class="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-border bg-muted"
                          >
                            <Image
                              v-if="item.skuImage"
                              :src="item.skuImage"
                              :width="48"
                              :height="48"
                              class="!h-12 !w-12 object-cover"
                              :preview="true"
                            />
                            <div
                              v-else
                              class="flex h-full w-full items-center justify-center text-xs text-muted-foreground"
                            >
                              无图
                            </div>
                          </div>
                          <div class="min-w-0 flex-1">
                            <div
                              class="truncate font-medium text-foreground"
                              :title="item.productName?.trim() || undefined"
                            >
                              {{ item.productName?.trim() || '—' }}
                            </div>
                            <div
                              v-if="formatSpecData(item.specData)"
                              class="mt-0.5 text-xs text-muted-foreground"
                            >
                              {{ formatSpecData(item.specData) }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-3 py-3 text-center tabular-nums">
                        {{ item.quantity ?? 0 }}
                      </td>
                      <td class="px-3 py-3 text-center tabular-nums">
                        {{
                          formatRecordAmount(item.productPrice, record.currency)
                        }}
                      </td>
                      <td class="px-3 py-3 text-center tabular-nums">
                        {{
                          formatRecordAmount(
                            item.subtotalAmount,
                            record.currency,
                          )
                        }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-sm text-muted-foreground">
                暂无商品明细
              </div>
            </div>
          </template>

          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'totalProductAmount'">
              {{
                formatRecordAmount(record.totalProductAmount, record.currency)
              }}
            </template>
            <template v-else-if="column.key === 'totalDiscountAmount'">
              {{
                formatRecordAmount(record.totalDiscountAmount, record.currency)
              }}
            </template>
            <template v-else-if="column.key === 'orderFinalPayAmount'">
              {{
                formatRecordAmount(record.orderFinalPayAmount, record.currency)
              }}
            </template>
            <template v-else-if="column.key === 'orderRefundedAmount'">
              {{
                formatRecordAmount(record.orderRefundedAmount, record.currency)
              }}
            </template>
            <template v-else-if="column.key === 'orderNetIncome'">
              {{ formatRecordAmount(record.orderNetIncome, record.currency) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <Button size="small" type="link">查看详情</Button>
            </template>
          </template>
        </Table>
      </MallListTableCard>
    </div>
  </MallListPage>
</template>
