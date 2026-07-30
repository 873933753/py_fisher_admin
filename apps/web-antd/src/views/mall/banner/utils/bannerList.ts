import type { SysHomeFeedApi } from '#/api/core/sysHomeFeed';

import { FEED_TYPE_BANNER, isFloorFeedType } from '../constants';

function formatFlag01(value: number | string | undefined) {
  return value === 1 || value === '1' ? '是' : '否';
}

/** 根据逗号分隔的 productIds 统计商品数量 */
export function countProductIds(productIds?: null | string): number {
  if (!productIds?.trim()) return 0;
  return productIds
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean).length;
}

/** 列表「商品数量」列展示：仅商品楼层显示数量，其它类型为 — */
export function formatListProductCount(
  record: SysHomeFeedApi.HomeFeedRecord,
): string {
  if (!isFloorFeedType(record.feedType)) return '—';
  return String(countProductIds(record.productIds));
}

/** 列表「是否轮播」列展示：仅广告图显示是/否，其它类型为 — */
export function formatListIsScroll(
  record: SysHomeFeedApi.HomeFeedRecord,
): string {
  if (record.feedType !== FEED_TYPE_BANNER) return '—';
  return formatFlag01(record.isScroll);
}
