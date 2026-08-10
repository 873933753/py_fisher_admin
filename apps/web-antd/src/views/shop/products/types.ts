import type { AdminShopProductApi } from '#/api/core/admin-shop-products';

export interface ShopProductFormState {
  cover_url: string;
  description: string;
  name: string;
  /** 售价，单位：元（展示/输入） */
  priceYuan?: number;
  status: AdminShopProductApi.ProductStatus;
  stock?: number;
}

export function emptyShopProductForm(): ShopProductFormState {
  return {
    name: '',
    description: '',
    priceYuan: undefined,
    stock: 0,
    cover_url: '',
    status: 0,
  };
}

export function mapProductToForm(
  product: AdminShopProductApi.Product,
): ShopProductFormState {
  return {
    name: product.name,
    description: product.description ?? '',
    priceYuan: product.price / 100,
    stock: product.stock,
    cover_url: product.cover_url,
    status: product.status,
  };
}
