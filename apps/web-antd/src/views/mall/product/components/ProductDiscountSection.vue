<script lang="ts" setup>
/**
 * 量价折扣：总开关默认开启；阶梯从 init 列表展示，每档下拉选择折扣百分比。
 */

import type { SelectValue } from 'ant-design-vue/es/select';

import type { VolumePricingRow } from '../types/product';

import { computed, watch } from 'vue';

import { Select, Switch } from 'ant-design-vue';

import {
  useMallProductFormBiz,
  useMallProductFormOptions,
} from '../useMallProductFormContext';

const NO_DISCOUNT_VALUE = '__none__';

const DISCOUNT_PERCENTS = Array.from({ length: 10 }, (_, i) => (i + 1) * 5);

const biz = useMallProductFormBiz();
const formOptions = useMallProductFormOptions();

/** init 选项 + 详情里可能存在但已下线的阶梯（编辑兼容） */
const volumePricingChoices = computed(() => {
  const base = formOptions.value.volumePricingOptions;
  const extra = biz.value.volumePricingList.filter(
    (row) => !base.some((o) => o.min === row.min),
  );
  return [...base, ...extra].toSorted((a, b) => a.min - b.min);
});

function isOptionalTier(index: number) {
  return index > 0;
}

function findSavedRow(min: number) {
  return biz.value.volumePricingList.find((row) => row.min === min);
}

function getTierSelectValue(row: VolumePricingRow, index: number) {
  const saved = findSavedRow(row.min);
  if (saved) return saved.discount;
  if (isOptionalTier(index)) return NO_DISCOUNT_VALUE;
  return row.discount;
}

function buildTierOptions(row: VolumePricingRow, index: number) {
  const saved = findSavedRow(row.min);
  const percents = new Set(DISCOUNT_PERCENTS);
  const currentDiscount =
    saved?.discount ?? (isOptionalTier(index) ? undefined : row.discount);
  if (typeof currentDiscount === 'number' && !percents.has(currentDiscount)) {
    percents.add(currentDiscount);
  }
  const discountOptions = [...percents]
    .toSorted((a, b) => a - b)
    .map((discount) => ({
      label: `${discount}%`,
      value: discount,
    }));

  if (isOptionalTier(index)) {
    return [{ label: '无折扣', value: NO_DISCOUNT_VALUE }, ...discountOptions];
  }
  return discountOptions;
}

function onTierDiscountChange(row: VolumePricingRow, value: SelectValue) {
  if (value === undefined || Array.isArray(value)) return;

  const list = [...biz.value.volumePricingList];
  const existingIndex = list.findIndex((item) => item.min === row.min);

  if (value === NO_DISCOUNT_VALUE) {
    if (existingIndex !== -1) {
      list.splice(existingIndex, 1);
    }
  } else {
    const nextRow: VolumePricingRow = {
      min: row.min,
      discount: Number(value),
      label: row.label,
    };
    if (existingIndex === -1) {
      list.push(nextRow);
    } else {
      list[existingIndex] = nextRow;
    }
  }

  biz.value.volumePricingList = list.toSorted((a, b) => a.min - b.min);
}

/** 新增模式：列表为空时用 init 默认折扣填充全部阶梯 */
watch(
  () =>
    [
      biz.value.discountEnabled,
      volumePricingChoices.value,
      biz.value.volumePricingList.length,
    ] as const,
  ([enabled, choices, listLength]) => {
    if (!enabled || choices.length === 0 || listLength > 0) return;
    biz.value.volumePricingList = choices.map((row) => ({
      min: row.min,
      discount: row.discount,
      label: row.label,
    }));
  },
  { immediate: true },
);
</script>

<template>
  <div class="product-form-module-shell">
    <h3
      class="product-form-module-title product-form-module-title--section-gap"
    >
      量价折扣
    </h3>
    <div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span class="shrink-0 text-sm text-slate-700">是否有折扣</span>
      <Switch
        v-model:checked="biz.discountEnabled"
        checked-children="开"
        un-checked-children="关"
      />
    </div>
    <div
      v-if="biz.discountEnabled && volumePricingChoices.length > 0"
      class="volume-pricing-grid"
    >
      <div
        v-for="(row, index) in volumePricingChoices"
        :key="row.min"
        class="volume-pricing-tier"
      >
        <span class="volume-pricing-tier-label">{{ row.label }}</span>
        <Select
          class="volume-pricing-tier-select"
          :value="getTierSelectValue(row, index)"
          :options="buildTierOptions(row, index)"
          @update:value="(value) => onTierDiscountChange(row, value)"
        />
      </div>
    </div>
    <p
      v-else-if="biz.discountEnabled && volumePricingChoices.length === 0"
      class="text-sm text-slate-500"
    >
      暂无可选折扣阶梯
    </p>
  </div>
</template>

<style scoped>
.volume-pricing-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.volume-pricing-tier {
  width: max-content;
  max-width: 100%;
}

.volume-pricing-tier-select {
  width: 12rem;
}

.volume-pricing-tier-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: rgb(30 41 59);
}
</style>
