import type { Key } from 'ant-design-vue/es/_util/type';
import type { DataNode } from 'ant-design-vue/es/tree';

import type { AdminRbacApi } from '#/api/core/admin-rbac';

const MENU_KEY_PREFIX = 'menu:';

export function formatMenuKey(menuId: number): string {
  return `${MENU_KEY_PREFIX}${menuId}`;
}

export function parseMenuKey(key: Key): number | null {
  const value = String(key);
  if (!value.startsWith(MENU_KEY_PREFIX)) {
    return null;
  }
  const id = Number(value.slice(MENU_KEY_PREFIX.length));
  return Number.isFinite(id) ? id : null;
}

export interface RoleAccessTreeContext {
  apiMenuMap: Map<number, number>;
  apiRuleMap: Map<number, AdminRbacApi.MenuApiRule>;
  apisByMenu: Map<number, AdminRbacApi.MenuApiRule[]>;
  loadedMenuApiIds: Set<number>;
  menuChildrenMap: Map<number, number[]>;
  menuDescendantsMap: Map<number, number[]>;
  menuParentMap: Map<number, null | number>;
  menuTree: AdminRbacApi.MenuTreeNode[];
  readOnly: boolean;
  treeData: DataNode[];
}

function collectMenuRelations(
  nodes: AdminRbacApi.MenuTreeNode[],
  parentId: null | number,
  menuParentMap: Map<number, null | number>,
  menuChildrenMap: Map<number, number[]>,
  allMenuIds: number[],
) {
  for (const node of nodes) {
    allMenuIds.push(node.id);
    menuParentMap.set(node.id, parentId);
    const childMenuIds = node.children.map((child) => child.id);
    menuChildrenMap.set(node.id, childMenuIds);

    if (node.children.length > 0) {
      collectMenuRelations(
        node.children,
        node.id,
        menuParentMap,
        menuChildrenMap,
        allMenuIds,
      );
    }
  }
}

export function formatApiNodeTitle(api: AdminRbacApi.MenuApiRule): string {
  const base = `${api.method} ${api.path_pattern}`;
  const remark = api.remark?.trim();
  return remark ? `${base}（${remark}）` : base;
}

function buildMenuDescendantsMap(
  menuIds: number[],
  menuChildrenMap: Map<number, number[]>,
): Map<number, number[]> {
  const descendantsMap = new Map<number, number[]>();

  function collectDescendants(menuId: number): number[] {
    const cached = descendantsMap.get(menuId);
    if (cached) {
      return cached;
    }

    const children = menuChildrenMap.get(menuId) ?? [];
    const descendants: number[] = [];
    for (const childId of children) {
      descendants.push(childId);
      descendants.push(...collectDescendants(childId));
    }
    descendantsMap.set(menuId, descendants);
    return descendants;
  }

  for (const menuId of menuIds) {
    collectDescendants(menuId);
  }

  return descendantsMap;
}

function mapMenuToTreeNode(
  node: AdminRbacApi.MenuTreeNode,
  readOnly: boolean,
): DataNode {
  const menuChildren = node.children.map((child) =>
    mapMenuToTreeNode(child, readOnly),
  );

  return {
    key: formatMenuKey(node.id),
    title: node.title,
    disableCheckbox: readOnly,
    children: menuChildren.length > 0 ? menuChildren : undefined,
    isLeaf: menuChildren.length === 0,
  };
}

export function buildRoleAccessTreeContext(
  menuTree: AdminRbacApi.MenuTreeNode[],
  readOnly = false,
): RoleAccessTreeContext {
  const menuParentMap = new Map<number, null | number>();
  const menuChildrenMap = new Map<number, number[]>();
  const allMenuIds: number[] = [];

  collectMenuRelations(
    menuTree,
    null,
    menuParentMap,
    menuChildrenMap,
    allMenuIds,
  );

  const menuDescendantsMap = buildMenuDescendantsMap(
    allMenuIds,
    menuChildrenMap,
  );

  return {
    apiMenuMap: new Map(),
    apiRuleMap: new Map(),
    apisByMenu: new Map(),
    loadedMenuApiIds: new Set(),
    menuChildrenMap,
    menuDescendantsMap,
    menuParentMap,
    menuTree,
    readOnly,
    treeData: menuTree.map((node) => mapMenuToTreeNode(node, readOnly)),
  };
}

export function appendMenuApis(
  ctx: RoleAccessTreeContext,
  menuId: number,
  apis: AdminRbacApi.MenuApiRule[],
): void {
  if (ctx.loadedMenuApiIds.has(menuId)) {
    return;
  }

  ctx.loadedMenuApiIds.add(menuId);
  ctx.apisByMenu.set(menuId, apis);

  for (const api of apis) {
    ctx.apiRuleMap.set(api.id, api);
    ctx.apiMenuMap.set(api.id, menuId);
  }
}

export function getMenusNeedingApiLoad(
  ctx: RoleAccessTreeContext,
  menuIds: number[],
): number[] {
  return menuIds.filter((menuId) => !ctx.loadedMenuApiIds.has(menuId));
}

export function getDefaultExpandedMenuKeys(
  ctx: RoleAccessTreeContext,
): Key[] {
  const keys: Key[] = [];
  for (const [menuId, children] of ctx.menuChildrenMap) {
    if (children.length > 0) {
      keys.push(formatMenuKey(menuId));
    }
  }
  return keys;
}

export function menuIdsToCheckedKeys(menuIds: Iterable<number>): Key[] {
  return [...menuIds].map((id) => formatMenuKey(id));
}

export function buildAccessPayload(
  checkedMenuIds: Set<number>,
  checkedApiIds: Set<number>,
): {
  menu_api_ids: number[];
  menu_ids: number[];
} {
  return {
    menu_ids: [...checkedMenuIds],
    menu_api_ids: [...checkedApiIds],
  };
}

function collectAffectedMenuIds(
  ctx: RoleAccessTreeContext,
  menuId: number,
): number[] {
  const descendants = ctx.menuDescendantsMap.get(menuId) ?? [];
  return [menuId, ...descendants];
}

function removeApisForMenus(
  checkedApiIds: Set<number>,
  ctx: RoleAccessTreeContext,
  menuIds: number[],
) {
  for (const menuId of menuIds) {
    const apis = ctx.apisByMenu.get(menuId) ?? [];
    for (const api of apis) {
      checkedApiIds.delete(api.id);
    }
  }
}

export function applyMenuCheck(
  ctx: RoleAccessTreeContext,
  checkedMenuIds: Set<number>,
  checkedApiIds: Set<number>,
  menuId: number,
  isChecking: boolean,
): void {
  const affectedMenuIds = collectAffectedMenuIds(ctx, menuId);

  if (isChecking) {
    for (const id of affectedMenuIds) {
      checkedMenuIds.add(id);
    }
    return;
  }

  for (const id of affectedMenuIds) {
    checkedMenuIds.delete(id);
  }
  removeApisForMenus(checkedApiIds, ctx, affectedMenuIds);
}

export function applyApiCheck(
  ctx: RoleAccessTreeContext,
  checkedMenuIds: Set<number>,
  checkedApiIds: Set<number>,
  apiId: number,
  isChecking: boolean,
): void {
  if (isChecking) {
    checkedApiIds.add(apiId);
    const menuId = ctx.apiMenuMap.get(apiId);
    if (menuId != null) {
      checkedMenuIds.add(menuId);
    }
    return;
  }

  checkedApiIds.delete(apiId);
}

export function normalizeTreeCheckedKeys(
  checkedKeys: Key[] | { checked: Key[]; halfChecked: Key[] },
): Key[] {
  return Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;
}
