import { requestClient } from '#/api/request';

export namespace AdminShopRefundApi {
  export type RefundStatus = 10 | 20 | 30 | 40 | 50 | 60 | 70;

  export interface RefundItem {
    line_amount: string;
    product_id: number;
    product_name: string;
    quantity: number;
  }

  export interface RefundListItem {
    amount: string;
    create_time: string;
    evidence: string[];
    id: number;
    items: RefundItem[];
    order_id: number;
    order_no: string;
    reason: string;
    refund_amount: string;
    refund_no: string;
    refunded_at: string;
    reject_reason: string;
    reviewed_at: string;
    reviewer_id: number | null;
    status: RefundStatus;
    user_id: number;
  }

  export interface ListParams {
    order_no?: string;
    page?: number;
    size?: number;
    status?: RefundStatus;
    user_id?: number;
  }

  export interface ListResult {
    items: RefundListItem[];
    page: number;
    pages: number;
    size: number;
    total: number;
  }

  export interface RejectParams {
    reject_reason: string;
  }
}

/** 退款工单分页列表 */
export function listShopRefundsApi(params: AdminShopRefundApi.ListParams) {
  return requestClient.get<AdminShopRefundApi.ListResult>(
    '/admin/refunds/list',
    { params },
  );
}

/** 拒绝退款 */
export function rejectShopRefundApi(
  refundNo: string,
  data: AdminShopRefundApi.RejectParams,
) {
  return requestClient.post<AdminShopRefundApi.RefundListItem>(
    `/admin/refunds/reject/${encodeURIComponent(refundNo)}`,
    data,
  );
}

/** 同意退款（无 Body，金额只信库） */
export function approveShopRefundApi(refundNo: string) {
  return requestClient.post<AdminShopRefundApi.RefundListItem>(
    `/admin/refunds/approve/${encodeURIComponent(refundNo)}`,
  );
}

/** 同步退款状态（查单兜底，不要轮询） */
export function syncShopRefundApi(refundNo: string) {
  return requestClient.post<AdminShopRefundApi.RefundListItem>(
    `/admin/refunds/sync/${encodeURIComponent(refundNo)}`,
  );
}
