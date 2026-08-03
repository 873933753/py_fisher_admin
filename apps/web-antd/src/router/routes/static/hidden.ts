import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

/**
 * 前端隐藏静态路由：不在侧栏展示，或与后端菜单互补（详情页、编辑页等）。
 */
const routes: RouteRecordRaw[] = [
  {
    name: 'Profile',
    path: '/profile',
    component: () => import('#/views/_core/profile/index.vue'),
    meta: {
      hideInMenu: true,
      icon: 'lucide:user',
      title: $t('page.auth.profile'),
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
  {
    meta: {
      hideInMenu: true,
      icon: 'mdi:store-outline',
      title: $t('page.mall.productTitle'),
    },
    name: 'MallProductGroup',
    path: '/mall/product-group',
    children: [
      {
        name: 'MallProductCreate',
        path: '/mall/product/create',
        component: () => import('#/views/mall/product/form/index.vue'),
        meta: {
          activePath: '/mall/product',
          hideInMenu: true,
          maxNumOfOpenTab: 1,
          title: $t('page.mall.productCreate'),
        },
      },
      {
        name: 'MallProductEdit',
        path: '/mall/product/edit/:id',
        component: () => import('#/views/mall/product/form/index.vue'),
        meta: {
          activePath: '/mall/product',
          hideInMenu: true,
          maxNumOfOpenTab: 1,
          title: $t('page.mall.productEdit'),
        },
      },
      {
        name: 'MallProductReviews',
        path: '/mall/product/reviews/:id',
        component: () => import('#/views/mall/product/reviews/index.vue'),
        meta: {
          activePath: '/mall/product',
          hideInMenu: true,
          maxNumOfOpenTab: 1,
          title: '商品评论',
        },
      },
    ],
  },
  {
    meta: {
      hideInMenu: true,
      icon: 'mdi:clipboard-list-outline',
      title: $t('page.mall.orderTitle'),
    },
    name: 'MallOrderGroup',
    path: '/mall/order-group',
    children: [
      {
        name: 'MallOrderFlow',
        path: '/mall/order-flow',
        component: () => import('#/views/mall/order-flow/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'mdi:cash-register',
          title: $t('page.mall.orderFlowList'),
        },
      },
      {
        name: 'MallPaypalTransaction',
        path: '/mall/paypal-transaction',
        component: () => import('#/views/mall/paypal-transaction/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'mdi:cash-multiple',
          title: $t('page.mall.paypalTransactionList'),
        },
      },
      {
        name: 'MallProductReview',
        path: '/mall/product-review',
        component: () => import('#/views/mall/product-review/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'mdi:comment-text-outline',
          title: $t('page.mall.productReviewList'),
        },
      },
      {
        name: 'MallOrderDetail',
        path: '/mall/order/detail/:id',
        component: () => import('#/views/mall/order/detail/index.vue'),
        meta: {
          activePath: '/mall/order',
          hideInMenu: true,
          maxNumOfOpenTab: 1,
          title: $t('page.mall.orderDetail'),
        },
      },
    ],
  },
];

export default routes;
