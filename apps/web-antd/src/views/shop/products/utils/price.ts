/** 分 → 元展示，如 29900 → ¥299.00 */
export function formatPriceCents(cents: number | undefined): string {
  if (cents === undefined || cents === null || Number.isNaN(cents)) {
    return '—';
  }
  return `¥${(cents / 100).toFixed(2)}`;
}

/** 元 → 分（提交接口） */
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100);
}

/** 分 → 元（表单回显） */
export function centsToYuan(cents: number): number {
  return cents / 100;
}
