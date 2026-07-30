<script lang="ts" setup>
import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Image } from 'ant-design-vue';

import { isVideoReviewFile } from '../constants';

const props = defineProps<{
  files: string[];
  maxPreview?: number;
}>();

function openVideo(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

const maxPreviewCount = computed(() => props.maxPreview ?? 3);

const visibleFiles = computed(() =>
  props.files.slice(0, maxPreviewCount.value),
);

const hiddenCount = computed(() =>
  Math.max(0, props.files.length - maxPreviewCount.value),
);
</script>

<template>
  <div v-if="files.length > 0" class="flex flex-wrap items-center gap-2">
    <Image.PreviewGroup>
      <template v-for="url in visibleFiles" :key="url">
        <Image
          v-if="!isVideoReviewFile(url)"
          :src="url"
          :width="48"
          :height="48"
          class="rounded object-cover"
          :preview="{ src: url }"
        />
        <button
          v-else
          type="button"
          class="review-media-video"
          title="播放视频"
          @click.stop="openVideo(url)"
        >
          <video
            class="review-media-video__player"
            :src="url"
            muted
            playsinline
            preload="metadata"
          ></video>
          <span class="review-media-video__play" aria-hidden="true">
            <IconifyIcon
              class="review-media-video__play-icon"
              icon="mdi:play-circle"
            />
          </span>
        </button>
      </template>
    </Image.PreviewGroup>
    <span v-if="hiddenCount > 0" class="text-xs text-muted-foreground">
      +{{ hiddenCount }}
    </span>
  </div>
  <span v-else>—</span>
</template>

<style scoped>
.review-media-video {
  position: relative;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: #f5f5f4;
  border: none;
  border-radius: 6px;
}

.review-media-video:hover .review-media-video__play {
  background: rgb(0 0 0 / 72%);
}

.review-media-video__player {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  object-fit: cover;
}

.review-media-video__play {
  position: absolute;
  bottom: 2px;
  left: 2px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  pointer-events: none;
  background: rgb(0 0 0 / 55%);
  border-radius: 9999px;
}

.review-media-video__play-icon {
  font-size: 12px;
  color: #fff;
}
</style>
