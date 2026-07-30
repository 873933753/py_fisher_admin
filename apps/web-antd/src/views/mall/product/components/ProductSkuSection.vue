<script lang="ts" setup>
/**
 * 多属性 · SKU 变体（主表单页）
 */
import { computed, ref, watch } from 'vue';

import { Button, Switch } from 'ant-design-vue';

import { useMallProductFormBiz } from '../useMallProductFormContext';
import {
  pruneExcludedVariationSignatures,
  rebuildVariations,
} from '../utils/productVariation';
import ProductSkuVariantsModal from './ProductSkuVariantsModal.vue';

const biz = useMallProductFormBiz();

const modalOpen = ref(false);

function openEditor() {
  modalOpen.value = true;
}

/** 售价区间：所有变体 price 的 min ~ max，相同则单个值 */
const salePriceSummary = computed(() => {
  const prices = biz.value.variations
    .map((v) => v.price)
    .filter((p): p is number => p !== undefined && !Number.isNaN(p) && p > 0);
  if (prices.length === 0) return '未设置';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const fmt = (n: number) => n.toFixed(2);
  return min === max ? fmt(min) : `${fmt(min)} - ${fmt(max)}`;
});

/** 库存总和：所有变体 quantity 求和 */
const stockSummary = computed(() => {
  const rows = biz.value.variations;
  if (rows.length === 0) return '未设置';
  const quantities = rows.map((v) => v.quantity);
  if (quantities.some((q) => q === undefined || Number.isNaN(q))) {
    return '未设置';
  }
  return String(quantities.reduce<number>((sum, q) => sum + (q ?? 0), 0));
});

/**
 * 属性 / 选项变更时重算变体笛卡尔积（仅 multiSkuEnabled 开启时有意义）。
 */
watch(
  () => biz.value.skuAttributes,
  () => {
    const excluded = pruneExcludedVariationSignatures(
      biz.value.skuAttributes,
      biz.value.excludedVariationSignatures ?? [],
    );
    biz.value.excludedVariationSignatures = excluded;
    biz.value.variations = rebuildVariations(
      biz.value.skuAttributes,
      biz.value.variations,
      excluded,
    );
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="product-form-module-shell">
    <div
      class="mb-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-2"
    >
      <div class="min-w-0 flex-1">
        <h3 class="product-form-module-title mb-0">多属性 · SKU 变体</h3>
        <div class="mt-2 flex items-center gap-2">
          <span class="shrink-0 text-sm text-slate-700">多属性</span>
          <Switch
            v-model:checked="biz.multiSkuEnabled"
            checked-children="开"
            un-checked-children="关"
          />
        </div>
      </div>
      <Button
        class="sku-section-edit-btn shrink-0"
        size="small"
        type="primary"
        ghost
        @click="openEditor"
      >
        编辑变体属性
      </Button>
    </div>

    <template v-if="biz.multiSkuEnabled">
      <div v-if="biz.skuAttributes.length > 0" class="sku-section-snapshot">
        <section class="sku-section-block">
          <h4 class="sku-section-subtitle">属性</h4>
          <div class="sku-section-attr-grid">
            <div
              v-for="attr in biz.skuAttributes"
              :key="attr.id"
              class="sku-section-attr-item"
            >
              <span class="sku-section-attr-name">
                {{ attr.name.trim() || '未命名属性' }} :
              </span>
              <div class="sku-section-attr-chips">
                <template v-if="attr.options.length === 0">
                  <span class="text-xs text-slate-400">未配置选项</span>
                </template>
                <span
                  v-for="opt in attr.options"
                  :key="opt.id"
                  class="sku-section-readonly-chip"
                >
                  {{ opt.label }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section class="sku-section-block sku-section-block--pricing">
          <h4 class="sku-section-subtitle">价格与库存</h4>
          <div class="sku-section-pricing-grid">
            <div class="sku-section-pricing-item">
              <span class="sku-section-pricing-label">售价：</span>
              <span class="sku-section-pricing-value">{{
                salePriceSummary
              }}</span>
            </div>
            <div class="sku-section-pricing-item">
              <span class="sku-section-pricing-label">库存：</span>
              <span class="sku-section-pricing-value">{{ stockSummary }}</span>
            </div>
          </div>
        </section>
      </div>

      <div
        v-else
        class="rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400"
      >
        请添加变体属性，点击右上角「编辑变体属性」开始添加
      </div>
    </template>

    <ProductSkuVariantsModal v-model:open="modalOpen" />
  </div>
</template>

<style scoped>
.sku-section-edit-btn.ant-btn {
  height: auto;
  padding-block: 5px;
  padding-inline: 12px;
  line-height: 1.5;
}

.sku-section-snapshot {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 14px;
  background-color: rgb(248 250 252);
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.sku-section-block--pricing {
  padding-top: 4px;
}

.sku-section-subtitle {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: #000;
}

.sku-section-attr-grid,
.sku-section-pricing-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 300px));
  gap: 12px 32px;
  width: fit-content;
  max-width: 100%;
}

.sku-section-attr-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  min-width: 0;
}

.sku-section-attr-name {
  flex-shrink: 0;
  font-size: 14px;
  line-height: 24px;
  color: rgb(71 85 105);
}

.sku-section-attr-chips {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.sku-section-readonly-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 14px;
  line-height: 20px;
  color: rgb(51 65 85);
  background: #fff;
  border: 1px solid rgb(226 232 240);
  border-radius: 2px;
}

.sku-section-pricing-item {
  display: flex;
  gap: 8px;
  align-items: baseline;
  min-width: 0;
}

.sku-section-pricing-label {
  flex-shrink: 0;
  font-size: 13px;
  color: rgb(71 85 105);
}

.sku-section-pricing-value {
  font-size: 14px;
  line-height: 1.5;
  color: rgb(15 23 42);
  overflow-wrap: break-word;
}
</style>
