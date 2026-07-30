<script lang="ts" setup>
import type { ProductMediaItem } from '../types/product';

import { computed, inject, onBeforeUnmount, ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { IconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import { uploadOssFileApi } from '#/api/core/oss';

import { PRODUCT_MEDIA_MAX_COUNT } from '../constants';
import { mallProductFormBizKey } from '../injectionKeys';
import { getMediaKindFromFile } from '../utils/mediaKind';
import {
  PRODUCT_MEDIA_SIZE_HINT,
  PRODUCT_MEDIA_UPLOAD_CONCURRENCY,
  resolveOssPreviewUrl,
  validateProductMediaFile,
} from '../utils/productMedia';

const injectedBiz = inject(mallProductFormBizKey);
if (!injectedBiz) {
  throw new Error('ProductMediaUpload must be used within MallProductForm');
}
const formBiz = injectedBiz;

const pickerRef = ref<HTMLInputElement | null>(null);

const maxMediaSlots = PRODUCT_MEDIA_MAX_COUNT;

const hasMedia = computed(() => formBiz.value.mediaItems.length > 0);
const mediaCount = computed(() => formBiz.value.mediaItems.length);

const canAddMoreMedia = computed(
  () => formBiz.value.mediaItems.length < maxMediaSlots,
);

const SECONDARY_SLOT_TOTAL = maxMediaSlots - 1;

const emptyPlaceholderCount = computed(() => {
  const usedSecondary = Math.max(0, formBiz.value.mediaItems.length - 1);
  const addCell = canAddMoreMedia.value ? 1 : 0;
  return Math.max(0, SECONDARY_SLOT_TOTAL - usedSecondary - addCell);
});

let uploadInFlight = 0;
const uploadWaiters: Array<() => void> = [];

function acquireUploadSlot(): Promise<void> {
  if (uploadInFlight < PRODUCT_MEDIA_UPLOAD_CONCURRENCY) {
    uploadInFlight += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    uploadWaiters.push(() => {
      uploadInFlight += 1;
      resolve();
    });
  });
}

function releaseUploadSlot() {
  uploadInFlight = Math.max(0, uploadInFlight - 1);
  const next = uploadWaiters.shift();
  if (next) next();
}

function createUid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function revokeIfBlob(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function findMediaItem(uid: string) {
  return formBiz.value.mediaItems.find((item) => item.uid === uid);
}

function createPendingItem(
  file: File,
  kind: ProductMediaItem['kind'],
): ProductMediaItem {
  return {
    kind,
    name: file.name,
    uid: createUid(),
    url: URL.createObjectURL(file),
    uploadStatus: 'uploading',
    file,
  };
}

async function uploadMediaItem(item: ProductMediaItem, file: File) {
  await acquireUploadSlot();
  try {
    const data = await uploadOssFileApi(file);
    const target = findMediaItem(item.uid);
    if (!target) return;
    revokeIfBlob(target.url);
    target.url = resolveOssPreviewUrl(data.fileUrl, data.ossPath) ?? '';
    target.ossPath = data.ossPath;
    target.uploadStatus = 'done';
    target.file = undefined;
  } catch {
    const target = findMediaItem(item.uid);
    if (target) {
      target.uploadStatus = 'error';
      target.file = file;
    }
    message.error(`上传失败：${file.name}`);
  } finally {
    releaseUploadSlot();
  }
}

function queueUpload(item: ProductMediaItem, file: File) {
  void uploadMediaItem(item, file);
}

function ingestFiles(files: File[]) {
  const pending: Array<{ file: File; item: ProductMediaItem }> = [];

  for (const file of files) {
    if (formBiz.value.mediaItems.length + pending.length >= maxMediaSlots) {
      message.warning(`最多可上传 ${maxMediaSlots} 个素材`);
      break;
    }

    const validated = validateProductMediaFile(file);
    if (!validated.ok) {
      message.warning(validated.message);
      continue;
    }

    const item = createPendingItem(file, validated.kind);
    pending.push({ file, item });
  }

  for (const { file, item } of pending) {
    formBiz.value.mediaItems.push(item);
    queueUpload(item, file);
  }
}

function onInputChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files?.length) return;
  ingestFiles([...files]);
  target.value = '';
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (!files?.length) return;
  ingestFiles([...files]);
}

function openPicker() {
  pickerRef.value?.click();
}

