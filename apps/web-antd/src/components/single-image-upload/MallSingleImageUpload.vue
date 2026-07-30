<script lang="ts" setup>
import type {
  UploadChangeParam,
  UploadFile,
  UploadProps,
} from 'ant-design-vue';

import type { MallSingleImageUploadMode } from './types';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { message, Upload } from 'ant-design-vue';

import { uploadAdminImageApi } from '#/api/core/admin-upload';
import type { AdminUploadApi } from '#/api/core/admin-upload';
import { uploadOssFileApi } from '#/api/core/oss';
import { PRODUCT_MEDIA_VIDEO_MAX_BYTES } from '#/views/mall/product/utils/productMedia';

const props = withDefaults(
  defineProps<{
    /** 是否允许上传视频（mp4/webm/mov） */
    allowVideo?: boolean;
    /** 选文件前的钩子，返回 false 则中止 */
    beforePick?: (file: File) => boolean;
    disabled?: boolean;
    /** 远端完整地址，用于仅存路径或编辑回显 */
    previewUrl?: string;
    size?: number;
    uploadMode?: MallSingleImageUploadMode;
    uploadPrefix?: AdminUploadApi.ImageUploadPrefix;
  }>(),
  {
    allowVideo: false,
    beforePick: undefined,
    previewUrl: '',
    size: 104,
    disabled: false,
    uploadMode: 'oss',
    uploadPrefix: 'avatars',
  },
);

/** oss：ossPath；defer-file：已有图标 URL（回显，可选） */
const modelValue = defineModel<string>({ default: '' });
/** defer-file：待随 saveOrUpd 提交的本地文件 */
const fileModel = defineModel<File | null>('file', { default: null });

const FILE_UID = '-mall-single-image-upload';

const pickerRef = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const sessionPreviewUrl = ref('');
const dismissedPreview = ref(false);
const localBlobUrl = ref('');

const isDeferFile = computed(() => props.uploadMode === 'defer-file');
const isAdminImage = computed(() => props.uploadMode === 'admin-image');
const sizePx = computed(() => `${props.size}px`);

const acceptAttr = computed(() =>
  props.allowVideo
    ? 'image/*,.mp4,.webm,.mov,video/mp4,video/webm,video/quicktime'
    : 'image/*',
);

const VIDEO_EXTENSIONS = new Set(['mov', 'mp4', 'webm']);

function extensionFromPath(pathOrUrl: string): string {
  const raw = pathOrUrl.split(/[?#]/)[0] ?? pathOrUrl;
  const base = raw.split('/').pop() ?? raw;
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

function isVideoPath(pathOrUrl: string): boolean {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return false;
  return VIDEO_EXTENSIONS.has(extensionFromPath(trimmed));
}

function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) {
    const ext = extensionFromPath(file.name);
    return !ext || VIDEO_EXTENSIONS.has(ext);
  }
  return isVideoPath(file.name);
}

function revokeLocalBlob() {
  if (localBlobUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(localBlobUrl.value);
  }
  localBlobUrl.value = '';
}

function resolveThumbUrl(): string {
  if (localBlobUrl.value) return localBlobUrl.value;
  if (!isDeferFile.value && sessionPreviewUrl.value) {
    return sessionPreviewUrl.value;
  }
  const value = modelValue.value?.trim() ?? '';
  if (!value) {
    return dismissedPreview.value ? '' : (props.previewUrl?.trim() ?? '');
  }
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('data:')) return value;
  return dismissedPreview.value ? '' : (props.previewUrl?.trim() ?? '');
}

const hasMedia = computed(() => {
  if (uploading.value) return true;
  if (isDeferFile.value && fileModel.value) return true;
  const url = resolveThumbUrl();
  return Boolean(url || modelValue.value?.trim());
});

const isVideoPreview = computed(() => {
  if (fileModel.value && isVideoFile(fileModel.value)) return true;
  const url = resolveThumbUrl();
  if (url && isVideoPath(url)) return true;
  const path = modelValue.value?.trim() ?? '';
  return Boolean(path && isVideoPath(path));
});

const previewVideoUrl = computed(() => resolveThumbUrl());

const fileList = ref<UploadFile[]>([]);

