import type { OrderApi } from '#/api/core/order';

export function getOrderFlowBuyerName(
  items: OrderApi.OrderFlowItemRecord[],
): string {
  const first = items[0];
  if (!first) {
    return '—';
  }
  const name = [first.firstName, first.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  return name || '—';
}

export function getOrderFlowItemQuantity(
  items: OrderApi.OrderFlowItemRecord[],
): number {
  return items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
}
