import type { RouteRecordRaw } from 'vue-router';

import { mergeRouteModules, traverseTreeValues } from '@vben/utils';

import { coreRoutes, fallbackNotFoundRoute } from './core';

const staticRouteFiles = import.meta.glob('./static/**/*.ts', {
  eager: true,
});

// 历史 modules 目录保留注释对照，业务菜单已迁至后端 userMenu
const legacyModuleRouteFiles = import.meta.glob('./modules/**/*.ts', {
  eager: true,
});

/** 前端静态补充路由（mixed 模式与后端 userMenu 合并） */
const staticRoutes: RouteRecordRaw[] = mergeRouteModules(staticRouteFiles);

/** @deprecated 请使用 static/ 目录，modules 仅保留空壳或历史注释 */
const legacyModuleRoutes: RouteRecordRaw[] =
  mergeRouteModules(legacyModuleRouteFiles);

const externalRoutes: RouteRecordRaw[] = [];

/** 路由列表，由基本路由、外部路由和404兜底路由组成 */
const routes: RouteRecordRaw[] = [
  ...coreRoutes,
  ...externalRoutes,
  fallbackNotFoundRoute,
];

/** 基本路由列表，这些路由不需要进入权限拦截 */
const coreRouteNames = traverseTreeValues(coreRoutes, (route) => route.name);

/**
 * mixed 模式下的前端路由：静态补充 + 遗留 modules（应为空）。
 * 后端菜单由 guard 中 fetchMenuListAsync 提供，与此处路由按 name 合并。
 */
const accessRoutes = [...staticRoutes, ...legacyModuleRoutes];

export { accessRoutes, coreRouteNames, routes };
