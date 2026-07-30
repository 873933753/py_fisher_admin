<script lang="ts" setup>
import type { OrderApi } from '#/api/core/order';

import { computed } from 'vue';

import { formatMoneyAmount, formatShippingFeeLabel } from '../../constants';

const props = defineProps<{
  currency?: string;
  paymentInfo?: OrderApi.OrderPaymentInfo;
}>();

const showDiscount = computed(() => {
  const amount = Number(props.paymentInfo?.totalDiscountAmount ?? 0);
  return !Number.isNaN(amount) && amount > 0;
});

const showRefund = computed(() => {
  const amount = Number(props.paymentInfo?.refundAmount ?? 0);
  return !Number.isNaN(amount) && amount > 0;
});
</script>

<template>
  <section
    class="rounded-lg border border-border bg-background px-4 py-4 shadow-sm"
  >
    <h3 class="mb-4 text-base font-semibold text-foreground">支付汇总</h3>
    <dl class="space-y-3 text-sm">
      <div class="flex justify-between gap-4">
        <dt class="text-muted-foreground">商品总额</dt>
        <dd class="font-medium tabular-nums text-foreground">
          {{ formatMoneyAmount(paymentInfo?.totalProductAmount, currency) }}
        </dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-muted-foreground">运费</dt>
        <dd class="tabular-nums text-foreground">
          {{ formatShippingFeeLabel(paymentInfo?.shippingFee, currency) }}
        </dd>
      </div>
      <div v-if="showDiscount" class="flex justify-between gap-4">
        <dt class="text-muted-foreground">折扣</dt>
        <dd class="tabular-nums text-green-600">
          -{{ formatMoneyAmount(paymentInfo?.totalDiscountAmount, currency) }}
        </dd>
      </div>
      <div class="flex justify-between gap-4 border-t border-border pt-3">
        <dt class="font-medium text-foreground">实付金额</dt>
        <dd class="text-base font-semibold tabular-nums text-foreground">
          {{ formatMoneyAmount(paymentInfo?.finalPayAmount, currency) }}
        </dd>
      </div>
      <div v-if="showRefund" class="flex justify-between gap-4">
        <dt class="text-muted-foreground">退款</dt>
        <dd class="tabular-nums text-foreground">
          {{ formatMoneyAmount(paymentInfo?.refundAmount, currency) }}
        </dd>
      </div>
    </dl>
  </section>
</template>
