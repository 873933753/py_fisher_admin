import type { OrderApi } from '#/api/core/order';

import { formatMoneyAmount, formatRefundTypeLabel } from '../constants';

const TERMINAL_ORDER_STATUSES = new Set<OrderApi.OrderStatusValue>([5, 6, 7]);

const CANCELLED_ORDER_STATUS: OrderApi.OrderStatusValue = 5;

const REFUND_ORDER_STATUSES = new Set<OrderApi.OrderStatusValue>([6, 7]);

const TIMELINE_STEPS = [
  { key: 'placed', title: '已下单', timeKey: 'createTime' as const },
  {
    key: 'paid',
    title: '买家已付款',
    pendingTitle: '待买家付款',
    timeKey: 'payTime' as const,
  },
  {
    key: 'shipped',
    title: '已发货',
    subLabel: '',
    timeKey: 'shipTime' as const,
  },
  { key: 'delivered', title: '已送达', timeKey: 'completeTime' as const },
] as const;

type TimelineStepStatus = 'error' | 'finish' | 'process' | 'wait';

export interface OrderTimelineStepItem {
  description?: string;
  status: TimelineStepStatus;
  title: string;
}

export interface OrderTimelineTimes {
  createTime?: string;
  payTime?: string;
  shipTime?: string;
  completeTime?: string;
}

export function getOrderDetailItemList(
  data: null | OrderApi.OrderDetailData | undefined,
): OrderApi.OrderItemRecord[] {
  if (!data) {
    return [];
  }
  const list =
    data.myOrderItemList ??
    (data['myOrderItemList '] as OrderApi.OrderItemRecord[] | undefined);
  return Array.isArray(list) ? list : [];
}

export function parseRouteOrderStatus(
  value: unknown,
): OrderApi.OrderStatusValue | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = Number(value);
  if (Number.isInteger(num) && num >= 1 && num <= 7) {
    return num as OrderApi.OrderStatusValue;
  }
  return undefined;
}

export function resolveOrderStatus(
  orderInfo: OrderApi.OrderDetailInfo | undefined,
  routeStatus: OrderApi.OrderStatusValue | undefined,
): OrderApi.OrderStatusValue | undefined {
  const fromApi = orderInfo?.orderStatus;
  if (
    typeof fromApi === 'number' &&
    fromApi >= 1 &&
    fromApi <= 7 &&
    Number.isInteger(fromApi)
  ) {
    return fromApi as OrderApi.OrderStatusValue;
  }
  return routeStatus;
}

export function resolveCreateTime(
  orderInfo: OrderApi.OrderDetailInfo | undefined,
  routeCreateTime?: string,
  firstItemCreateTime?: string,
): string | undefined {
  const fromApi = orderInfo?.createTime?.trim();
  if (fromApi) {
    return fromApi;
  }
  const fromRoute = routeCreateTime?.trim();
  if (fromRoute) {
    return fromRoute;
  }
  const fromItem = firstItemCreateTime?.trim();
  return fromItem || undefined;
}

export function resolveTimelineTimes(
  orderInfo: OrderApi.OrderDetailInfo | undefined,
  routeCreateTime?: string,
  firstItemCreateTime?: string,
  logisticsInfo?: OrderApi.OrderLogisticsInfo,
): OrderTimelineTimes {
  return {
    createTime: resolveCreateTime(
      orderInfo,
      routeCreateTime,
      firstItemCreateTime,
    ),
    payTime: orderInfo?.payTime?.trim() || undefined,
    shipTime:
      logisticsInfo?.shippingTime?.trim() ||
      orderInfo?.shipTime?.trim() ||
      undefined,
    completeTime:
      logisticsInfo?.signedTime?.trim() ||
      orderInfo?.completeTime?.trim() ||
      undefined,
  };
}

