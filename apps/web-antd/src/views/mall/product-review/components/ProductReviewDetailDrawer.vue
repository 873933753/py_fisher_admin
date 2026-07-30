<script lang="ts" setup>
import type { ProductReviewApi } from '#/api/core/productReview';

import { computed } from 'vue';

import { Drawer } from 'ant-design-vue';

import {
  getMerchantReplies,
  getReviewCreateTime,
  getReviewFiles,
  getUserDisplayName,
} from '../constants';
import ProductReviewMediaCell from './ProductReviewMediaCell.vue';
import ProductReviewRate from './ProductReviewRate.vue';

const props = defineProps<{
  hideReplies?: boolean;
  open: boolean;
  record: null | ProductReviewApi.ReviewRecord;
}>();

const emit = defineEmits<{
  delete: [record: ProductReviewApi.ReviewReplyRecord];
  'update:open': [value: boolean];
}>();

const drawerOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const merchantReplies = computed(() =>
  props.record ? getMerchantReplies(props.record) : [],
);

const reviewFiles = computed(() =>
  props.record ? getReviewFiles(props.record) : [],
);
</script>

<template>
  <Drawer
    v-model:open="drawerOpen"
    :destroy-on-close="true"
    title="评价详情"
    width="520"
  >
    <div v-if="record" class="flex flex-col gap-6">
      <section class="space-y-3">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-sm font-medium text-foreground">
            {{ getUserDisplayName(record) }}
          </span>
          <span class="text-sm text-muted-foreground">
            {{ getReviewCreateTime(record) }}
          </span>
        </div>

        <div class="space-y-3 rounded-md border border-border bg-muted/20 p-4">
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <span class="w-10 shrink-0 text-sm text-muted-foreground">
                质量
              </span>
              <ProductReviewRate :value="record.ratingQuality ?? 0" />
            </div>
            <div class="flex items-center gap-3">
              <span class="w-10 shrink-0 text-sm text-muted-foreground">
                运输
              </span>
              <ProductReviewRate :value="record.ratingShipping ?? 0" />
            </div>
            <div class="flex items-center gap-3">
              <span class="w-10 shrink-0 text-sm text-muted-foreground">
                服务
              </span>
              <ProductReviewRate :value="record.ratingService ?? 0" />
            </div>
          </div>

          <p
            class="whitespace-pre-wrap text-sm leading-relaxed text-foreground"
          >
            {{ record.content?.trim() || '—' }}
          </p>

          <div v-if="reviewFiles.length > 0">
            <ProductReviewMediaCell :files="reviewFiles" :max-preview="5" />
          </div>
        </div>
      </section>

      <section
        v-if="!hideReplies && merchantReplies.length > 0"
        class="space-y-4"
      >
        <h4 class="text-sm font-medium text-foreground">商家回复</h4>
        <div
          v-for="reply in merchantReplies"
          :key="reply.id"
          class="rounded-md border border-border bg-muted/20 p-3"
        >
          <div class="mb-2 flex items-center justify-between gap-3">
            <span class="text-xs text-muted-foreground">
              {{ getReviewCreateTime(reply) }}
            </span>
            <!--暂时不能只删除商家回复，会报错-->
            <!-- <Button
              danger
              size="small"
              type="link"
              @click="emit('delete', reply)"
            >
              删除
            </Button> -->
          </div>
          <p class="mb-2 whitespace-pre-wrap text-sm text-foreground">
            {{ reply.content?.trim() || '—' }}
          </p>
          <ProductReviewMediaCell
            v-if="getReviewFiles(reply).length > 0"
            :files="getReviewFiles(reply)"
            :max-preview="5"
          />
        </div>
      </section>
    </div>
  </Drawer>
</template>
