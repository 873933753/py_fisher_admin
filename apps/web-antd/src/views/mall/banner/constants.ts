/** 广告图 */
export const FEED_TYPE_BANNER = 'HOMEPAGE_HIERARCHY_BANNER';
/** 商品楼层 */
export const FEED_TYPE_FLOOR = 'HOMEPAGE_HIERARCHY_FLOOR';
/** 快捷入口 */
export const FEED_TYPE_QUICK = 'HOMEPAGE_HIERARCHY_QUICK';

export const JUMP_TYPE_CATEGORY = 'CATEGORY';
export const JUMP_TYPE_NONE = 'NONE_JUMP';

export const DEFAULT_SORT_NUM = 1;

/** 快捷入口最多条数 */
export const QUICK_ENTRY_MAX = 8;

export function isBannerLikeFeedType(feedType: string) {
  return feedType === FEED_TYPE_BANNER || feedType === FEED_TYPE_QUICK;
}

export function isFloorFeedType(feedType: string) {
  return feedType === FEED_TYPE_FLOOR;
}

export function isQuickFeedType(feedType: string) {
  return feedType === FEED_TYPE_QUICK;
}

/** 广告图且不轮播（isScroll=0） */
export function isBannerNoScroll(isScroll: string) {
  return isScroll === '0';
}
