<script lang="ts" setup>
import type { OrderRefundApplyApi } from '#/api/core/orderRefundApply';

import { computed } from 'vue';

import { Image, Spin } from 'ant-design-vue';

import { isVideoReviewFile } from '#/views/mall/product-review/constants';

import {
  formatMoneyAmount,
  formatRefundTypeLabel,
  formatSpecData,
} from '../../constants';

const props = defineProps<{
  currency?: string;
  data: null | OrderRefundApplyApi.RefundDetailsResult;
  loading: boolean;
  reasonTypeMap: OrderRefundApplyApi.ReasonTypeMap;
}>();

const REVIEW_STATUS_LABELS: Record<number, string> = {
  0: '待审核',
  1: '审核通过',
  2: '审核拒绝',
  3: '客户取消',
};

const REFUND_STATUS_LABELS: Record<number, string> = {
  0: '待处理',
  1: '处理中',
  2: '已完成',
  3: '失败',
};

const orderRefundApply = computed(() => props.data?.orderRefundApply ?? null);

const refundDetailsList = computed(() => props.data?.refundDetailsList ?? []);

const myOrderRefund = computed(() => props.data?.myOrderRefund ?? null);

const hasContent = computed(
  () => Boolean(orderRefundApply.value) && !props.loading,
);

function normalizeMediaList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function getReasonTypeLabel(reasonType?: string): string {
  const key = reasonType?.trim();
  if (!key) {
    return '—';
  }
  return props.reasonTypeMap[key] || key;
}

function formatReviewStatusLabel(status?: number): string {
  if (status === undefined || status === null) {
    return '—';
  }
  return REVIEW_STATUS_LABELS[status] ?? String(status);
}

function formatRefundStatusLabel(status?: number): string {
  if (status === undefined || status === null) {
    return '—';
  }
  return REFUND_STATUS_LABELS[status] ?? String(status);
}
</script>

