import type { ProductReviewApi } from '#/api/core/productReview';

import { inferMediaKindFromUrl } from '../product/utils/mediaKind';

/** 评论附件上限（图片 + 视频合计） */
export const REVIEW_FILE_MAX_COUNT = 5;

/** 商家回复内容字数上限 */
export const REVIEW_REPLY_CONTENT_MAX_LENGTH = 300;

/** 评论评分星星颜色 */
export const REVIEW_RATE_COLOR = '#e74e14';

/** 商家回复是否展示附件上传（暂隐藏） */
export const SHOW_REVIEW_REPLY_MEDIA_UPLOAD = false;

export const REVIEW_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const REVIEW_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

export function formatRatings(record: ProductReviewApi.ReviewRecord): string {
  const quality = record.ratingQuality ?? '—';
  const shipping = record.ratingShipping ?? '—';
  const service = record.ratingService ?? '—';
  return `质量 ${quality} / 运输 ${shipping} / 服务 ${service}`;
}

export function getUserDisplayName(
  record: ProductReviewApi.ReviewRecord,
): string {
  const nick = record.nickName?.trim();
  if (nick) return nick;
  const email = record.email?.trim();
  if (email) return email;
  return '—';
}

export function isVideoReviewFile(url: string): boolean {
  return inferMediaKindFromUrl(url) === 'video';
}

export function getReviewFiles(record: {
  reviewFile?: string | string[];
}): string[] {
  const raw = record.reviewFile;
  if (Array.isArray(raw)) {
    return raw.filter((item) => Boolean(item?.trim()));
  }
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text || text === '[]') {
      return [];
    }
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string =>
            typeof item === 'string' && Boolean(item.trim()),
        );
      }
    } catch {
      return [];
    }
  }
  return [];
}

export function getReviewCreateTime(record: {
  create_time?: string;
  createTime?: string;
}): string {
  const time = record.create_time?.trim() || record.createTime?.trim() || '';
  return time || '—';
}

function getMerchantReplyList(
  record: ProductReviewApi.ReviewRecord,
): ProductReviewApi.ReviewReplyRecord[] {
  return (record.productReviewReplieList ?? []).filter(
    (item) => item.replyType === 1,
  );
}

export function hasMerchantReply(
  record: ProductReviewApi.ReviewRecord,
): boolean {
  return getMerchantReplyList(record).length > 0;
}

export function getMerchantReplies(
  record: ProductReviewApi.ReviewRecord,
): ProductReviewApi.ReviewReplyRecord[] {
  return getMerchantReplyList(record);
}

export function hasReviewReplyType(
  record: ProductReviewApi.ReviewRecord,
  replyType: 0 | 1,
): boolean {
  return (record.productReviewReplieList ?? []).some(
    (item) => item.replyType === replyType,
  );
}

export function getReviewRepliesByType(
  record: ProductReviewApi.ReviewRecord,
  replyType: 0 | 1,
): ProductReviewApi.ReviewReplyRecord[] {
  return (record.productReviewReplieList ?? []).filter(
    (item) => item.replyType === replyType,
  );
}

export function getAverageRating(
  record: ProductReviewApi.ReviewRecord,
): number {
  const scores = [
    record.ratingQuality,
    record.ratingShipping,
    record.ratingService,
  ].filter((value): value is number => typeof value === 'number');

  if (scores.length === 0) {
    return 0;
  }

  const normalized = scores.map((value) => Math.min(5, Math.max(0, value)));
  const average =
    normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
  return Math.round(average * 2) / 2;
}

export function getUserHandle(record: ProductReviewApi.ReviewRecord): string {
  const name = getUserDisplayName(record);
  return name === '—' ? name : `@${name}`;
}
