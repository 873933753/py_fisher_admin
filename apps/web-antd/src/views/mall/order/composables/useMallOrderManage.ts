import type { OrderListTabKey, OrderStatusFilterValue } from '../constants';

import type { OrderApi } from '#/api/core/order';
import type { ProductReviewApi } from '#/api/core/productReview';

import { h, onActivated, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { message, Modal } from 'ant-design-vue';

import {
  findTrackingNoApi,
  getLogisticsApi,
  uploadTrackingNoApi,
} from '#/api/core/logistics';
import {
  addSellerRemarkApi,
  cancelOrderApi,
  findPageOrderApi,
} from '#/api/core/order';
import {
  deleteProductReviewApi,
  getProductReviewDetailsApi,
  saveProductReviewApi,
  saveProductReviewReplyApi,
} from '#/api/core/productReview';
import {
  consumeListRestore,
  isMenuResetListNavigation,
  MALL_ORDER_LIST_ROUTE_NAME,
} from '#/composables/useMallListRestore';
import { REVIEW_REPLY_CONTENT_MAX_LENGTH } from '#/views/mall/product-review/constants';

import OrderItemReviewForm from '../components/OrderItemReviewForm.vue';
import SellerRemarkForm from '../components/SellerRemarkForm.vue';
import UploadLogisticsForm from '../components/UploadLogisticsForm.vue';
import {
  formatOrderStatusQueryParam,
  getDefaultOrderListOrderStatus,
  getOrderListLogisticsTracesId,
  normalizeOrderRatingResult,
  resolveOrderStatusFromTab,
} from '../constants';

export interface MallOrderFilters {
  orderStatus: OrderStatusFilterValue;
  orderNo: string;
  firstLastName: string;
}

const defaultFilters = (): MallOrderFilters => ({
  orderStatus: getDefaultOrderListOrderStatus(),
  orderNo: '',
  firstLastName: '',
});

export function useMallOrderManage() {
  const router = useRouter();

  const filters = reactive<MallOrderFilters>(defaultFilters());
  const loading = ref(false);
  const dataSource = ref<OrderApi.OrderRecord[]>([]);
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const listInitialized = ref(false);
  const contactBuyerOpen = ref(false);
  const contactBuyerTarget = ref<null | OrderApi.OrderRecord>(null);
  const refundApprovalOpen = ref(false);
  const refundApprovalTarget = ref<null | OrderApi.OrderRecord>(null);
  const manualRefundOpen = ref(false);
  const manualRefundTarget = ref<null | OrderApi.OrderRecord>(null);
  const reviewDrawerOpen = ref(false);
  const reviewDrawerLoading = ref(false);
  const reviewDetail = ref<null | ProductReviewApi.ReviewRecord>(null);
  const reviewOrderTarget = ref<null | OrderApi.OrderRecord>(null);
  const replyModalOpen = ref(false);
  const replySubmitting = ref(false);
  const replyType = ref<0 | 1>(1);

  async function fetchList() {
    loading.value = true;
    try {
      const params: OrderApi.FindPageParams = {
        current: pagination.current,
        size: pagination.pageSize,
        orderStatus: formatOrderStatusQueryParam(filters.orderStatus),
      };

      const orderNo = filters.orderNo.trim();
      const firstLastName = filters.firstLastName.trim();
      if (orderNo) {
        params.orderNo = orderNo;
      }
      if (firstLastName) {
        params.firstLastName = firstLastName;
      }

      const data = await findPageOrderApi(params);
      dataSource.value = data.records ?? [];
      pagination.total = Number(data.total) || 0;
      pagination.current = Number(data.current) || pagination.current;
      pagination.pageSize = Number(data.size) || pagination.pageSize;
    } finally {
      loading.value = false;
    }
  }

  function applyDefaultFilters() {
    Object.assign(filters, defaultFilters());
    pagination.current = 1;
  }

  function clearMenuResetNavigationState() {
    if (!isMenuResetListNavigation(history.state)) {
      return;
    }

    const nextState = { ...history.state } as Record<string, unknown>;
    delete nextState.resetListOnMenu;
    router.replace({
      ...router.currentRoute.value,
      state: nextState,
    });
  }

  function handleListActivate() {
    if (isMenuResetListNavigation(history.state)) {
      applyDefaultFilters();
      clearMenuResetNavigationState();
      void fetchList();
      listInitialized.value = true;
      return;
    }

    const plan = consumeListRestore(MALL_ORDER_LIST_ROUTE_NAME);
    if (plan?.mode === 'reset') {
      applyDefaultFilters();
      void fetchList();
      listInitialized.value = true;
      return;
    }

    if (plan?.mode === 'keep') {
      if (plan.resetFilters) {
        applyDefaultFilters();
      }
      if (plan.refresh || !listInitialized.value) {
        void fetchList();
      }
      listInitialized.value = true;
      return;
    }

    if (!listInitialized.value) {
      void fetchList();
      listInitialized.value = true;
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

  function handleTabChange(tab: OrderListTabKey) {
    filters.orderStatus = resolveOrderStatusFromTab(tab);
    handleSearch();
  }

  function handlePageChange(page: number, pageSize: number) {
    pagination.current = page;
    pagination.pageSize = pageSize;
    fetchList();
  }

  function openRefundApproval(order: OrderApi.OrderRecord) {
    const applyId = order.orderRefundApplyId;
    if (
      applyId === undefined ||
      applyId === null ||
      String(applyId).trim() === ''
    ) {
      message.warning('订单退款申请 ID 不存在');
      return;
    }
    refundApprovalTarget.value = order;
    refundApprovalOpen.value = true;
  }

  function openManualRefund(order: OrderApi.OrderRecord) {
    const orderId = order.orderId?.trim();
    if (!orderId) {
      message.warning('订单 ID 不存在');
      return;
    }
    manualRefundTarget.value = order;
    manualRefundOpen.value = true;
  }

  function confirmCloseOrder(order: OrderApi.OrderRecord) {
    const orderId = order.orderId?.trim();
    if (!orderId) {
      message.warning('订单 ID 不存在');
      return;
    }

    Modal.confirm({
      title: '关闭订单',
      content: '确定关闭该订单吗？关闭后订单将无法恢复。',
      okText: '确定',
      cancelText: '取消',
      async onOk() {
        await cancelOrderApi({ orderId });
        message.success('订单已关闭');
        await fetchList();
      },
    });
  }

  function confirmDeleteSellerRemark(order: OrderApi.OrderRecord) {
    const orderId = order.orderId?.trim();
    if (!orderId) {
      message.warning('订单 ID 不存在');
      return;
    }

    Modal.confirm({
      title: '删除商家备注',
      content: '确定删除该商家备注吗？',
      okText: '确定',
      cancelText: '取消',
      async onOk() {
        await addSellerRemarkApi({ orderId, sellerRemark: '' });
        message.success('商家备注已删除');
        await fetchList();
      },
    });
  }

  function confirmEditSellerRemark(order: OrderApi.OrderRecord) {
    const orderId = order.orderId?.trim();
    if (!orderId) {
      message.warning('订单 ID 不存在');
      return;
    }

    const originalRemark = order.sellerRemark?.trim() ?? '';
    const formRef = ref<InstanceType<typeof SellerRemarkForm>>();

    Modal.confirm({
      title: '商家备注',
      width: 480,
      content: () =>
        h(SellerRemarkForm, {
          ref: formRef,
          orderId,
          initialRemark: order.sellerRemark,
        }),
      okText: '保存',
      cancelText: '取消',
      async onOk() {
        const sellerRemark = formRef.value?.getValue() ?? '';
        if (sellerRemark === originalRemark) {
          return;
        }
        await addSellerRemarkApi({ orderId, sellerRemark });
        message.success('商家备注保存成功');
        await fetchList();
      },
    });
  }

  function confirmSubmitOrderReview(order: OrderApi.OrderRecord) {
    const orderId = order.orderId?.trim();
    if (!orderId) {
      message.warning('订单 ID 不存在');
      return;
    }

    const formRef = ref<InstanceType<typeof OrderItemReviewForm>>();

    Modal.confirm({
      title: '代填评价',
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
                `订单 ID：${orderId}`,
              ),
            ],
          ),
          h(OrderItemReviewForm, { ref: formRef }),
        ]),
      okText: '提交评价',
      cancelText: '取消',
      async onOk() {
        const result = formRef.value?.validate();
        if (!result || !result.ok || !result.payload) {
          message.warning(
            result && !result.ok ? result.message : '请完善评价信息',
          );
          throw new Error('invalid review form');
        }

        await saveProductReviewApi({
          orderId,
          content: result.payload.content,
          ratingQuality: result.payload.ratingQuality,
          ratingShipping: result.payload.ratingShipping,
          ratingService: result.payload.ratingService,
          reviewFile: result.payload.reviewFile,
        });
        message.success('评价提交成功');
        formRef.value?.resetForm();
        await fetchList();
      },
    });
  }

  async function confirmUploadLogistics(order: OrderApi.OrderRecord) {
    const orderId = order.orderId?.trim();
    if (!orderId) {
      message.warning('订单 ID 不存在');
      return;
    }

    let logisticsOptions: string[];
    try {
      logisticsOptions = (await getLogisticsApi()) ?? [];
    } catch {
      message.error('获取物流公司失败');
      return;
    }
    if (logisticsOptions.length === 0) {
      message.warning('暂无可用物流公司');
      return;
    }

    const formRef = ref<InstanceType<typeof UploadLogisticsForm>>();

    Modal.confirm({
      title: '上传物流信息',
      width: 480,
      content: () =>
        h(UploadLogisticsForm, {
          ref: formRef,
          orderId,
          logisticsOptions,
        }),
      okText: '确认上传',
      cancelText: '取消',
      async onOk() {
        const result = formRef.value?.validate(orderId);
        if (!result?.ok || !result.payload) {
          message.warning(result?.message ?? '请完善物流信息');
          throw new Error('invalid logistics form');
        }
        await uploadTrackingNoApi(result.payload);
        message.success('物流信息上传成功');
        await fetchList();
      },
    });
  }

  async function confirmEditLogistics(order: OrderApi.OrderRecord) {
    const orderId = order.orderId?.trim();
    const logisticsTracesId = getOrderListLogisticsTracesId(order);
    if (!orderId) {
      message.warning('订单 ID 不存在');
      return;
    }
    if (!logisticsTracesId) {
      message.warning('物流轨迹 ID 不存在');
      return;
    }

    let logisticsOptions: string[];
    let trackingDetail: Awaited<ReturnType<typeof findTrackingNoApi>>;
    try {
      [logisticsOptions, trackingDetail] = await Promise.all([
        getLogisticsApi(),
        findTrackingNoApi(logisticsTracesId),
      ]);
    } catch {
      message.error('获取物流信息失败');
      return;
    }
    if ((logisticsOptions ?? []).length === 0) {
      message.warning('暂无可用物流公司');
      return;
    }

    const formRef = ref<InstanceType<typeof UploadLogisticsForm>>();

    Modal.confirm({
      title: '编辑物流信息',
      width: 480,
      content: () =>
        h(UploadLogisticsForm, {
          ref: formRef,
          orderId,
          logisticsOptions: logisticsOptions ?? [],
          initialValues: {
            logistics: trackingDetail.logistics,
            trackingNo: trackingDetail.trackingNo ?? '',
            waybillNo: trackingDetail.waybillNo ?? '',
          },
        }),
      okText: '确认修改',
      cancelText: '取消',
      async onOk() {
        const result = formRef.value?.validate(orderId);
        if (!result?.ok || !result.payload) {
          message.warning(result?.message ?? '请完善物流信息');
          throw new Error('invalid logistics form');
        }
        await uploadTrackingNoApi({
          ...result.payload,
          logisticsTracesId,
        });
        message.success('物流信息修改成功');
        await fetchList();
      },
    });
  }

  function openContactBuyer(order: OrderApi.OrderRecord) {
    const orderId = order.orderId?.trim();
    if (!orderId) {
      message.warning('订单 ID 不存在');
      return;
    }
    contactBuyerTarget.value = order;
    contactBuyerOpen.value = true;
  }

  function closeOrderReview() {
    reviewDrawerOpen.value = false;
    reviewOrderTarget.value = null;
    reviewDetail.value = null;
  }

  async function loadOrderReviewDetail(orderId: string) {
    reviewDrawerLoading.value = true;
    try {
      reviewDetail.value = await getProductReviewDetailsApi(orderId);
    } catch {
      reviewDetail.value = null;
      reviewDrawerOpen.value = false;
    } finally {
      reviewDrawerLoading.value = false;
    }
  }

  async function openOrderReview(order: OrderApi.OrderRecord) {
    const orderId = order.orderId?.trim();
    if (!orderId) {
      message.warning('订单 ID 不存在');
      return;
    }
    if (normalizeOrderRatingResult(order.ratingResult) === 0) {
      return;
    }

    reviewOrderTarget.value = order;
    reviewDrawerOpen.value = true;
    await loadOrderReviewDetail(orderId);
  }

  function openOrderReviewReply(type: 0 | 1) {
    if (!reviewDetail.value) {
      return;
    }
    replyType.value = type;
    replyModalOpen.value = true;
  }

  async function submitOrderReviewReply(payload: {
    content: string;
    reviewFile: string[];
  }) {
    const detail = reviewDetail.value;
    const order = reviewOrderTarget.value;
    if (!detail || !order) {
      return;
    }

    const orderId = order.orderId?.trim() || detail.orderId?.trim();
    if (!orderId) {
      message.warning('订单 ID 不存在');
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
      await saveProductReviewReplyApi(
        {
          reviewId: detail.id,
          content,
          replyType: replyType.value,
          reviewFile: payload.reviewFile,
        },
        { orderId },
      );
      message.success(replyType.value === 0 ? '追加评论成功' : '回复成功');
      replyModalOpen.value = false;
      await loadOrderReviewDetail(orderId);
      await fetchList();
    } finally {
      replySubmitting.value = false;
    }
  }

  function confirmDeleteOrderReview() {
    const detail = reviewDetail.value;
    if (!detail) {
      return;
    }

    const label = detail.content?.trim() || detail.id;
    Modal.confirm({
      title: '确认删除该评论？',
      content: `确定要删除「${label.slice(0, 40)}${label.length > 40 ? '…' : ''}」吗？删除后无法恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        await deleteProductReviewApi(detail.id);
        message.success('删除成功');
        closeOrderReview();
        await fetchList();
      },
    });
  }

  function markContactBuyerMailRead(orderId: string) {
    const normalizedId = orderId.trim();
    if (!normalizedId) {
      return;
    }

    const row = dataSource.value.find(
      (order) => order.orderId?.trim() === normalizedId,
    );
    if (row) {
      row.mailIsRead = 1;
    }

    if (contactBuyerTarget.value?.orderId?.trim() === normalizedId) {
      contactBuyerTarget.value = {
        ...contactBuyerTarget.value,
        mailIsRead: 1,
      };
    }
  }

  function handleContactBuyerMailRead(orderId: string) {
    markContactBuyerMailRead(orderId);
  }

  onActivated(() => {
    handleListActivate();
  });

  watch(reviewDrawerOpen, (open) => {
    if (!open) {
      reviewOrderTarget.value = null;
      reviewDetail.value = null;
    }
  });

  watch(refundApprovalOpen, (open) => {
    if (!open) {
      refundApprovalTarget.value = null;
    }
  });

  watch(manualRefundOpen, (open) => {
    if (!open) {
      manualRefundTarget.value = null;
    }
  });

  return {
    closeOrderReview,
    confirmCloseOrder,
    confirmDeleteOrderReview,
    confirmDeleteSellerRemark,
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
  };
}
