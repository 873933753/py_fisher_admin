<script lang="ts" setup>
import type { OrderApi } from '#/api/core/order';

import { computed } from 'vue';

import { Image } from 'ant-design-vue';

const props = defineProps<{
  items: OrderApi.OrderItemRecord[];
  totalQuantity?: number;
}>();

const firstItem = computed(() => props.items[0]);

const mainTitle = computed(() => firstItem.value?.productName?.trim() || '—');

const extraSkuLineCount = computed(() => {
  const count = props.items.length;
  return count > 1 ? count - 1 : 0;
});

const showTotalQuantity = computed(
  () => props.totalQuantity !== undefined && props.totalQuantity > 0,
);
</script>

<template>
  <section
    class="flex gap-4 rounded-lg border border-border bg-background px-4 py-4 shadow-sm"
  >
    <div
      class="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-border bg-muted"
    >
      <Image
        v-if="firstItem?.skuImage"
        :src="firstItem.skuImage"
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
      <h2 class="text-base font-semibold leading-snug text-foreground">
        {{ mainTitle }}
      </h2>
      <p
        v-if="extraSkuLineCount > 0"
        class="mt-1 text-sm text-muted-foreground"
      >
        另有 {{ extraSkuLineCount }} 件商品
      </p>
      <p v-if="showTotalQuantity" class="mt-1 text-sm text-muted-foreground">
        共 {{ totalQuantity }} 件
      </p>
    </div>
  </section>
</template>
