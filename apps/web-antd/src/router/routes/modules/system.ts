import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideInMenu: true,
      icon: 'lucide:settings',
      order: 1,
      title: $t('page.system.title'),
    },
    name: 'System',
    path: '/system',
    children: [
      {
        name: 'SystemUser',
        path: '/system/user',
        component: () => import('#/views/system/user/index.vue'),
        meta: {
          icon: 'lucide:users',
          title: $t('page.system.user'),
        },
      },
      {
        name: 'SystemProfile',
        path: '/system/profile',
        component: () => import('#/views/_core/profile/index.vue'),
        meta: {
          icon: 'lucide:user-round',
          title: $t('page.system.profile'),
        },
      },
    ],
  },
];

export default routes;