export function resolveCurrency(
  orderInfo: OrderApi.OrderDetailInfo | undefined,
  paymentInfo: OrderApi.OrderPaymentInfo | undefined,
  routeCurrency?: string,
): string | undefined {
  const fromPayment = paymentInfo?.currency?.trim();
  if (fromPayment) {
    return fromPayment;
  }
  const fromOrder = orderInfo?.currency?.trim();
  if (fromOrder) {
    return fromOrder;
  }
  const fromRoute = routeCurrency?.trim();
  return fromRoute || undefined;
}

export function isTerminalOrderStatus(
  status: OrderApi.OrderStatusValue | undefined,
): boolean {
  return status !== undefined && TERMINAL_ORDER_STATUSES.has(status);
}

export function isRefundOrderStatus(
  status: OrderApi.OrderStatusValue | undefined,
): status is 6 | 7 {
  return status !== undefined && REFUND_ORDER_STATUSES.has(status);
}

export function isCancelledOrderStatus(
  status: OrderApi.OrderStatusValue | undefined,
): status is 5 {
  return status === CANCELLED_ORDER_STATUS;
}

export function getDetailTotalQuantity(
  orderInfo: OrderApi.OrderDetailInfo | undefined,
): number | undefined {
  const raw = orderInfo?.totalQuantity;
  if (raw === undefined || raw === null || raw === '') {
    return undefined;
  }
  const num = Number(raw);
  return Number.isNaN(num) ? undefined : num;
}

export function formatDetailField(
  value: null | number | string | undefined,
): string {
  if (value === undefined || value === null) {
    return '—';
  }
  const text = String(value).trim();
  return text || '—';
}

export function getPostageBuyer(
  postage: OrderApi.PostageInfo | undefined,
): string {
  if (!postage) {
    return '';
  }
  return postage.Buyer?.trim() || postage.buyer?.trim() || '';
}

export function buildPostageFullAddress(
  postage: OrderApi.PostageInfo | undefined,
): string {
  if (!postage) {
    return '';
  }
  const parts = [
    getPostageBuyer(postage),
    postage.streetAddress,
    postage.apartment,
    postage.city,
    postage.stateProvince,
    postage.zipPostalCode,
    postage.country,
  ]
    .map((part) =>
      part === undefined || part === null ? '' : String(part).trim(),
    )
    .filter(Boolean);
  return parts.join('\n');
}

export function getLogisticsTrackingNo(
  logistics: OrderApi.OrderLogisticsInfo | undefined,
): string {
  if (!logistics) {
    return '';
  }
  return logistics.trackingNum?.trim() || logistics.trackingNo?.trim() || '';
}

export function getLogisticsWaybillNo(
  logistics: OrderApi.OrderLogisticsInfo | undefined,
): string {
  if (!logistics) {
    return '';
  }
  return logistics.waybillNo?.trim() || '';
}

const TRACE_TYPE_LABEL_MAP: Record<string, string> = {
  TRACE_TYPE_HEAD: '头程',
  TRACE_TYPE_OPERATE: '运输中',
  TRACE_TYPE_TAIL: '尾程',
};

function parseTraceTime(time?: string): number {
  if (!time?.trim()) {
    return 0;
  }
  const ts = Date.parse(time.replace(' ', 'T'));
  return Number.isNaN(ts) ? 0 : ts;
}

/** 是否有跟踪号（Australia Post 等可无运输单号） */
export function hasLogisticsTrackingNo(
  logistics: OrderApi.OrderLogisticsInfo | undefined,
): boolean {
  return Boolean(getLogisticsTrackingNo(logistics));
}

function isTraceAllArray(
  traceAll: OrderApi.OrderLogisticsInfo['traceAll'],
): traceAll is OrderApi.LogisticsTraceAllArrayItem[] {
  return Array.isArray(traceAll);
}

function normalizeObjectTraceList(
  traceAll: OrderApi.LogisticsTraceAllObject,
): OrderApi.NormalizedLogisticsTrace[] {
  const details = traceAll.data?.[0]?.traceDetail;
  if (!Array.isArray(details)) {
    return [];
  }
  return details.map((item) => ({
    traceTime: item.traceTime,
    traceDesc: item.traceDesc,
    traceLocation: item.traceLocation?.trim() || undefined,
    traceType: item.traceType,
  }));
}