function removeMedia(uid: string) {
  const idx = formBiz.value.mediaItems.findIndex((item) => item.uid === uid);
  if (idx === -1) return;
  const [removed] = formBiz.value.mediaItems.splice(idx, 1);
  if (removed) revokeIfBlob(removed.url);
}

function retryUpload(uid: string) {
  const item = findMediaItem(uid);
  if (!item?.file) return;
  const kind = getMediaKindFromFile(item.file) ?? item.kind;
  item.kind = kind;
  item.uploadStatus = 'uploading';
  queueUpload(item, item.file);
}

function isDraggableItem(item: ProductMediaItem) {
  return item.uploadStatus === 'done';
}

/* 点击图标打开新的页面播放video */
function openVideoPreview(item: ProductMediaItem) {
  if (!item.url || item.uploadStatus === 'uploading') return;
  window.open(item.url, '_blank', 'noopener,noreferrer');
}

onBeforeUnmount(() => {
  for (const item of formBiz.value.mediaItems) {
    revokeIfBlob(item.url);
  }
});
</script>

<template>
  <div class="product-form-module-shell">
    <div class="mb-3 flex items-center justify-between gap-2">
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <h3 class="product-form-module-title shrink-0">商品主图</h3>
        <span class="text-xs text-slate-400">{{
          PRODUCT_MEDIA_SIZE_HINT
        }}</span>
      </div>
      <div class="shrink-0 text-xs text-slate-500">
        图片 & 视频 【 {{ mediaCount }}/{{ maxMediaSlots }}】
      </div>
    </div>

    <input
      ref="pickerRef"
      type="file"
      class="sr-only"
      accept="image/*,video/*"
      multiple
      @change="onInputChange"
    />

    <div
      v-if="!hasMedia"
      class="media-empty-dropzone mt-3"
      @dragover.prevent
      @drop="onDrop"
    >
      <div class="media-empty-inner">
        <IconifyIcon
          class="media-empty-icon"
          icon="mdi:image-plus-outline"
          aria-hidden="true"
        />
        <p class="media-empty-title">将文件拖放到此处</p>
        <button
          type="button"
          class="media-empty-upload-btn"
          @click="openPicker"
        >
          从电脑上传
        </button>
      </div>
    </div>

    <div v-else class="media-grid mt-3" @dragover.prevent @drop="onDrop">
      <VueDraggable
        v-model="formBiz.mediaItems"
        :animation="200"
        class="media-draggable contents"
        draggable=".media-item--draggable"
        ghost-class="media-card-ghost"
        chosen-class="media-card-chosen"
      >
        <div
          v-for="(item, i) in formBiz.mediaItems"
          :key="item.uid"
          class="media-item group"
          :class="{ 'media-item--draggable': isDraggableItem(item) }"
        >
          <img
            v-if="item.kind === 'image'"
            :src="item.url"
            :alt="item.name"
            class="media-preview"
            draggable="false"
          />
          <video
            v-else
            :src="item.url"
            class="media-preview"
            muted
            playsinline
            preload="metadata"
          ></video>

          <button
            v-if="item.kind === 'video'"
            type="button"
            class="media-video-badge"
            title="播放视频"
            :disabled="!item.url || item.uploadStatus === 'uploading'"
            @mousedown.stop
            @click.stop="openVideoPreview(item)"
          >
            <IconifyIcon
              class="media-video-badge-icon"
              icon="mdi:play-circle"
            />
          </button>

          <div
            v-if="item.uploadStatus === 'uploading'"
            class="media-upload-mask"
            aria-live="polite"
          >
            <IconifyIcon
              class="media-upload-spinner"
              icon="mdi:loading"
              aria-hidden="true"
            />
          </div>
          <div
            v-else-if="item.uploadStatus === 'error'"
            class="media-upload-mask media-upload-mask--error"
          >
            <span class="media-upload-error-text">上传失败</span>
            <button
              type="button"
              class="media-upload-retry-btn"
              @click.stop="retryUpload(item.uid)"
            >
              重试
            </button>
          </div>

          <button
            type="button"
            class="media-remove"
            title="删除"
            @click.stop="removeMedia(item.uid)"
          >
            <IconifyIcon class="size-4" icon="mdi:close" />
          </button>

          <span v-if="i === 0" class="media-main-label">主图</span>
        </div>
      </VueDraggable>

      <button
        v-if="canAddMoreMedia"
        type="button"
        class="media-add"
        @click="openPicker"
      >
        <IconifyIcon
          class="mb-1 size-8 text-slate-500"
          icon="mdi:image-plus-outline"
        />
        <span class="text-[13px] font-medium leading-none text-slate-700">
          添加
        </span>
      </button>

      <div
        v-for="n in emptyPlaceholderCount"
        :key="`empty-${n}`"
        class="media-placeholder"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.media-empty-dropzone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 290px;
  padding: 48px 24px;
  background: #fff;
  border: 2px dashed #e2e8f0;
  border-radius: 18px;
}

