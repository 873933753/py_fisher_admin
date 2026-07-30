import type { ProductCategoryOption } from '../types/product';

import type { SysDictApi } from '#/api/core/sysDict';

/** 将球衣分类树展平为下拉选项（列表筛选用） */
export function mapJerseyTreeToCategoryOptions(
  nodes: SysDictApi.JerseyTypeTreeNode[],
  prefix = '',
): ProductCategoryOption[] {
  const result: ProductCategoryOption[] = [];
  for (const node of nodes) {
    const label = prefix ? `${prefix} / ${node.label}` : node.label;
    result.push({ label, value: node.id });
    if (node.children?.length) {
      result.push(...mapJerseyTreeToCategoryOptions(node.children, label));
    }
  }
  return result;
}
