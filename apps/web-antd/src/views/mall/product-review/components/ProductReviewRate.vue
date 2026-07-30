<script lang="ts" setup>
import { Rate } from 'ant-design-vue';

import { REVIEW_RATE_COLOR } from '../constants';

defineProps<{
  value?: number;
}>();
</script>

<template>
  <Rate
    :value="value ?? 0"
    allow-half
    disabled
    class="product-review-rate !text-sm"
    :style="{ '--product-review-rate-color': REVIEW_RATE_COLOR }"
  />
</template>

<style scoped>
.product-review-rate :deep(.ant-rate-star-full .ant-rate-star-second),
.product-review-rate :deep(.ant-rate-star-half .ant-rate-star-first) {
  color: var(--product-review-rate-color);
}
</style>