<template>
  <section
    class="rounded-lg border border-border bg-background px-4 py-4 shadow-sm"
  >
    <h3 class="mb-4 text-base font-semibold text-foreground">退货详情</h3>

    <Spin :spinning="loading">
      <template v-if="hasContent && orderRefundApply">
        <div class="flex flex-col gap-4">
          <section class="rounded-lg border border-border/60 p-4">
            <div class="mb-3 text-sm font-medium text-foreground">
              买家申请信息
            </div>
            <dl class="grid grid-cols-1 gap-2 text-sm">
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">申请时间</dt>
                <dd>{{ orderRefundApply.createTime || '—' }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">退款原因</dt>
                <dd>{{ getReasonTypeLabel(orderRefundApply.reasonType) }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">买家备注</dt>
                <dd class="whitespace-pre-wrap break-words">
                  {{ orderRefundApply.description?.trim() || '—' }}
                </dd>
              </div>
            </dl>

            <div
              v-if="normalizeMediaList(orderRefundApply.proofPics).length > 0"
              class="mt-3"
            >
              <div class="mb-2 text-sm text-muted-foreground">买家凭证</div>
              <div class="flex flex-wrap gap-2">
                <template
                  v-for="(fileUrl, index) in normalizeMediaList(
                    orderRefundApply.proofPics,
                  )"
                  :key="`proof-${index}`"
                >
                  <video
                    v-if="isVideoReviewFile(fileUrl)"
                    class="h-20 w-20 shrink-0 rounded object-cover"
                    controls
                    preload="metadata"
                    :src="fileUrl"
                  ></video>
                  <div
                    v-else
                    class="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-border bg-muted"
                  >
                    <Image
                      :height="80"
                      :preview="{ src: fileUrl }"
                      :src="fileUrl"
                      :width="80"
                      class="!h-20 !w-20 object-cover"
                    />
                  </div>
                </template>
              </div>
            </div>
          </section>

          <section
            v-if="refundDetailsList.length > 0"
            class="rounded-lg border border-border/60 p-4"
          >
            <div class="mb-3 text-sm font-medium text-foreground">退货明细</div>
            <div class="flex flex-col gap-3">
              <div
                v-for="(item, index) in refundDetailsList"
                :key="item.orderRefundItemId || item.myOrderItemId || index"
                class="flex gap-3 rounded-md bg-muted/30 p-3"
              >
                <div
                  v-if="item.skuImage"
                  class="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-border bg-muted"
                >
                  <Image
                    :height="64"
                    :preview="{ src: item.skuImage }"
                    :src="item.skuImage"
                    :width="64"
                    class="!h-16 !w-16 object-cover"
                  />
                </div>
                <div class="min-w-0 flex-1 text-sm">
                  <div class="font-medium text-foreground">
                    {{ item.productName || '—' }}
                  </div>
                  <div
                    v-if="formatSpecData(item.specData ?? null)"
                    class="mt-0.5 text-muted-foreground"
                  >
                    {{ formatSpecData(item.specData ?? null) }}
                  </div>
                  <div class="mt-1 text-muted-foreground">
                    数量 {{ item.quantity ?? '—' }} · 单价
                    {{ formatMoneyAmount(item.productPrice, currency) }} · 小计
                    {{ formatMoneyAmount(item.subtotalAmount, currency) }}
                  </div>
                  <!-- <div
                    v-if="item.returnDesc?.trim()"
                    class="mt-1 text-xs text-muted-foreground"
                  >
                    {{ item.returnDesc }}
                  </div> -->
                </div>
              </div>
            </div>
          </section>

          <section
            v-if="myOrderRefund"
            class="rounded-lg border border-border/60 p-4"
          >
            <div class="mb-3 text-sm font-medium text-foreground">退款记录</div>
            <dl class="grid grid-cols-1 gap-2 text-sm">
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">退款单号</dt>
                <dd>{{ myOrderRefund.refundNo || '—' }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">退款金额</dt>
                <dd>
                  {{ formatMoneyAmount(myOrderRefund.refundAmount, currency) }}
                </dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">退款类型</dt>
                <dd>{{ formatRefundTypeLabel(myOrderRefund.refundType) }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">退款状态</dt>
                <dd>
                  {{ formatRefundStatusLabel(myOrderRefund.refundStatus) }}
                </dd>
              </div>
              <div v-if="myOrderRefund.payMethod?.trim()" class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">支付方式</dt>
                <dd>{{ myOrderRefund.payMethod }}</dd>
              </div>
              <div v-if="myOrderRefund.outRefundNo?.trim()" class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">第三方退款号</dt>
                <dd>{{ myOrderRefund.outRefundNo }}</dd>
              </div>
              <div v-if="myOrderRefund.failReason?.trim()" class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">失败原因</dt>
                <dd class="break-words">{{ myOrderRefund.failReason }}</dd>
              </div>
            </dl>
          </section>

          <section class="rounded-lg border border-border/60 p-4">
            <div class="mb-3 text-sm font-medium text-foreground">
              商家处理信息
            </div>
            <dl class="grid grid-cols-1 gap-2 text-sm">
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">审核状态</dt>
                <dd>
                  {{ formatReviewStatusLabel(orderRefundApply.reviewStatus) }}
                </dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">处理时间</dt>
                <dd>{{ orderRefundApply.handleTime || '—' }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">处理备注</dt>
                <dd class="whitespace-pre-wrap break-words">
                  {{ orderRefundApply.handleNote?.trim() || '—' }}
                </dd>
              </div>
            </dl>

            <div
              v-if="
                normalizeMediaList(orderRefundApply.handleProofPics).length > 0
              "
              class="mt-3"
            >
              <div class="mb-2 text-sm text-muted-foreground">处理凭证</div>
              <div class="flex flex-wrap gap-2">
                <template
                  v-for="(fileUrl, index) in normalizeMediaList(
                    orderRefundApply.handleProofPics,
                  )"
                  :key="`handle-proof-${index}`"
                >
                  <video
                    v-if="isVideoReviewFile(fileUrl)"
                    class="h-20 w-20 shrink-0 rounded object-cover"
                    controls
                    preload="metadata"
                    :src="fileUrl"
                  ></video>
                  <div
                    v-else
                    class="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-border bg-muted"
                  >
                    <Image
                      :height="80"
                      :preview="{ src: fileUrl }"
                      :src="fileUrl"
                      :width="80"
                      class="!h-20 !w-20 object-cover"
                    />
                  </div>
                </template>
              </div>
            </div>
          </section>
        </div>
      </template>

      <div
        v-else-if="!loading"
        class="py-6 text-center text-sm text-muted-foreground"
      >
        暂无退货详情
      </div>
    </Spin>
  </section>
</template>