function normalizeArrayTraceList(
  traceAll: OrderApi.LogisticsTraceAllArrayItem[],
): OrderApi.NormalizedLogisticsTrace[] {
  const events = traceAll[0]?.events;
  if (!Array.isArray(events)) {
    return [];
  }
  return events.map((item) => ({
    traceTime: item.eventTime,
    traceDesc: item.activity,
    traceLocation: item.location?.trim() || undefined,
  }));
}

function sortTraceList(
  items: OrderApi.NormalizedLogisticsTrace[],
): OrderApi.NormalizedLogisticsTrace[] {
  return [...items].toSorted(
    (a, b) => parseTraceTime(b.traceTime) - parseTraceTime(a.traceTime),
  );
}

export function getLogisticsTraceList(
  logistics: OrderApi.OrderLogisticsInfo | undefined,
): OrderApi.NormalizedLogisticsTrace[] {
  const traceAll = logistics?.traceAll;
  if (!traceAll) {
    return [];
  }

  const items = isTraceAllArray(traceAll)
    ? normalizeArrayTraceList(traceAll)
    : normalizeObjectTraceList(traceAll);

  return sortTraceList(items);
}

export function getTraceTypeLabel(traceType?: string): string {
  const key = traceType?.trim();
  if (!key) {
    return '';
  }
  return TRACE_TYPE_LABEL_MAP[key] ?? '';
}

function isRefundPending(
  orderStatus: OrderApi.OrderStatusValue,
  paymentInfo: OrderApi.OrderPaymentInfo | undefined,
): boolean {
  if (orderStatus !== 6) {
    return false;
  }
  const refundStatus = paymentInfo?.refundStatus?.trim();
  if (!refundStatus) {
    return true;
  }
  return refundStatus === '待处理';
}

function formatRefundAmountLabel(
  paymentInfo: OrderApi.OrderPaymentInfo | undefined,
  currency?: string,
): string | undefined {
  const amount = paymentInfo?.refundAmount;
  if (amount === undefined || amount === null) {
    return undefined;
  }
  const formatted = formatMoneyAmount(amount, currency);
  return formatted === '—' ? undefined : formatted;
}

export function getStatusPanelTitle(
  orderStatus: OrderApi.OrderStatusValue | undefined,
  orderInfo: OrderApi.OrderDetailInfo | undefined,
  orderStatusName: string,
  paymentInfo?: OrderApi.OrderPaymentInfo,
  currency?: string,
): string {
  if (orderStatus === undefined) {
    return orderStatusName || '—';
  }

  if (orderStatus === 6) {
    const refundTypeLabel = formatRefundTypeLabel(paymentInfo?.refundType);
    if (isRefundPending(orderStatus, paymentInfo)) {
      return refundTypeLabel === '—'
        ? '退款待处理'
        : `${refundTypeLabel}待处理`;
    }
    return orderStatusName || '售后中';
  }

  if (orderStatus === 7) {
    const refundTypeLabel = formatRefundTypeLabel(paymentInfo?.refundType);
    const refundAmountLabel = formatRefundAmountLabel(paymentInfo, currency);
    if (refundTypeLabel !== '—' && refundAmountLabel) {
      return `已完成${refundTypeLabel} ${refundAmountLabel}`;
    }
    return orderStatusName || '已退款';
  }

  if (orderStatus === CANCELLED_ORDER_STATUS) {
    const cancelTime = orderInfo?.cancelTime?.trim();
    if (cancelTime) {
      return `已于 ${cancelTime} 取消`;
    }
    return '订单已取消';
  }

  switch (orderStatus) {
    case 1: {
      return '待支付';
    }
    case 2: {
      return '已支付，待发货';
    }
    case 3: {
      return '已发货';
    }
    case 4: {
      const completeTime = orderInfo?.completeTime?.trim();
      if (completeTime) {
        return `已于 ${completeTime} 送达`;
      }
      return '已完成';
    }
    default: {
      return orderStatusName || '—';
    }
  }
}

