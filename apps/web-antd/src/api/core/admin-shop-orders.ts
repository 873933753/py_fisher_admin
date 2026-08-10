import { requestClient } from '#/api/request';

export namespace AdminShopOrderApi {
  export type OrderStatus = 1;

  export interface OrderListItem {
    create_time: string;
    id: number;
    status: OrderStatus;
    total_amount: number;
    user_id: number;
  }

  export interface OrderItem {
    line_amount: number;
    price: number;
    product_cover: string;
    product_id: number;
    product_name: string;
    quantity: number;
  }

  export interface OrderDetail extends OrderListItem {
    items: OrderItem[];
  }

  export interface ListParams {
    page?: number;
    size?: number;
    user_id?: number;
  }

  export interface ListResult {
    items: OrderListItem[];
    page: number;
    pages: number;
    size: number;
    total: number;
  }
}

/** 订单分页列表 */
export function listShopOrdersApi(params: AdminShopOrderApi.ListParams) {
  return requestClient.get<AdminShopOrderApi.ListResult>(
    '/admin/orders/list',
    { params },
  );
}

/** 订单详情 */
export function getShopOrderApi(orderId: number) {
  return requestClient.get<AdminShopOrderApi.OrderDetail>(
    `/admin/orders/${orderId}`,
  );
}
