import type { AdminShopProductApi } from '#/api/core/admin-shop-products';

export const SHOP_PRODUCT_STATUS_OFF = 0 as const;
export const SHOP_PRODUCT_STATUS_ON = 1 as const;

export const SHOP_PRODUCT_STATUS_OPTIONS: {
  label: string;
  value: '' | AdminShopProductApi.ProductStatus;
}[] = [
  { label: '全部', value: '' },
  { label: '下架', value: SHOP_PRODUCT_STATUS_OFF },
  { label: '在售', value: SHOP_PRODUCT_STATUS_ON },
];

export const SHOP_PRODUCT_NAME_MAX = 100;
export const SHOP_PRODUCT_DESCRIPTION_MAX = 2000;