export function getStatusPanelSubtitle(
  orderStatus: OrderApi.OrderStatusValue | undefined,
  orderStatusName: string,
  orderInfo: OrderApi.OrderDetailInfo | undefined,
  paymentInfo?: OrderApi.OrderPaymentInfo,
  currency?: string,
): string {
  if (orderStatus === CANCELLED_ORDER_STATUS) {
    const cancelReason = orderInfo?.cancelReason?.trim();
    if (cancelReason) {
      return `原因：${cancelReason}`;
    }
  }

  if (orderStatus === 6 || orderStatus === 7) {
    const parts: string[] = [];
    const refundAmountLabel = formatRefundAmountLabel(paymentInfo, currency);
    const refundStatus = paymentInfo?.refundStatus?.trim();
    if (refundAmountLabel) {
      parts.push(`退款金额 ${refundAmountLabel}`);
    }
    if (refundStatus) {
      parts.push(refundStatus);
    }
    const refundReason = paymentInfo?.refundReason?.trim();
    if (refundReason) {
      parts.push(`原因：${refundReason}`);
    }
    if (parts.length > 0) {
      return parts.join(' · ');
    }
  }

  if (!orderStatusName) {
    return '';
  }
  if (orderStatus === 4 && orderInfo?.completeTime?.trim()) {
    return `${orderStatusName}。订单已成功送达。`;
  }
  return orderStatusName;
}

export function shouldShowOrderTimeline(
  orderStatus: OrderApi.OrderStatusValue | undefined,
): boolean {
  return orderStatus !== undefined;
}

export function getTimelineStepStatus(
  stepIndex: number,
  orderStatus: OrderApi.OrderStatusValue,
): TimelineStepStatus {
  const doneAt: OrderApi.OrderStatusValue[] = [1, 2, 3, 4];
  const threshold = doneAt[stepIndex];
  if (threshold === undefined) {
    return 'wait';
  }
  if (orderStatus >= threshold) {
    return 'finish';
  }
  if (stepIndex >= 2 && orderStatus === threshold - 1) {
    return 'process';
  }
  return 'wait';
}

function getTimelineStepTitle(
  step: (typeof TIMELINE_STEPS)[number],
  orderStatus: OrderApi.OrderStatusValue,
): string {
  if (
    step.key === 'paid' &&
    orderStatus === 1 &&
    'pendingTitle' in step &&
    step.pendingTitle
  ) {
    return step.pendingTitle;
  }
  return step.title;
}

function makeTimelineStep(
  title: string,
  status: TimelineStepStatus,
  descriptionParts: string[] = [],
): OrderTimelineStepItem {
  const description = descriptionParts.some(Boolean)
    ? descriptionParts.filter(Boolean).join(' · ')
    : undefined;
  return { title, status, description };
}

function buildFulfillmentTimelineSteps(
  times: OrderTimelineTimes,
  allFinished = false,
): OrderTimelineStepItem[] {
  return [
    makeTimelineStep(
      '已下单',
      allFinished ? 'finish' : times.createTime ? 'finish' : 'wait',
      times.createTime ? [times.createTime] : [],
    ),
    makeTimelineStep(
      '买家已付款',
      allFinished ? 'finish' : times.payTime ? 'finish' : 'wait',
      times.payTime ? [times.payTime] : [],
    ),
    ...(times.shipTime
      ? [makeTimelineStep('已发货', 'finish', [times.shipTime])]
      : []),
    ...(times.completeTime
      ? [makeTimelineStep('已送达', 'finish', [times.completeTime])]
      : []),
  ];
}

function buildCancelledFulfillmentSteps(
  times: OrderTimelineTimes,
): OrderTimelineStepItem[] {
  return [
    makeTimelineStep(
      '已下单',
      times.createTime ? 'finish' : 'wait',
      times.createTime ? [times.createTime] : [],
    ),
    ...(times.payTime
      ? [makeTimelineStep('买家已付款', 'finish', [times.payTime])]
      : []),
    ...(times.shipTime
      ? [makeTimelineStep('已发货', 'finish', [times.shipTime])]
      : []),
    ...(times.completeTime
      ? [makeTimelineStep('已送达', 'finish', [times.completeTime])]
      : []),
  ];
}

