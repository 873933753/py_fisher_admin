<script lang="ts" setup>
import type { WhatsappFileItem } from '../types';

import { computed, onBeforeUnmount, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import { uploadOssFileApi } from '#/api/core/oss';

import {
  resolveOssPreviewUrl,
  validateProductMediaFile,
} from '../../product/utils/productMedia';
import { WHATSAPP_FILES_MAX } from '../constants';

const items = defineModel<WhatsappFileItem[]>('modelValue', { required: true });

const pickerRef = ref<HTMLInputElement | null>(null);

const hasMedia = computed(() => items.value.length > 0);
const canAddMore = computed(() => items.value.length < WHATSAPP_FILES_MAX);

const emptyPlaceholderCount = computed(() => {
  const used = items.value.length + (canAddMore.value ? 1 : 0);
  return Math.max(0, WHATSAPP_FILES_MAX - used);
});

function createUid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `wa-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function revokeIfBlob(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
}

function replaceItem(uid: string, patch: Partial<WhatsappFileItem>) {
  items.value = items.value.map((item) =>
    item.uid === uid ? { ...item, ...patch } : item,
  );
}

function findItem(uid: string) {
  return items.value.find((item) => item.uid === uid);
}

function createPendingItem(file: File): WhatsappFileItem {
  return {
    uid: createUid(),
    name: file.name,
    previewUrl: URL.createObjectURL(file),
    ossPath: '',
    uploadStatus: 'uploading',
    file,
  };
}

async function uploadItem(item: WhatsappFileItem, file: File) {
  try {
    const data = await uploadOssFileApi(file);
    const target = findItem(item.uid);
    if (!target) return;
    revokeIfBlob(target.previewUrl);
    const preview =
      resolveOssPreviewUrl(data.fileUrl, data.ossPath) ?? data.fileUrl;
    replaceItem(item.uid, {
      previewUrl: preview,
      ossPath: data.ossPath,
      uploadStatus: 'done',
      file: undefined,
    });
  } catch {
    replaceItem(item.uid, { uploadStatus: 'error', file });
    message.error(`上传失败：${file.name}`);
  }
}

function ingestFiles(files: File[]) {
  const pending: Array<{ file: File; item: WhatsappFileItem }> = [];
  const next = [...items.value];

  for (const file of files) {
    if (next.length + pending.length >= WHATSAPP_FILES_MAX) {
      message.warning(`最多可上传 ${WHATSAPP_FILES_MAX} 张图片`);
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
    void uploadItem(item, file);
  }
}

function onInputChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files?.length) return;
  ingestFiles([...files]);
  target.value = '';
}

function openPicker() {
  pickerRef.value?.click();
}

function removeAt(index: number) {
  const next = [...items.value];
  const [removed] = next.splice(index, 1);
  if (removed) revokeIfBlob(removed.previewUrl);
  items.value = next;
}

function retryUpload(uid: string) {
  const item = findItem(uid);
  if (!item?.file) return;
  replaceItem(uid, { uploadStatus: 'uploading' });
  void uploadItem(item, item.file);
}

onBeforeUnmount(() => {
  for (const item of items.value) {
    revokeIfBlob(item.previewUrl);
  }
});
</script>

<template>
  <div class="about-us-whatsapp-upload">
    <input
      ref="pickerRef"
      type="file"
      class="sr-only"
      accept="image/*"
      multiple
      @change="onInputChange"
    />

    <p class="mb-2 text-xs text-slate-500">
      最多 {{ WHATSAPP_FILES_MAX }} 张，选填；
    </p>

    <div v-if="!hasMedia" class="about-us-whatsapp-empty" @click="openPicker">
      <IconifyIcon
        class="size-8 text-slate-400"
        icon="mdi:image-plus-outline"
      />
      <span class="mt-1 text-xs text-slate-500">点击上传</span>
    </div>

    <div v-else class="about-us-whatsapp-grid">
      <div
        v-for="(item, index) in items"
        :key="item.uid"
        class="about-us-whatsapp-item group"
      >
        <img
          :src="item.previewUrl"
          :alt="item.name"
          class="about-us-whatsapp-preview"
        />

        <div
          v-if="item.uploadStatus === 'uploading'"
          class="about-us-whatsapp-mask"
        >
          <IconifyIcon
            class="size-6 animate-spin text-white"
            icon="mdi:loading"
          />
        </div>
        <div
          v-else-if="item.uploadStatus === 'error'"
          class="about-us-whatsapp-mask about-us-whatsapp-mask--error"
        >
          <button
            type="button"
            class="text-xs text-white underline"
            @click="retryUpload(item.uid)"
          >
            重试
          </button>
        </div>

        <button
          type="button"
          class="about-us-whatsapp-remove"
          aria-label="删除"
          @click="removeAt(index)"
        >
          <IconifyIcon class="size-4" icon="mdi:close" />
        </button>
      </div>

      <button
        v-if="canAddMore"
        type="button"
        class="about-us-whatsapp-add"
        @click="openPicker"
      >
        <IconifyIcon class="size-6" icon="mdi:plus" />
      </button>

      <div
        v-for="n in emptyPlaceholderCount"
        :key="`ph-${n}`"
        class="about-us-whatsapp-placeholder"
        aria-hidden="true"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.about-us-whatsapp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 104px;
  height: 104px;
  cursor: pointer;
  border: 1px dashed rgb(203 213 225);
  border-radius: 8px;
}

.about-us-whatsapp-empty:hover {
  border-color: rgb(148 163 184);
}

.about-us-whatsapp-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.about-us-whatsapp-item,
.about-us-whatsapp-add,
.about-us-whatsapp-placeholder {
  position: relative;
  flex: 0 0 104px;
  width: 104px;
  height: 104px;
  overflow: hidden;
  border-radius: 8px;
}

.about-us-whatsapp-add {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgb(248 250 252);
  border: 1px dashed rgb(203 213 225);
}

.about-us-whatsapp-add:hover {
  border-color: rgb(148 163 184);
}

.about-us-whatsapp-placeholder {
  visibility: hidden;
  pointer-events: none;
  border: 1px dashed transparent;
}

.about-us-whatsapp-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.about-us-whatsapp-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 45%);
}

.about-us-whatsapp-mask--error {
  background: rgb(220 38 38 / 55%);
}

.about-us-whatsapp-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: white;
  cursor: pointer;
  background: rgb(0 0 0 / 55%);
  border: none;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.about-us-whatsapp-item:hover .about-us-whatsapp-remove {
  opacity: 1;
}
</style>
