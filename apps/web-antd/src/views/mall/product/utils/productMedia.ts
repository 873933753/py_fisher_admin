import type {
  ProductMediaItem,
  ProductSkuAttributeRow,
  ProductSkuOptionMedia,
} from '../types/product';
import type { ProductMediaKind } from './mediaKind';

import { getMediaKindFromFile } from './mediaKind';

/* 限制上传图片和文件大小 */
export const PRODUCT_MEDIA_IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 图片10M
export const PRODUCT_MEDIA_VIDEO_MAX_BYTES = 100 * 1024 * 1024; // 视频100M
export const PRODUCT_MEDIA_UPLOAD_CONCURRENCY = 4;

function formatProductMediaMaxMb(bytes: number): string {
  return `${bytes / (1024 * 1024)}MB`;
}

export const PRODUCT_MEDIA_IMAGE_MAX_LABEL = formatProductMediaMaxMb(
  PRODUCT_MEDIA_IMAGE_MAX_BYTES,
);
export const PRODUCT_MEDIA_VIDEO_MAX_LABEL = formatProductMediaMaxMb(
  PRODUCT_MEDIA_VIDEO_MAX_BYTES,
);

/** 商品主图区域展示的体积限制说明 */
export const PRODUCT_MEDIA_SIZE_HINT = `（图片最大 ${PRODUCT_MEDIA_IMAGE_MAX_LABEL}，视频最大 ${PRODUCT_MEDIA_VIDEO_MAX_LABEL}）`;

export function validateProductMediaFile(
  file: File,
): { kind: ProductMediaKind; ok: true } | { message: string; ok: false } {
  const kind = getMediaKindFromFile(file);
  if (!kind) {
    return { ok: false, message: `不支持的文件类型：${file.name}` };
  }
  const maxBytes =
    kind === 'image'
      ? PRODUCT_MEDIA_IMAGE_MAX_BYTES
      : PRODUCT_MEDIA_VIDEO_MAX_BYTES;
  const maxLabel =
    kind === 'image'
      ? PRODUCT_MEDIA_IMAGE_MAX_LABEL
      : PRODUCT_MEDIA_VIDEO_MAX_LABEL;
  if (file.size > maxBytes) {
    return {
      ok: false,
      message: `${kind === 'image' ? '图片' : '视频'}「${file.name}」超过 ${maxLabel} 限制`,
    };
  }
  return { ok: true, kind };
}

/** 保存商品时写入 mainImg：图片/视频、已上传成功的 ossPath，顺序与 mediaItems 一致 */
export function getMainImgUrlsForSave(items: ProductMediaItem[]): string[] {
  return items
    .filter(
      (m) =>
        (m.kind === 'image' || m.kind === 'video') &&
        m.uploadStatus === 'done' &&
        Boolean(m.ossPath?.trim()),
    )
    .map((m) => m.ossPath?.trim() ?? '');
}

export function hasIncompleteMediaUploads(items: ProductMediaItem[]): boolean {
  return items.some(
    (m) => m.uploadStatus === 'uploading' || m.uploadStatus === 'error',
  );
}

/** 保存 specImages.imgPath：仅上传成功的 ossPath，顺序与选项图集一致 */
export function getSkuOptionImgPathsForSave(
  items: ProductSkuOptionMedia[],
): string[] {
  return items
    .filter((m) => m.uploadStatus === 'done' && Boolean(m.ossPath?.trim()))
    .map((m) => m.ossPath?.trim() ?? '');
}

export function hasIncompleteSkuOptionMediaUploads(
  items: ProductSkuOptionMedia[],
): boolean {
  return items.some(
    (m) => m.uploadStatus === 'uploading' || m.uploadStatus === 'error',
  );
}

/** 遍历所有规格选项图集，是否存在未完成上传 */
export function hasIncompleteSkuOptionMediaInAttributes(
  skuAttributes: ProductSkuAttributeRow[],
): boolean {
  for (const row of skuAttributes) {
    for (const opt of row.options) {
      if (hasIncompleteSkuOptionMediaUploads(opt.images)) return true;
    }
  }
  return false;
}

