<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Spin } from 'ant-design-vue';

import {
  MALL_PRODUCT_LIST_ROUTE_NAME,
  markListRestore,
} from '#/composables/useMallListRestore';
import OrderReviewDetailDrawer from '#/views/mall/order/components/OrderReviewDetailDrawer.vue';
import ProductReviewReplyModal from '#/views/mall/product-review/components/ProductReviewReplyModal.vue';

import ProductItemReviewListPanel from './components/ProductItemReviewListPanel.vue';
import { useProductReviewsPage } from './composables/useProductReviewsPage';

defineOptions({ name: 'MallProductReviews' });

const router = useRouter();

const {
  confirmAddProductReview,
  confirmDelete,
  confirmDeleteFromDetail,
  dataSource,
  detailDrawerOpen,
  detailTarget,
  handleTableChange,
  listLoading,
  openDetail,
  openDetailReply,
  pageLoading,
  pagination,
  productInfoText,
  replyModalOpen,
  replySubmitting,
  replyType,
  submitDetailReply,
} = useProductReviewsPage();

function goBack() {
  markListRestore(MALL_PRODUCT_LIST_ROUTE_NAME, {
    mode: 'keep',
    refresh: false,
  });
  router.push({ name: 'MallProduct' });
}
</script>

<template>
  <Page title="商品评论">
    <template #description>
      <span class="text-sm text-muted-foreground">{{ productInfoText }}</span>
    </template>
    <template #extra>
      <div class="flex gap-2">
        <Button type="primary" @click="confirmAddProductReview">
          添加评论
        </Button>
        <Button @click="goBack">返回列表</Button>
      </div>
    </template>

    <Spin :spinning="pageLoading">
      <ProductItemReviewListPanel
        v-if="!pageLoading"
        :data-source="dataSource"
        :loading="listLoading"
        :pagination="pagination"
        @delete="confirmDelete"
        @detail="openDetail"
        @page-change="handleTableChange"
      />
    </Spin>

    <OrderReviewDetailDrawer
      v-model:open="detailDrawerOpen"
      :loading="false"
      :record="detailTarget"
      @delete="confirmDeleteFromDetail"
      @reply-follow-up="openDetailReply(0)"
      @reply-merchant="openDetailReply(1)"
    />

    <ProductReviewReplyModal
      v-model:open="replyModalOpen"
      :reply-type="replyType"
      :submitting="replySubmitting"
      :target="detailTarget"
      @submit="submitDetailReply"
    />
  </Page>
</template>
