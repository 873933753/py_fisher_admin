<script lang="ts" setup>
import type { CategoryCascaderOption } from '../../product/utils/categoryOptions';
import type { BannerFileFormItem } from '../types';

import type { SysDictApi } from '#/api/core/sysDict';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, Cascader, message, Select } from 'ant-design-vue';

import { findJerseyTypeTreeApi } from '#/api/core/sysDict';
import { MallListFilterField } from '#/components/mall-list';
import { MallSingleImageUpload } from '#/components/single-image-upload';

import {
  findCategoryPathByLeafId,
  isLeafPathInOptions,
  mapJerseyTreeToCascaderOptions,
} from '../../product/utils/categoryOptions';
import {
  FEED_TYPE_BANNER,
  isBannerNoScroll,
  isQuickFeedType,
  JUMP_TYPE_CATEGORY,
  JUMP_TYPE_NONE,
  QUICK_ENTRY_MAX,
} from '../constants';
import { emptyBannerFileItem } from '../utils/bannerForm';
import { bannerListHasVideo, isBannerVideoFile } from '../utils/bannerMedia';

const props = defineProps<{
  feedType: string;
  /** 是否轮播，仅广告图有效：0=否，1=是 */
  isScroll: string;
  jumpTypeOptions: { label: string; value: string }[];
}>();

const bannerFile = defineModel<BannerFileFormItem[]>('bannerFile', {
  required: true,
});

const isQuick = computed(() => isQuickFeedType(props.feedType));
const isBanner = computed(() => props.feedType === FEED_TYPE_BANNER);
const noScroll = computed(
  () => isBanner.value && isBannerNoScroll(props.isScroll),
);
const allowVideoUpload = computed(() => noScroll.value);

const itemLabelPrefix = computed(() => (isQuick.value ? '快捷入口' : '轮播图'));

const addButtonText = computed(() =>
  isQuick.value ? '添加快捷入口' : '添加轮播图',
);

const quickEntryMax = QUICK_ENTRY_MAX;

const jumpTypeSelectOptions = computed(() =>
  props.jumpTypeOptions.map((opt) => ({
    ...opt,
    disabled: noScroll.value && opt.value === JUMP_TYPE_CATEGORY,
  })),
);

const canAddMore = computed(() => {
  if (isQuick.value) return bannerFile.value.length < QUICK_ENTRY_MAX;
  if (allowVideoUpload.value && bannerListHasVideo(bannerFile.value)) {
    return false;
  }
  return true;
});

const jerseyTree = ref<SysDictApi.JerseyTypeTreeNode[]>([]);

const categoryCascaderOptions = computed<CategoryCascaderOption[]>(() =>
  mapJerseyTreeToCascaderOptions(jerseyTree.value),
);

const cascaderShowStrategy = Cascader.SHOW_CHILD;

function normalizeMultiplePaths(value: unknown): string[][] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!Array.isArray(entry)) return [];
      return entry.map(String);
    })
    .filter((path) => path.length > 0);
}

function leafIdsFromPaths(paths: string[][]): string[] {
  const leafIds: string[] = [];
  for (const path of paths) {
    if (!isLeafPathInOptions(path, categoryCascaderOptions.value)) continue;
    const leafId = path[path.length - 1] ?? '';
    if (leafId && !leafIds.includes(leafId)) {
      leafIds.push(leafId);
    }
  }
  return leafIds;
}

function syncPathsFromIds(item: BannerFileFormItem) {
  if (jerseyTree.value.length === 0 || item.jumpType !== JUMP_TYPE_CATEGORY) {
    return;
  }
  const paths = item.jumpCategoryIds
    .map((id) => findCategoryPathByLeafId(jerseyTree.value, id))
    .filter((path): path is string[] => Boolean(path?.length));
  item.jumpCategoryPaths = paths;
}

function onMultipleCategoryChange(item: BannerFileFormItem, value: unknown) {
  const paths = normalizeMultiplePaths(value);
  item.jumpCategoryPaths = paths;
  item.jumpCategoryIds = leafIdsFromPaths(paths);
}

function addItem() {
  if (isQuick.value && bannerFile.value.length >= QUICK_ENTRY_MAX) {
    message.warning(`快捷入口最多 ${QUICK_ENTRY_MAX} 个`);
    return;
  }
  bannerFile.value = [...bannerFile.value, emptyBannerFileItem()];
}

