/** 邮件已读状态：0=未读，1=已读 */
export function hasUnreadProductMail(record: { mailIsRead?: number }): boolean {
  return record.mailIsRead === 0;
}

/** 商品素材（图片 + 视频）总个数上限 */
export const PRODUCT_MEDIA_MAX_COUNT = 25;

/** @deprecated 使用 {@link PRODUCT_MEDIA_MAX_COUNT} */
export const PRODUCT_MEDIA_MAX_IMAGES = PRODUCT_MEDIA_MAX_COUNT;
