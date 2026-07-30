<script lang="ts" setup>
import type { SysHomeFeedApi } from '#/api/core/sysHomeFeed';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Image } from 'ant-design-vue';

import { resolveOssPreviewUrl } from '../../product/utils/productMedia';
import { isQuickFeedType } from '../constants';
import { isBannerVideoPath } from '../utils/bannerMedia';

const props = defineProps<{
  bannerFile: null | SysHomeFeedApi.BannerFileItem[] | undefined;
  feedType?: string;
}>();

const MAX_THUMBS = 3;

const items = computed(() => {
  const list = props.bannerFile ?? [];
  return list.slice(0, MAX_THUMBS).map((item) => {
    const url =
      resolveOssPreviewUrl(item.fileUrl, item.filePath) ??
      item.fileUrl ??
      item.filePath ??
      '';
    const isVideo =
      isBannerVideoPath(item.filePath ?? '') ||
      isBannerVideoPath(item.fileUrl ?? '');
    return { url, isVideo };
  });
});

const total = computed(() => (props.bannerFile ?? []).length);

const isQuick = computed(() => isQuickFeedType(props.feedType ?? ''));
</script>

<template>
  <span v-if="isQuick && total > 0" class="text-muted-foreground">
    共 {{ total }} 个入口
  </span>
  <div
    v-else-if="!isQuick && total > 0"
    class="flex flex-wrap items-center justify-center gap-2"
  >
    <template v-for="(item, index) in items" :key="index">
      <div
        v-if="item.isVideo"
        class="flex size-10 items-center justify-center rounded bg-slate-800 text-white"
        title="视频"
      >
        <IconifyIcon class="size-5" icon="mdi:play-circle-outline" />
      </div>
      <Image
        v-else
        :height="40"
        :src="item.url"
        :width="40"
        class="rounded object-cover"
        fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect fill='%23f5f5f4' width='40' height='40'/%3E%3C/svg%3E"
      />
    </template>
    <span class="text-xs text-muted-foreground">共 {{ total }} 个</span>
  </div>
  <span v-else class="text-muted-foreground">—</span>
</template>
