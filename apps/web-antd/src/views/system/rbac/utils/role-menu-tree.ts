import type { Key } from 'ant-design-vue/es/_util/type';
import type { DataNode } from 'ant-design-vue/es/tree';

import type { AdminRbacApi } from '#/api/core/admin-rbac';

export function mapMenuToCheckableTreeData(
  nodes: AdminRbacApi.MenuTreeNode[],
  readOnly = false,
): DataNode[] {
  return nodes.map((node) => {
    const hasChildren = node.children.length > 0;
    return {
      key: node.id,
      title: node.title,
      disableCheckbox: readOnly,
      children: hasChildren
        ? mapMenuToCheckableTreeData(node.children, readOnly)
        : undefined,
      isLeaf: !hasChildren,
    };
  });
}

export function collectAllMenuExpandKeys(
  nodes: AdminRbacApi.MenuTreeNode[],
): Key[] {
  const keys: Key[] = [];
  for (const node of nodes) {
    keys.push(node.id);
    if (node.children.length > 0) {
      keys.push(...collectAllMenuExpandKeys(node.children));
    }
  }
  return keys;
}

export function normalizeCheckedMenuKeys(
  checkedKeys: Key[] | { checked: Key[]; halfChecked: Key[] },
): number[] {
  const keys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;
  return keys.map((key) => Number(key));
}

export interface MenuCheckedKeyState {
  checked: Key[];
  halfChecked: Key[];
}

export function toCheckedMenuKeyState(menuIds: number[]): MenuCheckedKeyState {
  return {
    checked: menuIds,
    halfChecked: [],
  };
}

export function applyMenuTreeCheck(
  state: MenuCheckedKeyState,
  checked: Key[] | { checked: Key[]; halfChecked: Key[] },
) {
  if (Array.isArray(checked)) {
    state.checked = checked;
    state.halfChecked = [];
    return;
  }
  state.checked = checked.checked;
  state.halfChecked = checked.halfChecked;
}
