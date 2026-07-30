<script lang="ts" setup>
import ProductReviewReplyModal from '#/views/mall/product-review/components/ProductReviewReplyModal.vue';

import ContactBuyerDrawer from './components/ContactBuyerDrawer.vue';
import ManualRefundDrawer from './components/ManualRefundDrawer.vue';
import OrderListPanel from './components/OrderListPanel.vue';
import OrderReviewDetailDrawer from './components/OrderReviewDetailDrawer.vue';
import RefundApprovalDrawer from './components/RefundApprovalDrawer.vue';
import { useMallOrderManage } from './composables/useMallOrderManage';

defineOptions({ name: 'MallOrder' });

const {
  confirmCloseOrder,
  confirmDeleteSellerRemark,
  confirmDeleteOrderReview,
  confirmEditLogistics,
  confirmEditSellerRemark,
  confirmSubmitOrderReview,
  confirmUploadLogistics,
  contactBuyerOpen,
  contactBuyerTarget,
  dataSource,
  fetchList,
  filters,
  handleContactBuyerMailRead,
  handlePageChange,
  handleSearch,
  handleTabChange,
  loading,
  manualRefundOpen,
  manualRefundTarget,
  openContactBuyer,
  openManualRefund,
  openOrderReview,
  openOrderReviewReply,
  openRefundApproval,
  pagination,
  refundApprovalOpen,
  refundApprovalTarget,
  replyModalOpen,
  replySubmitting,
  replyType,
  resetFilters,
  reviewDetail,
  reviewDrawerLoading,
  reviewDrawerOpen,
  submitOrderReviewReply,
} = useMallOrderManage();
</script>

<template>
  <div class="mall-order-page">
    <OrderListPanel
      v-model:first-last-name="filters.firstLastName"
      v-model:order-no="filters.orderNo"
      v-model:order-status="filters.orderStatus"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @close-order="confirmCloseOrder"
      @contact-buyer="openContactBuyer"
      @delete-seller-remark="confirmDeleteSellerRemark"
      @edit-logistics="confirmEditLogistics"
      @edit-seller-remark="confirmEditSellerRemark"
      @execute-refund="openRefundApproval"
      @manual-refund="openManualRefund"
      @submit-order-review="confirmSubmitOrderReview"
      @upload-logistics="confirmUploadLogistics"
      @view-order-review="openOrderReview"
      @page-change="handlePageChange"
      @reset="resetFilters"
      @search="handleSearch"
      @tab-change="handleTabChange"
    />

    <ContactBuyerDrawer
      v-model:open="contactBuyerOpen"
      :order="contactBuyerTarget"
      @mail-read="handleContactBuyerMailRead"
    />

    <RefundApprovalDrawer
      v-model:open="refundApprovalOpen"
      :order="refundApprovalTarget"
      @submitted="fetchList"
    />

    <ManualRefundDrawer
      v-model:open="manualRefundOpen"
      :order="manualRefundTarget"
      @submitted="fetchList"
    />

    <OrderReviewDetailDrawer
      v-model:open="reviewDrawerOpen"
      :loading="reviewDrawerLoading"
      :record="reviewDetail"
      @delete="confirmDeleteOrderReview"
      @reply-follow-up="openOrderReviewReply(0)"
      @reply-merchant="openOrderReviewReply(1)"
    />

    <ProductReviewReplyModal
      v-model:open="replyModalOpen"
      :reply-type="replyType"
      :submitting="replySubmitting"
      :target="reviewDetail"
      @submit="submitOrderReviewReply"
    />
  </div>
</template>