export function buildCancelledTimelineStepItems(
  times: OrderTimelineTimes,
  orderInfo?: OrderApi.OrderDetailInfo,
): OrderTimelineStepItem[] {
  const steps = buildCancelledFulfillmentSteps(times);

  const cancelDescription: string[] = [];
  const cancelTime = orderInfo?.cancelTime?.trim();
  const cancelReason = orderInfo?.cancelReason?.trim();
  if (cancelTime) {
    cancelDescription.push(cancelTime);
  }
  if (cancelReason) {
    cancelDescription.push(`原因：${cancelReason}`);
  }

  steps.push(makeTimelineStep('订单已取消', 'error', cancelDescription));

  return steps;
}

export function buildRefundTimelineStepItems(
  orderStatus: 6 | 7,
  times: OrderTimelineTimes,
  paymentInfo: OrderApi.OrderPaymentInfo | undefined,
  currency?: string,
): OrderTimelineStepItem[] {
  const steps = buildFulfillmentTimelineSteps(times, true);

  const refundTypeLabel = formatRefundTypeLabel(paymentInfo?.refundType);
  const refundReason = paymentInfo?.refundReason?.trim();
  const applyDescription: string[] = [];
  if (refundTypeLabel !== '—') {
    applyDescription.push(refundTypeLabel);
  }
  if (refundReason) {
    applyDescription.push(`原因：${refundReason}`);
  }

  steps.push(makeTimelineStep('买家申请退款', 'finish', applyDescription));

  const pending = isRefundPending(orderStatus, paymentInfo);
  const refundAmountLabel = formatRefundAmountLabel(paymentInfo, currency);
  const processDescription: string[] = [];
  if (refundAmountLabel) {
    processDescription.push(`退款 ${refundAmountLabel}`);
  }
  const refundStatus = paymentInfo?.refundStatus?.trim();
  if (refundStatus && orderStatus === 6) {
    processDescription.push(refundStatus);
  }

  steps.push(
    makeTimelineStep(
      orderStatus === 6 && pending ? '待商家处理退款' : '商家已处理退款',
      orderStatus === 7 ? 'finish' : pending ? 'process' : 'finish',
      processDescription,
    ),
  );

  const completeDescription: string[] = [];
  if (orderStatus === 7 && refundAmountLabel) {
    completeDescription.push(refundAmountLabel);
  }

  steps.push(
    makeTimelineStep(
      '退款完成',
      orderStatus === 7 ? 'finish' : 'wait',
      completeDescription,
    ),
  );

  return steps;
}

export function buildTimelineStepItems(
  orderStatus: OrderApi.OrderStatusValue,
  times: OrderTimelineTimes,
): OrderTimelineStepItem[] {
  return TIMELINE_STEPS.map((step, index) => {
    const time = times[step.timeKey]?.trim();
    const descriptionParts: string[] = [];
    if ('subLabel' in step && step.subLabel) {
      descriptionParts.push(step.subLabel);
    }
    if (time) {
      descriptionParts.push(time);
    }
    const description =
      descriptionParts.length > 0 ? descriptionParts.join(' · ') : undefined;
    return {
      title: getTimelineStepTitle(step, orderStatus),
      description,
      status: getTimelineStepStatus(index, orderStatus),
    };
  });
}

export function getBuyerContact(
  orderInfo: OrderApi.OrderDetailInfo | undefined,
  postageInfo: OrderApi.PostageInfo | undefined,
) {
  return {
    email:
      orderInfo?.recipientEmail?.trim() ||
      postageInfo?.recipientEmail?.trim() ||
      '',
    phone:
      orderInfo?.recipientPhone?.trim() ||
      postageInfo?.recipientPhone?.trim() ||
      '',
  };
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text.trim()) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
