/** 分 → 元展示，如 29900 → ¥299.00 */
export function formatPriceCents(cents: number | undefined): string {
  if (cents === undefined || cents === null || Number.isNaN(cents)) {
    return '—';
  }
  return `¥${(cents / 100).toFixed(2)}`;
}

/** 元字符串展示（订单接口已是元，不要再除 100），如 "1097.00" → ￥1097.00 */
export function formatPriceYuan(amount: string | undefined): string {
  if (amount === undefined || amount === null || amount.trim() === '') {
    return '—';
  }
  return `￥${amount}`;
}

/** 空字符串展示为 — */
export function formatEmptyText(value: string | undefined): string {
  if (value === undefined || value === null || value.trim() === '') {
    return '—';
  }
  return value;
}

/** 元 → 分（提交接口） */
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100);
}

/** 分 → 元（表单回显） */
export function centsToYuan(cents: number): number {
  return cents / 100;
}
