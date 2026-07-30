import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'MallUser',
    path: '/mall/user',
    component: () => import('#/views/mall/user/index.vue'),
    meta: {
      icon: 'mdi:account-group-outline',
      order: 2,
      title: $t('page.mall.user'),
    },
  },
  {
    meta: {
      hideInMenu: true,
      icon: 'mdi:home-outline',
      order: 3,
      title: $t('page.mall.homeTitle'),
    },
    name: 'MallHome',
    path: '/mall/home',
    children: [
      {
        name: 'MallBanner',
        path: '/mall/banner',
        component: () => import('#/views/mall/banner/index.vue'),
        meta: {
          icon: 'mdi:view-carousel-outline',
          order: 1,
          title: $t('page.mall.banner'),
        },
      },
      {
        name: 'MallAboutUs',
        path: '/mall/about-us',
        component: () => import('#/views/mall/about-us/index.vue'),
        meta: {
          icon: 'mdi:information-outline',
          order: 2,
          title: $t('page.mall.aboutUs'),
        },
      },
    ],
  },
  {
    meta: {
      hideInMenu: true,
      icon: 'mdi:store-outline',
      order: 4,
      title: $t('page.mall.productTitle'),
    },
    name: 'MallProductGroup',
    path: '/mall/product-group',
    children: [
      {
        name: 'MallProduct',
        path: '/mall/product',
        component: () => import('#/views/mall/product/index.vue'),
        meta: {
          icon: 'mdi:package-variant-closed',
          keepAlive: true,
          order: 1,
          resetListOnMenu: true,
          title: $t('page.mall.productList'),
        },
      },
      {
        name: 'MallCategory',
        path: '/mall/category',
        component: () => import('#/views/mall/category/index.vue'),
        meta: {
          icon: 'mdi:shape-outline',
          order: 2,
          title: $t('page.mall.category'),
        },
      },
      {
        name: 'MallCoupon',
        path: '/mall/coupon',
        component: () => import('#/views/mall/coupon/index.vue'),
        meta: {
          icon: 'mdi:ticket-percent-outline',
          order: 3,
          title: $t('page.mall.coupon'),
        },
      },
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
      order: 5,
      title: $t('page.mall.orderTitle'),
    },
    name: 'MallOrderGroup',
    path: '/mall/order-group',
    children: [
      {
        name: 'MallOrder',
        path: '/mall/order',
        component: () => import('#/views/mall/order/index.vue'),
        meta: {
          icon: 'mdi:receipt-text-outline',
          keepAlive: true,
          order: 1,
          resetListOnMenu: true,
          title: $t('page.mall.orderList'),
        },
      },
      {
        name: 'MallOrderFlow',
        path: '/mall/order-flow',
        component: () => import('#/views/mall/order-flow/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'mdi:cash-register',
          order: 2,
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
          order: 4,
          title: $t('page.mall.paypalTransactionList'),
        },
      },
      {
        name: 'MallProductReview',
        path: '/mall/product-review',
        component: () => import('#/views/mall/product-review/index.vue'),
        meta: {
          icon: 'mdi:comment-text-outline',
          order: 3,
          title: $t('page.mall.productReviewList'),
          hideInMenu: true,
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
