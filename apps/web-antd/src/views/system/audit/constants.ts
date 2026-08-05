import dayjs from 'dayjs';

export const AUDIT_SUCCESS_FILTER_OPTIONS = [
  { label: '全部', value: '' },
  { label: '成功', value: 'true' },
  { label: '失败', value: 'false' },
] as const;

export type AuditSuccessFilterValue = '' | 'false' | 'true';

export function formatAuditUnixTime(
  value: null | number | undefined,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  return dayjs.unix(value).format('YYYY-MM-DD HH:mm:ss');
}

export function getAuditSuccessLabel(success: boolean): string {
  return success ? '成功' : '失败';
}

export function getAuditSuccessTagColor(success: boolean): string {
  return success ? 'success' : 'error';
}

export function displayAuditText(
  value: null | number | string | undefined,
): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value);
}

/** 摘要字段：能解析为 JSON 则美化，否则原文展示 */
export function formatAuditSummary(
  value: null | string | undefined,
): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
}

export function dateToStartUnix(date: string): number {
  return dayjs(date).startOf('day').unix();
}

export function dateToEndUnix(date: string): number {
  return dayjs(date).endOf('day').unix();
}
