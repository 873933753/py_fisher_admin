<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Spin } from 'ant-design-vue';

import { useOrderDetail } from '../composables/useOrderDetail';
import OrderDetailHeader from './components/OrderDetailHeader.vue';
import OrderDetailItemList from './components/OrderDetailItemList.vue';
import OrderDetailPostageCard from './components/OrderDetailPostageCard.vue';
import OrderDetailRefundSection from './components/OrderDetailRefundSection.vue';
import OrderDetailSidebarContact from './components/OrderDetailSidebarContact.vue';
import OrderDetailSidebarOrderInfo from './components/OrderDetailSidebarOrderInfo.vue';
import OrderDetailSidebarPayment from './components/OrderDetailSidebarPayment.vue';
import OrderDetailStatusPanel from './components/OrderDetailStatusPanel.vue';

defineOptions({ name: 'MallOrderDetail' });

const {
  pageLoading,
  orderInfo,
  postageInfo,
  logisticsInfo,
  paymentInfo,
  itemList,
  currency,
  totalQuantity,
  showTimeline,
  statusTitle,
  statusSubtitle,
  timelineItems,
  resolvedCreateTime,
  buyerContact,
  showRefundDetails,
  refundDetailsLoading,
  refundDetails,
  reasonTypeMap,
  goBack,
} = useOrderDetail();

const orderInfoWithCreateTime = computed(() => {
  if (!orderInfo.value) {
    return undefined;
  }
  if (orderInfo.value.createTime?.trim() || !resolvedCreateTime.value) {
    return orderInfo.value;
  }
  return {
    ...orderInfo.value,
    createTime: resolvedCreateTime.value,
  };
});
</script>

<template>
  <Page title="订单详情">
    <template #extra>
      <Button @click="goBack">返回列表</Button>
    </template>

    <Spin :spinning="pageLoading">
      <div v-if="!pageLoading" class="flex flex-col gap-4 pb-6">
        <div
          class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]"
        >
          <div class="flex min-w-0 flex-col gap-4">
            <OrderDetailHeader
              :items="itemList"
              :total-quantity="totalQuantity"
            />
            <OrderDetailStatusPanel
              :status-title="statusTitle"
              :status-subtitle="statusSubtitle"
              :show-timeline="showTimeline"
              :timeline-items="timelineItems"
            />
            <OrderDetailPostageCard
              :postage-info="postageInfo"
              :logistics-info="logisticsInfo"
            />
            <OrderDetailItemList :items="itemList" :currency="currency" />
            <OrderDetailRefundSection
              v-if="showRefundDetails"
              :loading="refundDetailsLoading"
              :data="refundDetails"
              :currency="currency"
              :reason-type-map="reasonTypeMap"
            />
          </div>

          <aside class="flex min-w-0 flex-col gap-4">
            <OrderDetailSidebarOrderInfo
              :order-info="orderInfoWithCreateTime"
              :total-quantity="totalQuantity"
            />
            <OrderDetailSidebarContact
              :email="buyerContact.email"
              :phone="buyerContact.phone"
            />
            <OrderDetailSidebarPayment
              :payment-info="paymentInfo"
              :currency="currency"
            />
          </aside>
        </div>
      </div>
    </Spin>
  </Page>
</template>
