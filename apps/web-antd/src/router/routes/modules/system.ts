import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 1,
      title: $t('page.system.title'),
    },
    name: 'System',
    path: '/system',
    children: [
      {
        name: 'SystemAdmin',
        path: '/system/admin',
        component: () => import('#/views/system/admin/index.vue'),
        meta: {
          icon: 'lucide:users',
          title: $t('page.system.admin'),
        },
      },
      {
        name: 'SystemRbac',
        path: '/system/rbac',
        component: () => import('#/views/system/rbac/index.vue'),
        meta: {
          icon: 'lucide:shield',
          title: $t('page.system.rbac'),
        },
      },
      {
        name: 'SystemProfile',
        path: '/system/profile',
        component: () => import('#/views/_core/profile/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:user-round',
          title: $t('page.system.profile'),
        },
      },
    ],
  },
];

export default routes;
