<script lang="ts" setup>
import type { ProductReviewApi } from '#/api/core/productReview';

import { computed, ref, watch } from 'vue';

import { Input, message, Modal } from 'ant-design-vue';

import {
  REVIEW_FILE_MAX_COUNT,
  REVIEW_REPLY_CONTENT_MAX_LENGTH,
} from '../constants';
import ProductReviewMediaUpload from './ProductReviewMediaUpload.vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    replyType?: 0 | 1;
    submitting: boolean;
    target: null | ProductReviewApi.ReviewRecord;
  }>(),
  {
    replyType: 1,
  },
);

const emit = defineEmits<{
  submit: [payload: { content: string; reviewFile: string[] }];
  'update:open': [value: boolean];
}>();

const content = ref('');
const mediaUploadRef = ref<InstanceType<
  typeof ProductReviewMediaUpload
> | null>(null);

const modalOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const modalTitle = computed(() =>
  props.replyType === 0 ? '追加评论' : '商家回复',
);

const contentLabel = computed(() =>
  props.replyType === 0 ? '追加评论内容' : '回复内容',
);

const submitText = computed(() =>
  props.replyType === 0 ? '提交追加评论' : '提交回复',
);

const contentPlaceholder = computed(
  () =>
    `请输入${props.replyType === 0 ? '追加评论' : '回复'}内容（${REVIEW_REPLY_CONTENT_MAX_LENGTH}字以内）`,
);

const showMediaUpload = computed(() => props.replyType === 0);

function resetForm() {
  content.value = '';
  mediaUploadRef.value?.resetSlots();
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      resetForm();
    }
  },
);

function handleSubmit() {
  const trimmedContent = content.value.trim();
  if (!trimmedContent) {
    message.warning(
      props.replyType === 0 ? '请输入追加评论内容' : '请输入回复内容',
    );
    return;
  }
  if (trimmedContent.length > REVIEW_REPLY_CONTENT_MAX_LENGTH) {
    message.warning(`回复内容不能超过 ${REVIEW_REPLY_CONTENT_MAX_LENGTH} 字`);
    return;
  }

  const reviewFile = mediaUploadRef.value?.getOssPaths() ?? [];
  if (reviewFile.length > REVIEW_FILE_MAX_COUNT) {
    message.warning(`最多上传 ${REVIEW_FILE_MAX_COUNT} 个附件`);
    return;
  }

  emit('submit', {
    content: trimmedContent,
    reviewFile,
  });
}

function handleCancel() {
  modalOpen.value = false;
}
</script>

<template>
  <Modal
    v-model:open="modalOpen"
    :confirm-loading="submitting"
    destroy-on-close
    :ok-text="submitText"
    :title="modalTitle"
    width="640px"
    @cancel="handleCancel"
    @ok="handleSubmit"
  >
    <div v-if="target" class="flex flex-col gap-4">
      <div class="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
        <div class="mb-1 font-medium text-foreground">用户评价</div>
        <div class="line-clamp-3 whitespace-pre-wrap">
          {{ target.content || '—' }}
        </div>
      </div>

      <div>
        <div class="mb-2 text-sm font-medium">{{ contentLabel }}</div>
        <Input.TextArea
          v-model:value="content"
          :auto-size="{ minRows: 4, maxRows: 8 }"
          :maxlength="REVIEW_REPLY_CONTENT_MAX_LENGTH"
          :placeholder="contentPlaceholder"
          show-count
        />
      </div>

      <div v-if="showMediaUpload">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">附件（选填）</span>
          <span class="text-xs text-muted-foreground">
            最多 {{ REVIEW_FILE_MAX_COUNT }} 个，支持图片与视频
          </span>
        </div>

        <ProductReviewMediaUpload ref="mediaUploadRef" />
      </div>
    </div>
  </Modal>
</template>
