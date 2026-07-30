<script lang="ts" setup>
/**
 * 变体属性编辑弹窗
 */
import type {
  ProductSkuAttributeOption,
  ProductSkuAttributeRow,
  ProductVariationRow,
} from '../types/product';

import { computed, ref, toRaw, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, message, Modal, Select, Tooltip } from 'ant-design-vue';

import { useMallProductFormBiz } from '../useMallProductFormContext';
import { sanitizeSkuAttributesPreviewUrls } from '../utils/productMedia';
import {
  getVariationPricingBlockReason,
  pruneExcludedVariationSignatures,
  rebuildVariations,
  skuComboAttrs,
} from '../utils/productVariation';
import ProductSkuAttributeEditor from './ProductSkuAttributeEditor.vue';
import ProductSkuOptionMediaGrid, {
  SKU_OPTION_MEDIA_MAX_DEFAULT,
} from './ProductSkuOptionMediaGrid.vue';
import ProductVariationTable from './ProductVariationTable.vue';

interface Props {
  open: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:open', v: boolean): void;
}>();

const biz = useMallProductFormBiz();

const innerOpen = computed<boolean>({
  get: () => props.open,
  set: (v) => emit('update:open', v),
});

/** 单次递归：解包 Proxy 同时深拷贝为纯对象，不再需要 structuredClone 二次遍历 */
function deepCloneRaw<T>(value: T): T {
  const raw = toRaw(value);
  if (raw === null || typeof raw !== 'object') {
    return raw;
  }
  if (raw instanceof File || raw instanceof Blob || raw instanceof Date) {
    return raw;
  }
  if (Array.isArray(raw)) {
    return raw.map((item) => deepCloneRaw(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(raw)) {
    out[key] = deepCloneRaw(val);
  }
  return out as T;
}

/** `selected` 仅用于变体表批量操作，不入库；克隆草稿时统一不勾选 */
function cloneVariationsForDraft(
  rows: ProductVariationRow[],
): ProductVariationRow[] {
  return deepCloneRaw(rows).map((r) => ({ ...r, selected: false }));
}

/** 弹窗内编辑草稿；`biz` 仅在「完成」时写入 */
const draftSkuAttributes = ref<ProductSkuAttributeRow[]>([]);
const draftVariations = ref<ProductVariationRow[]>([]);
const draftExcludedVariationSignatures = ref<string[]>([]);
/** 打开弹窗赋值时跳过 deep watcher 触发的冗余 rebuild */
let skipNextSkuWatch = false;
/** 打开弹窗时 `biz` 中已有的 blob URL，关窗丢弃草稿时不回收这些 */
const baselineBlobUrls = ref<Set<string>>(new Set());
/** 为 true 时关窗不回收 blob（已提交到 `biz`，URL 仍有效） */
const suppressDiscardBlobRevoke = ref(false);

function collectBlobUrlsFromSlice(
  sku: ProductSkuAttributeRow[],
  vars: ProductVariationRow[],
): Set<string> {
  const s = new Set<string>();
  for (const row of sku) {
    for (const opt of row.options) {
      for (const im of opt.images) {
        if (im.url.startsWith('blob:')) s.add(im.url);
      }
    }
  }
  for (const vrow of vars) {
    for (const u of vrow.imageUrls) {
      if (u.startsWith('blob:')) s.add(u);
    }
  }
  return s;
}

function revokeBlobIfNotBaseline(url: string, baseline: Set<string>) {
  if (!url.startsWith('blob:')) return;
  if (baseline.has(url)) return;
  URL.revokeObjectURL(url);
}

function revokeDraftBlobsNotInBaseline(
  sku: ProductSkuAttributeRow[],
  vars: ProductVariationRow[],
  baseline: Set<string>,
) {
  for (const row of sku) {
    for (const opt of row.options) {
      for (const im of opt.images) {
        revokeBlobIfNotBaseline(im.url, baseline);
      }
    }
  }
  for (const vrow of vars) {
    for (const u of vrow.imageUrls) {
      revokeBlobIfNotBaseline(u, baseline);
    }
  }
}

/* ================ 选中态：属性编辑器与选项图集分离 ================ */

/** 属性与选项模块：tag 高亮、新增选项后的选中（不与选项图片区联动） */
const editorAttrId = ref('');
const editorOptionId = ref('');

/** 选项图片区：仅由本区下拉/列表或确认后默认「第一属性·第一选项」 */
const mediaAttrId = ref('');
const mediaOptionId = ref('');

/** 用户确认「属性与选项」后才展示选项图片与变体组合 */
const skuAttrsConfirmed = ref(false);

/** 延迟一帧再渲染重 DOM 区域（选项图片 + 变体组合表），弹窗动画不被阻塞 */
const deferredReady = ref(false);

/** 选项图片区当前属性 */
const mediaActiveAttr = computed<ProductSkuAttributeRow | undefined>(() =>
  draftSkuAttributes.value.find((r) => r.id === mediaAttrId.value),
);

/** 选项图片区当前选项 */
const mediaActiveOption = computed<ProductSkuAttributeOption | undefined>(() =>
  mediaActiveAttr.value?.options.find((o) => o.id === mediaOptionId.value),
);

/**
 * 弹窗打开：从 `biz` 克隆草稿；关闭：未提交则回收草稿中新增 blob。
 */
watch(
  () => innerOpen.value,
  (open) => {
    if (open) {
      deferredReady.value = false;
      suppressDiscardBlobRevoke.value = false;
      baselineBlobUrls.value = collectBlobUrlsFromSlice(
        toRaw(biz.value.skuAttributes),
        toRaw(biz.value.variations),
      );
      draftVariations.value = cloneVariationsForDraft(biz.value.variations);
      skipNextSkuWatch = true;
      draftSkuAttributes.value = deepCloneRaw(biz.value.skuAttributes);
      draftExcludedVariationSignatures.value = deepCloneRaw(
        biz.value.excludedVariationSignatures ?? [],
      );
      sanitizeSkuAttributesPreviewUrls(draftSkuAttributes.value);
      draftVariations.value = rebuildVariations(
        draftSkuAttributes.value,
        draftVariations.value,
        draftExcludedVariationSignatures.value,
      );
      editorAttrId.value = '';
      editorOptionId.value = '';
      if (getSkuAttrsConfirmBlockReason(draftSkuAttributes.value) === null) {
        skuAttrsConfirmed.value = true;
        resetMediaSelectionToFirst();
      } else {
        skuAttrsConfirmed.value = false;
        mediaAttrId.value = '';
        mediaOptionId.value = '';
      }
      ensureEditorSelection();
      requestAnimationFrame(() => {
        deferredReady.value = true;
      });
      return;
    }
    if (!suppressDiscardBlobRevoke.value) {
      revokeDraftBlobsNotInBaseline(
        draftSkuAttributes.value,
        draftVariations.value,
        baselineBlobUrls.value,
      );
    }
    suppressDiscardBlobRevoke.value = false;
    editorAttrId.value = '';
    editorOptionId.value = '';
    mediaAttrId.value = '';
    mediaOptionId.value = '';
    skuAttrsConfirmed.value = false;
    deferredReady.value = false;
  },
  { immediate: true },
);

function refreshDraftVariationsFromSku() {
  if (skipNextSkuWatch) {
    skipNextSkuWatch = false;
    return;
  }
  if (!innerOpen.value) return;
  draftExcludedVariationSignatures.value = pruneExcludedVariationSignatures(
    draftSkuAttributes.value,
    draftExcludedVariationSignatures.value,
  );
  draftVariations.value = rebuildVariations(
    draftSkuAttributes.value,
    draftVariations.value,
    draftExcludedVariationSignatures.value,
  );
}

/** 草稿侧属性变更时重算变体行（与主表单 `ProductSkuSection` 逻辑对齐，但不写 `biz`） */
watch(() => draftSkuAttributes.value, refreshDraftVariationsFromSku, {
  deep: true,
});

/** 选项图上传完成 / 排序后同步变体组合主图预览 */
watch(
  () =>
    draftSkuAttributes.value
      .flatMap((r) =>
        r.options.flatMap((o) =>
          o.images.map(
            (im) =>
              `${im.uid}:${im.url}:${im.uploadStatus ?? ''}:${im.ossPath ?? ''}`,
          ),
        ),
      )
      .join('|'),
  () => {
    if (!innerOpen.value || !skuAttrsConfirmed.value) return;
    refreshDraftVariationsFromSku();
  },
);

/**
 * 属性 / 选项数组发生增删时：
 * - 属性编辑器：校正 tag 选中态
 * - 已确认且选项图片区已展示时：校正媒体区 id（无效时落到第一属性·第一选项）
 */
watch(
  () =>
    draftSkuAttributes.value
      .map((r) => `${r.id}:${r.options.map((o) => o.id).join(',')}`)
      .join('|'),
  () => {
    if (!innerOpen.value) return;
    ensureEditorSelection();
    if (skuAttrsConfirmed.value) ensureMediaSelection();
  },
);

function ensureEditorSelection() {
  const attrs = draftSkuAttributes.value;
  if (attrs.length === 0) {
    editorAttrId.value = '';
    editorOptionId.value = '';
    return;
  }
  const attr = attrs.find((r) => r.id === editorAttrId.value) ?? attrs[0];
  if (!attr) return;
  if (editorAttrId.value !== attr.id) editorAttrId.value = attr.id;
  const opt =
    attr.options.find((o) => o.id === editorOptionId.value) ?? attr.options[0];
  editorOptionId.value = opt?.id ?? '';
}

/** 选项图片区：校正 id；当前属性或选项不存在时落到第一个属性及其第一个选项 */
function ensureMediaSelection() {
  const attrs = draftSkuAttributes.value;
  if (attrs.length === 0) {
    mediaAttrId.value = '';
    mediaOptionId.value = '';
    return;
  }
  const attr = attrs.find((r) => r.id === mediaAttrId.value) ?? attrs[0];
  if (!attr) return;
  mediaAttrId.value = attr.id;
  const opt =
    attr.options.find((o) => o.id === mediaOptionId.value) ?? attr.options[0];
  mediaOptionId.value = opt?.id ?? '';
}

/** 下拉切换属性时，选项 id 可能仍属上一属性，需落到当前属性下的有效选项 */
watch(mediaAttrId, () => {
  if (!innerOpen.value || !skuAttrsConfirmed.value) return;
  ensureMediaSelection();
});

/** 确认属性后：选项图片始终从第一维度、第一选项开始 */
function resetMediaSelectionToFirst() {
  const attrs = draftSkuAttributes.value;
  const first = attrs[0];
  if (!first) {
    mediaAttrId.value = '';
    mediaOptionId.value = '';
    return;
  }
  mediaAttrId.value = first.id;
  mediaOptionId.value = first.options[0]?.id ?? '';
}

/* ================ 选项图集双向绑定 ================ */

/**
 * 把当前选中选项的 images 数组桥接为受控值给 ProductSkuOptionMediaGrid。
 * 写回时，因为 mediaActiveOption 是同一个对象引用，直接替换其 images 即可触发响应。
 */
const activeOptionImages = computed({
  get: () => mediaActiveOption.value?.images ?? [],
  set: (v) => {
    if (mediaActiveOption.value) mediaActiveOption.value.images = v;
  },
});

const optionMediaTitle = computed(() => {
  if (!mediaActiveAttr.value || !mediaActiveOption.value) return '';
  const attrName = mediaActiveAttr.value.name.trim() || '未命名属性';
  return `${attrName} / ${mediaActiveOption.value.label}`;
});

/** 与 ProductSkuOptionMediaGrid 的 max 一致，列表用量展示同步 */
const optionMediaMax = SKU_OPTION_MEDIA_MAX_DEFAULT;

const attrSelectOptions = computed(() =>
  draftSkuAttributes.value.map((a) => ({
    label: a.name.trim() || '未命名',
    value: a.id,
  })),
);

const hasAnyAttribute = computed(() => draftSkuAttributes.value.length > 0);

/**
 * 确认前：每一行属性名非空，且每行至少有一个非空选项 label。
 * 返回 null 表示可确认，否则为提示文案。
 */
function getSkuAttrsConfirmBlockReason(
  rows: ProductSkuAttributeRow[],
): null | string {
  if (rows.length === 0) {
    return '请先添加属性';
  }
  if (rows.some((r) => r.name.trim() === '')) {
    return '存在未填写名称的属性，请补全后再确认。';
  }
  for (const r of rows) {
    if (!r.options.some((o) => o.label.trim() !== '')) {
      return `请为属性「${r.name.trim()}」至少添加一个选项。`;
    }
  }
  return null;
}

const skuAttrsConfirmBlockReason = computed(() =>
  getSkuAttrsConfirmBlockReason(draftSkuAttributes.value),
);

/** 与变体组合表一致的笛卡尔积数量（确认态摘要展示） */
const variationComboCount = computed(
  () => skuComboAttrs(draftSkuAttributes.value).length,
);

/** 确认态：各属性及其选项文案 */
const skuSummaryRows = computed(() =>
  draftSkuAttributes.value.map((r) => {
    const name = r.name.trim() || '未命名属性';
    const labels = r.options.map((o) => o.label.trim()).filter(Boolean);
    return {
      id: r.id,
      name,
      labelsText: labels.length > 0 ? labels.join('、') : '—',
    };
  }),
);

const skuAttrEditorRef = ref<null | {
  addAttribute: () => void;
  cancelPendingOptionBlurCommit: () => void;
  validateReadyForConfirm: () => null | string;
}>(null);

function addSkuAttribute() {
  skuAttrEditorRef.value?.addAttribute();
}

function confirmSkuAttrs() {
  skuAttrEditorRef.value?.cancelPendingOptionBlurCommit();
  const editorReason = skuAttrEditorRef.value?.validateReadyForConfirm();
  if (editorReason) {
    message.warning(editorReason);
    return;
  }
  const reason = skuAttrsConfirmBlockReason.value;
  if (reason) {
    message.warning(reason);
    return;
  }
  skuAttrsConfirmed.value = true;
  resetMediaSelectionToFirst();
}

function close() {
  innerOpen.value = false;
}

/** 完成：校验草稿后写入 `biz` 再关闭；关窗未走此路径则丢弃草稿并回收新增 blob */
function handleFinish() {
  if (!skuAttrsConfirmed.value) {
    message.warning('请先确认属性与选项');
    return;
  }
  skuAttrEditorRef.value?.cancelPendingOptionBlurCommit();
  const editorReason = skuAttrEditorRef.value?.validateReadyForConfirm();
  if (editorReason) {
    message.warning(editorReason);
    return;
  }
  const reason = getSkuAttrsConfirmBlockReason(draftSkuAttributes.value);
  if (reason) {
    message.warning(reason);
    return;
  }
  const pricingReason = getVariationPricingBlockReason(draftVariations.value);
  if (pricingReason) {
    message.warning(pricingReason);
    return;
  }
  suppressDiscardBlobRevoke.value = true;
  biz.value.excludedVariationSignatures = deepCloneRaw(
    draftExcludedVariationSignatures.value,
  );
  biz.value.skuAttributes = deepCloneRaw(draftSkuAttributes.value);
  biz.value.variations = cloneVariationsForDraft(draftVariations.value);
  close();
}
</script>

<template>
  <Modal
    v-model:open="innerOpen"
    title="编辑变体属性"
    :width="1200"
    :mask-closable="false"
    :footer="null"
    wrap-class-name="sku-variants-modal-wrap"
  >
    <div class="flex flex-col gap-5">
      <!-- 属性 + 选项：未确认可编辑，确认后只读摘要 -->
      <section class="sku-variants-section">
        <template v-if="!skuAttrsConfirmed">
          <div
            class="sku-variants-section-head mb-3 flex flex-wrap items-center justify-between gap-3"
          >
            <div class="sku-variants-section-title">属性与选项</div>
            <div
              v-if="!hasAnyAttribute"
              class="flex flex-wrap items-center gap-2"
            >
              <Button
                class="sku-variants-section-toolbar-btn sku-variants-add-attr-btn"
                size="small"
                type="dashed"
                @click="addSkuAttribute"
              >
                <template #icon>
                  <IconifyIcon class="size-[14px]" icon="mdi:plus" />
                </template>
                新增属性
              </Button>
            </div>
          </div>
          <ProductSkuAttributeEditor
            ref="skuAttrEditorRef"
            v-model="draftSkuAttributes"
            v-model:active-attr-id="editorAttrId"
            v-model:active-option-id="editorOptionId"
          />
          <div
            v-if="hasAnyAttribute"
            class="mt-3 flex flex-wrap items-center gap-2"
          >
            <Button
              class="sku-variants-section-toolbar-btn sku-variants-add-attr-btn"
              size="small"
              type="dashed"
              @click="addSkuAttribute"
            >
              <template #icon>
                <IconifyIcon class="size-[14px]" icon="mdi:plus" />
              </template>
              新增属性
            </Button>
            <Button
              class="sku-variants-section-toolbar-btn"
              size="small"
              type="primary"
              @click="confirmSkuAttrs"
            >
              确认属性与选项
            </Button>
          </div>
          <p
            v-if="hasAnyAttribute"
            class="mt-3 mb-0 text-xs leading-relaxed text-slate-500"
          >
            确认后可编辑选项图片与变体组合。
          </p>
        </template>

        <template v-else>
          <div
            class="sku-variants-section-head mb-3 flex flex-wrap items-center justify-between gap-3"
          >
            <div class="sku-variants-section-title sku-attrs-summary-heading">
              已选属性与选项
            </div>
            <Button
              size="middle"
              type="default"
              class="sku-attrs-summary-edit-btn"
              @click="skuAttrsConfirmed = false"
            >
              编辑
            </Button>
          </div>
          <div class="sku-attrs-summary">
            <div class="sku-attrs-summary-row">
              <span class="sku-attrs-summary-label">变体数量</span>
              <span class="sku-attrs-summary-value">{{
                variationComboCount
              }}</span>
            </div>
            <div
              v-for="row in skuSummaryRows"
              :key="row.id"
              class="sku-attrs-summary-row"
            >
              <span class="sku-attrs-summary-label">{{ row.name }}</span>
              <span class="sku-attrs-summary-value">{{ row.labelsText }}</span>
            </div>
          </div>
        </template>
      </section>

      <!-- 选项图集（仅在已选中具体选项时展示编辑界面） -->
      <section
        v-if="hasAnyAttribute && skuAttrsConfirmed && deferredReady"
        class="sku-variants-section"
      >
        <div class="sku-variants-section-title">选项图片</div>

        <div class="mb-3 flex flex-col gap-4">
          <div class="flex flex-wrap items-center gap-3">
            <span class="shrink-0 text-xs text-slate-500">选择属性：</span>
            <Select
              v-model:value="mediaAttrId"
              class="sku-variants-attr-select min-w-[200px] max-w-full"
              :options="attrSelectOptions"
              placeholder="选择属性"
            />
          </div>

          <div
            v-if="mediaActiveAttr && mediaActiveAttr.options.length > 0"
            class="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4"
          >
            <div
              class="sku-option-picker shrink-0 sm:max-w-[280px] sm:min-w-[220px]"
            >
              <div class="mb-2 text-xs text-slate-500">选择选项：</div>
              <ul class="sku-option-picker-list" role="listbox">
                <li
                  v-for="opt in mediaActiveAttr.options"
                  :key="opt.id"
                  role="option"
                  class="sku-option-picker-item"
                  :class="{
                    'sku-option-picker-item--active': opt.id === mediaOptionId,
                  }"
                  :aria-selected="opt.id === mediaOptionId"
                  @click="mediaOptionId = opt.id"
                >
                  <span class="sku-option-picker-label">{{ opt.label }}</span>
                  <span class="sku-option-picker-count">
                    ({{ opt.images.length }}/{{ optionMediaMax }} 图片)
                  </span>
                  <!-- <IconifyIcon
                    v-if="opt.id === mediaOptionId"
                    class="sku-option-picker-chevron size-[18px] shrink-0 text-slate-500"
                    icon="mdi:chevron-right"
                  /> -->
                </li>
              </ul>
            </div>
            <div class="min-w-0 flex-1">
              <ProductSkuOptionMediaGrid
                v-if="mediaActiveOption"
                v-model="activeOptionImages"
                :title="optionMediaTitle"
                :max="optionMediaMax"
              />
            </div>
          </div>
        </div>

        <div
          v-if="
            !(
              mediaActiveAttr &&
              mediaActiveAttr.options.length > 0 &&
              mediaActiveOption
            )
          "
          class="rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400"
        >
          请在上方先添加并选中一个选项
        </div>
      </section>

      <!-- 变体组合表 -->
      <section
        v-if="hasAnyAttribute && skuAttrsConfirmed && deferredReady"
        class="sku-variants-section"
      >
        <div class="sku-variants-section-title">变体组合</div>
        <ProductVariationTable
          v-model:sku-attributes="draftSkuAttributes"
          v-model:variations="draftVariations"
          v-model:excluded-variation-signatures="
            draftExcludedVariationSignatures
          "
        />
      </section>

      <div class="flex flex-col items-end gap-1 pt-2">
        <p v-if="!skuAttrsConfirmed" class="mb-0 text-xs text-slate-500">
          请先点击【确认属性与选项】后再完成
        </p>
        <Tooltip :title="skuAttrsConfirmed ? '' : '请先确认属性与选项'">
          <span>
            <Button
              type="primary"
              :disabled="!skuAttrsConfirmed"
              @click="handleFinish"
            >
              完成
            </Button>
          </span>
        </Tooltip>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.sku-variants-section {
  padding: 14px 16px;
  background: #fff;
  border: 1px solid rgb(226 232 240);
  border-radius: 10px;
}

.sku-variants-section-title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: rgb(15 23 42);
}

