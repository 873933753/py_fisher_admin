import type { BannerFileFormItem } from '../types';

/** 轮播「不轮播」模式下允许的视频扩展名 */
const BANNER_VIDEO_EXTENSIONS = new Set(['mov', 'mp4', 'webm']);

const BANNER_VIDEO_MIME_PREFIX = 'video/';

function extensionFromPath(pathOrUrl: string): string {
  const raw = pathOrUrl.split(/[?#]/)[0] ?? pathOrUrl;
  const base = raw.split('/').pop() ?? raw;
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

export function isBannerVideoPath(pathOrUrl: string): boolean {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return false;
  return BANNER_VIDEO_EXTENSIONS.has(extensionFromPath(trimmed));
}

export function isBannerVideoFile(file: File): boolean {
  if (file.type.startsWith(BANNER_VIDEO_MIME_PREFIX)) {
    const ext = extensionFromPath(file.name);
    return !ext || BANNER_VIDEO_EXTENSIONS.has(ext);
  }
  return isBannerVideoPath(file.name);
}

export function isBannerVideoItem(item: BannerFileFormItem): boolean {
  return (
    isBannerVideoPath(item.filePath) || isBannerVideoPath(item.fileUrl ?? '')
  );
}

export function bannerListHasVideo(items: BannerFileFormItem[]): boolean {
  return items.some((item) => isBannerVideoItem(item));
}
