<script lang="ts" setup>
import type { OrderRatingResult } from '../constants';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { normalizeOrderRatingResult } from '../constants';

const props = defineProps<{
  clickable?: boolean;
  ratingResult?: null | number;
  viewable?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
  view: [];
}>();

const normalizedRating = computed(() =>
  normalizeOrderRatingResult(props.ratingResult),
);

const badgeClass = computed(() => {
  const map: Record<Exclude<OrderRatingResult, 0>, string> = {
    1: 'order-item-rating-badge--positive',
    2: 'order-item-rating-badge--neutral',
    3: 'order-item-rating-badge--negative',
  };
  return map[normalizedRating.value as Exclude<OrderRatingResult, 0>];
});

const badgeSymbol = computed(() => {
  if (normalizedRating.value === 1) {
    return '+';
  }
  if (normalizedRating.value === 2 || normalizedRating.value === 3) {
    return '−';
  }
  return '';
});

const badgeTitle = computed(() => {
  if (normalizedRating.value === 1) {
    return '好评，点击查看评价详情';
  }
  if (normalizedRating.value === 2) {
    return '中评，点击查看评价详情';
  }
  if (normalizedRating.value === 3) {
    return '差评，点击查看评价详情';
  }
  return '';
});

function handlePenClick() {
  if (props.clickable && normalizedRating.value === 0) {
    emit('submit');
  }
}

function handleBadgeClick() {
  if (props.viewable && normalizedRating.value !== 0) {
    emit('view');
  }
}
</script>

<template>
  <button
    v-if="normalizedRating === 0"
    type="button"
    class="order-item-rating-pen"
    :class="{ 'order-item-rating-pen--clickable': clickable }"
    :disabled="!clickable"
    title="代填评价"
    @click="handlePenClick"
  >
    <IconifyIcon class="size-[18px]" icon="mdi:square-edit-outline" />
  </button>
  <button
    v-else
    type="button"
    class="order-item-rating-badge"
    :class="[badgeClass, { 'order-item-rating-badge--clickable': viewable }]"
    :disabled="!viewable"
    :title="badgeTitle"
    @click="handleBadgeClick"
  >
    {{ badgeSymbol }}
  </button>
</template>

<style scoped>
.order-item-rating-badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  border: none;
  border-radius: 9999px;
}

.order-item-rating-badge--clickable {
  cursor: pointer;
}

.order-item-rating-badge--clickable:hover {
  opacity: 0.85;
}

.order-item-rating-badge--positive {
  background: #3db838;
}

.order-item-rating-badge--neutral {
  background: #9ca3af;
}

.order-item-rating-badge--negative {
  background: #e53238;
}

.order-item-rating-pen {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: rgb(0 0 0 / 88%);
  cursor: default;
  background: transparent;
  border: none;
}

.order-item-rating-pen--clickable {
  cursor: pointer;
}

.order-item-rating-pen--clickable:hover {
  opacity: 0.75;
}
</style>
