<script lang="ts" setup>
import type { PaginationProps } from 'ant-design-vue';

import type { ProductReviewApi } from '#/api/core/productReview';

import { computed } from 'vue';

import { Empty, Pagination, Spin } from 'ant-design-vue';

import ProductItemReviewCard from './ProductItemReviewCard.vue';

const props = defineProps<{
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

const listPagination = computed<PaginationProps>(() => ({
  current: props.pagination.current,
  pageSize: props.pagination.pageSize,
  total: props.pagination.total,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
  onChange: (page, pageSize) => {
    emit('pageChange', page, pageSize);
  },
}));
</script>

<template>
  <Spin :spinning="loading">
    <div v-if="dataSource.length > 0" class="flex flex-col gap-4">
      <div
        class="hidden px-4 text-xs font-medium text-muted-foreground lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_12rem_5.5rem_3rem] lg:gap-6"
      >
        <div>评价内容</div>
        <div>商家回复</div>
        <div>商品信息</div>
        <div>用户</div>
        <div>操作</div>
        <div class="text-right"></div>
      </div>
      <ProductItemReviewCard
        v-for="record in dataSource"
        :key="record.id"
        :record="record"
        @delete="(item) => emit('delete', item)"
        @detail="(item) => emit('detail', item)"
      />
      <div class="flex justify-end pt-1">
        <Pagination v-bind="listPagination" />
      </div>
    </div>
    <Empty v-else-if="!loading" class="py-16" description="暂无评论" />
  </Spin>
</template>
