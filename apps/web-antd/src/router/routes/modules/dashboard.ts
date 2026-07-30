import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/dashboard/workspace/index.vue'),
    meta: {
      affixTab: true,
      icon: 'carbon:workspace',
      order: -1,
      title: $t('page.dashboard.workspace'),
    },
    name: 'Workspace',
    path: '/workspace',
  },
];

export default routes;
