import type { RouteRecordStringComponent } from '@vben/types';

import type { AdminRbacApi } from '#/api/core/admin-rbac';

import {
  DEFAULT_MENU_ICON,
  ROUTE_META_OVERRIDES,
} from './route-meta';

function pathToRouteName(path: null | string, id: number): string {
  if (!path?.trim()) {
    return `Menu${id}`;
  }

  const segments = path
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      const clean = segment.replace(/^:/, '').replace(/[^a-zA-Z0-9]/g, '');
      if (!clean) {
        return '';
      }
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    })
    .filter(Boolean);

  return segments.join('') || `Menu${id}`;
}

function resolveMenuIcon(icon: null | string | undefined): string {
  const trimmed = icon?.trim();
  return trimmed || DEFAULT_MENU_ICON;
}

function convertMenuNode(
  node: AdminRbacApi.MenuTreeNode,
): RouteRecordStringComponent {
  const path = node.path?.trim() || '';
  const route = {
    name: pathToRouteName(node.path, node.id),
    meta: {
      icon: resolveMenuIcon(node.icon),
      order: node.sort,
      title: node.title,
      ...(path ? ROUTE_META_OVERRIDES[path] : {}),
    },
    path: path || `/menu-${node.id}`,
    ...(node.menu_type === 'menu' && node.component?.trim()
      ? { component: node.component.trim() }
      : {}),
    ...(node.children?.length
      ? { children: node.children.map((child) => convertMenuNode(child)) }
      : {}),
  } as RouteRecordStringComponent;

  return route;
}

export function convertMenuTreeToRoutes(
  menus: AdminRbacApi.MenuTreeNode[],
): RouteRecordStringComponent[] {
  return menus.map((menu) => convertMenuNode(menu));
}
