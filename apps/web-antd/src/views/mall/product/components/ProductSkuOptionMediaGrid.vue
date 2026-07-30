<script lang="ts">
/** 默认最大张数 */
export const SKU_OPTION_MEDIA_MAX_DEFAULT = 12;
</script>

<script lang="ts" setup>
/**
 * SKU 选项图集（受控组件）
 */
import type { ProductSkuOptionMedia } from '../types/product';

import { computed, onBeforeUnmount, ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { IconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import { uploadOssFileApi } from '#/api/core/oss';

import {
  PRODUCT_MEDIA_UPLOAD_CONCURRENCY,
  resolveOssPreviewUrl,
  validateProductMediaFile,
} from '../utils/productMedia';

interface Props {
  /** 当前选项的图集（受控） */
  modelValue: ProductSkuOptionMedia[];
  /** 最多张数，默认 12 */
  max?: number;
  /** 网格头部展示的副标题*/
  title?: string;
  /** 禁用上传/删除/拖拽 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  max: SKU_OPTION_MEDIA_MAX_DEFAULT,
  title: '',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', v: ProductSkuOptionMedia[]): void;
}>();

const pickerRef = ref<HTMLInputElement | null>(null);

/** 双向绑定计算属性：拖动排序与新增删除统一通过 emit 输出 */
const items = computed<ProductSkuOptionMedia[]>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const hasMedia = computed(() => items.value.length > 0);
const canAddMore = computed(() => items.value.length < props.max);

/** 剩余空格子数：补足到 max，让网格视觉始终是 12 个位置 */
const emptyPlaceholderCount = computed(() => {
  const used =
    items.value.length + (canAddMore.value && !props.disabled ? 1 : 0);
  return Math.max(0, props.max - used);
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
  return `opt-img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function revokeIfBlob(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
}

function replaceItem(uid: string, patch: Partial<ProductSkuOptionMedia>) {
  const list = items.value.map((item) =>
    item.uid === uid ? { ...item, ...patch } : item,
  );
  items.value = list;
}

function findItem(uid: string) {
  return items.value.find((item) => item.uid === uid);
}

function createPendingItem(file: File): ProductSkuOptionMedia {
  return {
    uid: createUid(),
    name: file.name,
    url: URL.createObjectURL(file),
    uploadStatus: 'uploading',
    file,
  };
}

async function uploadItem(item: ProductSkuOptionMedia, file: File) {
  await acquireUploadSlot();
  try {
    const data = await uploadOssFileApi(file);
    const target = findItem(item.uid);
    if (!target) return;
    revokeIfBlob(target.url);
    replaceItem(item.uid, {
      url: resolveOssPreviewUrl(data.fileUrl, data.ossPath) ?? '',
      ossPath: data.ossPath,
      uploadStatus: 'done',
      file: undefined,
    });
  } catch {
    replaceItem(item.uid, { uploadStatus: 'error', file });
    message.error(`上传失败：${file.name}`);
  } finally {
    releaseUploadSlot();
  }
}

function queueUpload(item: ProductSkuOptionMedia, file: File) {
  void uploadItem(item, file);
}

/** 批量摄入文件：仅图片，超出 max 提示并截断 */
function ingestFiles(files: File[]) {
  if (props.disabled) return;
  const pending: Array<{ file: File; item: ProductSkuOptionMedia }> = [];
  const next = [...items.value];

  for (const file of files) {
    if (next.length + pending.length >= props.max) {
      message.warning(`最多可上传 ${props.max} 张图片`);
      break;
    }
    if (!file.type.startsWith('image/')) {
      message.warning(`仅支持图片：${file.name}`);
      continue;
    }
    const validated = validateProductMediaFile(file);
    if (!validated.ok) {
      message.warning(validated.message);
      continue;
    }
    if (validated.kind !== 'image') continue;

    const item = createPendingItem(file);
    pending.push({ file, item });
    next.push(item);
  }

  if (pending.length === 0) return;
  items.value = next;
  for (const { file, item } of pending) {
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
  if (props.disabled) return;
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (!files?.length) return;
  ingestFiles([...files]);
}

function openPicker() {
  if (props.disabled) return;
  pickerRef.value?.click();
}

function removeAt(index: number) {
  if (props.disabled) return;
  const next = [...items.value];
  const [removed] = next.splice(index, 1);
  if (removed) revokeIfBlob(removed.url);
  items.value = next;
}

function retryUpload(uid: string) {
  const item = findItem(uid);
  if (!item?.file) return;
  replaceItem(uid, { uploadStatus: 'uploading' });
  queueUpload(item, item.file);
}

function isDraggableItem(item: ProductSkuOptionMedia) {
  return item.uploadStatus === 'done';
}

onBeforeUnmount(() => {
  for (const item of items.value) {
    revokeIfBlob(item.url);
  }
});
</script>

<template>
  <div class="sku-option-media">
    <input
      ref="pickerRef"
      type="file"
      class="sr-only"
      accept="image/*"
      multiple
      @change="onInputChange"
    />

    <div
      v-if="!hasMedia"
      class="sku-option-media-empty mt-4"
      @dragover.prevent
      @drop="onDrop"
    >
      <div class="sku-option-media-empty-inner">
        <IconifyIcon
          class="sku-option-media-empty-icon"
          icon="mdi:image-plus-outline"
          aria-hidden="true"
        />
        <p class="sku-option-media-empty-title">将图片拖放到此处</p>
        <button
          v-if="!disabled"
          type="button"
          class="sku-option-media-empty-upload-btn"
          @click="openPicker"
        >
          从电脑上传
        </button>
      </div>
    </div>

    <div v-else class="sku-option-media-grid" @dragover.prevent @drop="onDrop">
      <VueDraggable
        v-model="items"
        :animation="180"
        :disabled="disabled"
        class="contents sku-option-media-draggable"
        draggable=".sku-option-media-item--draggable"
        ghost-class="sku-option-media-item-ghost"
        chosen-class="sku-option-media-item-chosen"
      >
        <div
          v-for="(item, i) in items"
          :key="item.uid"
          class="sku-option-media-item group"
          :class="{
            'sku-option-media-item--draggable': isDraggableItem(item),
          }"
        >
          <img
            :src="item.url"
            :alt="item.name"
            class="sku-option-media-preview"
            draggable="false"
          />

          <div
            v-if="item.uploadStatus === 'uploading'"
            class="sku-option-media-upload-mask"
            aria-live="polite"
          >
            <IconifyIcon
              class="sku-option-media-upload-spinner"
              icon="mdi:loading"
              aria-hidden="true"
            />
          </div>
          <div
            v-else-if="item.uploadStatus === 'error'"
            class="sku-option-media-upload-mask sku-option-media-upload-mask--error"
          >
            <span class="sku-option-media-upload-error-text">上传失败</span>
            <button
              type="button"
              class="sku-option-media-upload-retry-btn"
              @click.stop="retryUpload(item.uid)"
            >
              重试
            </button>
          </div>

          <span v-if="i === 0" class="sku-option-media-cover-tag">主图</span>
          <button
            v-if="!disabled"
            type="button"
            class="sku-option-media-remove"
            title="删除"
            @click.stop="removeAt(i)"
          >
            <IconifyIcon class="size-3.5" icon="mdi:close" />
          </button>
        </div>
      </VueDraggable>

      <button
        v-if="canAddMore && !disabled"
        type="button"
        class="sku-option-media-add"
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
        class="sku-option-media-placeholder"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.sku-option-media {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sku-option-media-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: rgb(15 23 42);
}

.sku-option-media-counter {
  font-size: 12px;
  font-weight: 400;
  color: rgb(100 116 139);
}

.sku-option-media-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 290px;
  padding: 48px 24px;
  background: #fff;
  border: 2px dashed #e2e8f0;
  border-radius: 18px;
}

.sku-option-media-empty-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  text-align: center;
}

.sku-option-media-empty-icon {
  width: 40px;
  height: 40px;
  font-size: 40px;
  color: #0f172a;
}

.sku-option-media-empty-title {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
  color: #0f172a;
}

.sku-option-media-empty-upload-btn {
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

.sku-option-media-empty-upload-btn:hover {
  background: #fafafa;
}

.sku-option-media-grid {
  display: grid;
  grid-template-columns: repeat(8, 90px);
  grid-auto-rows: 90px;
  gap: 10px;
  align-content: start;
}

.sku-option-media-item,
.sku-option-media-add,
.sku-option-media-placeholder {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f5f5f4;
  border: 1px solid transparent;
  border-radius: 16px;
}

.sku-option-media-item {
  cursor: grab;
}

.sku-option-media-item:active {
  cursor: grabbing;
}

.sku-option-media-item:not(.sku-option-media-item--draggable) {
  cursor: default;
}

.sku-option-media-grid :deep(.sku-option-media-draggable > *:first-child) {
  grid-row: span 3;
  grid-column: span 3;
  border-radius: 18px;
}

.sku-option-media-preview {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sku-option-media-upload-mask {
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

.sku-option-media-upload-mask--error {
  pointer-events: auto;
  background: rgb(15 23 42 / 55%);
}

.sku-option-media-upload-spinner {
  font-size: 28px;
  color: #334155;
  animation: sku-option-media-upload-spin 0.9s linear infinite;
}

.sku-option-media-upload-error-text {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.sku-option-media-upload-retry-btn {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
  cursor: pointer;
  background: #fff;
  border: none;
  border-radius: 9999px;
}

@keyframes sku-option-media-upload-spin {
  to {
    transform: rotate(360deg);
  }
}

.sku-option-media-remove {
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

.sku-option-media-item:hover .sku-option-media-remove {
  display: inline-flex;
}

.sku-option-media-grid
  :deep(.sku-option-media-draggable > *:first-child .sku-option-media-remove) {
  top: 12px;
  right: 12px;
  display: inline-flex;
  width: 32px;
  height: 32px;
  color: #111827;
  background: rgb(255 255 255 / 92%);
}

.sku-option-media-cover-tag {
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

.sku-option-media-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #334155;
  cursor: pointer;
}

.sku-option-media-add:hover {
  background: #ecebea;
}

.sku-option-media-placeholder {
  background: #fafafa;
}

.sku-option-media-item-ghost {
  opacity: 0.45;
}

.sku-option-media-item-chosen {
  outline: 2px dashed #94a3b8;
  outline-offset: -2px;
}

@media (max-width: 720px) {
  .sku-option-media-grid {
    grid-template-columns: repeat(3, 90px);
  }
}
</style>
