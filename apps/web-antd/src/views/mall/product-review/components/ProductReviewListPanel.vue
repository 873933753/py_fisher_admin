<script lang="ts" setup>
import type { ProductReviewApi } from '#/api/core/productReview';

import { MallListPage, MallListTableCard } from '#/components/mall-list';

import ProductReviewCardList from './ProductReviewCardList.vue';

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
  reply: [record: ProductReviewApi.ReviewRecord];
  reset: [];
  search: [];
}>();

defineModel<string>('productId', { default: '' });
</script>

<template>
  <MallListPage>
    <div class="flex flex-col gap-4">
      <!-- <MallListSearchCard>
        <template #filters>
          <MallListFilterField label="商品 ID：">
            <Input
              v-model:value="productId"
              allow-clear
              class="min-w-0 flex-1"
              placeholder="请输入商品 ID"
              @press-enter="emit('search')"
            />
          </MallListFilterField>
        </template>
        <template #actions>
          <Button type="primary" :loading="loading" @click="emit('search')">
            搜索
          </Button>
          <Button :disabled="loading" @click="emit('reset')">重置</Button>
        </template>
      </MallListSearchCard> -->

      <MallListTableCard>
        <template #header>
          <div class="text-base font-medium text-foreground">评论列表</div>
        </template>
        <ProductReviewCardList
          :data-source="dataSource"
          :loading="loading"
          :pagination="pagination"
          @delete="(record) => emit('delete', record)"
          @detail="(record) => emit('detail', record)"
          @page-change="(page, pageSize) => emit('pageChange', page, pageSize)"
          @reply="(record) => emit('reply', record)"
        />
      </MallListTableCard>
    </div>
  </MallListPage>
</template>
