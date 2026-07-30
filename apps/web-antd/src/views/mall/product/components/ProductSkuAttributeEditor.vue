<script lang="ts" setup>
/**
 * SKU 属性 + 选项编辑器
 */
import type { Sortable } from '@vben/hooks';

import type {
  ProductSkuAttributeOption,
  ProductSkuAttributeRow,
} from '../types/product';

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { useSortable } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { Button, Input, message, Tag } from 'ant-design-vue';

interface Props {
  modelValue: ProductSkuAttributeRow[];
  activeAttrId?: string; // 当前选中的属性 id
  activeOptionId?: string; // 当前选中的选项 id
}

const props = withDefaults(defineProps<Props>(), {
  activeAttrId: '',
  activeOptionId: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', v: ProductSkuAttributeRow[]): void;
  (e: 'update:activeAttrId', v: string): void;
  (e: 'update:activeOptionId', v: string): void;
}>();

/** 选项图集中可能持有 blob URL，删除选项/属性时需要回收 */
function revokeIfBlob(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
}

function disposeOption(opt: ProductSkuAttributeOption) {
  for (const img of opt.images) revokeIfBlob(img.url);
}

function disposeRow(row: ProductSkuAttributeRow) {
  for (const opt of row.options) disposeOption(opt);
}

/** 受控数据：所有写操作都通过 emit 同步给外层 */
const rows = computed<ProductSkuAttributeRow[]>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

function newId(prefix: string) {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 各属性 新增属性名 输入框草稿，按属性 id 存 */
const nameDraftByRowId = ref<Record<string, string>>({});

/** 当前哪一行正在显示 新建属性名 输入框 */
const nameAddingRowId = ref<null | string>(null);

const nameInputRefs = ref<Map<string, { focus?: () => void }>>(new Map());

function setNameInputRef(rowId: string, inst: unknown) {
  if (!inst || typeof inst !== 'object') {
    nameInputRefs.value.delete(rowId);
    return;
  }
  const withFocus = inst as { focus?: () => void };
  if (typeof withFocus.focus === 'function')
    nameInputRefs.value.set(rowId, withFocus);
  else nameInputRefs.value.delete(rowId);
}

function focusNameInput(rowId: string) {
  nameInputRefs.value.get(rowId)?.focus?.();
}

/** 各属性 新增可选值 输入框草稿，按属性 id 存 */
const optionDraftByRowId = ref<Record<string, string>>({});

/** 当前哪一行正在显示 新建选项 输入框（null 则显示 + New Tag） */
const optionAddingRowId = ref<null | string>(null);

/** Ant Design Vue Input 组件实例（含 focus） */
const optionInputRefs = ref<Map<string, { focus?: () => void }>>(new Map());

function setOptionInputRef(rowId: string, inst: unknown) {
  if (!inst || typeof inst !== 'object') {
    optionInputRefs.value.delete(rowId);
    return;
  }
  const withFocus = inst as { focus?: () => void };
  if (typeof withFocus.focus === 'function')
    optionInputRefs.value.set(rowId, withFocus);
  else optionInputRefs.value.delete(rowId);
}

function focusOptionInput(rowId: string) {
  optionInputRefs.value.get(rowId)?.focus?.();
}

/* ================= 属性级排序：使用 useSortable 管理 ================= */

const sortableListRef = ref<HTMLElement | null>(null);
const sortableInst = ref<null | Sortable>(null);

function destroySortable() {
  sortableInst.value?.destroy();
  sortableInst.value = null;
}

async function initSortable() {
  destroySortable();
  await nextTick();
  const el = sortableListRef.value;
  if (!el || rows.value.length === 0) return;

  const { initializeSortable } = useSortable(el, {
    animation: 200,
    delay: 0,
    draggable: '.sku-attr-dimension-row',
    handle: '.sku-attr-drag-handle',
    onEnd(evt) {
      const oldIndex = evt.oldIndex;
      const newIndex = evt.newIndex;
      if (
        oldIndex === undefined ||
        newIndex === undefined ||
        oldIndex === newIndex
      ) {
        return;
      }
      const list = [...rows.value];
      const moved = list.splice(oldIndex, 1)[0];
      if (moved) list.splice(newIndex, 0, moved);
      rows.value = list;
    },
  });
  sortableInst.value = await initializeSortable();
}

watch(
  () => rows.value.map((r) => r.id).join('|'),
  () => {
    void initSortable();
  },
  { flush: 'post', immediate: true },
);

onBeforeUnmount(() => {
  destroySortable();
  cancelPendingBlurCommit();
});

/* ================= 名称去重 ================= */

function normAttrNameKey(name: string) {
  return name.trim().toLowerCase();
}

function isDuplicateAttrName(index: number, trimmed: string) {
  const key = normAttrNameKey(trimmed);
  if (!key) return false;
  return rows.value.some(
    (r, i) => i !== index && normAttrNameKey(r.name) === key,
  );
}

function commitAttrName(
  row: ProductSkuAttributeRow,
  index: number,
  opts?: { silentOnDuplicate?: boolean },
): boolean {
  const trimmed = (nameDraftByRowId.value[row.id] ?? '').trim();
  if (!trimmed) return false;
  if (isDuplicateAttrName(index, trimmed)) {
    if (!opts?.silentOnDuplicate) message.warning('属性名不能与已有维度重复');
    return false;
  }
  row.name = trimmed;
  nameDraftByRowId.value[row.id] = '';
  nameAddingRowId.value = null;
  return true;
}

function openNameInput(rowId: string) {
  const row = rows.value.find((r) => r.id === rowId);
  if (!row || row.name.trim()) return;

  const prev = nameAddingRowId.value;
  if (prev && prev !== rowId) nameDraftByRowId.value[prev] = '';

  nameDraftByRowId.value[rowId] = '';
  nameAddingRowId.value = rowId;
  void nextTick(() => focusNameInput(rowId));
}

function removeAttrName(row: ProductSkuAttributeRow) {
  row.name = '';
  nameDraftByRowId.value[row.id] = '';
  openNameInput(row.id);
}

const suppressNameInputBlurClose = ref(false);

let nameBlurTimerId: null | ReturnType<typeof setTimeout> = null;

function cancelPendingNameBlurCommit() {
  if (nameBlurTimerId) {
    clearTimeout(nameBlurTimerId);
    nameBlurTimerId = null;
  }
}

async function onNamePressEnter(row: ProductSkuAttributeRow, index: number) {
  suppressNameInputBlurClose.value = true;
  commitAttrName(row, index);
  await nextTick();
  setTimeout(() => {
    suppressNameInputBlurClose.value = false;
  }, 200);
}

function onNameInputBlur(row: ProductSkuAttributeRow, index: number) {
  const rowId = row.id;
  if (nameBlurTimerId) clearTimeout(nameBlurTimerId);
  nameBlurTimerId = setTimeout(() => {
    nameBlurTimerId = null;
    if (suppressNameInputBlurClose.value) return;
    if (nameAddingRowId.value !== rowId) return;
    const raw = (nameDraftByRowId.value[rowId] ?? '').trim();
    if (!raw) {
      nameAddingRowId.value = null;
      nameDraftByRowId.value[rowId] = '';
      return;
    }
    commitAttrName(row, index, { silentOnDuplicate: true });
  }, 0);
}

/* ================= 属性 CRUD ================= */

function addAttribute() {
  const next: ProductSkuAttributeRow = {
    id: newId('attr'),
    name: '',
    options: [],
  };
  rows.value = [...rows.value, next];
  // 新增后自动选中，便于直接编辑属性名与选项
  emit('update:activeAttrId', next.id);
  emit('update:activeOptionId', '');
  void nextTick(() => openNameInput(next.id));
}

function removeAttribute(index: number) {
  const removed = rows.value[index];
  if (!removed) return;
  disposeRow(removed);
  const list = [...rows.value];
  list.splice(index, 1);
  rows.value = list;
  if (props.activeAttrId === removed.id) {
    // 选中态自动落回相邻属性，没有则清空
    const fallback = list[index] ?? list[index - 1];
    emit('update:activeAttrId', fallback?.id ?? '');
    emit('update:activeOptionId', fallback?.options[0]?.id ?? '');
  }
}

/* ================= 选项 ================= */

function addOption(
  row: ProductSkuAttributeRow,
  opts?: { silentOnDuplicate?: boolean },
) {
  const raw = (optionDraftByRowId.value[row.id] ?? '').trim();
  if (!raw) return;
  if (row.options.some((o) => o.label === raw)) {
    if (!opts?.silentOnDuplicate) message.warning('该选项已存在');
    return;
  }
  const opt: ProductSkuAttributeOption = {
    id: newId('opt'),
    label: raw,
    images: [],
  };
  row.options.push(opt);
  optionDraftByRowId.value[row.id] = '';
  // 新增选项后自动选中，方便用户立即上传图片
  emit('update:activeAttrId', row.id);
  emit('update:activeOptionId', opt.id);
}

/** 展开「+ New Tag」输入框并聚焦 */
function openOptionInput(rowId: string) {
  const prev = optionAddingRowId.value;
  if (prev && prev !== rowId) optionDraftByRowId.value[prev] = '';
  optionAddingRowId.value = rowId;
  void nextTick(() => focusOptionInput(rowId));
}

/** Enter 提交后会立刻 refocus，忽略紧随其后的 blur，避免误收起输入框 */
const suppressOptionInputBlurClose = ref(false);

/** blur 里 setTimeout(0) 提交草稿；与「确认」时可能先于 cancel 执行，重复选项在 blur 路径静默提示，由 confirm 的 validate 统一弹窗 */
let optionBlurTimerId: null | ReturnType<typeof setTimeout> = null;

function cancelPendingOptionBlurCommit() {
  if (optionBlurTimerId) {
    clearTimeout(optionBlurTimerId);
    optionBlurTimerId = null;
  }
}

function cancelPendingBlurCommit() {
  cancelPendingOptionBlurCommit();
  cancelPendingNameBlurCommit();
}

async function onOptionPressEnter(row: ProductSkuAttributeRow) {
  suppressOptionInputBlurClose.value = true;
  addOption(row);
  await nextTick();
  if (optionAddingRowId.value === row.id) focusOptionInput(row.id);
  setTimeout(() => {
    suppressOptionInputBlurClose.value = false;
  }, 200);
}

function onOptionInputBlur(row: ProductSkuAttributeRow) {
  const rowId = row.id;
  if (optionBlurTimerId) clearTimeout(optionBlurTimerId);
  optionBlurTimerId = setTimeout(() => {
    optionBlurTimerId = null;
    if (suppressOptionInputBlurClose.value) return;
    if (optionAddingRowId.value !== rowId) return;
    const raw = (optionDraftByRowId.value[rowId] ?? '').trim();
    if (!raw) {
      optionAddingRowId.value = null;
      optionDraftByRowId.value[rowId] = '';
      return;
    }
    addOption(row, { silentOnDuplicate: true });
    void nextTick(() => {
      if (optionAddingRowId.value === rowId) focusOptionInput(rowId);
    });
  }, 0);
}

function removeOption(row: ProductSkuAttributeRow, index: number) {
  const removed = row.options[index];
  if (!removed) return;
  disposeOption(removed);
  row.options.splice(index, 1);
  if (props.activeOptionId === removed.id) {
    const fallback = row.options[index] ?? row.options[index - 1];
    emit('update:activeOptionId', fallback?.id ?? '');
  }
}

/**
 * 父级点击「确认属性与选项」前调用：待提交草稿与已有选项重复，或已提交选项 label 在同属性内重复时返回原因
 */
function validateReadyForConfirm(): null | string {
  for (const [index, r] of rows.value.entries()) {
    const nameDraft = (nameDraftByRowId.value[r.id] ?? '').trim();
    if (nameDraft) {
      if (
        isDuplicateAttrName(index, nameDraft) &&
        nameDraft !== r.name.trim()
      ) {
        return '属性名不能与已有维度重复';
      }
      if (!r.name.trim() || nameDraft !== r.name.trim()) {
        return '请先回车确认属性名';
      }
    }

    const draft = (optionDraftByRowId.value[r.id] ?? '').trim();
    if (draft && r.options.some((o) => o.label === draft)) {
      return '该选项已存在';
    }
    const seen = new Set<string>();
    for (const o of r.options) {
      const lab = o.label.trim();
      if (!lab) continue;
      if (seen.has(lab)) {
        return `属性「${r.name.trim() || '未命名'}」存在重复选项，请先修改后再确认。`;
      }
      seen.add(lab);
    }
  }
  return null;
}

defineExpose({
  addAttribute,
  cancelPendingOptionBlurCommit: cancelPendingBlurCommit,
  validateReadyForConfirm,
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <div ref="sortableListRef" class="flex flex-col gap-3">
      <div
        v-for="(row, index) in rows"
        :key="row.id"
        class="sku-attr-dimension-row flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-slate-50/80 p-3 transition-colors"
      >
        <div class="flex shrink-0 items-center gap-2" @click.stop>
          <span class="shrink-0 text-xs text-slate-500">属性名：</span>
          <div
            class="sku-attr-option-controls flex min-w-0 flex-wrap items-center gap-1"
          >
            <Tag
              v-if="row.name.trim()"
              bordered
              class="sku-attr-option-chip sku-attr-name-chip m-0 inline-flex max-w-[min(100%,220px)] items-center gap-0.5"
              closable
              @close.stop="removeAttrName(row)"
            >
              <span class="sku-attr-option-chip-label min-w-0 flex-1">{{
                row.name
              }}</span>
            </Tag>
            <Button
              v-else-if="nameAddingRowId !== row.id"
              class="sku-attr-new-tag-btn"
              size="middle"
              type="dashed"
              @click.stop="openNameInput(row.id)"
            >
              <IconifyIcon class="mr-0.5 size-[12px]" icon="mdi:plus" />
              属性名
            </Button>
            <Input
              v-else
              :ref="(el) => setNameInputRef(row.id, el)"
              :value="nameDraftByRowId[row.id] ?? ''"
              allow-clear
              class="sku-attr-option-input sku-attr-new-tag-input !w-[140px] shrink-0"
              placeholder="输入后回车"
              size="middle"
              @blur="onNameInputBlur(row, index)"
              @press-enter="onNamePressEnter(row, index)"
              @update:value="(v) => (nameDraftByRowId[row.id] = v ?? '')"
            />
          </div>
        </div>

        <div
          class="flex min-w-[200px] flex-1 flex-wrap items-center gap-2"
          @click.stop
        >
          <span class="shrink-0 text-xs text-slate-500"> 选项： </span>
          <div
            class="sku-attr-option-controls flex min-w-0 flex-1 flex-wrap items-center gap-1"
          >
            <VueDraggable
              v-model="row.options"
              :animation="200"
              chosen-class="sku-attr-option-chip-chosen"
              class="sku-attr-options-draggable contents"
              draggable=".sku-attr-option-chip"
              filter=".ant-tag-close-icon"
              ghost-class="sku-attr-option-chip-ghost"
            >
              <Tag
                v-for="(opt, oi) in row.options"
                :key="opt.id"
                bordered
                class="sku-attr-option-chip m-0 inline-flex max-w-[min(100%,220px)] cursor-grab select-none items-center gap-0.5 active:cursor-grabbing"
                :class="
                  opt.id === activeOptionId && 'sku-attr-option-chip-active'
                "
                closable
                @close.stop="removeOption(row, oi)"
              >
                <!-- @click="selectOption(row, opt)" 暂时不要切换的联动 -->
                <span class="sku-attr-option-chip-label min-w-0 flex-1">{{
                  opt.label
                }}</span>
              </Tag>
            </VueDraggable>
            <Button
              v-if="optionAddingRowId !== row.id"
              class="sku-attr-new-tag-btn"
              size="middle"
              type="dashed"
              @click.stop="openOptionInput(row.id)"
            >
              <IconifyIcon class="mr-0.5 size-[12px]" icon="mdi:plus" />
              选项
            </Button>
            <Input
              v-else
              :ref="(el) => setOptionInputRef(row.id, el)"
              :value="optionDraftByRowId[row.id] ?? ''"
              allow-clear
              class="sku-attr-option-input sku-attr-new-tag-input !w-[140px] shrink-0"
              placeholder="输入后回车"
              size="middle"
              @blur="onOptionInputBlur(row)"
              @press-enter="onOptionPressEnter(row)"
              @update:value="(v) => (optionDraftByRowId[row.id] = v ?? '')"
            />
          </div>
        </div>

        <div class="ml-auto flex shrink-0 items-center gap-0.5" @click.stop>
          <Button
            danger
            size="small"
            title="删除当前属性"
            type="text"
            @click="removeAttribute(index)"
          >
            <IconifyIcon class="size-[18px]" icon="mdi:minus-circle-outline" />
          </Button>
          <span
            class="sku-attr-drag-handle flex cursor-grab select-none items-center rounded px-0.5 py-0.5 text-slate-500 hover:bg-slate-200/80 active:cursor-grabbing"
            title="拖动排序属性"
          >
            <IconifyIcon class="size-[18px]" icon="mdi:drag-vertical" />
          </span>
        </div>
      </div>
    </div>

    <div v-if="rows.length === 0" class="text-center text-sm text-slate-400">
      暂无属性，点击「新增属性」开始添加
    </div>
  </div>
</template>

<style scoped>
/* 与属性名 Input（middle）同高，统一选项区 Tag / 按钮 / 内联输入框 */
.sku-attr-option-controls {
  --sku-attr-option-control-h: 32px;
}

.sku-attr-option-controls :deep(.ant-tag) {
  margin-inline-end: 0;
}

.sku-attr-option-controls :deep(.sku-attr-option-chip.ant-tag) {
  display: inline-flex;
  align-items: center;
  height: var(--sku-attr-option-control-h);
  min-height: var(--sku-attr-option-control-h);
  padding-block: 0;
  padding-inline: 11px;
  font-size: 14px;
  line-height: 1;
  background: #fff;
  border-color: rgb(226 232 240);
}

.sku-attr-option-chip-active {
  color: hsl(var(--primary));
  background-color: hsl(var(--primary) / 12%);
  border-color: hsl(var(--primary) / 50%);
}

.sku-attr-option-chip-ghost {
  opacity: 0.55;
}

.sku-attr-option-chip-chosen {
  cursor: grabbing;
}

.sku-attr-option-chip-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sku-attr-name-chip {
  cursor: default;
}

.sku-attr-new-tag-btn.ant-btn {
  height: var(--sku-attr-option-control-h);
  min-height: var(--sku-attr-option-control-h);
  padding-block: 0;
  padding-inline: 11px;
  font-size: 14px;
  line-height: 1;
  color: rgb(100 116 139);
  background: transparent;
  border-color: rgb(203 213 225);
}

.sku-attr-new-tag-btn.ant-btn:not(:disabled):hover {
  color: hsl(var(--primary));
  border-color: hsl(var(--primary) / 45%);
}

.sku-attr-new-tag-input.ant-input-affix-wrapper {
  height: var(--sku-attr-option-control-h);
  min-height: var(--sku-attr-option-control-h);
  padding-block: 0;
  font-size: 14px;
}
</style>