.sku-variants-section-head .sku-variants-section-title {
  margin-bottom: 0;
}

.sku-attrs-summary-heading {
  margin-bottom: 0;
}

.sku-attrs-summary-edit-btn.ant-btn {
  color: hsl(var(--primary));
  background-color: hsl(var(--primary) / 10%);
  border-color: rgb(226 232 240);
}

.sku-attrs-summary-edit-btn.ant-btn:not(:disabled):hover {
  color: hsl(var(--primary));
  background-color: rgb(248 250 252);
  border-color: rgb(203 213 225);
}

.sku-attrs-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.sku-attrs-summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: baseline;
}

.sku-attrs-summary-label {
  flex: 0 0 auto;
  min-width: 5.5rem;
  color: rgb(100 116 139);
}

.sku-attrs-summary-value {
  flex: 1 1 auto;
  min-width: 0;
  color: rgb(15 23 42);
  overflow-wrap: break-word;
}

.sku-variants-section-toolbar-btn.ant-btn {
  height: auto;
  padding-block: 5px;
  padding-inline: 10px;
  line-height: 1.5;
}

.sku-variants-add-attr-btn.ant-btn {
  color: hsl(var(--primary));
  background-color: hsl(var(--primary) / 10%);
  border-color: hsl(var(--primary) / 45%);
}

.sku-variants-add-attr-btn.ant-btn:not(:disabled):hover {
  color: hsl(var(--primary));
  background-color: hsl(var(--primary) / 16%);
  border-color: hsl(var(--primary) / 65%);
}

.sku-variants-attr-select {
  min-width: 200px;
}

.sku-option-picker-list {
  padding: 0;
  margin: 0;
  overflow: hidden;
  list-style: none;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
}

.sku-option-picker-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid rgb(241 245 249);
  transition: background-color 0.15s ease;
}

.sku-option-picker-item:last-child {
  border-bottom: none;
}

.sku-option-picker-item:hover {
  background-color: rgb(248 250 252);
}

.sku-option-picker-item--active {
  background-color: hsl(var(--primary) / 10%);
}

.sku-option-picker-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sku-option-picker-count {
  flex-shrink: 0;
  font-size: 12px;
  line-height: 1.4;
  color: rgb(100 116 139);
}
</style>

<style>
.sku-variants-modal-wrap.ant-modal-wrap {
  align-items: flex-start;
  justify-content: center;
}

.sku-variants-modal-wrap .ant-modal {
  top: 50px !important;
  padding-bottom: 0;
}
</style>
