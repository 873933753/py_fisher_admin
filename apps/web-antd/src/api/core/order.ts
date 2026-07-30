import { requestClient } from '#/api/request';

export namespace OrderApi {
  export type OrderStatusValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;

  export interface FindPageParams {
    current?: number;
    size?: number;
    orderStatus?: null | OrderStatusValue;
    orderNo?: string;
    firstLastName?: string;
  }

  export interface OrderItemRecord {
    id: string;
    orderId: string;
    productId: string;
    productName: null | string;
    skuId: string;
    skuImage: string;
    quantity: number;
    productPrice: number;
    subtotalAmount: number;
    specData: null | Record<string, string> | string;
    logistics: null | string;
    trackingNum: null | string;
    bulkDiscount: string;
    remark: null | string;
    createTime: string;
    volumePricing?: Record<string, unknown>;
    [property: string]: unknown;
  }

  export interface OrderRecord {
    orderId: string;
    orderNo: string;
    buyer: string;
    nickName: string;
    postcode: string;
    orderStatus: number;
    orderStatusName: string;
    buyerRemark: null | string;
    sellerRemark: null | string;
    payTime: null | string;
    createTime?: null | string;
    total: string;
    subtotal: string;
    /** 免邮为 0；有邮费时可能为后台格式化字符串，如 "+US$39.00\n postage" */
    shippingFee: number | string;
    currency?: string;
    myOrderItemList: OrderItemRecord[];
    handlingTime?: number;
    /** 物流公司名称 */
    logistics?: null | string;
    /** 物流轨迹 ID，编辑物流时必传 */
    logisticsTracesId?: null | number | string;
    /** 物流跟踪号，列表展示 */
    trackingNo?: null | string;
    /** 0=未评价，1=好评，2=中评，3=差评 */
    ratingResult?: number;
    /** 退款类型：1 全额退款，2 部分退款 */
    refundType?: 1 | 2 | null;
    /** 退款记录 ID（待审批退款时由 findPage 返回，已废弃） */
    refundId?: null | number | string;
    /** 订单退款申请 ID（待审批退款时由 findPage 返回） */
    orderRefundApplyId?: null | number | string;
    /** 邮件已读状态：0=未读，1=已读 */
    mailIsRead?: number;
    [property: string]: unknown;
  }

  export interface AddSellerRemarkParams {
    orderId: string;
    sellerRemark: string;
  }

  export interface CancelOrderParams {
    orderId: string;
  }

  export interface FindPageResult {
    current: string;
    pages: string;
    size: string;
    total: string;
    records: OrderRecord[];
  }

  export interface OrderDetailInfo {
    orderNo: string;
    buyer: string;
    nickName: string;
    productName?: null | string;
    payTime?: null | string;
    createTime?: null | string;
    shipTime?: null | string;
    completeTime?: null | string;
    recipientEmail?: null | string;
    recipientPhone?: null | string;
    totalQuantity?: null | number | string;
    orderStatus?: OrderStatusValue;
    orderStatusName?: string;
    currency?: string;
    cancelTime?: null | string;
    cancelReason?: null | string;
    [property: string]: unknown;
  }

  export interface PostageInfo {
    Buyer?: string;
    buyer?: string;
    streetAddress?: string;
    apartment?: string;
    city?: string;
    stateProvince?: string;
    zipPostalCode?: string;
    country?: string;
    countryCode?: string;
    recipientEmail?: null | string;
    recipientPhone?: null | string;
    [property: string]: unknown;
  }

  export interface LogisticsTraceDetail {
    city?: string;
    country?: string;
    flightNo?: string;
    postcode?: string;
    state?: string;
    tailTrace?: number;
    traceDesc?: string;
    traceLocation?: string;
    traceStatus?: string;
    traceTime?: string;
    traceType?: string;
    timeZone?: string;
    [property: string]: unknown;
  }

  export interface LogisticsTraceAllData {
    orderNo?: string;
    waybillNo?: string;
    transhipNo?: string;
    traceDetail?: LogisticsTraceDetail[];
    [property: string]: unknown;
  }

  /** Yodel 等：traceAll 为 object，traceAllType 为 object */
  export interface LogisticsTraceAllObject {
    data?: LogisticsTraceAllData[];
    result?: { code?: number };
    [property: string]: unknown;
  }