function removeItem(index: number) {
  if (bannerFile.value.length <= 1) return;
  bannerFile.value = bannerFile.value.filter((_, i) => i !== index);
}

function onJumpTypeChange(item: BannerFileFormItem) {
  if (item.jumpType === JUMP_TYPE_NONE) {
    item.jumpCategoryIds = [];
    item.jumpCategoryPaths = [];
    item.jumpValue = '';
  } else if (item.jumpType !== JUMP_TYPE_CATEGORY) {
    item.jumpCategoryIds = [];
    item.jumpCategoryPaths = [];
  }
}

function beforePick(file: File): boolean {
  if (
    allowVideoUpload.value &&
    isBannerVideoFile(file) &&
    bannerFile.value.length > 1
  ) {
    message.warning(
      '存在多条轮播时不能上传视频，请先删除多余条目，仅保留一条后再上传',
    );
    return false;
  }
  return true;
}

function ensureQuickItemJumpType(item: BannerFileFormItem) {
  if (!isQuick.value) return;
  item.jumpType = JUMP_TYPE_CATEGORY;
  item.filePath = '';
  item.fileUrl = '';
}

watch(
  () => props.feedType,
  () => {
    for (const item of bannerFile.value) {
      ensureQuickItemJumpType(item);
      syncPathsFromIds(item);
    }
  },
);

watch(jerseyTree, () => {
  for (const item of bannerFile.value) {
    syncPathsFromIds(item);
  }
});

onMounted(async () => {
  try {
    jerseyTree.value = (await findJerseyTypeTreeApi()) ?? [];
  } catch {
    jerseyTree.value = [];
  }
  for (const item of bannerFile.value) {
    ensureQuickItemJumpType(item);
    syncPathsFromIds(item);
  }
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="(item, index) in bannerFile"
      :key="index"
      class="rounded-lg border border-border p-4"
    >
      <div class="mb-3 flex items-center justify-between">
        <span class="text-sm font-medium">
          {{ itemLabelPrefix }} {{ index + 1 }}
        </span>
        <Button
          v-if="bannerFile.length > 1"
          danger
          size="small"
          type="link"
          @click="removeItem(index)"
        >
          删除
        </Button>
      </div>
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6"
        :class="{ 'sm:gap-0': isQuick }"
      >
        <MallSingleImageUpload
          v-if="!isQuick"
          v-model="item.filePath"
          :allow-video="allowVideoUpload"
          :before-pick="beforePick"
          :preview-url="item.fileUrl"
          :size="96"
        />
        <div class="min-w-0 flex-1 space-y-3">
          <MallListFilterField v-if="!isQuick" label="跳转类型：">
            <Select
              v-model:value="item.jumpType"
              :options="jumpTypeSelectOptions"
              class="min-w-0 flex-1"
              placeholder="请选择"
              @change="onJumpTypeChange(item)"
            />
          </MallListFilterField>
          <MallListFilterField
            v-if="isQuick || item.jumpType === JUMP_TYPE_CATEGORY"
            class="banner-file-editor__field--top"
            label="跳转类目："
          >
            <Cascader
              v-model:value="item.jumpCategoryPaths"
              allow-clear
              :change-on-select="false"
              class="min-w-0 flex-1"
              expand-trigger="click"
              max-tag-count="responsive"
              multiple
              :options="categoryCascaderOptions"
              placeholder="请展开到三级分类，勾选多个类目"
              :show-checked-strategy="cascaderShowStrategy"
              @change="(v) => onMultipleCategoryChange(item, v)"
            />
          </MallListFilterField>
        </div>
      </div>
    </div>
    <p v-if="isQuick" class="text-xs text-slate-500">
      最多 {{ quickEntryMax }} 个快捷入口
    </p>
    <p v-else-if="allowVideoUpload" class="text-xs text-slate-500">
      不轮播时可上传 mp4/webm/mov 视频；只允许上传一条视频
    </p>
    <Button v-if="canAddMore" type="dashed" block @click="addItem">
      {{ addButtonText }}
    </Button>
  </div>
</template>

<style scoped>
.banner-file-editor__field--top {
  align-items: flex-start;
}

.banner-file-editor__field--top > span {
  padding-top: 4px;
  line-height: 32px;
}
</style>
