import { requestClient } from '#/api/request';

/** PayPal 接口路径自带 /api 前缀，与通用代理规则区分 */
const PAYPAL_API_PREFIX = '/api/paypal/v2';

export namespace PaypalApi {
  export type TxnTypeValue = 'CAPTURE' | 'CREATE_ORDER' | 'REFUND';

  export interface FindTransactionsParams {
    current?: number;
    orderId?: null | number;
    paypalOrderId?: null | string;
    size?: number;
    txnType?: null | string | TxnTypeValue;
    [property: string]: unknown;
  }

  export interface TransactionRecord {
    amount: number;
    captureId: null | string;
    createTime: string;
    currency: null | string;
    id: string;
    orderId: null | number | string;
    orderNo: null | string;
    paypalOrderId: null | string;
    rawResponse: null | string;
    refundId: null | string;
    txnStatus: null | string;
    txnType: null | string;
    [property: string]: unknown;
  }

  export interface FindTransactionsResult {
    current: string;
    pages: string;
    records: TransactionRecord[];
    size: string;
    total: string;
  }

  export interface MoneyAmount {
    currency_code?: string;
    value?: string;
    [property: string]: unknown;
  }

  export interface SellerProtection {
    status?: string;
    dispute_categories?: string[];
    [property: string]: unknown;
  }

  export interface SellerReceivableBreakdown {
    gross_amount?: MoneyAmount;
    paypal_fee?: MoneyAmount;
    net_amount?: MoneyAmount;
    [property: string]: unknown;
  }

  export interface PaypalLink {
    href?: string;
    rel?: string;
    method?: string;
    [property: string]: unknown;
  }

  export interface CaptureRecord {
    id?: string;
    status?: string;
    amount?: MoneyAmount;
    final_capture?: boolean;
    seller_protection?: SellerProtection;
    seller_receivable_breakdown?: SellerReceivableBreakdown;
    links?: PaypalLink[];
    create_time?: string;
    update_time?: string;
    [property: string]: unknown;
  }

  export interface OrderDetailData {
    id?: string;
    status?: string;
    intent?: string;
    amount?: string;
    currency?: string;
    captures?: CaptureRecord[] | null;
    refunds?: null | unknown[];
    createTime?: string;
    updateTime?: string;
    [property: string]: unknown;
  }
}

/** PayPal 流水列表 */
export function findPaypalTransactionsApi(
  params: PaypalApi.FindTransactionsParams,
) {
  return requestClient.post<PaypalApi.FindTransactionsResult>(
    `${PAYPAL_API_PREFIX}/transactions`,
    params,
  );
}

/** PayPal 订单详情（orderId 传 PayPal 订单号） */
export function findPaypalOrderDetailApi(paypalOrderId: string) {
  return requestClient.get<PaypalApi.OrderDetailData>(
    `${PAYPAL_API_PREFIX}/order-details`,
    {
      params: { orderId: paypalOrderId },
    },
  );
}
