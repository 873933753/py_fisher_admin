import type { Key } from 'ant-design-vue/es/_util/type';
import type { DataNode } from 'ant-design-vue/es/tree';

import type { AdminRbacApi } from '#/api/core/admin-rbac';

export function findMenuNode(
  list: AdminRbacApi.MenuTreeNode[],
  id: number,
): AdminRbacApi.MenuTreeNode | null {
  for (const node of list) {
    if (node.id === id) {
      return node;
    }
    if (node.children.length > 0) {
      const found = findMenuNode(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function filterMenuByKeyword(
  nodes: AdminRbacApi.MenuTreeNode[],
  keyword: string,
): AdminRbacApi.MenuTreeNode[] {
  const lower = keyword.trim().toLowerCase();
  if (!lower) {
    return nodes;
  }

  const result: AdminRbacApi.MenuTreeNode[] = [];
  for (const node of nodes) {
    const children = node.children.length
      ? filterMenuByKeyword(node.children, keyword)
      : [];
    const hit =
      node.title.toLowerCase().includes(lower) ||
      String(node.id).includes(keyword.trim());

    if (hit) {
      result.push({
        ...node,
        children: node.children,
      });
    } else if (children.length > 0) {
      result.push({
        ...node,
        children,
      });
    }
  }
  return result;
}

export function mapMenuToTreeData(
  nodes: AdminRbacApi.MenuTreeNode[],
): DataNode[] {
  return nodes.map((node) => {
    const hasChildren = node.children.length > 0;
    return {
      key: node.id,
      title: node.title,
      children: hasChildren ? mapMenuToTreeData(node.children) : undefined,
      isLeaf: !hasChildren,
      menuType: node.menu_type,
    };
  });
}

export function collectRootExpandKeys(
  nodes: AdminRbacApi.MenuTreeNode[],
): Key[] {
  return nodes.map((node) => node.id);
}
