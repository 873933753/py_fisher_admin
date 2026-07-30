<script lang="ts" setup>
import type { ProductReviewApi } from '#/api/core/productReview';

import { computed } from 'vue';

import { Button } from 'ant-design-vue';

import {
  getAverageRating,
  getMerchantReplies,
  getReviewCreateTime,
  getReviewFiles,
  getUserHandle,
  hasMerchantReply,
} from '../constants';
import ProductReviewMediaCell from './ProductReviewMediaCell.vue';
import ProductReviewRate from './ProductReviewRate.vue';

const props = defineProps<{
  record: ProductReviewApi.ReviewRecord;
}>();

const emit = defineEmits<{
  delete: [record: ProductReviewApi.ReviewRecord];
  detail: [record: ProductReviewApi.ReviewRecord];
  reply: [record: ProductReviewApi.ReviewRecord];
}>();

const averageRating = computed(() => getAverageRating(props.record));
const reviewFiles = computed(() => getReviewFiles(props.record));
const merchantReplies = computed(() => getMerchantReplies(props.record));
const firstReply = computed(() => merchantReplies.value[0] ?? null);
const replyCount = computed(() => merchantReplies.value.length);
const canReply = computed(() => !hasMerchantReply(props.record));
</script>

<template>
  <article
    class="grid grid-cols-1 gap-4 rounded-lg border border-border bg-background px-4 py-4 shadow-sm lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_8rem_5.5rem_3rem] lg:items-start lg:gap-6"
  >
    <div class="min-w-0">
      <div class="mb-2 flex min-h-[22px] flex-wrap items-center gap-2">
        <ProductReviewRate :value="averageRating" />
        <span class="text-sm leading-none text-muted-foreground">
          {{ getReviewCreateTime(record) }}
        </span>
      </div>
      <p class="line-clamp-2 whitespace-pre-wrap text-sm text-foreground">
        {{ record.content?.trim() || '—' }}
      </p>
      <div v-if="reviewFiles.length > 0" class="mt-2">
        <ProductReviewMediaCell :files="reviewFiles" :max-preview="3" />
      </div>
    </div>

    <div class="min-w-0 border-t border-border pt-3 lg:border-t-0 lg:pt-0">
      <div
        class="mb-2 flex min-h-[22px] items-center text-sm leading-none text-muted-foreground"
      >
        {{ replyCount }} 条回复
      </div>
      <template v-if="firstReply">
        <div class="mb-1 text-xs text-muted-foreground">
          {{ getReviewCreateTime(firstReply) }}
        </div>
        <p class="line-clamp-2 whitespace-pre-wrap text-sm text-foreground">
          {{ firstReply.content?.trim() || '—' }}
        </p>
      </template>
      <span v-else class="text-sm text-muted-foreground">—</span>
    </div>

    <div class="min-w-0 border-t border-border pt-3 lg:border-t-0 lg:pt-0">
      <div
        class="flex min-h-[22px] items-center truncate text-sm leading-none text-muted-foreground"
      >
        <span>订单 ID：</span>
        <span class="text-foreground">{{ record.orderId || '—' }}</span>
      </div>
    </div>

    <div
      class="flex min-h-[22px] min-w-0 items-center truncate border-t border-border pt-3 text-sm leading-none text-foreground lg:border-t-0 lg:pt-0"
      :title="getUserHandle(record)"
    >
      {{ getUserHandle(record) }}
    </div>

    <div
      class="flex flex-col items-start gap-1 border-t border-border pt-3 lg:border-t-0 lg:pt-0"
    >
      <div v-if="canReply" class="flex min-h-[22px] items-center">
        <Button
          size="small"
          type="link"
          class="!px-0"
          @click="emit('reply', record)"
        >
          回复
        </Button>
      </div>
      <div class="flex min-h-[22px] items-center">
        <Button
          size="small"
          type="link"
          class="!px-0"
          @click="emit('detail', record)"
        >
          评价详情
        </Button>
      </div>
    </div>

    <div
      class="flex min-h-[22px] items-center justify-end border-t border-border pt-3 lg:border-t-0 lg:pt-0"
    >
      <Button danger size="small" type="link" @click="emit('delete', record)">
        删除
      </Button>
    </div>
  </article>
</template>