/** Ant Design Upload 扩展名白名单不含 avif，需补 type 才会渲染缩略图 */
function resolveUploadFileType(url: string): string | undefined {
  if (fileModel.value?.type) {
    return fileModel.value.type;
  }
  if (isVideoPath(url)) {
    const ext = extensionFromPath(url);
    if (ext === 'mov') return 'video/quicktime';
    if (ext === 'webm') return 'video/webm';
    if (ext === 'mp4') return 'video/mp4';
  }
  const dataMatch = url.match(/^data:(image\/[^;]+)/i);
  if (dataMatch?.[1]) return dataMatch[1];

  const raw = url.split(/[?#]/)[0] ?? url;
  const base = raw.split('/').pop() ?? raw;
  const dot = base.lastIndexOf('.');
  const ext = dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
  if (ext === 'avif') return 'image/avif';
  return undefined;
}

function syncFileList() {
  if (uploading.value) {
    fileList.value = [
      {
        uid: FILE_UID,
        name: 'uploading',
        status: 'uploading',
      },
    ];
    return;
  }
  const url = resolveThumbUrl();
  if (!url) {
    fileList.value = [];
    return;
  }
  const type = resolveUploadFileType(url);
  fileList.value = [
    {
      uid: FILE_UID,
      name: 'image',
      status: 'done',
      url,
      ...(type ? { type } : {}),
    },
  ];
}

watch(
  [
    modelValue,
    () => props.previewUrl,
    sessionPreviewUrl,
    dismissedPreview,
    uploading,
    localBlobUrl,
    fileModel,
    isDeferFile,
  ],
  syncFileList,
  { immediate: true },
);

watch(
  () => props.previewUrl,
  () => {
    dismissedPreview.value = false;
    sessionPreviewUrl.value = '';
  },
);

function clearImage() {
  revokeLocalBlob();
  modelValue.value = '';
  sessionPreviewUrl.value = '';
  fileModel.value = null;
  dismissedPreview.value = true;
  fileList.value = [];
}

function onFileChange({ file, fileList: list }: UploadChangeParam) {
  if (list.length === 0 || file.status === 'removed') {
    clearImage();
  }
}

function validateMediaFile(file: File) {
  const isVideo = isVideoFile(file);
  const isImage = file.type.startsWith('image/');

  if (isVideo) {
    if (!props.allowVideo) {
      message.error('当前模式下只能上传图片');
      return false;
    }
    if (!isVideoFile(file)) {
      message.error('仅支持 mp4、webm、mov 格式的视频');
      return false;
    }
    if (file.size > PRODUCT_MEDIA_VIDEO_MAX_BYTES) {
      message.error('视频超过 100MB 限制');
      return false;
    }
  } else if (!isImage) {
    message.error(
      props.allowVideo ? '仅支持图片或 mp4/webm/mov 视频' : '只能上传图片',
    );
    return false;
  }

  if (props.beforePick && !props.beforePick(file)) {
    return false;
  }
  return true;
}

async function applyOssFile(file: File) {
  uploading.value = true;
  try {
    if (isAdminImage.value) {
      const data = await uploadAdminImageApi(file, props.uploadPrefix);
      modelValue.value = data.url;
      sessionPreviewUrl.value = data.url;
    } else {
      const data = await uploadOssFileApi(file);
      modelValue.value = data.ossPath;
      sessionPreviewUrl.value = data.fileUrl;
    }
    dismissedPreview.value = false;
    fileModel.value = null;
  } finally {
    uploading.value = false;
  }
}

function applyDeferFile(file: File) {
  revokeLocalBlob();
  localBlobUrl.value = URL.createObjectURL(file);
  fileModel.value = file;
  dismissedPreview.value = false;
}

async function handlePickedFile(file: File) {
  if (isDeferFile.value) {
    applyDeferFile(file);
    return;
  }
  await applyOssFile(file);
}

function openPicker() {
  if (props.disabled || uploading.value) return;
  pickerRef.value?.click();
}

async function onNativeFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || !validateMediaFile(file)) return;
  await handlePickedFile(file);
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (!validateMediaFile(file as File)) {
    return Upload.LIST_IGNORE;
  }
  return true;
};

const customRequest: UploadProps['customRequest'] = async ({
  file,
  onError,
  onSuccess,
}) => {
  try {
    await handlePickedFile(file as File);
    onSuccess?.({});
  } catch (error) {
    onError?.(error as Error);
  }
};

