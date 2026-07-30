import type { SysDictApi } from '#/api/core/sysDict';

/** 三级联动 Cascader 节点 */
export interface CategoryCascaderOption {
  label: string;
  value: string;
  children?: CategoryCascaderOption[];
}

function hasChildNodes(
  node: SysDictApi.JerseyTypeTreeNode,
): node is SysDictApi.JerseyTypeTreeNode & {
  children: SysDictApi.JerseyTypeTreeNode[];
} {
  return Array.isArray(node.children) && node.children.length > 0;
}

/** 将球衣分类树转为 Cascader 选项（保留层级，不展平） */
export function mapJerseyTreeToCascaderOptions(
  nodes: SysDictApi.JerseyTypeTreeNode[],
): CategoryCascaderOption[] {
  return nodes.map((node) => ({
    label: node.label,
    value: node.id,
    children: hasChildNodes(node)
      ? mapJerseyTreeToCascaderOptions(node.children)
      : undefined,
  }));
}

/** 根据任意层级节点 id 还原 Cascader 路径 */
export function findCategoryPathById(
  nodes: SysDictApi.JerseyTypeTreeNode[],
  targetId: string,
  path: string[] = [],
): string[] | undefined {
  for (const node of nodes) {
    const nextPath = [...path, node.id];
    if (node.id === targetId) {
      return nextPath;
    }
    if (hasChildNodes(node)) {
      const found = findCategoryPathById(node.children, targetId, nextPath);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * 限制 Cascader 可选层级深度（用于父级选择：新增二级仅一级、新增三级仅到二级）
 * @param maxSelectableDepth 允许选中的最大路径长度（1=仅一级，2=一级→二级）
 */
export function limitCascaderOptionsDepth(
  options: CategoryCascaderOption[],
  maxSelectableDepth: number,
  currentDepth = 1,
): CategoryCascaderOption[] {
  if (maxSelectableDepth <= 0) return [];
  const mapped = options.map((node) => {
    if (currentDepth >= maxSelectableDepth) {
      return { label: node.label, value: node.value };
    }
    if (!node.children?.length) {
      return { label: node.label, value: node.value };
    }
    return {
      label: node.label,
      value: node.value,
      children: limitCascaderOptionsDepth(
        node.children,
        maxSelectableDepth,
        currentDepth + 1,
      ),
    };
  });

  // 须选到二级父级时，去掉没有二级子节点的一级（无法作为新增三级的父级路径）
  if (maxSelectableDepth >= 2 && currentDepth === 1) {
    return mapped.filter((node) => (node.children?.length ?? 0) > 0);
  }
  return mapped;
}

/** 判断路径是否在 options 中存在且长度等于指定层级深度 */
export function isValidPathAtDepth(
  path: string[],
  options: CategoryCascaderOption[],
  depth: number,
): boolean {
  if (path.length !== depth || depth <= 0) return false;
  let level = options;
  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    const node = level.find((o) => o.value === segment);
    if (!node) return false;
    if (i === path.length - 1) return true;
    level = node.children ?? [];
  }
  return false;
}

/** 编辑分类时从联动选项中排除自身及子孙节点 */
export function filterJerseyTreeExcludeIds(
  nodes: SysDictApi.JerseyTypeTreeNode[],
  excludeIds: Set<string>,
): SysDictApi.JerseyTypeTreeNode[] {
  return nodes
    .filter((n) => !excludeIds.has(n.id))
    .map((n) => {
      const filteredChildren = hasChildNodes(n)
        ? filterJerseyTreeExcludeIds(n.children, excludeIds)
        : null;
      return {
        ...n,
        children:
          filteredChildren && filteredChildren.length > 0
            ? filteredChildren
            : null,
      };
    });
}

/** 判断路径是否指向叶子节点 */
export function isLeafPathInOptions(
  path: string[],
  options: CategoryCascaderOption[],
): boolean {
  if (path.length === 0) return false;
  let level = options;
  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    const node = level.find((o) => o.value === segment);
    if (!node) return false;
    const isLast = i === path.length - 1;
    if (isLast) return !node.children?.length;
    level = node.children ?? [];
  }
  return false;
}

/** 根据叶子节点 id 还原 Cascader 路径（仅匹配叶子，避免误匹配一二级） */
export function findCategoryPathByLeafId(
  nodes: SysDictApi.JerseyTypeTreeNode[],
  leafId: string,
  path: string[] = [],
): string[] | undefined {
  for (const node of nodes) {
    const nextPath = [...path, node.id];
    if (!hasChildNodes(node) && node.id === leafId) {
      return nextPath;
    }
    if (hasChildNodes(node)) {
      const found = findCategoryPathByLeafId(node.children, leafId, nextPath);
      if (found) return found;
    }
  }
  return undefined;
}

/** 取树中第一个叶子节点 id（用于无 query 时的新增默认） */
export function findFirstLeafCategoryId(
  nodes: SysDictApi.JerseyTypeTreeNode[],
): string | undefined {
  for (const node of nodes) {
    if (hasChildNodes(node)) {
      const leaf = findFirstLeafCategoryId(node.children);
      if (leaf) return leaf;
    } else {
      return node.id;
    }
  }
  return undefined;
}
