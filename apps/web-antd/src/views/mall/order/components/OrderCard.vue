<script lang="ts" setup>
import type { OrderApi } from '#/api/core/order';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import { Badge, Button, Image, message } from 'ant-design-vue';

import {
  MALL_ORDER_LIST_ROUTE_NAME,
  markListRestore,
} from '#/composables/useMallListRestore';

import {
  canCloseOrder,
  canEditOrderLogistics,
  canManualRefund,
  canSubmitOrderReviewAction,
  canUploadLogistics,
  formatMoneyAmount,
  formatShippingFeeLabel,
  formatSpecData,
  getOrderDisplayTime,
  getOrderListLogisticsName,
  getOrderListLogisticsTrackingNo,
  getOrderListPostcode,
  getOrderPlacedTime,
  getOrderTotalQuantity,
  hasOrderListLogistics,
  hasOrderRemark,
  hasUnreadBuyerMail,
  normalizeOrderRatingResult,
  shouldShowOrderRatingBadge,
  SHOW_ORDER_ITEM_BULK_DISCOUNT,
} from '../constants';
import OrderItemRatingBadge from './OrderItemRatingBadge.vue';

const props = defineProps<{
  order: OrderApi.OrderRecord;
}>();

const emit = defineEmits<{
  closeOrder: [order: OrderApi.OrderRecord];
  contactBuyer: [order: OrderApi.OrderRecord];
  deleteSellerRemark: [order: OrderApi.OrderRecord];
  editLogistics: [order: OrderApi.OrderRecord];
  editSellerRemark: [order: OrderApi.OrderRecord];
  executeRefund: [order: OrderApi.OrderRecord];
  manualRefund: [order: OrderApi.OrderRecord];
  submitOrderReview: [order: OrderApi.OrderRecord];
  uploadLogistics: [order: OrderApi.OrderRecord];
  viewOrderReview: [order: OrderApi.OrderRecord];
}>();

const router = useRouter();

const showCloseOrder = computed(() => canCloseOrder(props.order));
const showManualRefund = computed(() => canManualRefund(props.order));
const showRefundApproval = computed(() => props.order.orderStatus === 6);
const showUploadLogistics = computed(() => canUploadLogistics(props.order));
const showUnreadBuyerMail = computed(() => hasUnreadBuyerMail(props.order));
const showSecondaryActions = computed(
  () =>
    showCloseOrder.value ||
    showUploadLogistics.value ||
    showManualRefund.value ||
    showRefundApproval.value,
);

function goOrderDetail() {
  const id = props.order.orderId;
  if (!id) {
    message.warning('订单 ID 不存在');
    return;
  }
  const query: Record<string, string> = {};
  if (
    props.order.orderStatus !== undefined &&
    props.order.orderStatus !== null
  ) {
    query.orderStatus = String(props.order.orderStatus);
  }
  if (props.order.orderStatusName?.trim()) {
    query.orderStatusName = props.order.orderStatusName.trim();
  }
  if (props.order.currency?.trim()) {
    query.currency = props.order.currency.trim();
  }
  const placedTime = getOrderPlacedTime(props.order);
  if (placedTime) {
    query.createTime = placedTime;
  }
  const applyId = props.order.orderRefundApplyId;
  if (
    applyId !== undefined &&
    applyId !== null &&
    String(applyId).trim() !== ''
  ) {
    query.orderRefundApplyId = String(applyId);
  }
  markListRestore(MALL_ORDER_LIST_ROUTE_NAME, {
    mode: 'keep',
    refresh: false,
  });
  router.push({
    name: 'MallOrderDetail',
    params: { id },
    query,
  });
}

function handleCloseOrder() {
  emit('closeOrder', props.order);
}

function handleExecuteRefund() {
  emit('executeRefund', props.order);
}

function handleManualRefund() {
  emit('manualRefund', props.order);
}

function handleUploadLogistics() {
  emit('uploadLogistics', props.order);
}

function handleEditSellerRemark() {
  emit('editSellerRemark', props.order);
}

function handleDeleteSellerRemark() {
  emit('deleteSellerRemark', props.order);
}

function handleSubmitOrderReview() {
  emit('submitOrderReview', props.order);
}

function handleViewOrderReview() {
  emit('viewOrderReview', props.order);
}

function handleEditLogistics() {
  emit('editLogistics', props.order);
}

function handleContactBuyer() {
  emit('contactBuyer', props.order);
}
</script>

