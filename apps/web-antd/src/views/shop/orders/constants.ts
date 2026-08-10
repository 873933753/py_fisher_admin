import type { AdminShopOrderApi } from '#/api/core/admin-shop-orders';

export const SHOP_ORDER_STATUS_CREATED = 1 as const;

export const SHOP_ORDER_STATUS_LABEL: Record<
  AdminShopOrderApi.OrderStatus,
  string
> = {
  [SHOP_ORDER_STATUS_CREATED]: '已创建',
};

export function getShopOrderStatusLabel(
  status: AdminShopOrderApi.OrderStatus,
): string {
  return SHOP_ORDER_STATUS_LABEL[status] ?? `未知(${status})`;
}

export function getShopOrderStatusTagColor(
  status: AdminShopOrderApi.OrderStatus,
): string {
  if (status === SHOP_ORDER_STATUS_CREATED) {
    return 'blue';
  }
  return 'default';
}
