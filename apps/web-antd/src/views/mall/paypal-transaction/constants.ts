import type { PaypalApi } from '#/api/core/paypal';

export const TXN_TYPE_FILTER_OPTIONS: {
  label: string;
  value: PaypalApi.TxnTypeValue;
}[] = [
  { label: '收款', value: 'CAPTURE' },
  { label: '退款', value: 'REFUND' },
];

export const DEFAULT_TXN_TYPE_FILTER: PaypalApi.TxnTypeValue = 'CAPTURE';

const TXN_TYPE_LABEL_MAP: Record<string, string> = {
  CREATE_ORDER: '创建订单',
  CAPTURE: '收款',
  REFUND: '退款',
};

const TXN_STATUS_LABEL_MAP: Record<string, string> = {
  CREATED: '已创建',
  COMPLETED: '已完成',
  FAILED: '失败',
};

export function getTxnTypeLabel(value: null | string | undefined) {
  if (!value) {
    return '—';
  }
  return TXN_TYPE_LABEL_MAP[value] ?? value;
}

export function getTxnStatusLabel(value: null | string | undefined) {
  if (!value) {
    return '—';
  }
  return TXN_STATUS_LABEL_MAP[value] ?? value;
}

export function formatTransactionAmount(
  amount: null | number | undefined,
  currency: null | string | undefined,
) {
  if (amount === undefined || amount === null) {
    return '—';
  }
  const currencyText = currency?.trim();
  return currencyText ? `${amount} ${currencyText}` : String(amount);
}
