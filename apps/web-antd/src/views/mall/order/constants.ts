import type { OrderApi } from '#/api/core/order';

export type OrderStatusFilterValue = OrderApi.OrderStatusValue | undefined;

export const ORDER_STATUS_OPTIONS = [
  { label: '待付款', value: 1 as const },
  { label: '待发货', value: 2 as const },
  { label: '已发货', value: 3 as const },
  { label: '已完成', value: 4 as const },
  { label: '已取消', value: 5 as const },
  { label: '售后中', value: 6 as const },
  { label: '已退款', value: 7 as const },
];

export type OrderListTabKey =
  | 'all'
  | 'cancel'
  | 'return'
  | 'unpaid'
  | 'unshipped';

export const ORDER_LIST_TABS: ReadonlyArray<{
  key: OrderListTabKey;
  label: string;
}> = [
  { key: 'all', label: '全部订单' },
  { key: 'unshipped', label: '未发货订单' },
  { key: 'unpaid', label: '未支付订单' },
  { key: 'return', label: '退货' },
  { key: 'cancel', label: '取消' },
];

export const DEFAULT_ORDER_LIST_TAB: OrderListTabKey = 'unshipped';

const ORDER_LIST_TAB_STATUS_MAP: Record<
  Exclude<OrderListTabKey, 'all'>,
  OrderApi.OrderStatusValue
> = {
  unpaid: 1,
  unshipped: 2,
  cancel: 5,
  return: 6,
};

export function resolveOrderListTab(
  orderStatus: OrderStatusFilterValue,
): OrderListTabKey {
  switch (orderStatus) {
    case 1: {
      return 'unpaid';
    }
    case 2: {
      return 'unshipped';
    }
    case 5: {
      return 'cancel';
    }
    case 6: {
      return 'return';
    }
    default: {
      return 'all';
    }
  }
}

export function resolveOrderStatusFromTab(
  tab: OrderListTabKey,
): OrderStatusFilterValue {
  if (tab === 'all') {
    return undefined;
  }
  return ORDER_LIST_TAB_STATUS_MAP[tab];
}

export function getDefaultOrderListOrderStatus(): OrderStatusFilterValue {
  return resolveOrderStatusFromTab(DEFAULT_ORDER_LIST_TAB);
}

/** 暂时隐藏商品批量折扣文案，恢复展示时改为 true */
export const SHOW_ORDER_ITEM_BULK_DISCOUNT = false;

/** 待付款订单可关闭 */
export function canCloseOrder(order: OrderApi.OrderRecord): boolean {
  return order.orderStatus === 1;
}

/** 待发货 / 已发货订单可手动退款 */
export function canManualRefund(order: OrderApi.OrderRecord): boolean {
  return order.orderStatus === 2 || order.orderStatus === 3;
}

export function formatOrderStatusQueryParam(
  value: OrderStatusFilterValue,
): null | OrderApi.OrderStatusValue | undefined {
  if (value === undefined || value === null) {
    return null;
  }
  return value;
}

export function formatSpecData(
  specData: OrderApi.OrderItemRecord['specData'],
): string {
  if (!specData) {
    return '';
  }
  if (typeof specData === 'string') {
    return specData.trim();
  }
  const entries = Object.entries(specData).filter(
    ([, v]) => v !== undefined && v !== null && String(v).trim() !== '',
  );
  if (entries.length === 0) {
    return '';
  }
  return entries.map(([key, value]) => `${key}: ${value}`).join(' ，');
}

export function getOrderTotalQuantity(
  order: OrderApi.OrderRecord,
): number | undefined {
  const spaced = order['totalQuantity '];
  if (typeof spaced === 'number' && !Number.isNaN(spaced)) {
    return spaced;
  }
  const normal = order.totalQuantity;
  if (typeof normal === 'number' && !Number.isNaN(normal)) {
    return normal;
  }
  return undefined;
}

export function getOrderPlacedTime(order: OrderApi.OrderRecord): string {
  return order.createTime?.trim() ?? '';
}

export function getOrderDisplayTime(order: OrderApi.OrderRecord): string {
  const placed = getOrderPlacedTime(order);
  if (placed) {
    return placed;
  }
  if (order.payTime?.trim()) {
    return order.payTime;
  }
  return '—';
}

export function formatMoneyAmount(
  amount: null | number | string | undefined,
  currency?: string,
): string {
  if (amount === undefined || amount === null || amount === '') {
    return '—';
  }
  const text = String(amount);
  if (currency && !text.toUpperCase().includes(currency.toUpperCase())) {
    return `${currency}${text}`;
  }
  return text;
}

function isFreeShippingFee(shippingFee: number | string): boolean {
  if (typeof shippingFee === 'number') {
    return shippingFee <= 0;
  }
  const trimmed = shippingFee.trim();
  if (!trimmed) {
    return true;
  }
  const fee = Number(trimmed);
  return !Number.isNaN(fee) && fee <= 0;
}

