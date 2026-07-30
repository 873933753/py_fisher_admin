<script lang="ts" setup>
import type { OrderApi } from '#/api/core/order';

import { Image } from 'ant-design-vue';

import { formatMoneyAmount, formatSpecData } from '../../constants';

defineProps<{
  currency?: string;
  items: OrderApi.OrderItemRecord[];
}>();
</script>

<template>
  <section
    class="rounded-lg border border-border bg-background px-4 py-4 shadow-sm"
  >
    <h3 class="mb-4 text-base font-semibold text-foreground">商品清单</h3>

    <ul v-if="items.length > 0" class="flex flex-col gap-4">
      <li
        v-for="item in items"
        :key="item.id"
        class="grid grid-cols-1 gap-3 border-b border-border/60 pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_10rem_10rem_10rem] sm:items-start"
      >
        <div class="flex min-w-0 gap-3 sm:pt-0">
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
              class="truncate text-sm font-medium leading-snug text-foreground"
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
            <div
              v-if="item.productId"
              class="mt-0.5 text-xs text-muted-foreground"
            >
              商品 ID：{{ item.productId }}
            </div>
            <div
              v-if="item.remark?.trim()"
              class="mt-0.5 text-xs text-muted-foreground"
            >
              明细备注：{{ item.remark }}
            </div>
          </div>
        </div>

        <div class="text-center">
          <div class="text-xs font-medium text-muted-foreground">数量</div>
          <div
            class="mt-0.5 text-sm font-semibold tabular-nums text-foreground"
          >
            {{ item.quantity ?? 0 }}
          </div>
        </div>

        <div class="text-center">
          <div class="text-xs font-medium text-muted-foreground">单价</div>
          <div
            class="mt-0.5 text-sm font-semibold tabular-nums text-foreground"
          >
            {{ formatMoneyAmount(item.productPrice, currency) }}
          </div>
        </div>

        <div class="text-center">
          <div class="text-xs font-medium text-muted-foreground">小计</div>
          <div
            class="mt-0.5 text-sm font-semibold tabular-nums text-foreground"
          >
            {{ formatMoneyAmount(item.subtotalAmount, currency) }}
          </div>
        </div>
      </li>
    </ul>

    <div v-else class="text-sm text-muted-foreground">暂无商品明细</div>
  </section>
</template>
