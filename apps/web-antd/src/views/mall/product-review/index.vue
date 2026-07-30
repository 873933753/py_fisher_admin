<script lang="ts" setup>
import ProductReviewDetailDrawer from './components/ProductReviewDetailDrawer.vue';
import ProductReviewListPanel from './components/ProductReviewListPanel.vue';
import ProductReviewReplyModal from './components/ProductReviewReplyModal.vue';
import { useProductReviewManage } from './composables/useProductReviewManage';

defineOptions({ name: 'MallProductReview' });

const {
  confirmDelete,
  dataSource,
  detailDrawerOpen,
  detailTarget,
  filters,
  handleDetailDelete,
  handleSearch,
  handleTableChange,
  loading,
  openDetail,
  openReply,
  pagination,
  replyModalOpen,
  replySubmitting,
  replyTarget,
  resetFilters,
  submitReply,
} = useProductReviewManage();
</script>

<template>
  <div class="mall-product-review-page">
    <ProductReviewListPanel
      v-model:product-id="filters.productId"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @delete="confirmDelete"
      @detail="openDetail"
      @reply="openReply"
      @reset="resetFilters"
      @search="handleSearch"
      @page-change="handleTableChange"
    />
    <ProductReviewDetailDrawer
      v-model:open="detailDrawerOpen"
      :record="detailTarget"
      @delete="handleDetailDelete"
    />
    <ProductReviewReplyModal
      v-model:open="replyModalOpen"
      :reply-type="1"
      :submitting="replySubmitting"
      :target="replyTarget"
      @submit="submitReply"
    />
  </div>
</template>