<template>
  <article class="rounded-lg border border-border bg-background shadow-sm">
    <div
      v-if="hasOrderRemark(order.buyerRemark)"
      class="rounded-t-lg border-b border-[#ffd591] bg-[#fff7e6] px-4 py-2.5 text-sm text-foreground"
    >
      <span class="font-medium">客户备注：</span>
      <span class="break-words">{{ order.buyerRemark }}</span>
    </div>

    <header
      class="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-muted/40 px-4 py-2.5 text-sm"
    >
      <span class="inline-flex items-center">
        <span class="text-muted-foreground">订单 ID：</span>
        <span
          v-if="order.orderId"
          role="link"
          tabindex="0"
          class="order-id-link"
          @click="goOrderDetail"
          @keydown.enter="goOrderDetail"
        >
          {{ order.orderId }}
        </span>
        <span v-else class="text-foreground">—</span>
      </span>
      <!-- <span class="text-foreground">
        <span class="text-muted-foreground">订单编号：</span>
        {{ order.orderNo || '—' }}
      </span> -->
      <span v-if="order.buyer" class="text-foreground">
        <span class="text-muted-foreground">买家：</span>
        {{ order.buyer }}
      </span>
      <span v-if="order.nickName" class="text-foreground">
        <span class="text-muted-foreground">昵称：</span>
        {{ order.nickName }}
      </span>
      <span v-if="getOrderListPostcode(order)" class="text-foreground">
        <span class="text-muted-foreground">邮编：</span>
        {{ getOrderListPostcode(order) }}
      </span>
      <span
        v-if="getOrderTotalQuantity(order) !== undefined"
        class="text-muted-foreground"
      >
        共 {{ getOrderTotalQuantity(order) }} 件
      </span>
      <OrderItemRatingBadge
        v-if="shouldShowOrderRatingBadge(order)"
        :clickable="canSubmitOrderReviewAction(order)"
        :rating-result="order.ratingResult"
        :viewable="normalizeOrderRatingResult(order.ratingResult) !== 0"
        @submit="handleSubmitOrderReview"
        @view="handleViewOrderReview"
      />
      <span class="ml-auto text-muted-foreground">
        下单时间：{{ getOrderDisplayTime(order) }}
      </span>
    </header>

    <div
      class="grid grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.4fr)_minmax(0,1fr)_minmax(0,0.9fr)_21rem]"
    >
      <section class="min-w-0">
        <!-- <div class="mb-2 text-xs font-medium text-muted-foreground">
          商品信息
        </div> -->
        <ul v-if="order.myOrderItemList?.length" class="flex flex-col gap-3">
          <li
            v-for="item in order.myOrderItemList"
            :key="item.id"
            class="flex gap-3 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
          >
            <div
              class="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-border bg-muted"
            >
              <Image
                v-if="item.skuImage"
                :src="item.skuImage"
                :width="64"
                :height="64"
                class="!h-16 !w-16 object-cover"
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
                class="flex w-full min-w-0 items-baseline gap-3 text-sm leading-snug"
              >
                <span
                  class="min-w-0 flex-1 truncate font-medium text-foreground"
                  :title="item.productName?.trim() || undefined"
                >
                  {{ item.productName?.trim() || '—' }}
                </span>
                <span
                  class="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-foreground"
                >
                  × {{ item.quantity ?? 0 }}
                </span>
              </div>
              <div
                v-if="formatSpecData(item.specData)"
                class="mt-0.5 text-xs text-muted-foreground"
              >
                {{ formatSpecData(item.specData) }}
              </div>
              <!-- <div
                v-if="item.skuId"
                class="mt-0.5 text-xs text-muted-foreground"
              >
                SKU：{{ item.skuId }}
              </div> -->
              <div
                v-if="item.productId"
                class="mt-0.5 text-xs text-muted-foreground"
              >
                商品 ID：{{ item.productId }}
              </div>
              <!-- <div
                v-if="
                  (item.productPrice !== undefined &&
                    item.productPrice !== null) ||
                  (item.subtotalAmount !== undefined &&
                    item.subtotalAmount !== null)
                "
                class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
              >
                <span
                  v-if="
                    item.productPrice !== undefined &&
                    item.productPrice !== null
                  "
                >
                  单价
                  {{ formatMoneyAmount(item.productPrice, order.currency) }}
                </span>
                <span
                  v-if="
                    item.subtotalAmount !== undefined &&
                    item.subtotalAmount !== null
                  "
                >
                  小计
                  {{ formatMoneyAmount(item.subtotalAmount, order.currency) }}
                </span>
              </div> -->
              <div
                v-if="
                  SHOW_ORDER_ITEM_BULK_DISCOUNT && item.bulkDiscount?.trim()
                "
                class="mt-0.5 text-xs text-green-600"
              >
                {{ item.bulkDiscount }}
              </div>
              <div
                v-if="item.remark?.trim()"
                class="mt-0.5 text-xs text-muted-foreground"
              >
                明细备注：{{ item.remark }}
              </div>
            </div>
          </li>
        </ul>
        <div v-else class="text-sm text-muted-foreground">暂无商品明细</div>
      </section>

      <section class="min-w-0 lg:border-l lg:border-border/60 lg:pl-4">
        <!-- <div class="mb-2 text-xs font-medium text-muted-foreground">
          订单状态
        </div> -->
        <div class="text-sm font-semibold text-foreground text-center">
          {{ order.orderStatusName || '—' }}
        </div>
      </section>

      <section class="min-w-0 lg:border-l lg:border-border/60 lg:pl-4">
        <div class="mb-2 text-xs font-medium text-muted-foreground">物流</div>
        <div
          v-if="hasOrderListLogistics(order)"
          class="space-y-0.5 text-sm font-medium"
        >
          <div v-if="getOrderListLogisticsName(order)">
            <span class="text-foreground">物流公司：</span>
            <span class="text-foreground">{{
              getOrderListLogisticsName(order)
            }}</span>
          </div>
          <div
            v-if="getOrderListLogisticsTrackingNo(order)"
            class="flex flex-wrap items-center gap-1"
          >
            <span class="text-foreground">跟踪号：</span>
            <button
              v-if="canEditOrderLogistics(order)"
              type="button"
              class="order-logistics-tracking-link text-foreground"
              @click="handleEditLogistics"
            >
              {{ getOrderListLogisticsTrackingNo(order) }}
            </button>
            <span v-else class="text-foreground">{{
              getOrderListLogisticsTrackingNo(order)
            }}</span>
            <button
              v-if="canEditOrderLogistics(order)"
              type="button"
              class="order-logistics-edit-action"
              title="编辑物流信息"
              @click="handleEditLogistics"
            >
              <IconifyIcon class="size-[18px]" icon="mdi:pencil-outline" />
            </button>
          </div>
        </div>
        <span v-else class="text-sm text-muted-foreground">—</span>
      </section>

      <section class="min-w-0 lg:border-l lg:border-border/60 lg:pl-4">
        <div class="mb-2 text-xs font-medium text-muted-foreground">金额</div>
        <div class="text-base font-semibold text-foreground">
          {{ formatMoneyAmount(order.total, order.currency) }}
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          商品：{{ formatMoneyAmount(order.subtotal, order.currency) }}
        </div>
        <div class="mt-0.5 text-xs text-muted-foreground">
          邮费：{{ formatShippingFeeLabel(order.shippingFee, order.currency) }}
        </div>
      </section>

      <section
        class="relative z-10 flex min-w-[21rem] flex-col justify-center gap-2 overflow-visible lg:border-l lg:border-border/60 lg:pl-4"
      >
        <div class="grid grid-cols-3 gap-2">
          <Button class="order-action-btn" @click="goOrderDetail">详情</Button>
          <Badge :dot="showUnreadBuyerMail" class="contact-buyer-badge">
            <Button class="order-action-btn" @click="handleContactBuyer">
              联系买家
            </Button>
          </Badge>
          <Button class="order-action-btn" @click="handleEditSellerRemark">
            商家备注
          </Button>
        </div>
        <div v-if="showSecondaryActions" class="grid grid-cols-3 gap-2">
          <Button
            v-if="showCloseOrder"
            class="order-action-btn"
            danger
            @click="handleCloseOrder"
          >
            关闭订单
          </Button>
          <Button
            v-if="showUploadLogistics"
            class="order-action-btn"
            type="primary"
            @click="handleUploadLogistics"
          >
            上传跟踪号
          </Button>
          <Button
            v-if="showManualRefund"
            class="order-action-btn"
            danger
            type="primary"
            @click="handleManualRefund"
          >
            手动退款
          </Button>
          <Button
            v-if="showRefundApproval"
            class="order-action-btn"
            danger
            type="primary"
            @click="handleExecuteRefund"
          >
            退款审批
          </Button>
        </div>
      </section>
    </div>

    <footer
      v-if="hasOrderRemark(order.sellerRemark)"
      class="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-b-lg border-t border-[#ffd591] bg-[#fff7e6] px-4 py-2.5 text-sm text-foreground"
    >
      <span class="shrink-0 font-medium">商家备注：</span>
      <span class="break-words">{{ order.sellerRemark }}</span>
      <span class="inline-flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          class="order-remark-action"
          title="编辑商家备注"
          @click="handleEditSellerRemark"
        >
          <IconifyIcon class="size-[18px] ml-4" icon="mdi:pencil-outline" />
        </button>
        <button
          type="button"
          class="order-remark-action"
          title="删除商家备注"
          @click="handleDeleteSellerRemark"
        >
          <IconifyIcon class="size-[18px]" icon="mdi:delete-outline" />
        </button>
      </span>
    </footer>
  </article>
</template>

<style scoped>
.order-remark-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  color: rgb(0 0 0 / 88%);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.order-remark-action:hover {
  background: rgb(0 0 0 / 8%);
}

.order-id-link {
  color: hsl(var(--primary));
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.order-id-link:hover {
  opacity: 0.85;
}

.order-logistics-tracking-link {
  padding: 0;
  font: inherit;
  font-size: inherit;
  line-height: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  background: transparent;
  border: none;
  transition: color 0.2s;
}

.order-logistics-tracking-link:hover {
  color: hsl(var(--primary));
}

.order-logistics-edit-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: rgb(0 0 0 / 88%);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
}

.order-logistics-edit-action:hover {
  opacity: 0.75;
}

.order-action-btn {
  width: 100%;
  min-width: 0;
  padding-inline: 8px;
  white-space: nowrap;
}

.order-action-btn :deep(span) {
  overflow: visible;
}

.contact-buyer-badge {
  display: block;
  width: 100%;
  min-width: 0;
}

.contact-buyer-badge :deep(.ant-badge) {
  width: 100%;
}

.contact-buyer-badge :deep(.ant-btn) {
  width: 100%;
}
</style>
