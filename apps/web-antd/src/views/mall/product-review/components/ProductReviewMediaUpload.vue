<script lang="ts" setup>
import { ref, watch } from 'vue';

import { MallSingleImageUpload } from '#/components/single-image-upload';

import { REVIEW_FILE_MAX_COUNT } from '../constants';
import { createReviewMediaUid } from '../utils/reviewMedia';

export interface ReviewMediaSlot {
  id: string;
  ossPath: string;
}

const slots = ref<ReviewMediaSlot[]>([createEmptySlot()]);

function createEmptySlot(): ReviewMediaSlot {
  return { id: createReviewMediaUid(), ossPath: '' };
}

function syncSlots() {
  const filled = slots.value.filter((slot) => Boolean(slot.ossPath.trim()));
  const trailingEmpty = slots.value.find((slot) => !slot.ossPath.trim());

  if (filled.length >= REVIEW_FILE_MAX_COUNT) {
    if (slots.value.length !== filled.length) {
      slots.value = filled;
    }
    return;
  }

  if (!trailingEmpty) {
    slots.value = [...filled, createEmptySlot()];
    return;
  }

  if (slots.value.length !== filled.length + 1) {
    slots.value = [...filled, trailingEmpty];
  }
}

watch(
  () => slots.value.map((slot) => slot.ossPath).join('\0'),
  () => {
    syncSlots();
  },
);

function resetSlots() {
  slots.value = [createEmptySlot()];
}

function getOssPaths(): string[] {
  return slots.value.map((slot) => slot.ossPath.trim()).filter(Boolean);
}

defineExpose({
  getOssPaths,
  resetSlots,
});
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <MallSingleImageUpload
      v-for="slot in slots"
      :key="slot.id"
      v-model="slot.ossPath"
      allow-video
      :size="80"
    />
  </div>
</template>
