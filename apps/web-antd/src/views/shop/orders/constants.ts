import type { AdminShopOrderApi } from '#/api/core/admin-shop-orders';

export const SHOP_ORDER_STATUS_UNPAID = 1 as const;
export const SHOP_ORDER_STATUS_PAID = 2 as const;
export const SHOP_ORDER_STATUS_CLOSED = 3 as const;
export const SHOP_ORDER_STATUS_REFUNDED = 4 as const;
export const SHOP_ORDER_STATUS_REFUNDING = 5 as const;

export const SHOP_ORDER_STATUS_LABEL: Record<
  AdminShopOrderApi.OrderStatus,
  string
> = {
  [SHOP_ORDER_STATUS_UNPAID]: '待支付',
  [SHOP_ORDER_STATUS_PAID]: '已支付',
  [SHOP_ORDER_STATUS_CLOSED]: '已关闭',
  [SHOP_ORDER_STATUS_REFUNDED]: '已退款',
  [SHOP_ORDER_STATUS_REFUNDING]: '退款中',
};

export const SHOP_ORDER_STATUS_OPTIONS: {
  label: string;
  value: '' | AdminShopOrderApi.OrderStatus;
}[] = [
  { label: '全部', value: '' },
  { label: '待支付', value: SHOP_ORDER_STATUS_UNPAID },
  { label: '已支付', value: SHOP_ORDER_STATUS_PAID },
  { label: '已关闭', value: SHOP_ORDER_STATUS_CLOSED },
  { label: '退款中', value: SHOP_ORDER_STATUS_REFUNDING },
  { label: '已退款', value: SHOP_ORDER_STATUS_REFUNDED },
];

export function getShopOrderStatusLabel(
  status: AdminShopOrderApi.OrderStatus,
): string {
  return SHOP_ORDER_STATUS_LABEL[status] ?? `未知(${status})`;
}

export function getShopOrderStatusTagColor(
  status: AdminShopOrderApi.OrderStatus,
): string {
  if (status === SHOP_ORDER_STATUS_UNPAID) {
    return 'orange';
  }
  if (status === SHOP_ORDER_STATUS_PAID) {
    return 'green';
  }
  if (status === SHOP_ORDER_STATUS_REFUNDING) {
    return 'blue';
  }
  if (status === SHOP_ORDER_STATUS_REFUNDED) {
    return 'purple';
  }
  return 'default';
}
