import { requestClient } from '#/api/request';

export namespace AdminShopOrderApi {
  export type OrderStatus = 1 | 2 | 3 | 4 | 5;

  export interface OrderListItem {
    create_time: string;
    expire_at: string;
    id: number;
    order_no: string;
    out_trade_no: string;
    paid_amount: string;
    paid_at: string;
    status: OrderStatus;
    total_amount: string;
    user_id: number;
  }

  export interface OrderItem {
    line_amount: string;
    price: string;
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
    status?: OrderStatus;
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
