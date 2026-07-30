<script lang="ts" setup>
import type { ProductReviewApi } from '#/api/core/productReview';

import { MallListTableCard } from '#/components/mall-list';

import ProductItemReviewCardList from './ProductItemReviewCardList.vue';

defineProps<{
  dataSource: ProductReviewApi.ReviewRecord[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}>();

const emit = defineEmits<{
  delete: [record: ProductReviewApi.ReviewRecord];
  detail: [record: ProductReviewApi.ReviewRecord];
  pageChange: [page: number, pageSize: number];
}>();
</script>

<template>
  <MallListTableCard>
    <ProductItemReviewCardList
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @delete="(record) => emit('delete', record)"
      @detail="(record) => emit('detail', record)"
      @page-change="(page, pageSize) => emit('pageChange', page, pageSize)"
    />
  </MallListTableCard>
</template>
