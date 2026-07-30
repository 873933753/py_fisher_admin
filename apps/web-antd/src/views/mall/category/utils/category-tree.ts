import type { Key } from 'ant-design-vue/es/_util/type';
import type { DataNode } from 'ant-design-vue/es/tree';

import type { CategoryNode, RawNode } from '../types/category';

import { MAX_CATEGORY_LEVEL } from '../constants';

export function normalizeImported(raw: RawNode[]): CategoryNode[] {
  function walk(nodes: RawNode[], parent: CategoryNode | null): CategoryNode[] {
    return nodes.map((rn, idx) => {
      const id = String(rn.id);
      const parentIdStr = rn.parentId;
      const immediateParentId =
        parentIdStr === '0' ? null : parentIdStr.split(',').pop() || null;
      const level = parent ? parent.level + 1 : 1;
      const arr = Array.isArray(rn.children) ? rn.children : [];
      const node: CategoryNode = {
        id,
        name: rn.label || rn.dictCode,
        dictCode: rn.dictCode,
        dictDesc: rn.dictDesc ?? '',
        label: rn.label,
        icon: rn.icon || '',
        parentId: parentIdStr,
        immediateParentId,
        sort: rn.sort ?? idx + 1,
        level,
        productCount: Number(id) % 11,
        createTime: `2025-12-${String((Number(id) % 28) + 1).padStart(2, '0')} 10:00:00`,
        deletedAt: null,
        children: undefined,
      };
      if (arr.length > 0) {
        node.children = walk(arr, node);
      }
      return node;
    });
  }
  return walk(raw, null);
}

export function collectExpandableKeys(nodes: CategoryNode[]): Key[] {
  const keys: Key[] = [];
  for (const n of nodes) {
    if (n.deletedAt) continue;
    if (n.children?.some((c) => !c.deletedAt)) {
      keys.push(
        n.id,
        ...collectExpandableKeys(n.children.filter((c) => !c.deletedAt)),
      );
    }
  }
  return keys;
}

export function findNode(
  list: CategoryNode[],
  id: string,
): CategoryNode | null {
  for (const n of list) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const f = findNode(n.children, id);
      if (f) return f;
    }
  }
  return null;
}

export function findParentPosition(
  list: CategoryNode[],
  id: string,
  parent: CategoryNode | null = null,
): null | {
  index: number;
  parent: CategoryNode | null;
  siblings: CategoryNode[];
} {
  for (let i = 0; i < list.length; i++) {
    const n = list[i];
    if (!n || n.deletedAt) continue;
    if (n.id === id) return { parent, index: i, siblings: list };
    if (n.children?.length) {
      const f = findParentPosition(n.children, id, n);
      if (f) return f;
    }
  }
  return null;
}

export function collectSubtreeIds(root: CategoryNode | null): Set<string> {
  const s = new Set<string>();
  function w(n: CategoryNode) {
    s.add(n.id);
    n.children
      ?.filter((c) => !c.deletedAt)
      .forEach((child) => {
        w(child);
      });
  }
  if (root) w(root);
  return s;
}

export function filterDeleted(nodes: CategoryNode[]): CategoryNode[] {
  return nodes
    .filter((n) => !n.deletedAt)
    .map((n) => ({
      ...n,
      children: n.children?.length ? filterDeleted(n.children) : undefined,
    }));
}

export function filterByKeyword(
  nodes: CategoryNode[],
  kw: string,
): CategoryNode[] {
  const lower = kw.trim().toLowerCase();
  if (!lower) {
    return nodes.filter((n) => !n.deletedAt);
  }
  const out: CategoryNode[] = [];
  for (const n of nodes) {
    if (n.deletedAt) continue;
    const sub = n.children ? filterByKeyword(n.children, kw) : [];
    const hit =
      n.name.toLowerCase().includes(lower) || n.id.includes(kw.trim());
    if (hit) {
      out.push({
        ...n,
        children: n.children?.filter((c) => !c.deletedAt),
      });
    } else if (sub.length > 0) {
      out.push({ ...n, children: sub });
    }
  }
  return out;
}

/** 构建树数据；达到最大层级时视为叶子且不展示子节点（与业务最大层级一致） */
export function mapCategoryToTreeData(
  nodes: CategoryNode[],
  maxLevel: number = MAX_CATEGORY_LEVEL,
): DataNode[] {
  return nodes
    .filter((n) => !n.deletedAt)
    .map((n) => {
      const atMaxLevel = n.level >= maxLevel;
      const childList = n.children?.filter((c) => !c.deletedAt) ?? [];
      const hasChildrenInData = childList.length > 0;
      const children =
        !atMaxLevel && hasChildrenInData
          ? mapCategoryToTreeData(childList, maxLevel)
          : undefined;

      const node: DataNode = {
        key: n.id,
        title: n.name,
        children,
        isLeaf: atMaxLevel || !hasChildrenInData,
      };
      if (atMaxLevel) {
        Object.assign(node, {
          class: 'cat-tree-max-level',
          className: 'cat-tree-max-level',
        });
      }
      return node;
    });
}

export function firstSelectableId(nodes: CategoryNode[]): null | string {
  const n = nodes.find((x) => !x.deletedAt);
  return n?.id ?? null;
}

