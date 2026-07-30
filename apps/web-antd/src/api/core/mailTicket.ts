import { requestClient } from '#/api/request';

export namespace MailTicketApi {
  export type MailSenderType = 1 | 2;

  export interface MailRecord {
    id: string;
    orderId: string;
    subject?: null | string;
    bodyContent: string;
    nickName?: null | string;
    email?: null | string;
    avatar?: null | string;
    mailFile?: null | string[];
    /** 发送者身份：1=用户, 2=客服 */
    senderType: MailSenderType;
    senderId?: null | string;
    createTime?: null | string;
    lastMessageTime?: null | string;
    assignedAgent?: null | string;
    sessionId?: null | string;
    [property: string]: unknown;
  }

  export interface ConsultSellerRecord {
    id: string;
    sessionId: string;
    productId: string;
    productName: string;
    senderId: string;
    bodyContent: string;
    email?: null | string;
    nickName?: null | string;
    avatar?: null | string;
    createTime?: null | string;
    /** 客服是否已读：0=未读，1=已读 */
    isReadAgent: 0 | 1;
    mailFile?: null | string[];
    senderType?: MailSenderType;
    [property: string]: unknown;
  }

  export interface ConsultSellerPageParams {
    productId: string;
    productName: string;
  }

  export interface ConsultSellerPageResult {
    current: string;
    pages: string;
    records: ConsultSellerRecord[];
    size: string;
    total: string;
  }

  export interface SendMailByOrderParams {
    orderId: string;
    bodyContent: string;
    subject?: string;
    mailFile?: string[];
  }

  export interface SendMailByProductParams {
    productId: string;
    sessionId: string;
    bodyContent: string;
    subject?: string;
    mailFile?: string[];
  }

  export type SendMailParams = SendMailByOrderParams | SendMailByProductParams;

  export type CheckMailParams =
    | { orderId: string }
    | { productId: string; sessionId: string };
}

/** 咨询该商品的所有用户（每人最新一条消息） */
export function consultSellerPageApi(
  params: MailTicketApi.ConsultSellerPageParams,
) {
  return requestClient.post<MailTicketApi.ConsultSellerPageResult>(
    '/mailTicket/consultSellerPage',
    params,
  );
}

/** 发送消息给买家/用户 */
export function sendMailApi(data: MailTicketApi.SendMailParams) {
  return requestClient.post('/mailTicket/sendMail', data);
}

/** 查看消息历史（订单或商品会话） */
export function checkMailApi(params: MailTicketApi.CheckMailParams) {
  return requestClient.post<MailTicketApi.MailRecord[]>(
    '/mailTicket/checkMail',
    params,
  );
}

/** 删除消息 */
export function deleteMailApi(id: string) {
  return requestClient.get('/mailTicket/delMail', {
    params: { id },
  });
}
