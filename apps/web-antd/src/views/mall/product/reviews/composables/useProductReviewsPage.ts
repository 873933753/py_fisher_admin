import type { ProductReviewApi } from '#/api/core/productReview';

import { computed, h, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { message, Modal } from 'ant-design-vue';

import { getProductInfoApi } from '#/api/core/product';
import {
  addProductReviewApi,
  deleteProductReviewApi,
  findProductReviewPageApi,
  saveProductReviewReplyApi,
} from '#/api/core/productReview';
import { randomSysUserApi } from '#/api/core/user';
import OrderItemReviewForm from '#/views/mall/order/components/OrderItemReviewForm.vue';
import { REVIEW_REPLY_CONTENT_MAX_LENGTH } from '#/views/mall/product-review/constants';

export function useProductReviewsPage() {
  const route = useRoute();
  const router = useRouter();

  const pageLoading = ref(true);
  const listLoading = ref(false);
  const productName = ref('');
  const dataSource = ref<ProductReviewApi.ReviewRecord[]>([]);
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const detailDrawerOpen = ref(false);
  const detailTarget = ref<null | ProductReviewApi.ReviewRecord>(null);

  const replyModalOpen = ref(false);
  const replySubmitting = ref(false);
  const replyType = ref<0 | 1>(1);

  const productId = computed(() => {
    const rawId = route.params.id;
    if (typeof rawId === 'string') return rawId.trim();
    if (Array.isArray(rawId)) return rawId[0]?.trim() ?? '';
    return '';
  });

  const productInfoText = computed(() => {
    const id = productId.value || '—';
    const name = productName.value.trim() || '—';
    return `商品 ID：${id}　商品名称：${name}`;
  });

  function resolveRouteProductId(): string {
    const id = productId.value;
    if (!id) {
      message.error('缺少商品 ID');
      router.replace({ name: 'MallProduct' });
      return '';
    }
    return id;
  }

  async function loadProductInfo(id: string) {
    try {
      const detail = await getProductInfoApi(id);
      productName.value = detail.product?.productName?.trim() || '';
    } catch {
      productName.value = '';
    }
  }

  async function fetchList() {
    const id = productId.value;
    if (!id) {
      return;
    }

    listLoading.value = true;
    try {
      const data = await findProductReviewPageApi({
        productId: id,
        current: String(pagination.current),
        size: String(pagination.pageSize),
      });
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
      listLoading.value = false;
    }
  }

  function handleTableChange(page: number, pageSize: number) {
    pagination.current = page;
    pagination.pageSize = pageSize;
    void fetchList();
  }

  function openDetail(record: ProductReviewApi.ReviewRecord) {
    detailTarget.value = record;
    detailDrawerOpen.value = true;
  }

  function closeDetail() {
    detailDrawerOpen.value = false;
    detailTarget.value = null;
  }

  function confirmDelete(record: ProductReviewApi.ReviewRecord) {
    const label = record.content?.trim() || record.id;
    Modal.confirm({
      title: '确认删除该评论？',
      content: `确定要删除「${label.slice(0, 40)}${label.length > 40 ? '…' : ''}」吗？删除后无法恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        await deleteProductReviewApi(record.id);
        message.success('删除成功');
        if (dataSource.value.length <= 1 && pagination.current > 1) {
          pagination.current -= 1;
        }
        if (detailTarget.value?.id === record.id) {
          closeDetail();
        }
        await fetchList();
      },
    });
  }

  function confirmDeleteFromDetail() {
    const record = detailTarget.value;
    if (!record) {
      return;
    }
    confirmDelete(record);
  }

  function openDetailReply(type: 0 | 1) {
    if (!detailTarget.value) {
      return;
    }
    replyType.value = type;
    replyModalOpen.value = true;
  }

  async function submitDetailReply(payload: {
    content: string;
    reviewFile: string[];
  }) {
    const detail = detailTarget.value;
    if (!detail) {
      return;
    }

    const content = payload.content.trim();
    if (!content) {
      message.warning(
        replyType.value === 0 ? '请输入追加评论内容' : '请输入回复内容',
      );
      return;
    }
    if (content.length > REVIEW_REPLY_CONTENT_MAX_LENGTH) {
      message.warning(`内容不能超过 ${REVIEW_REPLY_CONTENT_MAX_LENGTH} 字`);
      return;
    }

    replySubmitting.value = true;
    try {
      await saveProductReviewReplyApi({
        reviewId: detail.id,
        content,
        replyType: replyType.value,
        reviewFile: payload.reviewFile,
      });
      message.success(replyType.value === 0 ? '追加评论成功' : '回复成功');
      replyModalOpen.value = false;
      await fetchList();
    } finally {
      replySubmitting.value = false;
    }
  }

  async function confirmAddProductReview() {
    const id = productId.value;
    if (!id) {
      message.warning('商品 ID 不存在');
      return;
    }

    let randomUser: Awaited<ReturnType<typeof randomSysUserApi>>;
    try {
      randomUser = await randomSysUserApi();
    } catch {
      return;
    }

    if (!randomUser?.id) {
      message.warning('获取评论用户失败');
      return;
    }

    const name = productName.value.trim() || '—';
    const userEmail = randomUser.email?.trim() || '—';
    const formRef = ref<InstanceType<typeof OrderItemReviewForm>>();

    Modal.confirm({
      title: '添加评论',
      width: 640,
      content: () =>
        h('div', { class: 'flex flex-col gap-4' }, [
          h(
            'div',
            {
              class: 'rounded-md bg-muted/40 p-3 text-sm text-muted-foreground',
            },
            [
              h(
                'div',
                { class: 'font-medium text-foreground' },
                `商品 ID：${id}`,
              ),
              h('div', { class: 'mt-1' }, `商品名称：${name}`),
              h('div', { class: 'mt-1' }, `随机用户：${userEmail}`),
            ],
          ),
          h(OrderItemReviewForm, { ref: formRef }),
        ]),
      okText: '提交评论',
      cancelText: '取消',
      async onOk() {
        const result = formRef.value?.validate();
        if (!result || !result.ok || !result.payload) {
          message.warning(
            result && !result.ok ? result.message : '请完善评价信息',
          );
          throw new Error('invalid review form');
        }

        await addProductReviewApi({
          productId: id,
          userId: randomUser.id,
          content: result.payload.content,
          ratingQuality: result.payload.ratingQuality,
          ratingShipping: result.payload.ratingShipping,
          ratingService: result.payload.ratingService,
          reviewFile: result.payload.reviewFile,
        });
        message.success('评论提交成功');
        formRef.value?.resetForm();
        await fetchList();
      },
    });
  }

  async function bootstrapPage() {
    pageLoading.value = true;
    try {
      const id = resolveRouteProductId();
      if (!id) {
        return;
      }
      pagination.current = 1;
      await Promise.all([loadProductInfo(id), fetchList()]);
    } finally {
      pageLoading.value = false;
    }
  }

  watch(
    () => route.params.id,
    () => {
      void bootstrapPage();
    },
  );

  onMounted(() => {
    void bootstrapPage();
  });

  return {
    closeDetail,
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
    productName,
    replyModalOpen,
    replySubmitting,
    replyType,
    submitDetailReply,
  };
}
