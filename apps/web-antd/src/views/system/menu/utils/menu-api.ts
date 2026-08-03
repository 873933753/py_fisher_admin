import type { AdminRbacApi } from '#/api/core/admin-rbac';

import type { MenuApiRow } from '../types';

export const MENU_API_METHOD_OPTIONS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' },
  { label: '*（任意）', value: '*' },
] as const;

const ALLOWED_METHODS = new Set<string>(
  MENU_API_METHOD_OPTIONS.map((item) => item.value),
);

let menuApiRowSeed = 0;

export function createMenuApiRow(
  partial: Partial<MenuApiRow> = {},
): MenuApiRow {
  menuApiRowSeed += 1;
  return {
    key: partial.id
      ? `menu-api-${partial.id}`
      : `menu-api-new-${menuApiRowSeed}`,
    method: partial.method ?? '*',
    path_pattern: partial.path_pattern ?? '',
    remark: partial.remark ?? '',
    sort: partial.sort ?? 0,
    ...(partial.id !== undefined ? { id: partial.id } : {}),
  };
}

export function mapMenuApiRulesToRows(
  apis: AdminRbacApi.MenuApiRule[],
): MenuApiRow[] {
  return apis.map((api) =>
    createMenuApiRow({
      id: api.id,
      method: api.method,
      path_pattern: api.path_pattern,
      remark: api.remark ?? '',
      sort: api.sort,
    }),
  );
}

export function mapMenuApiRowsToPayload(
  rows: MenuApiRow[],
): AdminRbacApi.UpdateMenuApiItem[] {
  return rows.map((row) => {
    const remark = row.remark.trim();
    return {
      ...(row.id !== undefined ? { id: row.id } : {}),
      method: row.method,
      path_pattern: row.path_pattern.trim(),
      sort: row.sort,
      ...(remark ? { remark } : {}),
    };
  });
}

export function cloneMenuApiRows(rows: MenuApiRow[]): MenuApiRow[] {
  return rows.map((row) => ({ ...row }));
}

export function validateMenuApiRows(rows: MenuApiRow[]): null | string {
  const seen = new Set<string>();

  for (const [index, row] of rows.entries()) {
    const path = row.path_pattern.trim();
    const method = row.method.trim().toUpperCase();
    const rowNo = index + 1;

    if (!path) {
      return `第 ${rowNo} 行：path_pattern 不能为空`;
    }
    if (path.length > 255) {
      return `第 ${rowNo} 行：path_pattern 不能超过 255 个字符`;
    }
    if (!path.startsWith('/')) {
      return `第 ${rowNo} 行：path_pattern 必须以 / 开头`;
    }
    if (!ALLOWED_METHODS.has(method)) {
      return `第 ${rowNo} 行：无效 method: ${row.method}`;
    }

    const duplicateKey = `${method} ${path}`;
    if (seen.has(duplicateKey)) {
      return `重复接口: ${method} ${path}`;
    }
    seen.add(duplicateKey);
  }

  return null;
}
