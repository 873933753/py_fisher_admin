<script lang="ts" setup>
import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Image } from 'ant-design-vue';

import { inferMediaKindFromUrl } from '../utils/mediaKind';
import {
  isDisplayablePreviewUrl,
  resolveOssPreviewUrl,
} from '../utils/productMedia';

const props = defineProps<{
  src?: string;
}>();

const previewUrl = computed(() => {
  const raw = props.src?.trim() ?? '';
  if (!raw) return '';
  const resolved = resolveOssPreviewUrl(raw, raw);
  if (resolved) return resolved;
  return isDisplayablePreviewUrl(raw) ? raw : raw;
});

const mediaKind = computed(
  () => inferMediaKindFromUrl(props.src ?? '') ?? 'image',
);

const hasPreview = computed(() => Boolean(previewUrl.value));
</script>

<template>
  <div v-if="hasPreview" class="product-list-main-img">
    <Image
      v-if="mediaKind === 'image'"
      :height="48"
      :src="previewUrl"
      :width="48"
      class="product-list-main-img__media rounded object-cover"
    />
    <div v-else class="product-list-main-img__video-wrap">
      <video
        :src="previewUrl"
        class="product-list-main-img__media"
        muted
        playsinline
        preload="metadata"
      ></video>
      <span class="product-list-main-img__video-badge" aria-hidden="true">
        <IconifyIcon
          class="product-list-main-img__video-icon"
          icon="mdi:play-circle"
        />
      </span>
    </div>
  </div>
  <span v-else class="text-muted-foreground">—</span>
</template>

<style scoped>
.product-list-main-img {
  display: inline-flex;
  justify-content: center;
}

.product-list-main-img__media {
  display: block;
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
}

.product-list-main-img__video-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  overflow: hidden;
  background: #f5f5f4;
  border-radius: 6px;
}

.product-list-main-img__video-wrap video {
  pointer-events: none;
}

.product-list-main-img__video-badge {
  position: absolute;
  right: 2px;
  bottom: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  pointer-events: none;
  background: rgb(0 0 0 / 55%);
  border-radius: 9999px;
}

.product-list-main-img__video-icon {
  font-size: 12px;
  color: #fff;
}
</style>
