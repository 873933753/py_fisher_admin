import type { ProductReviewApi } from '#/api/core/productReview';

import { onMounted, reactive, ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import {
  deleteProductReviewApi,
  findProductReviewPageApi,
  saveProductReviewReplyApi,
} from '#/api/core/productReview';

import { REVIEW_REPLY_CONTENT_MAX_LENGTH } from '../constants';

export interface ProductReviewFilters {
  productId: string;
}

const defaultFilters = (): ProductReviewFilters => ({
  productId: '',
});

export function useProductReviewManage() {
  const filters = reactive<ProductReviewFilters>(defaultFilters());
  const loading = ref(false);
  const dataSource = ref<ProductReviewApi.ReviewRecord[]>([]);
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const replyModalOpen = ref(false);
  const replySubmitting = ref(false);
  const replyTarget = ref<null | ProductReviewApi.ReviewRecord>(null);

  const detailDrawerOpen = ref(false);
  const detailTarget = ref<null | ProductReviewApi.ReviewRecord>(null);

  async function fetchList() {
    loading.value = true;
    try {
      const params: ProductReviewApi.FindPageParams = {
        current: String(pagination.current),
        size: String(pagination.pageSize),
      };

      const productId = filters.productId.trim();
      if (productId) {
        params.productId = productId;
      }

      const data = await findProductReviewPageApi(params);
      dataSource.value = data.records ?? [];
      pagination.total = Number(data.total) || 0;
      pagination.current = Number(data.current) || pagination.current;
      pagination.pageSize = Number(data.size) || pagination.pageSize;

      if (detailDrawerOpen.value && detailTarget.value) {
        const updated = dataSource.value.find(
          (item) => item.id === detailTarget.value?.id,
        );
        if (updated) {
          detailTarget.value = updated;
        } else {
          closeDetail();
        }
      }
    } finally {
      loading.value = false;
    }
  }

  function handleSearch() {
    pagination.current = 1;
    fetchList();
  }

  function resetFilters() {
    Object.assign(filters, defaultFilters());
    handleSearch();
  }

  function handleTableChange(page: number, pageSize: number) {
    pagination.current = page;
    pagination.pageSize = pageSize;
    fetchList();
  }

  function openReply(record: ProductReviewApi.ReviewRecord) {
    replyTarget.value = record;
    replyModalOpen.value = true;
  }

  function closeReply() {
    replyModalOpen.value = false;
    replyTarget.value = null;
  }

  function openDetail(record: ProductReviewApi.ReviewRecord) {
    detailTarget.value = record;
    detailDrawerOpen.value = true;
  }

  function closeDetail() {
    detailDrawerOpen.value = false;
    detailTarget.value = null;
  }

  async function submitReply(payload: {
    content: string;
    reviewFile: string[];
  }) {
    const target = replyTarget.value;
    if (!target) {
      return;
    }

    const content = payload.content.trim();
    if (!content) {
      message.warning('请输入回复内容');
      return;
    }
    if (content.length > REVIEW_REPLY_CONTENT_MAX_LENGTH) {
      message.warning(`回复内容不能超过 ${REVIEW_REPLY_CONTENT_MAX_LENGTH} 字`);
      return;
    }

    const orderId = target.orderId?.trim();
    if (!orderId) {
      message.warning('评价缺少订单信息，无法回复');
      return;
    }

    replySubmitting.value = true;
    try {
      await saveProductReviewReplyApi(
        {
          reviewId: target.id,
          content,
          replyType: 1,
          reviewFile: [],
        },
        { orderId },
      );
      message.success('回复成功');
      closeReply();
      await fetchList();
    } finally {
      replySubmitting.value = false;
    }
  }

  function handleDetailDelete(record: ProductReviewApi.ReviewReplyRecord) {
    confirmDelete(record);
  }

  function confirmDelete(
    record: ProductReviewApi.ReviewDeletableItem,
    options?: { onDeleted?: () => void },
  ) {
    const reviewRecord = record as ProductReviewApi.ReviewRecord;
    const label =
      reviewRecord.title?.trim() || record.content?.trim() || record.id;
    Modal.confirm({
      title: '确认删除该评论？',
      content: `确定要删除「${label.slice(0, 40)}${label.length > 40 ? '…' : ''}」吗？删除后无法恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        await deleteProductReviewApi(record.id);
        message.success('删除成功');
        options?.onDeleted?.();
        await fetchList();
      },
    });
  }

  onMounted(() => {
    fetchList();
  });

  return {
    closeDetail,
    closeReply,
    confirmDelete,
    dataSource,
    detailDrawerOpen,
    detailTarget,
    fetchList,
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
  };
}
