<script lang="ts" setup>
import { ref } from 'vue';

import { Input, Rate } from 'ant-design-vue';

import ProductReviewMediaUpload from '#/views/mall/product-review/components/ProductReviewMediaUpload.vue';
import {
  REVIEW_FILE_MAX_COUNT,
  REVIEW_RATE_COLOR,
  REVIEW_REPLY_CONTENT_MAX_LENGTH,
} from '#/views/mall/product-review/constants';

const DEFAULT_RATING_SCORE = 5;

const ratingQuality = ref(DEFAULT_RATING_SCORE);
const ratingShipping = ref(DEFAULT_RATING_SCORE);
const ratingService = ref(DEFAULT_RATING_SCORE);
const content = ref('');

const mediaUploadRef = ref<InstanceType<
  typeof ProductReviewMediaUpload
> | null>(null);

function resetForm() {
  ratingQuality.value = DEFAULT_RATING_SCORE;
  ratingShipping.value = DEFAULT_RATING_SCORE;
  ratingService.value = DEFAULT_RATING_SCORE;
  content.value = '';
  mediaUploadRef.value?.resetSlots();
}

function validate():
  | { message: string; ok: false }
  | {
      ok: true;
      payload: {
        content: string;
        ratingQuality: number;
        ratingService: number;
        ratingShipping: number;
        reviewFile: string[];
      };
    } {
  if (ratingQuality.value <= 0) {
    return { ok: false, message: '请选择质量评分' };
  }
  if (ratingShipping.value <= 0) {
    return { ok: false, message: '请选择运输评分' };
  }
  if (ratingService.value <= 0) {
    return { ok: false, message: '请选择服务评分' };
  }

  const trimmedContent = content.value.trim();
  if (!trimmedContent) {
    return { ok: false, message: '请输入评价内容' };
  }
  if (trimmedContent.length > REVIEW_REPLY_CONTENT_MAX_LENGTH) {
    return {
      ok: false,
      message: `评价内容不能超过 ${REVIEW_REPLY_CONTENT_MAX_LENGTH} 字`,
    };
  }

  const reviewFile = mediaUploadRef.value?.getOssPaths() ?? [];
  if (reviewFile.length > REVIEW_FILE_MAX_COUNT) {
    return {
      ok: false,
      message: `最多上传 ${REVIEW_FILE_MAX_COUNT} 个附件`,
    };
  }

  return {
    ok: true,
    payload: {
      ratingQuality: ratingQuality.value,
      ratingShipping: ratingShipping.value,
      ratingService: ratingService.value,
      content: trimmedContent,
      reviewFile,
    },
  };
}

defineExpose({
  resetForm,
  validate,
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="space-y-2">
      <div class="flex items-center gap-3">
        <span class="w-10 shrink-0 text-sm text-muted-foreground">质量</span>
        <Rate
          v-model:value="ratingQuality"
          class="order-item-review-rate !text-sm"
          :style="{ '--order-item-review-rate-color': REVIEW_RATE_COLOR }"
        />
      </div>
      <div class="flex items-center gap-3">
        <span class="w-10 shrink-0 text-sm text-muted-foreground">运输</span>
        <Rate
          v-model:value="ratingShipping"
          class="order-item-review-rate !text-sm"
          :style="{ '--order-item-review-rate-color': REVIEW_RATE_COLOR }"
        />
      </div>
      <div class="flex items-center gap-3">
        <span class="w-10 shrink-0 text-sm text-muted-foreground">服务</span>
        <Rate
          v-model:value="ratingService"
          class="order-item-review-rate !text-sm"
          :style="{ '--order-item-review-rate-color': REVIEW_RATE_COLOR }"
        />
      </div>
    </div>

    <div>
      <div class="mb-2 text-sm font-medium">评价内容</div>
      <Input.TextArea
        v-model:value="content"
        :auto-size="{ minRows: 4, maxRows: 8 }"
        :maxlength="REVIEW_REPLY_CONTENT_MAX_LENGTH"
        :placeholder="`请输入评价内容（${REVIEW_REPLY_CONTENT_MAX_LENGTH}字以内）`"
        show-count
      />
    </div>

    <div>
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-medium">附件（选填）</span>
        <span class="text-xs text-muted-foreground">
          最多 {{ REVIEW_FILE_MAX_COUNT }} 个，支持图片与视频
        </span>
      </div>
      <ProductReviewMediaUpload ref="mediaUploadRef" />
    </div>
  </div>
</template>

<style scoped>
.order-item-review-rate :deep(.ant-rate-star-full .ant-rate-star-second),
.order-item-review-rate :deep(.ant-rate-star-half .ant-rate-star-first) {
  color: var(--order-item-review-rate-color);
}
</style>