/** 邮费直接取接口 shippingFee：0 为免邮，有邮费时后台返回如 "+US$39.00\n postage" */
export function formatShippingFeeLabel(
  shippingFee: null | number | string | undefined,
  currency?: string,
): string {
  if (shippingFee === undefined || shippingFee === null) {
    return '免邮';
  }
  if (isFreeShippingFee(shippingFee)) {
    return '免邮';
  }
  if (typeof shippingFee === 'string') {
    return shippingFee.trim().replaceAll(/\s+/g, ' ');
  }
  return formatMoneyAmount(shippingFee, currency);
}

export function hasOrderRemark(remark: null | string | undefined): boolean {
  return Boolean(remark?.trim());
}

/** refundType: 1 全额退款，2 部分退款 */
/** Australia Post 仅需 trackingNo，其余物流公司需同时填写 waybillNo */
export const LOGISTICS_WITHOUT_WAYBILL = 'Australia Post';

export function requiresWaybillNo(logistics: string): boolean {
  const name = logistics.trim();
  return name !== '' && name !== LOGISTICS_WITHOUT_WAYBILL;
}

export function getOrderListLogisticsName(order: OrderApi.OrderRecord): string {
  return order.logistics?.trim() ?? '';
}

export function getOrderListLogisticsTrackingNo(
  order: OrderApi.OrderRecord,
): string {
  const value = order.trackingNo;
  if (value === undefined || value === null || value === '') {
    return '';
  }
  return String(value).trim();
}

export function getOrderListLogisticsTracesId(
  order: OrderApi.OrderRecord,
): string {
  const value = order.logisticsTracesId;
  if (value === undefined || value === null || value === '') {
    return '';
  }
  return String(value).trim();
}

export function canEditOrderLogistics(order: OrderApi.OrderRecord): boolean {
  return Boolean(getOrderListLogisticsTracesId(order));
}

export function getOrderListPostcode(order: OrderApi.OrderRecord): string {
  return order.postcode?.trim() ?? '';
}

export function hasOrderListLogistics(order: OrderApi.OrderRecord): boolean {
  return Boolean(
    getOrderListLogisticsName(order) || getOrderListLogisticsTrackingNo(order),
  );
}

/** 订单层级无物流信息时视为空 */
export function isOrderLogisticsEmpty(order: OrderApi.OrderRecord): boolean {
  return !hasOrderListLogistics(order);
}

/** 待发货且物流信息为空时可上传 */
export function canUploadLogistics(order: OrderApi.OrderRecord): boolean {
  return order.orderStatus === 2 && isOrderLogisticsEmpty(order);
}

export function formatRefundTypeLabel(
  refundType: null | number | undefined,
): string {
  if (refundType === 1) {
    return '全额退款';
  }
  if (refundType === 2) {
    return '部分退款';
  }
  return '—';
}

/** 订单评价结果：0=未评价，1=好评，2=中评，3=差评 */
export type OrderRatingResult = 0 | 1 | 2 | 3;

export function normalizeOrderRatingResult(value: unknown): OrderRatingResult {
  const rating = Number(value);
  if (rating === 1 || rating === 2 || rating === 3) {
    return rating;
  }
  return 0;
}

/** 已付款订单可代填评价（待发货 / 已发货 / 已完成 / 售后中） */
export function canSubmitOrderReview(order: OrderApi.OrderRecord): boolean {
  return [2, 3, 4, 6].includes(order.orderStatus);
}

/** 未评价时仅已付款订单展示笔图标；已评价始终展示 */
export function shouldShowOrderRatingBadge(
  order: OrderApi.OrderRecord,
): boolean {
  if (normalizeOrderRatingResult(order.ratingResult) !== 0) {
    return true;
  }
  return canSubmitOrderReview(order);
}

export function canSubmitOrderReviewAction(
  order: OrderApi.OrderRecord,
): boolean {
  return (
    canSubmitOrderReview(order) &&
    normalizeOrderRatingResult(order.ratingResult) === 0
  );
}

/** 发送者身份：1=用户, 2=客服 */
export const MAIL_SENDER_TYPE = {
  BUYER: 1,
  CS: 2,
} as const;

export const MAIL_BODY_MAX_LENGTH = 500;

export const MAIL_FILE_MAX_COUNT = 5;

/** 邮件已读状态：0=未读，1=已读 */
export function hasUnreadBuyerMail(order: OrderApi.OrderRecord): boolean {
  return order.mailIsRead === 0;
}

export function getMailFiles(record: { mailFile?: null | string[] }): string[] {
  const raw = record.mailFile;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((item) => Boolean(item?.trim()));
}
