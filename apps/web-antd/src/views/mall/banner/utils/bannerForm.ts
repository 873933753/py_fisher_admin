import type {
  BannerFileFormItem,
  BannerFormState,
  PickedProduct,
} from '../types';

import type { SysHomeFeedApi } from '#/api/core/sysHomeFeed';

import {
  DEFAULT_SORT_NUM,
  FEED_TYPE_BANNER,
  FEED_TYPE_QUICK,
  isQuickFeedType,
  JUMP_TYPE_CATEGORY,
  JUMP_TYPE_NONE,
  QUICK_ENTRY_MAX,
} from '../constants';
import { isBannerVideoItem } from './bannerMedia';

function clearBannerItemJump(item: BannerFileFormItem) {
  item.jumpCategoryIds = [];
  item.jumpCategoryPaths = [];
  item.jumpValue = '';
}

/** 是否轮播切换时规整轮播条目（仅广告图） */
export function normalizeBannerOnIsScrollChange(
  form: BannerFormState,
  prevIsScroll: string,
  nextIsScroll: string,
) {
  if (form.feedType !== FEED_TYPE_BANNER || prevIsScroll === nextIsScroll) {
    return;
  }

  if (nextIsScroll === '0' && prevIsScroll === '1') {
    for (const item of form.bannerFile) {
      if (item.jumpType === JUMP_TYPE_CATEGORY) {
        item.jumpType = JUMP_TYPE_NONE;
        clearBannerItemJump(item);
      }
    }
    return;
  }

  if (nextIsScroll === '1' && prevIsScroll === '0') {
    for (const item of form.bannerFile) {
      if (isBannerVideoItem(item)) {
        item.filePath = '';
        item.fileUrl = '';
      }
      item.jumpType = JUMP_TYPE_CATEGORY;
      clearBannerItemJump(item);
    }
  }
}

export function emptyBannerFileItem(): BannerFileFormItem {
  return {
    filePath: '',
    fileUrl: '',
    jumpType: JUMP_TYPE_CATEGORY,
    jumpCategoryIds: [],
    jumpCategoryPaths: [],
    jumpValue: '',
  };
}

/** 快捷入口：固定类目跳转、无图片 */
export function normalizeBannerFileItemForQuick(
  item: BannerFileFormItem,
): BannerFileFormItem {
  const jumpCategoryIds =
    item.jumpType === JUMP_TYPE_CATEGORY ? [...item.jumpCategoryIds] : [];
  return {
    filePath: '',
    fileUrl: '',
    jumpType: JUMP_TYPE_CATEGORY,
    jumpValue: '',
    jumpCategoryIds,
    jumpCategoryPaths: [...item.jumpCategoryPaths],
  };
}

export function normalizeBannerFileListForQuick(
  items: BannerFileFormItem[],
): BannerFileFormItem[] {
  const source =
    items.length > 0
      ? items.slice(0, QUICK_ENTRY_MAX)
      : [emptyBannerFileItem()];
  return source.map((item) => normalizeBannerFileItemForQuick(item));
}

export function normalizeIsScroll(
  value: null | number | string | undefined,
): string {
  if (value === 0 || value === '0') return '0';
  return '1';
}

export function emptyBannerForm(): BannerFormState {
  return {
    title: '',
    feedType: FEED_TYPE_BANNER,
    sortNum: DEFAULT_SORT_NUM,
    isScroll: '1',
    bannerFile: [emptyBannerFileItem()],
    productIds: '',
    pickedProducts: [],
  };
}

function parseJumpCategoryIds(jumpValue: string) {
  return jumpValue
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function recordToBannerForm(
  row: SysHomeFeedApi.HomeFeedRecord,
): BannerFormState {
  const feedType = row.feedType ?? FEED_TYPE_BANNER;
  const bannerFileSource =
    feedType === FEED_TYPE_QUICK
      ? (row.bannerFile ?? []).slice(0, QUICK_ENTRY_MAX)
      : (row.bannerFile ?? []);

  const bannerFile = bannerFileSource.map((item) => {
    const jumpCategoryIds =
      item.jumpType === JUMP_TYPE_CATEGORY
        ? parseJumpCategoryIds(item.jumpValue ?? '')
        : [];
    const base = {
      filePath: item.filePath ?? '',
      fileUrl: item.fileUrl ?? '',
      jumpType: item.jumpType?.trim() || JUMP_TYPE_NONE,
      jumpValue: item.jumpValue ?? '',
      jumpCategoryIds,
      jumpCategoryPaths: [] as string[][],
    };
    return feedType === FEED_TYPE_QUICK
      ? normalizeBannerFileItemForQuick(base)
      : base;
  });

  const productIds = (row.productIds ?? '').trim();
  const pickedProducts: PickedProduct[] = productIds
    ? productIds.split(',').map((id) => ({
        id: id.trim(),
        productName: id.trim(),
        mainImg: '',
        categoryLabel: '—',
      }))
    : [];

  return {
    id: row.id,
    title: row.title ?? '',
    feedType,
    sortNum: Number(row.sortNum) || DEFAULT_SORT_NUM,
    isScroll: normalizeIsScroll(row.isScroll),
    bannerFile: bannerFile.length > 0 ? bannerFile : [emptyBannerFileItem()],
    productIds,
    pickedProducts,
  };
}

export function bannerFormToSaveBody(
  form: BannerFormState,
): SysHomeFeedApi.SaveOrUpdBody {
  const body: SysHomeFeedApi.SaveOrUpdBody = {
    title: form.title.trim(),
    feedType: form.feedType,
    sortNum: form.sortNum,
  };

  if (form.id) {
    body.id = form.id;
  }

  if (form.feedType === FEED_TYPE_BANNER) {
    body.isScroll = normalizeIsScroll(form.isScroll);
  }

  if (isQuickFeedType(form.feedType)) {
    body.bannerFile = form.bannerFile.slice(0, QUICK_ENTRY_MAX).map((item) => ({
      filePath: '',
      jumpType: JUMP_TYPE_CATEGORY,
      jumpValue: item.jumpCategoryIds.join(','),
    }));
  } else if (form.feedType === FEED_TYPE_BANNER) {
    body.bannerFile = form.bannerFile
      .filter((item) => item.filePath.trim())
      .map((item) => {
        const jumpType = item.jumpType || JUMP_TYPE_NONE;
        let jumpValue = '';
        if (jumpType === JUMP_TYPE_CATEGORY) {
          jumpValue = item.jumpCategoryIds.join(',');
        }
        return {
          filePath: item.filePath.trim(),
          jumpType,
          jumpValue,
        };
      });
  } else {
    body.productIds = form.pickedProducts.map((p) => p.id).join(',');
  }

  return body;
}
