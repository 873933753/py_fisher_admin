import type { RouteMeta } from 'vue-router';

/** 仅前端 UX 配置，与权限无关；后端菜单转换后按 path 合并 */
export const ROUTE_META_OVERRIDES: Record<string, Partial<RouteMeta>> = {
  '/workspace': { affixTab: true },
  '/mall/product': { keepAlive: true, resetListOnMenu: true },
  '/mall/order': { keepAlive: true, resetListOnMenu: true },
};

export const DEFAULT_MENU_ICON = 'lucide:circle';