.media-empty-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  text-align: center;
}

.media-empty-icon {
  width: 40px;
  height: 40px;
  font-size: 40px;
  color: #0f172a;
}

.media-empty-title {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
  color: #0f172a;
}

.media-empty-upload-btn {
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.25;
  color: #0f172a;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
}

.media-empty-upload-btn:hover {
  background: #fafafa;
}

/*
 * 统一网格：11 列 × 90px + 10px gap → 主图 3×3 = 290×290（3*90 + 2*10），
 * 与小图 90×90 共用同一套 grid，sortable 在拖动时移动 DOM，:first-child 自动套用
 * 主图 span 规则，从而 ghost 尺寸总是与目标位置一致，不会再"顶掉"相邻格。
 */
.media-grid {
  display: grid;
  grid-template-columns: repeat(11, 90px);
  grid-auto-rows: 90px;
  gap: 10px;
  align-content: start;
}

.media-item,
.media-add,
.media-placeholder {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f5f5f4;
  border: 1px solid transparent;
  border-radius: 16px;
}

.media-item {
  cursor: grab;
}

.media-item:active {
  cursor: grabbing;
}

.media-item:not(.media-item--draggable) {
  cursor: default;
}

/* 主图：取 .media-draggable 当前 DOM 顺序中的第一个子节点（含拖拽时的 ghost） */
.media-grid .media-draggable > *:first-child {
  grid-row: span 3;
  grid-column: span 3;
  border-radius: 18px;
}

.media-preview {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-upload-mask {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: rgb(255 255 255 / 72%);
}

.media-upload-mask--error {
  pointer-events: auto;
  background: rgb(15 23 42 / 55%);
}

.media-upload-spinner {
  font-size: 28px;
  color: #334155;
  animation: media-upload-spin 0.9s linear infinite;
}

.media-upload-error-text {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.media-upload-retry-btn {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
  cursor: pointer;
  background: #fff;
  border: none;
  border-radius: 9999px;
}

@keyframes media-upload-spin {
  to {
    transform: rotate(360deg);
  }
}

.media-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 10;
  display: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #fff;
  cursor: pointer;
  background: rgb(0 0 0 / 58%);
  border: none;
  border-radius: 9999px;
}

.media-item:hover .media-remove {
  display: inline-flex;
}

/* 主图位置的删除按钮放大并永显 */
.media-grid .media-draggable > *:first-child .media-remove {
  top: 12px;
  right: 12px;
  display: inline-flex;
  width: 32px;
  height: 32px;
  color: #111827;
  background: rgb(255 255 255 / 92%);
}

.media-main-label {
  position: absolute;
  bottom: 12px;
  left: 50%;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  pointer-events: none;
  background: rgb(75 85 99 / 85%);
  border-radius: 9999px;
  transform: translateX(-50%);
}

.media-video-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  cursor: pointer;
  background: rgb(0 0 0 / 55%);
  border: none;
  border-radius: 9999px;
}

.media-video-badge:hover:not(:disabled) {
  background: rgb(0 0 0 / 72%);
}

.media-video-badge:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.media-video-badge-icon {
  font-size: 18px;
  color: #fff;
}

.media-grid .media-draggable > *:first-child .media-video-badge {
  bottom: 12px;
  left: 12px;
  width: 36px;
  height: 36px;
}

.media-grid .media-draggable > *:first-child .media-video-badge-icon {
  font-size: 22px;
}

.media-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #334155;
  cursor: pointer;
}

.media-add:hover {
  background: #ecebea;
}

/* 拖动中的 ghost 与目标格保持一致的尺寸（由 grid 决定），仅做透明度提示 */
.media-card-ghost {
  opacity: 0.45;
}

.media-card-chosen {
  outline: 2px dashed #94a3b8;
  outline-offset: -2px;
}

/* 缩略视频仅作预览，不拦截拖拽 */
.media-item video {
  pointer-events: none;
}

@media (max-width: 900px) {
  /* 窄屏：3 列布局，主图依然 3×3 占满首屏宽度，小图自下方流式排列 */
  .media-grid {
    grid-template-columns: repeat(3, 90px);
  }
}
</style>
