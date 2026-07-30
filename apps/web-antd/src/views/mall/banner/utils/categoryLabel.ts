import type { SysDictApi } from '#/api/core/sysDict';

import {
  findCategoryPathById,
  findCategoryPathByLeafId,
} from '../../product/utils/categoryOptions';

/** 根据 dictIds（逗号路径或叶子 id）解析分类展示名 */
export function resolveCategoryLabelFromDictIds(
  dictIds: string | undefined,
  nodes: SysDictApi.JerseyTypeTreeNode[],
): string {
  const raw = (dictIds ?? '').trim();
  if (!raw) return '—';

  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const leafId = parts[parts.length - 1] ?? '';
  const pathIds = findCategoryPathById(nodes, leafId) ?? parts;
  if (pathIds.length === 0) return '—';

  const labels: string[] = [];
  let current: SysDictApi.JerseyTypeTreeNode[] = nodes;

  for (const id of pathIds) {
    const node = current.find((n) => n.id === id);
    if (!node) break;
    labels.push(node.label);
    current = node.children ?? [];
  }

  return labels.length > 0 ? labels.join(' / ') : '—';
}

/** 根据叶子类目 id 解析「一级 / 二级 / 三级」展示名 */
export function resolveCategoryLabelFromLeafId(
  leafId: string,
  nodes: SysDictApi.JerseyTypeTreeNode[],
): string {
  const id = leafId.trim();
  if (!id) return '—';
  const pathIds = findCategoryPathByLeafId(nodes, id);
  if (!pathIds?.length) return id;

  const labels: string[] = [];
  let current: SysDictApi.JerseyTypeTreeNode[] = nodes;
  for (const segment of pathIds) {
    const node = current.find((n) => n.id === segment);
    if (!node) break;
    labels.push(node.label);
    current = node.children ?? [];
  }
  return labels.length > 0 ? labels.join(' / ') : id;
}