function openVideoPreview() {
  const url = previewVideoUrl.value;
  if (!url || uploading.value) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

onBeforeUnmount(() => {
  revokeLocalBlob();
});
</script>

<template>
  <div
    class="mall-single-image-upload"
    :style="{ '--mall-upload-pic': sizePx }"
  >
    <button
      v-if="!hasMedia"
      type="button"
      class="mall-single-image-upload-empty"
      :disabled="disabled || uploading"
      @click="openPicker"
    >
      <IconifyIcon class="size-6" icon="mdi:plus" />
      <span class="mt-1 text-xs">上传</span>
    </button>

    <div v-else-if="isVideoPreview" class="mall-single-image-upload-video">
      <video
        class="mall-single-image-upload-video__player"
        :src="previewVideoUrl"
        muted
        playsinline
        preload="metadata"
      ></video>
      <button
        type="button"
        class="mall-single-image-upload-video__play"
        title="播放视频"
        :disabled="!previewVideoUrl || uploading"
        @click.stop="openVideoPreview"
      >
        <IconifyIcon
          class="mall-single-image-upload-video__play-icon"
          icon="mdi:play-circle"
        />
      </button>
      <button
        type="button"
        class="mall-single-image-upload-video__remove"
        :disabled="disabled || uploading"
        title="移除"
        @click.stop="clearImage"
      >
        <IconifyIcon icon="mdi:close" />
      </button>
    </div>

    <Upload
      v-else
      :custom-request="customRequest"
      :disabled="disabled || uploading"
      v-model:file-list="fileList"
      :max-count="1"
      :show-upload-list="{
        showPreviewIcon: true,
        showRemoveIcon: !uploading,
      }"
      :accept="acceptAttr"
      list-type="picture-card"
      :before-upload="beforeUpload"
      :open-file-dialog-on-click="false"
      @change="onFileChange"
    />

    <input
      ref="pickerRef"
      type="file"
      class="sr-only"
      :accept="acceptAttr"
      :disabled="disabled || uploading"
      @change="onNativeFileChange"
    />
  </div>
</template>

<style scoped>
.mall-single-image-upload {
  position: relative;
  flex-shrink: 0;
  width: var(--mall-upload-pic);
  height: var(--mall-upload-pic);
  min-height: var(--mall-upload-pic);
  max-height: var(--mall-upload-pic);
}

.mall-single-image-upload-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: var(--mall-upload-pic);
  height: var(--mall-upload-pic);
  padding: 0;
  color: rgb(100 116 139);
  cursor: pointer;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  transition: border-color 0.2s;
}

.mall-single-image-upload-empty:hover:not(:disabled) {
  border-color: #1677ff;
}

.mall-single-image-upload-empty:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.mall-single-image-upload :deep(.ant-upload-select) {
  display: none !important;
}

.mall-single-image-upload :deep(.ant-upload-list-picture-card) {
  display: flex;
  width: var(--mall-upload-pic);
  height: var(--mall-upload-pic);
  margin: 0 !important;
}

.mall-single-image-upload
  :deep(.ant-upload-list-picture-card .ant-upload-list-item-container) {
  width: var(--mall-upload-pic) !important;
  height: var(--mall-upload-pic) !important;
}

.mall-single-image-upload
  :deep(.ant-upload-list-picture-card .ant-upload-list-item) {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 0 !important;
  margin: 0 !important;
}

.mall-single-image-upload
  :deep(.ant-upload-list-picture-card .ant-upload-list-item::before) {
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

.mall-single-image-upload
  :deep(.ant-upload-list-picture-card .ant-upload-list-item-info) {
  height: 100%;
  padding: 0 !important;
}

.mall-single-image-upload
  :deep(.ant-upload-list-picture-card .ant-upload-list-item-thumbnail),
.mall-single-image-upload
  :deep(.ant-upload-list-picture-card .ant-upload-list-item-thumbnail img) {
  width: 100% !important;
  height: 100% !important;
}

.mall-single-image-upload
  :deep(
    .ant-upload-list-picture-card .ant-upload-list-item-thumbnail .ant-image
  ),
.mall-single-image-upload
  :deep(
    .ant-upload-list-picture-card .ant-upload-list-item-thumbnail .ant-image-img
  ) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}

.mall-single-image-upload
  :deep(.ant-upload-list-picture-card .ant-upload-list-item-actions) {
  position: absolute !important;
  inset: 0 !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 100% !important;
  height: 100% !important;
  line-height: normal;
}

.mall-single-image-upload-video {
  position: relative;
  width: var(--mall-upload-pic);
  height: var(--mall-upload-pic);
  overflow: hidden;
  background: #f5f5f4;
  border-radius: 8px;
}

.mall-single-image-upload-video__player {
  width: 100%;
  height: 100%;
  pointer-events: none;
  object-fit: cover;
}

.mall-single-image-upload-video__play {
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

.mall-single-image-upload-video__play:hover:not(:disabled) {
  background: rgb(0 0 0 / 72%);
}

.mall-single-image-upload-video__play:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.mall-single-image-upload-video__play-icon {
  font-size: 18px;
  color: #fff;
}

.mall-single-image-upload-video__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 10;
  display: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: #fff;
  cursor: pointer;
  background: rgb(0 0 0 / 58%);
  border: none;
  border-radius: 9999px;
}

.mall-single-image-upload-video:hover .mall-single-image-upload-video__remove {
  display: inline-flex;
}

.mall-single-image-upload-video__remove:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  white-space: nowrap;
  border: 0;
  clip-path: inset(50%);
}
</style>
