import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

/**
 * 前端公共静态路由：不需后端 menu 配置，所有已登录用户可访问。
 * 侧栏是否展示由 hideInMenu 控制；设为 true 时仅作为落地页，菜单仍走后端 userMenu。
 */
const routes: RouteRecordRaw[] = [
  {
    name: 'Workspace',
    path: '/workspace',
    component: () => import('#/views/dashboard/workspace/index.vue'),
    meta: {
      affixTab: true,
      hideInMenu: true,
      icon: 'carbon:workspace',
      title: $t('page.dashboard.workspace'),
    },
  },
];

export default routes;
