import type { OrderApi } from '#/api/core/order';
import type { OrderRefundApplyApi } from '#/api/core/orderRefundApply';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { message } from 'ant-design-vue';

import { findOrderDetailApi } from '#/api/core/order';
import {
  findReasonTypeApi,
  refundDetailsApi,
} from '#/api/core/orderRefundApply';
import {
  MALL_ORDER_LIST_ROUTE_NAME,
  markListRestore,
} from '#/composables/useMallListRestore';

import {
  buildCancelledTimelineStepItems,
  buildRefundTimelineStepItems,
  buildTimelineStepItems,
  getBuyerContact,
  getDetailTotalQuantity,
  getOrderDetailItemList,
  getStatusPanelSubtitle,
  getStatusPanelTitle,
  isCancelledOrderStatus,
  isRefundOrderStatus,
  parseRouteOrderStatus,
  resolveCreateTime,
  resolveCurrency,
  resolveOrderStatus,
  resolveTimelineTimes,
  shouldShowOrderTimeline,
} from '../utils/orderDetail';

export function useOrderDetail() {
  const route = useRoute();
  const router = useRouter();

  const pageLoading = ref(false);
  const detail = ref<null | OrderApi.OrderDetailData>(null);

  const orderId = computed(() => String(route.params.id ?? ''));

  const routeOrderStatus = computed(() =>
    parseRouteOrderStatus(route.query.orderStatus),
  );

  const routeOrderStatusName = computed(() =>
    String(route.query.orderStatusName ?? '').trim(),
  );

  const routeCurrency = computed(() =>
    String(route.query.currency ?? '').trim(),
  );

  const routeCreateTime = computed(() =>
    String(route.query.createTime ?? '').trim(),
  );

  const routeOrderRefundApplyId = computed(() => {
    const value = route.query.orderRefundApplyId;
    if (value === undefined || value === null) {
      return '';
    }
    const id = String(value).trim();
    return id;
  });

  const showRefundDetails = computed(
    () => routeOrderRefundApplyId.value.length > 0,
  );

  const refundDetailsLoading = ref(false);
  const refundDetails = ref<null | OrderRefundApplyApi.RefundDetailsResult>(
    null,
  );
  const reasonTypeMap = ref<OrderRefundApplyApi.ReasonTypeMap>({});

  const orderInfo = computed(() => detail.value?.orderInfo);

  const postageInfo = computed(() => detail.value?.postageInfo);

  const logisticsInfo = computed(() => detail.value?.logisticsInfo);

  const paymentInfo = computed(() => detail.value?.paymentInfo);

  const itemList = computed(() => getOrderDetailItemList(detail.value));

  const orderStatus = computed(() =>
    resolveOrderStatus(orderInfo.value, routeOrderStatus.value),
  );

  const orderStatusName = computed(
    () =>
      orderInfo.value?.orderStatusName?.trim() ||
      routeOrderStatusName.value ||
      '—',
  );

  const currency = computed(() =>
    resolveCurrency(orderInfo.value, paymentInfo.value, routeCurrency.value),
  );

  const totalQuantity = computed(() => getDetailTotalQuantity(orderInfo.value));

  const showTimeline = computed(() =>
    shouldShowOrderTimeline(orderStatus.value),
  );

  const statusTitle = computed(() =>
    getStatusPanelTitle(
      orderStatus.value,
      orderInfo.value,
      orderStatusName.value,
      paymentInfo.value,
      currency.value,
    ),
  );

  const statusSubtitle = computed(() =>
    getStatusPanelSubtitle(
      orderStatus.value,
      orderStatusName.value,
      orderInfo.value,
      paymentInfo.value,
      currency.value,
    ),
  );

  const timelineItems = computed(() => {
    if (
      orderStatus.value === undefined ||
      !shouldShowOrderTimeline(orderStatus.value)
    ) {
      return [];
    }
    const firstItemTime = itemList.value[0]?.createTime?.trim();
    const times = resolveTimelineTimes(
      orderInfo.value,
      routeCreateTime.value,
      firstItemTime,
      logisticsInfo.value,
    );
    if (isCancelledOrderStatus(orderStatus.value)) {
      return buildCancelledTimelineStepItems(times, orderInfo.value);
    }
    if (isRefundOrderStatus(orderStatus.value)) {
      return buildRefundTimelineStepItems(
        orderStatus.value,
        times,
        paymentInfo.value,
        currency.value,
      );
    }
    return buildTimelineStepItems(orderStatus.value, times);
  });

  const resolvedCreateTime = computed(() =>
    resolveCreateTime(
      orderInfo.value,
      routeCreateTime.value,
      itemList.value[0]?.createTime,
    ),
  );

  const buyerContact = computed(() =>
    getBuyerContact(orderInfo.value, postageInfo.value),
  );

  async function loadDetail() {
    const id = orderId.value;
    if (!id) {
      message.error('缺少订单 ID');
      router.replace({ name: 'MallOrder' });
      return;
    }

    pageLoading.value = true;
    try {
      detail.value = await findOrderDetailApi(id);
    } catch {
      detail.value = null;
      message.error('加载订单详情失败');
      router.replace({ name: 'MallOrder' });
    } finally {
      pageLoading.value = false;
    }
  }

  async function loadRefundDetails() {
    const applyId = routeOrderRefundApplyId.value;
    if (!applyId) {
      refundDetails.value = null;
      reasonTypeMap.value = {};
      return;
    }

    refundDetailsLoading.value = true;
    refundDetails.value = null;

    try {
      const [reasonTypes, details] = await Promise.all([
        findReasonTypeApi(),
        refundDetailsApi({ orderRefundApplyId: applyId }),
      ]);
      reasonTypeMap.value = reasonTypes ?? {};
      refundDetails.value = details;
    } catch {
      refundDetails.value = null;
      message.error('加载退货详情失败');
    } finally {
      refundDetailsLoading.value = false;
    }
  }

  function goBack() {
    markListRestore(MALL_ORDER_LIST_ROUTE_NAME, {
      mode: 'keep',
      refresh: false,
    });
    router.push({ name: 'MallOrder' });
  }

  watch(
    () => orderId.value,
    () => {
      void loadDetail();
    },
    { immediate: true },
  );

  watch(
    () => routeOrderRefundApplyId.value,
    () => {
      void loadRefundDetails();
    },
    { immediate: true },
  );

  return {
    pageLoading,
    detail,
    orderId,
    orderInfo,
    postageInfo,
    logisticsInfo,
    paymentInfo,
    itemList,
    orderStatus,
    orderStatusName,
    currency,
    totalQuantity,
    showTimeline,
    statusTitle,
    statusSubtitle,
    timelineItems,
    resolvedCreateTime,
    buyerContact,
    showRefundDetails,
    refundDetailsLoading,
    refundDetails,
    reasonTypeMap,
    goBack,
  };
}
