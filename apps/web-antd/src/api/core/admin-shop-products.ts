import { requestClient } from '#/api/request';

export namespace AdminShopProductApi {
  export type ProductStatus = 0 | 1;

  export interface Product {
    cover_url: string;
    create_time: string;
    description: null | string;
    id: number;
    name: string;
    price: number;
    status: ProductStatus;
    stock: number;
    update_time: null | string;
  }

  export interface ListParams {
    keyword?: string;
    page?: number;
    size?: number;
    status?: ProductStatus;
  }

  export interface ListResult {
    items: Product[];
    page: number;
    pages: number;
    size: number;
    total: number;
  }

  export interface CreateParams {
    cover_url: string;
    description?: string;
    name: string;
    price: number;
    stock?: number;
  }

  export interface UpdateParams {
    cover_url?: string;
    description?: string;
    name?: string;
    price?: number;
    status?: ProductStatus;
    stock?: number;
  }
}

/** 商品分页列表 */
export function listShopProductsApi(params: AdminShopProductApi.ListParams) {
  return requestClient.get<AdminShopProductApi.ListResult>(
    '/admin/products/list',
    { params },
  );
}

/** 商品详情 */
export function getShopProductApi(productId: number) {
  return requestClient.get<AdminShopProductApi.Product>(
    `/admin/products/${productId}`,
  );
}

/** 创建商品 */
export function createShopProductApi(data: AdminShopProductApi.CreateParams) {
  return requestClient.post<AdminShopProductApi.Product>(
    '/admin/products/create',
    data,
  );
}

/** 更新商品 */
export function updateShopProductApi(
  productId: number,
  data: AdminShopProductApi.UpdateParams,
) {
  return requestClient.request<AdminShopProductApi.Product>(
    `/admin/products/${productId}`,
    {
      data,
      method: 'PATCH',
    },
  );
}

/** 软删除商品 */
export function deleteShopProductApi(productId: number) {
  return requestClient.delete<null>(`/admin/products/${productId}`);
}
