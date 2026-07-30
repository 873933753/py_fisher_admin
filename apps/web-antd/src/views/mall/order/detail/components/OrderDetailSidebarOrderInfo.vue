<script lang="ts" setup>
import type { OrderApi } from '#/api/core/order';

import { formatDetailField } from '../../utils/orderDetail';

defineProps<{
  orderInfo?: OrderApi.OrderDetailInfo;
  totalQuantity?: number;
}>();
</script>

<template>
  <section
    class="rounded-lg border border-border bg-background px-4 py-4 shadow-sm"
  >
    <h3 class="mb-4 text-base font-semibold text-foreground">订单信息</h3>
    <dl class="space-y-3 text-sm">
      <div class="flex gap-2">
        <dt class="w-20 shrink-0 text-muted-foreground">订单编号</dt>
        <dd class="min-w-0 flex-1 break-all text-foreground">
          {{ formatDetailField(orderInfo?.orderNo) }}
        </dd>
      </div>
      <div class="flex gap-2">
        <dt class="w-20 shrink-0 text-muted-foreground">买家</dt>
        <dd class="min-w-0 flex-1 text-foreground">
          {{ formatDetailField(orderInfo?.buyer) }}
        </dd>
      </div>
      <div class="flex gap-2">
        <dt class="w-20 shrink-0 text-muted-foreground">昵称</dt>
        <dd class="min-w-0 flex-1 text-foreground">
          {{ formatDetailField(orderInfo?.nickName) }}
        </dd>
      </div>
      <div v-if="totalQuantity !== undefined" class="flex gap-2">
        <dt class="w-20 shrink-0 text-muted-foreground">件数</dt>
        <dd class="min-w-0 flex-1 text-foreground">
          共 {{ totalQuantity }} 件
        </dd>
      </div>
      <div class="flex gap-2">
        <dt class="w-20 shrink-0 text-muted-foreground">下单时间</dt>
        <dd class="min-w-0 flex-1 text-foreground">
          {{ formatDetailField(orderInfo?.createTime) }}
        </dd>
      </div>
      <div class="flex gap-2">
        <dt class="w-20 shrink-0 text-muted-foreground">付款时间</dt>
        <dd class="min-w-0 flex-1 text-foreground">
          {{ formatDetailField(orderInfo?.payTime) }}
        </dd>
      </div>
    </dl>
  </section>
</template>
