<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { AdminShopOrderApi } from '#/api/core/admin-shop-orders';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Descriptions, DescriptionsItem, Spin, Table, Tag } from 'ant-design-vue';

import ShopProductCoverCell from '#/views/shop/products/components/ShopProductCoverCell.vue';
import {
  formatEmptyText,
  formatPriceYuan,
} from '#/views/shop/products/utils/price';

import {
  getShopOrderStatusLabel,
  getShopOrderStatusTagColor,
} from '../constants';
import { useShopOrderDetail } from '../composables/useShopOrderDetail';

defineOptions({ name: 'ShopOrderDetail' });

const { detail, goBack, pageLoading } = useShopOrderDetail();

const itemColumns: TableColumnsType<AdminShopOrderApi.OrderItem> = [
  {
    title: '商品 ID',
    dataIndex: 'product_id',
    key: 'product_id',
    width: 90,
    align: 'center',
  },
  {
    title: '主图',
    dataIndex: 'product_cover',
    key: 'product_cover',
    width: 80,
    align: 'center',
  },
  {
    title: '商品名称',
    dataIndex: 'product_name',
    key: 'product_name',
    ellipsis: true,
    align: 'center',
  },
  {
    title: '单价',
    dataIndex: 'price',
    key: 'price',
    width: 120,
    align: 'center',
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 90,
    align: 'center',
  },
  {
    title: '小计',
    dataIndex: 'line_amount',
    key: 'line_amount',
    width: 120,
    align: 'center',
  },
];

const itemList = computed(() => detail.value?.items ?? []);
</script>

<template>
  <Page title="订单详情">
    <template #extra>
      <Button @click="goBack">返回列表</Button>
    </template>

    <Spin :spinning="pageLoading">
      <div v-if="detail" class="flex flex-col gap-4 pb-6">
        <Descriptions bordered :column="2" size="small" title="订单信息">
          <DescriptionsItem label="订单 ID">
            {{ detail.id }}
          </DescriptionsItem>
          <DescriptionsItem label="订单号">
            {{ detail.order_no }}
          </DescriptionsItem>
          <DescriptionsItem label="交易单号">
            {{ formatEmptyText(detail.out_trade_no) }}
          </DescriptionsItem>
          <DescriptionsItem label="用户 ID">
            {{ detail.user_id }}
          </DescriptionsItem>
          <DescriptionsItem label="状态">
            <Tag :color="getShopOrderStatusTagColor(detail.status)">
              {{ getShopOrderStatusLabel(detail.status) }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="总金额">
            {{ formatPriceYuan(detail.total_amount) }}
          </DescriptionsItem>
          <DescriptionsItem label="支付金额">
            {{ formatPriceYuan(detail.paid_amount) }}
          </DescriptionsItem>
          <DescriptionsItem label="支付时间">
            {{ formatEmptyText(detail.paid_at) }}
          </DescriptionsItem>
          <DescriptionsItem label="下单时间">
            {{ detail.create_time }}
          </DescriptionsItem>
          <DescriptionsItem label="支付截止时间">
            {{ detail.expire_at }}
          </DescriptionsItem>
        </Descriptions>

        <div class="rounded-lg border border-border bg-card p-4">
          <div class="mb-3 text-base font-medium text-foreground">商品明细</div>
          <Table
            :columns="itemColumns"
            :data-source="itemList"
            :pagination="false"
            row-key="product_id"
            :scroll="{ x: 900 }"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'product_cover'">
                <ShopProductCoverCell :src="record.product_cover" />
              </template>
              <template v-else-if="column.key === 'price'">
                {{ formatPriceYuan(record.price) }}
              </template>
              <template v-else-if="column.key === 'line_amount'">
                {{ formatPriceYuan(record.line_amount) }}
              </template>
            </template>
          </Table>
        </div>
      </div>
    </Spin>
  </Page>
</template>
