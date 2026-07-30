import type { AboutUsFormState, WhatsappFileItem } from '../types';

import type { SysAboutUsApi } from '#/api/core/sysAboutUs';

import { EMAILS_MAX } from '../constants';

function createUid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `wa-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 完整 URL 或路径 -> 带前导 / 的 ossPath */
export function urlToOssPath(value: string): string {
  const t = value.trim();
  if (!t) return '';
  if (t.startsWith('/') && !t.startsWith('//')) return t;
  try {
    const pathname = new URL(t).pathname;
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  } catch {
    return t.startsWith('/') ? t : `/${t}`;
  }
}

function normalizeOssPathForSave(ossPath: string): string {
  const t = ossPath.trim();
  if (!t) return '';
  return t.startsWith('/') ? t : `/${t}`;
}

/** 接口 email 字符串 -> 表单行（仅按英文逗号拆分） */
export function splitEmails(value?: string): string[] {
  if (!value?.trim()) return [''];
  const parts = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, EMAILS_MAX);
  return parts.length > 0 ? parts : [''];
}

/** 表单行 -> 接口 email 字符串 */
export function joinEmails(emails: string[]): string {
  return emails
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, EMAILS_MAX)
    .join(', ');
}

export function emptyAboutUsForm(): AboutUsFormState {
  return {
    title: '',
    content: '',
    emails: [''],
    endPage: '',
    whatsappFiles: [],
  };
}

function whatsappUrlToItem(url: string, index: number): WhatsappFileItem {
  const ossPath = urlToOssPath(url);
  const previewUrl = url.trim() || ossPath;
  return {
    uid: createUid(),
    name: `whatsapp-${index + 1}`,
    ossPath,
    previewUrl,
    uploadStatus: 'done',
  };
}

export function mapAboutUsInfoToForm(
  info: null | SysAboutUsApi.AboutUsInfo | undefined,
): AboutUsFormState {
  if (!info) return emptyAboutUsForm();

  const files = (info.whatsappFiles ?? [])
    .map((url, index) => whatsappUrlToItem(url, index))
    .filter((item) => item.ossPath);

  return {
    title: info.title ?? '',
    content: info.content ?? '',
    emails: splitEmails(info.email),
    endPage: info.endPage ?? '',
    whatsappFiles: files,
  };
}

export function formToSaveBody(
  form: AboutUsFormState,
): SysAboutUsApi.SaveOrUpdBody {
  const whatsappFiles = form.whatsappFiles
    .filter((item) => item.uploadStatus === 'done' && item.ossPath.trim())
    .map((item) => normalizeOssPathForSave(item.ossPath));

  return {
    title: form.title.trim(),
    content: form.content.trim(),
    email: joinEmails(form.emails),
    endPage: form.endPage.trim(),
    whatsappFiles,
  };
}

export function hasIncompleteWhatsappUploads(form: AboutUsFormState): boolean {
  return form.whatsappFiles.some((item) => item.uploadStatus === 'uploading');
}
