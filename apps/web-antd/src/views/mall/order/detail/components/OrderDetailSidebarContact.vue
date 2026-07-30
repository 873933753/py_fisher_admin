<script lang="ts" setup>
import { formatDetailField } from '../../utils/orderDetail';

defineProps<{
  email: string;
  phone: string;
}>();
</script>

<template>
  <section
    class="rounded-lg border border-border bg-background px-4 py-4 shadow-sm"
  >
    <h3 class="mb-4 text-base font-semibold text-foreground">买家联系方式</h3>
    <dl class="space-y-3 text-sm">
      <div class="flex gap-2">
        <dt class="w-12 shrink-0 text-muted-foreground">邮箱</dt>
        <dd class="min-w-0 flex-1 break-all text-foreground">
          {{ formatDetailField(email) }}
        </dd>
      </div>
      <div class="flex gap-2">
        <dt class="w-12 shrink-0 text-muted-foreground">电话</dt>
        <dd class="min-w-0 flex-1 text-foreground">
          {{ formatDetailField(phone) }}
        </dd>
      </div>
    </dl>
  </section>
</template>
