<script lang="ts" setup>
import type { ProductReviewApi } from '#/api/core/productReview';

import { computed } from 'vue';

import { Button, Drawer, Spin } from 'ant-design-vue';

import ProductReviewMediaCell from '#/views/mall/product-review/components/ProductReviewMediaCell.vue';
import ProductReviewRate from '#/views/mall/product-review/components/ProductReviewRate.vue';
import {
  getReviewCreateTime,
  getReviewFiles,
  getReviewRepliesByType,
  getUserDisplayName,
  hasReviewReplyType,
} from '#/views/mall/product-review/constants';

const props = defineProps<{
  loading: boolean;
  open: boolean;
  record: null | ProductReviewApi.ReviewRecord;
}>();

const emit = defineEmits<{
  delete: [];
  replyFollowUp: [];
  replyMerchant: [];
  'update:open': [value: boolean];
}>();

const drawerOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const reviewFiles = computed(() =>
  props.record ? getReviewFiles(props.record) : [],
);

const followUpReplies = computed(() =>
  props.record ? getReviewRepliesByType(props.record, 0) : [],
);

const merchantReplies = computed(() =>
  props.record ? getReviewRepliesByType(props.record, 1) : [],
);

const canFollowUp = computed(() =>
  props.record ? !hasReviewReplyType(props.record, 0) : false,
);

const canMerchantReply = computed(() =>
  props.record ? !hasReviewReplyType(props.record, 1) : false,
);
</script>

<template>
  <Drawer
    v-model:open="drawerOpen"
    :destroy-on-close="true"
    title="评价详情"
    width="520"
  >
    <Spin :spinning="loading">
      <div v-if="record" class="flex flex-col gap-6 pb-20">
        <section class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-sm font-medium text-foreground">
              {{ getUserDisplayName(record) }}
            </span>
            <span class="text-sm text-muted-foreground">
              {{ getReviewCreateTime(record) }}
            </span>
          </div>

          <div
            class="space-y-3 rounded-md border border-border bg-muted/20 p-4"
          >
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

        <section v-if="followUpReplies.length > 0" class="space-y-4">
          <h4 class="text-sm font-medium text-foreground">追加评论</h4>
          <div
            v-for="reply in followUpReplies"
            :key="reply.id"
            class="rounded-md border border-border bg-muted/20 p-3"
          >
            <div class="mb-2 text-xs text-muted-foreground">
              {{ getReviewCreateTime(reply) }}
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

        <section v-if="merchantReplies.length > 0" class="space-y-4">
          <h4 class="text-sm font-medium text-foreground">商家回复</h4>
          <div
            v-for="reply in merchantReplies"
            :key="reply.id"
            class="rounded-md border border-border bg-muted/20 p-3"
          >
            <div class="mb-2 text-xs text-muted-foreground">
              {{ getReviewCreateTime(reply) }}
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
    </Spin>

    <template v-if="record && !loading" #footer>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap gap-2">
          <Button v-if="canFollowUp" @click="emit('replyFollowUp')">
            追加评论
          </Button>
          <Button v-if="canMerchantReply" @click="emit('replyMerchant')">
            商家回复
          </Button>
        </div>
        <Button danger type="primary" @click="emit('delete')">
          删除评论
        </Button>
      </div>
    </template>
  </Drawer>
</template>