/** 误将 CDN 域名与 blob拼接 */
export function isCorruptedPreviewUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return true;
  return /^https?:\/\/.+blob:/i.test(t);
}

/** 可用于 <img src> 的地址：完整 http(s) 或本地 blob（排除畸形拼接） */
export function isDisplayablePreviewUrl(url: string): boolean {
  const t = url.trim();
  if (!t || isCorruptedPreviewUrl(t)) return false;
  return /^https?:\/\//i.test(t) || t.startsWith('blob:');
}

/**
 * 修复 CDN域名 + blob:... 错误拼接；需同时提供 ossPath。
 * https://ossisb2c.shuoguo.lifeblob:http://localhost:5666/uuid + ossPath -> https://ossisb2c.shuoguo.life/{ossPath}
 */
export function tryRepairCorruptedOssFileUrl(
  fileUrl: string,
  ossPath: string,
): string | undefined {
  const path = ossPath.trim().replace(/^\//, '');
  if (!path) return undefined;
  const baseMatch = fileUrl.trim().match(/^(https?:\/\/[^/]+?)blob:/i);
  if (!baseMatch?.[1]) return undefined;
  return `${baseMatch[1]}/${path}`;
}

/** 解析 OSS 上传/详情返回的预览地址，过滤或修复畸形 fileUrl */
export function resolveOssPreviewUrl(
  fileUrl: string | undefined,
  ossPath?: string,
): string | undefined {
  const url = fileUrl?.trim() ?? '';
  const path = ossPath?.trim() ?? '';

  if (url && isDisplayablePreviewUrl(url)) return url;

  if (url && isCorruptedPreviewUrl(url) && path) {
    const repaired = tryRepairCorruptedOssFileUrl(url, path);
    if (repaired && isDisplayablePreviewUrl(repaired)) return repaired;
  }

  return undefined;
}

/** 选项图预览地址（上传中仅 blob；完成后不含ossPath） */
export function getSkuOptionMediaPreviewUrl(
  item: ProductSkuOptionMedia,
): string | undefined {
  if (item.uploadStatus === 'uploading') {
    const url = item.url?.trim();
    return url?.startsWith('blob:') ? url : undefined;
  }
  if (item.uploadStatus === 'error') return undefined;
  return resolveOssPreviewUrl(item.url, item.ossPath);
}

/** 选项图集首张可预览地址 */
export function getFirstSkuOptionMediaPreviewUrl(
  images: ProductSkuOptionMedia[],
): string | undefined {
  for (const im of images) {
    const preview = getSkuOptionMediaPreviewUrl(im);
    if (preview) return preview;
  }
  return undefined;
}

/** 变体组合主图继承：仅稳定远端地址，不用 blob */
export function getFirstSkuOptionMediaPreviewUrlForVariation(
  images: ProductSkuOptionMedia[],
): string | undefined {
  for (const im of images) {
    if (im.uploadStatus === 'uploading' || im.uploadStatus === 'error') {
      continue;
    }
    const preview = resolveOssPreviewUrl(im.url, im.ossPath);
    if (preview && !preview.startsWith('blob:')) return preview;
  }
  return undefined;
}

/** 变体行主图列展示地址（不用 blob，可尝试修复畸形 https） */
export function getVariationRowPreviewUrl(
  imageUrls: string[],
): string | undefined {
  const u = imageUrls[0]?.trim();
  if (!u || u.startsWith('blob:')) return undefined;
  const resolved = resolveOssPreviewUrl(u);
  if (resolved) return resolved;
  return isDisplayablePreviewUrl(u) ? u : undefined;
}

/** 回显/草稿：修正选项图与变体行中的畸形预览地址 */
export function sanitizeSkuAttributesPreviewUrls(
  skuAttributes: ProductSkuAttributeRow[],
): void {
  for (const row of skuAttributes) {
    for (const opt of row.options) {
      for (const im of opt.images) {
        if (im.uploadStatus === 'uploading') continue;
        const fixed = resolveOssPreviewUrl(im.url, im.ossPath);
        im.url = fixed ?? (isDisplayablePreviewUrl(im.url ?? '') ? im.url : '');
      }
    }
  }
}
