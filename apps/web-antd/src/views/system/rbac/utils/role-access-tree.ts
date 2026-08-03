import type { Key } from 'ant-design-vue/es/_util/type';
import type { DataNode } from 'ant-design-vue/es/tree';

import type { AdminRbacApi } from '#/api/core/admin-rbac';

const MENU_KEY_PREFIX = 'menu:';
const API_KEY_PREFIX = 'api:';

export function formatMenuKey(menuId: number): string {
  return `${MENU_KEY_PREFIX}${menuId}`;
}

export function formatApiKey(apiId: number): string {
  return `${API_KEY_PREFIX}${apiId}`;
}

export function parseAccessKey(
  key: Key,
): { id: number; type: 'api' | 'menu' } | null {
  const value = String(key);
  if (value.startsWith(MENU_KEY_PREFIX)) {
    const id = Number(value.slice(MENU_KEY_PREFIX.length));
    return Number.isFinite(id) ? { type: 'menu', id } : null;
  }
  if (value.startsWith(API_KEY_PREFIX)) {
    const id = Number(value.slice(API_KEY_PREFIX.length));
    return Number.isFinite(id) ? { type: 'api', id } : null;
  }
  return null;
}

export interface RoleAccessTreeContext {
  apiMenuMap: Map<number, number>;
  apiRuleMap: Map<number, AdminRbacApi.MenuApiRule>;
  apisByMenu: Map<number, AdminRbacApi.MenuApiRule[]>;
  loadedMenuApiIds: Set<number>;
  menuApisMap: Map<number, number[]>;
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

function formatApiNodeTitle(api: AdminRbacApi.MenuApiRule): string {
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

function mapMenuToAccessTreeNode(
  node: AdminRbacApi.MenuTreeNode,
  ctx: RoleAccessTreeContext,
): DataNode {
  const menuChildren = node.children.map((child) =>
    mapMenuToAccessTreeNode(child, ctx),
  );
  const hasMenuChildren = node.children.length > 0;
  const apisLoaded = ctx.loadedMenuApiIds.has(node.id);

  let apiChildren: DataNode[] = [];
  if (apisLoaded) {
    const apiIds = ctx.menuApisMap.get(node.id) ?? [];
    apiChildren = apiIds.map((apiId) => {
      const api = ctx.apiRuleMap.get(apiId);
      return {
        key: formatApiKey(apiId),
        title: api ? formatApiNodeTitle(api) : `API ${apiId}`,
        disableCheckbox: ctx.readOnly,
        isLeaf: true,
      };
    });
  }

  const children = [...menuChildren, ...apiChildren];
  const isLeaf =
    !hasMenuChildren && apisLoaded && apiChildren.length === 0;

  return {
    key: formatMenuKey(node.id),
    title: node.title,
    disableCheckbox: ctx.readOnly,
    children: children.length > 0 ? children : undefined,
    isLeaf,
  };
}

function rebuildTreeData(ctx: RoleAccessTreeContext): DataNode[] {
  return ctx.menuTree.map((node) => mapMenuToAccessTreeNode(node, ctx));
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

  const ctx: RoleAccessTreeContext = {
    apiMenuMap: new Map(),
    apiRuleMap: new Map(),
    apisByMenu: new Map(),
    loadedMenuApiIds: new Set(),
    menuApisMap: new Map(),
    menuChildrenMap,
    menuDescendantsMap,
    menuParentMap,
    menuTree,
    readOnly,
    treeData: [],
  };

  ctx.treeData = rebuildTreeData(ctx);
  return ctx;
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

  const apiIds = apis.map((api) => api.id);
  ctx.menuApisMap.set(menuId, apiIds);

  for (const api of apis) {
    ctx.apiRuleMap.set(api.id, api);
    ctx.apiMenuMap.set(api.id, menuId);
  }

  ctx.treeData = rebuildTreeData(ctx);
}

export function getMenusNeedingApiLoad(
  ctx: RoleAccessTreeContext,
  menuIds: number[],
): number[] {
  return menuIds.filter((menuId) => !ctx.loadedMenuApiIds.has(menuId));
}

export function accessToCheckedKeys(
  menuIds: number[],
  menuApiIds: number[],
): Key[] {
  const keys: Key[] = menuIds.map((id) => formatMenuKey(id));
  for (const apiId of menuApiIds) {
    keys.push(formatApiKey(apiId));
  }
  return keys;
}

export function checkedKeysToAccessPayload(checkedKeys: Key[]): {
  menu_api_ids: number[];
  menu_ids: number[];
} {
  const menuIds: number[] = [];
  const menuApiIds: number[] = [];

  for (const key of checkedKeys) {
    const parsed = parseAccessKey(key);
    if (!parsed) {
      continue;
    }
    if (parsed.type === 'menu') {
      menuIds.push(parsed.id);
    } else {
      menuApiIds.push(parsed.id);
    }
  }

  return {
    menu_ids: menuIds,
    menu_api_ids: menuApiIds,
  };
}

function checkMenuBranch(
  checked: Set<string>,
  ctx: RoleAccessTreeContext,
  menuId: number,
) {
  checked.add(formatMenuKey(menuId));

  let parentId = ctx.menuParentMap.get(menuId);
  while (parentId != null) {
    checked.add(formatMenuKey(parentId));
    parentId = ctx.menuParentMap.get(parentId);
  }

  const descendants = ctx.menuDescendantsMap.get(menuId) ?? [];
  for (const descendantId of descendants) {
    checked.add(formatMenuKey(descendantId));
  }

  const affectedMenuIds = [menuId, ...descendants];
  for (const affectedMenuId of affectedMenuIds) {
    const apiIds = ctx.menuApisMap.get(affectedMenuId) ?? [];
    for (const apiId of apiIds) {
      checked.add(formatApiKey(apiId));
    }
  }
}

function uncheckMenuBranch(
  checked: Set<string>,
  ctx: RoleAccessTreeContext,
  menuId: number,
) {
  const descendants = ctx.menuDescendantsMap.get(menuId) ?? [];
  const affectedMenuIds = [menuId, ...descendants];

  for (const affectedMenuId of affectedMenuIds) {
    checked.delete(formatMenuKey(affectedMenuId));
    const apiIds = ctx.menuApisMap.get(affectedMenuId) ?? [];
    for (const apiId of apiIds) {
      checked.delete(formatApiKey(apiId));
    }
  }

  uncheckAncestorsWithoutCheckedChildren(checked, ctx, menuId);
}

function uncheckAncestorsWithoutCheckedChildren(
  checked: Set<string>,
  ctx: RoleAccessTreeContext,
  menuId: number,
) {
  const parentId = ctx.menuParentMap.get(menuId);
  if (parentId == null) {
    return;
  }

  const siblings = ctx.menuChildrenMap.get(parentId) ?? [];
  const hasCheckedSibling = siblings.some((siblingId) =>
    checked.has(formatMenuKey(siblingId)),
  );

  if (!hasCheckedSibling) {
    checked.delete(formatMenuKey(parentId));
    const apiIds = ctx.menuApisMap.get(parentId) ?? [];
    for (const apiId of apiIds) {
      checked.delete(formatApiKey(apiId));
    }
    uncheckAncestorsWithoutCheckedChildren(checked, ctx, parentId);
  }
}

export function applyAccessTreeCheck(
  ctx: RoleAccessTreeContext,
  currentChecked: Key[],
  triggerKey: Key,
  isChecking: boolean,
): Key[] {
  const parsed = parseAccessKey(triggerKey);
  if (!parsed) {
    return currentChecked;
  }

  const checked = new Set(currentChecked.map(String));

  if (parsed.type === 'menu') {
    if (isChecking) {
      checkMenuBranch(checked, ctx, parsed.id);
    } else {
      uncheckMenuBranch(checked, ctx, parsed.id);
    }
  } else if (isChecking) {
    const menuId = ctx.apiMenuMap.get(parsed.id);
    if (menuId == null) {
      return currentChecked;
    }

    checked.add(formatApiKey(parsed.id));

    let currentMenuId: null | number = menuId;
    while (currentMenuId != null) {
      checked.add(formatMenuKey(currentMenuId));
      currentMenuId = ctx.menuParentMap.get(currentMenuId) ?? null;
    }
  } else {
    checked.delete(formatApiKey(parsed.id));
  }

  return [...checked];
}

export function normalizeTreeCheckedKeys(
  checkedKeys: Key[] | { checked: Key[]; halfChecked: Key[] },
): Key[] {
  return Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;
}

export function collectMenuIdsForCheckCascade(
  ctx: RoleAccessTreeContext,
  menuId: number,
): number[] {
  const descendants = ctx.menuDescendantsMap.get(menuId) ?? [];
  return [menuId, ...descendants];
}
