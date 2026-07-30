/** 常见图片扩展名 */
const IMAGE_EXTENSIONS = new Set([
  'avif',
  'bmp',
  'gif',
  'heic',
  'heif',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'webp',
]);

/** 常见视频扩展名 */
const VIDEO_EXTENSIONS = new Set([
  'avi',
  'flv',
  'm4v',
  'mkv',
  'mov',
  'mp4',
  'mpeg',
  'mpg',
  'webm',
  'wmv',
]);

export type ProductMediaKind = 'image' | 'video';

function extensionFromPath(pathOrUrl: string): string {
  const raw = pathOrUrl.split(/[?#]/)[0] ?? pathOrUrl;
  const base = raw.split('/').pop() ?? raw;
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

/** 根据 URL / ossPath 后缀推断素材类型 */
export function inferMediaKindFromUrl(
  pathOrUrl: string,
): null | ProductMediaKind {
  const ext = extensionFromPath(pathOrUrl);
  if (!ext) return null;
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  return null;
}

/** 根据 File MIME 推断素材类型 */
export function getMediaKindFromFile(file: File): null | ProductMediaKind {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return inferMediaKindFromUrl(file.name);
}
