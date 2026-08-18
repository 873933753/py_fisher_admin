import type { AdminShopRefundApi } from '#/api/core/admin-shop-refunds';

export const SHOP_REFUND_STATUS_PENDING = 10 as const;
export const SHOP_REFUND_STATUS_APPROVED = 20 as const;
export const SHOP_REFUND_STATUS_PROCESSING = 30 as const;
export const SHOP_REFUND_STATUS_SUCCESS = 40 as const;
export const SHOP_REFUND_STATUS_FAILED = 50 as const;
export const SHOP_REFUND_STATUS_REJECTED = 60 as const;
export const SHOP_REFUND_STATUS_CANCELLED = 70 as const;

export const SHOP_REFUND_REJECT_REASON_MAX = 200;
export const SHOP_REFUND_REJECT_REASON_MIN = 1;

export const SHOP_REFUND_STATUS_LABEL: Record<
  AdminShopRefundApi.RefundStatus,
  string
> = {
  [SHOP_REFUND_STATUS_PENDING]: '待审核',
  [SHOP_REFUND_STATUS_APPROVED]: '已同意，等待打款',
  [SHOP_REFUND_STATUS_PROCESSING]: '通道退款中',
  [SHOP_REFUND_STATUS_SUCCESS]: '退款成功',
  [SHOP_REFUND_STATUS_FAILED]: '通道失败',
  [SHOP_REFUND_STATUS_REJECTED]: '已拒绝',
  [SHOP_REFUND_STATUS_CANCELLED]: '已撤销',
};

export const SHOP_REFUND_STATUS_OPTIONS: {
  label: string;
  value: '' | AdminShopRefundApi.RefundStatus;
}[] = [
  { label: '全部', value: '' },
  { label: '待审核', value: SHOP_REFUND_STATUS_PENDING },
  { label: '通道退款中', value: SHOP_REFUND_STATUS_PROCESSING },
  { label: '退款成功', value: SHOP_REFUND_STATUS_SUCCESS },
  { label: '已拒绝', value: SHOP_REFUND_STATUS_REJECTED },
  { label: '已撤销', value: SHOP_REFUND_STATUS_CANCELLED },
];

export function getShopRefundStatusLabel(
  status: AdminShopRefundApi.RefundStatus,
): string {
  return SHOP_REFUND_STATUS_LABEL[status] ?? `未知(${status})`;
}

export function getShopRefundStatusTagColor(
  status: AdminShopRefundApi.RefundStatus,
): string {
  if (status === SHOP_REFUND_STATUS_PENDING) {
    return 'orange';
  }
  if (
    status === SHOP_REFUND_STATUS_APPROVED ||
    status === SHOP_REFUND_STATUS_PROCESSING
  ) {
    return 'blue';
  }
  if (status === SHOP_REFUND_STATUS_SUCCESS) {
    return 'green';
  }
  if (status === SHOP_REFUND_STATUS_FAILED) {
    return 'red';
  }
  return 'default';
}

export function canRejectShopRefund(
  status: AdminShopRefundApi.RefundStatus,
): boolean {
  return status === SHOP_REFUND_STATUS_PENDING;
}

export function canApproveShopRefund(
  status: AdminShopRefundApi.RefundStatus,
): boolean {
  return (
    status === SHOP_REFUND_STATUS_PENDING ||
    status === SHOP_REFUND_STATUS_PROCESSING
  );
}

export function canSyncShopRefund(
  status: AdminShopRefundApi.RefundStatus,
): boolean {
  return status === SHOP_REFUND_STATUS_PROCESSING;
}
