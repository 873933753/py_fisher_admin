import { requestClient } from '#/api/request';

export namespace OrderRefundApplyApi {
  export interface RefundDetailsParams {
    orderRefundApplyId: string;
  }

  export interface OrderRefundApplyInfo {
    createTime?: string;
    createUserId?: string;
    description?: string;
    handleNote?: string;
    handleProofPics?: string[];
    handleTime?: string;
    handleUserId?: string;
    id?: string;
    isDel?: number;
    orderId?: string;
    proofPics?: string[];
    reasonType?: string;
    reviewStatus?: number;
    updateTime?: string;
    updateUserId?: string;
    userId?: string;
    [property: string]: unknown;
  }

  export interface MyOrderRefundInfo {
    createTime?: string;
    createUserId?: string;
    failReason?: string;
    id?: string;
    isDel?: number;
    orderId?: string;
    orderNo?: string;
    outRefundNo?: null | string;
    payMethod?: string;
    refundAmount?: number;
    refundNo?: string;
    refundStatus?: number;
    refundType?: number;
    updateTime?: string;
    userId?: string;
    [property: string]: unknown;
  }

  export interface RefundDetailsItem {
    myOrderItemId?: string;
    orderId?: string;
    orderRefundItemId?: string;
    productId?: string;
    productName?: string;
    productPrice?: number;
    quantity?: number;
    returnDesc?: string;
    skuId?: string;
    skuImage?: string;
    specData?: string;
    subtotalAmount?: number;
    totalDiscountAmount?: number;
    [property: string]: unknown;
  }

  export interface RefundDetailsResult {
    myOrderRefund: MyOrderRefundInfo | null;
    orderRefundApply: OrderRefundApplyInfo;
    refundDetailsList: RefundDetailsItem[];
  }

  export interface ReviewRefundParams {
    orderId: string;
    orderRefundApplyId: string;
    reviewStatus: number;
    handleNote?: string;
    handleProofPics?: string[];
    refundAmount?: number;
    refundType?: number;
  }

  export interface BackRefundItemEntry {
    myOrderItemId: string;
    refundCount: number;
  }

  export interface BackRefundItemParams {
    orderId: string;
    reasonType: string;
    refundType: 1 | 2;
    handleNote?: string;
    handleProofPics?: string[];
    refundAmount?: number;
    orderRefundItemList: BackRefundItemEntry[];
  }

  export type ReasonTypeMap = Record<string, string>;
}

/** 退款原因枚举 */
export function findReasonTypeApi() {
  return requestClient.get<OrderRefundApplyApi.ReasonTypeMap>(
    '/orderRefundApply/findReasonType',
  );
}

/** 退款详情 */
export function refundDetailsApi(
  data: OrderRefundApplyApi.RefundDetailsParams,
) {
  return requestClient.post<OrderRefundApplyApi.RefundDetailsResult>(
    '/orderRefundApply/refundDetails',
    data,
  );
}

/** 退款审批 */
export function reviewRefundApi(data: OrderRefundApplyApi.ReviewRefundParams) {
  return requestClient.post<null>('/orderRefundApply/reviewRefund', data);
}

/** 手动退款 */
export function backRefundItemApi(
  data: OrderRefundApplyApi.BackRefundItemParams,
) {
  return requestClient.post<null>('/orderRefundApply/backRefundItem', data);
}
