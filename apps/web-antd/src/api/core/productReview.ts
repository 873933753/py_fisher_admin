import { requestClient } from '#/api/request';

export namespace ProductReviewApi {
  export interface FindPageParams {
    current?: number | string;
    productId?: string;
    size?: number | string;
    [property: string]: unknown;
  }

  export interface ReviewReplyRecord {
    avatar?: string;
    content?: string;
    createTime?: string;
    createUserId?: string;
    id: string;
    ip?: string;
    isDel?: number;
    replyType: 0 | 1;
    reviewFile?: string[];
    reviewId?: string;
    userId?: string;
    [property: string]: unknown;
  }

  export interface ReviewRecord {
    avatar?: string;
    content?: string;
    create_time?: string;
    createTime?: string;
    email?: string;
    id: string;
    ip?: string;
    likes?: number;
    nickName?: string;
    orderId?: string;
    parentId?: number | string;
    productId?: null | string;
    productReviewReplieList?: ReviewReplyRecord[];
    ratingQuality?: number;
    ratingResult?: null | number;
    ratingService?: number;
    ratingShipping?: number;
    reviewFile?: string | string[];
    skuId?: string;
    title?: string;
    userId?: string;
    [property: string]: unknown;
  }

  export type ReviewDeletableItem = ReviewRecord | ReviewReplyRecord;

  export interface FindPageResult {
    current: string;
    pages: string;
    records: ReviewRecord[];
    size: string;
    total: string;
  }

  export interface AddProductReviewParams {
    content: string;
    productId: string;
    ratingQuality: number;
    ratingService: number;
    ratingShipping: number;
    reviewFile?: string[];
    userId: string;
    [property: string]: unknown;
  }

  export interface SaveReviewParams {
    content: string;
    orderId: string;
    ratingQuality: number;
    ratingService: number;
    ratingShipping: number;
    reviewFile?: string[];
    [property: string]: unknown;
  }

  export interface SaveReplyParams {
    content: string;
    replyType: 0 | 1;
    reviewFile?: string[];
    reviewId: string;
    [property: string]: unknown;
  }
}

/** 评论分页列表 */
export function findProductReviewPageApi(
  params: ProductReviewApi.FindPageParams,
) {
  return requestClient.post<ProductReviewApi.FindPageResult>(
    '/productReview/findPageListByHome',
    params,
  );
}

/** 商品添加评论 */
export function addProductReviewApi(
  params: ProductReviewApi.AddProductReviewParams,
) {
  return requestClient.post<null>('/productReview/addProductReview', params);
}

/** 代填评价（用户未评论） */
export function saveProductReviewApi(
  params: ProductReviewApi.SaveReviewParams,
) {
  return requestClient.post<null>('/productReview/save', params);
}

/** 追加评论 / 商家回复 */
export function saveProductReviewReplyApi(
  params: ProductReviewApi.SaveReplyParams,
  options?: { orderId?: string },
) {
  const orderId = options?.orderId?.trim();
  return requestClient.post<null>('/productReview/saveReply', params, {
    params: orderId ? { orderId } : undefined,
  });
}

/** 评论详情（按订单） */
export function getProductReviewDetailsApi(orderId: string) {
  return requestClient.get<ProductReviewApi.ReviewRecord>(
    '/productReview/reviewDetails',
    { params: { orderId } },
  );
}

/** 删除评论 */
export function deleteProductReviewApi(id: string) {
  return requestClient.get<null>('/productReview/delete', {
    params: { id },
  });
}