export function nodeInForest(forest: CategoryNode[], id: string): boolean {
  for (const n of forest) {
    if (n.deletedAt) continue;
    if (n.id === id) return true;
    if (n.children?.length) {
      const ch = n.children.filter((c) => !c.deletedAt);
      if (nodeInForest(ch, id)) return true;
    }
  }
  return false;
}

export function computeChildParentId(parent: CategoryNode): string {
  if (parent.parentId === '0') return parent.id;
  return `${parent.parentId},${parent.id}`;
}

export function maxNumericId(nodes: CategoryNode[]): number {
  let m = 0;
  function walk(list: CategoryNode[]) {
    for (const n of list) {
      const v = Number(n.id);
      if (!Number.isNaN(v)) m = Math.max(m, v);
      if (n.children?.length) walk(n.children);
    }
  }
  walk(nodes);
  return m;
}

export function sortSiblings(siblings: CategoryNode[]) {
  siblings.sort((a, b) => a.sort - b.sort || Number(a.id) - Number(b.id));
}

/** @returns 是否成功交换 */
export function tryMoveInSiblings(
  tree: CategoryNode[],
  id: string,
  dir: -1 | 1,
): boolean {
  const pos = findParentPosition(tree, id);
  if (!pos) return false;
  const { siblings } = pos;
  const active = siblings.filter((n) => !n.deletedAt);
  sortSiblings(active);
  const idx = active.findIndex((n) => n.id === id);
  const j = idx + dir;
  if (idx < 0 || j < 0 || j >= active.length) {
    return false;
  }
  const a = active[idx];
  const b = active[j];
  if (!a || !b) return false;
  const tmp = a.sort;
  a.sort = b.sort;
  b.sort = tmp;
  sortSiblings(siblings);
  return true;
}

/**
 * 按表格展示顺序重排父节点下未删除的子节点，并重写 sort 为顺序索引。
 * @returns 是否成功
 */
export function reorderActiveChildren(
  tree: CategoryNode[],
  parentId: string,
  oldIndex: number,
  newIndex: number,
): boolean {
  const parent = findNode(tree, parentId);
  if (!parent?.children?.length) return false;
  const active = [...parent.children.filter((c) => !c.deletedAt)].toSorted(
    (a, b) => a.sort - b.sort || Number(a.id) - Number(b.id),
  );
  if (oldIndex < 0 || oldIndex >= active.length) return false;
  if (newIndex < 0 || newIndex >= active.length) return false;
  const [moved] = active.splice(oldIndex, 1);
  if (!moved) return false;
  active.splice(newIndex, 0, moved);
  active.forEach((n, i) => {
    n.sort = i;
  });
  const deletedOnly = parent.children.filter((c) => c.deletedAt);
  deletedOnly.forEach((n, i) => {
    n.sort = active.length + i + 1;
  });
  sortSiblings(parent.children);
  return true;
}

export function extractNode(
  tree: CategoryNode[],
  nodeId: string,
): CategoryNode | null {
  const pos = findParentPosition(tree, nodeId);
  if (!pos) return null;
  const [removed] = pos.siblings.splice(pos.index, 1);
  if (pos.parent && pos.siblings.length === 0) {
    pos.parent.children = undefined;
  }
  return removed ?? null;
}

export function reparentDetached(
  detached: CategoryNode,
  newParent: CategoryNode | null,
) {
  if (!newParent) {
    detached.parentId = '0';
    detached.level = 1;
    detached.immediateParentId = null;
    return;
  }
  detached.parentId = computeChildParentId(newParent);
  detached.level = newParent.level + 1;
  detached.immediateParentId = newParent.id;
}

export function reparentLeaf(
  tree: CategoryNode[],
  nodeId: string,
  newParentId: string | undefined,
  maxLevel: number = MAX_CATEGORY_LEVEL,
): boolean {
  const node = findNode(tree, nodeId);
  if (!node) return false;

  if (newParentId === undefined || newParentId === '') {
    const detached = extractNode(tree, nodeId);
    if (!detached) return false;
    reparentDetached(detached, null);
    tree.push(detached);
    sortSiblings(tree);
    return true;
  }

  const parent = findNode(tree, newParentId);
  if (!parent || parent.deletedAt) return false;
  if (parent.level >= maxLevel) return false;
  if (parent.level + 1 > maxLevel) return false;

  const detached = extractNode(tree, nodeId);
  if (!detached) return false;
  reparentDetached(detached, parent);
  if (!parent.children) parent.children = [];
  parent.children.push(detached);
  sortSiblings(parent.children);
  return true;
}

export function mapTreeSelectNodes(
  nodes: CategoryNode[],
  excludeIds: Set<string>,
  maxLevel: number,
  /** 指定时仅该层级的节点可选（用于「新增 N 级 → 父级为 N-1 级」） */
  selectableParentLevel?: null | number,
): Array<Record<string, unknown>> {
  return nodes
    .filter((n) => !n.deletedAt && !excludeIds.has(n.id))
    .map((n) => {
      const levelMismatch =
        typeof selectableParentLevel === 'number' &&
        n.level !== selectableParentLevel;
      return {
        title: n.name,
        value: n.id,
        disabled: n.level >= maxLevel || levelMismatch,
        children:
          n.children?.length === undefined
            ? undefined
            : mapTreeSelectNodes(
                n.children.filter((c) => !c.deletedAt),
                excludeIds,
                maxLevel,
                selectableParentLevel,
              ),
      };
    });
}