  /** Australia Post 等：traceAll 为 array，traceAllType 为 array */
  export interface LogisticsTraceEvent {
    activity?: string;
    country?: string;
    destCountry?: string;
    eventCode?: string;
    eventTime?: string;
    location?: string;
    timeZone?: string;
    trackingNo?: string;
    [property: string]: unknown;
  }

  export interface LogisticsTraceAllArrayItem {
    events?: LogisticsTraceEvent[];
    lastMileCarrier?: string;
    orderId?: string;
    parcelStatus?: string;
    status?: string;
    [property: string]: unknown;
  }

  /** 归一化后的轨迹项 */
  export interface NormalizedLogisticsTrace {
    traceDesc?: string;
    traceLocation?: string;
    traceTime?: string;
    traceType?: string;
  }

  export interface OrderLogisticsInfo {
    logistics?: null | string;
    trackingNum?: null | string;
    trackingNo?: null | string;
    waybillNo?: null | string;
    trackingInfo?: Record<string, unknown>;
    traceAll?: LogisticsTraceAllArrayItem[] | LogisticsTraceAllObject;
    traceAllType?: string;
    payTime?: null | string;
    shippingTime?: null | string;
    signedTime?: null | string;
    [property: string]: unknown;
  }

  export interface OrderPaymentInfo {
    totalProductAmount?: number;
    shippingFee?: number | string;
    totalDiscountAmount?: number;
    finalPayAmount?: number;
    refundAmount?: number;
    refundNo?: string;
    refundReason?: string;
    refundStatus?: string;
    /** 1 全额退款，2 部分退款 */
    refundType?: 1 | 2 | null;
    currency?: string;
    [property: string]: unknown;
  }

  export interface OrderDetailData {
    myOrderItemList?: OrderItemRecord[];
    orderInfo: OrderDetailInfo;
    postageInfo?: PostageInfo;
    logisticsInfo?: OrderLogisticsInfo;
    paymentInfo?: OrderPaymentInfo;
    [property: string]: unknown;
  }

  export interface OrderFlowPageParams {
    startDate?: string;
    endDate?: string;
    orderNo?: string;
    productName?: string;
    current?: number;
    size?: number;
    [property: string]: unknown;
  }

  export interface OrderFlowItemRecord {
    firstName: string;
    lastName: string;
    nickName: string;
    quantity: number;
    skuImage: string;
    specData: Record<string, string> | string;
    productId: string;
    productName: string;
    productPrice: number;
    myOrderItemId: string;
    subtotalAmount: number;
    [property: string]: unknown;
  }

  export interface OrderFlowRecord {
    orderId: string;
    orderNo: string;
    payTime: string;
    currency: string;
    orderStatus: number;
    orderStatusName: string;
    totalProductAmount: number;
    totalDiscountAmount: number;
    orderRefundedAmount: number;
    orderFinalPayAmount: number;
    orderNetIncome: number;
    orderItemList: OrderFlowItemRecord[];
    [property: string]: unknown;
  }

  export interface OrderFlowSummary {
    totalIncome: number;
    totalRefunded: number;
    totalNet: number;
    [property: string]: unknown;
  }

  export interface OrderFlowPageResult {
    current: string;
    pages: string;
    records: OrderFlowRecord[];
    size: string;
    summary: OrderFlowSummary;
    total: string;
    [property: string]: unknown;
  }
}

/** 订单分页列表（后台固定传 origin: back） */
export function findPageOrderApi(params: OrderApi.FindPageParams) {
  return requestClient.post<OrderApi.FindPageResult>('/order/findPage', {
    origin: 'back',
    ...params,
  });
}

/** 订单详情 */
export function findOrderDetailApi(orderId: string) {
  return requestClient.get<OrderApi.OrderDetailData>('/order/findOrderDetail', {
    params: { orderId },
  });
}

/** 添加/编辑商家备注 */
export function addSellerRemarkApi(data: OrderApi.AddSellerRemarkParams) {
  return requestClient.post<null>('/order/addSellerRemark', data);
}

/** 关闭待付款订单 */
export function cancelOrderApi(data: OrderApi.CancelOrderParams) {
  return requestClient.post<null>('/order/cancelOrder', data);
}

/** 订单流水列表 */
export function orderFlowPageApi(params: OrderApi.OrderFlowPageParams) {
  return requestClient.post<OrderApi.OrderFlowPageResult>(
    '/order/orderFlowPage',
    params,
  );
}
