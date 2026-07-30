<script lang="ts" setup>
/**
 * 变体组合表：批量填价/库存/SKU、主图列仅展示
 */
import type {
  ProductSkuAttributeRow,
  ProductVariationRow,
} from '../types/product';

import { computed, ref } from 'vue';

import {
  Button,
  Input,
  InputNumber,
  message,
  Modal,
  Table,
} from 'ant-design-vue';

import { getVariationRowPreviewUrl } from '../utils/productMedia';
import { excludeVariationSignature } from '../utils/productVariation';

const skuAttributes = defineModel<ProductSkuAttributeRow[]>('skuAttributes', {
  required: true,
});
const variations = defineModel<ProductVariationRow[]>('variations', {
  required: true,
});
const excludedVariationSignatures = defineModel<string[]>(
  'excludedVariationSignatures',
  { required: true },
);

const bulkOpen = ref(false);
const bulkKind = ref<'originalPrice' | 'price' | 'quantity' | 'sku'>('price');
const bulkNum = ref<number | undefined>(undefined);
const bulkStr = ref('');

const attrTitles = computed(() =>
  skuAttributes.value.map((a) => a.name.trim()).filter(Boolean),
);

const selectedRows = computed(() => variations.value.filter((r) => r.selected));

const tableColumns = computed(() => {
  const dynamic = attrTitles.value.map((title) => ({
    title,
    key: `attr:${title}`,
    width: 120,
    align: 'center' as const,
  }));
  return [
    { title: '主图', key: 'photos', width: 120, align: 'center' as const },
    { title: 'SKU', key: 'sku', width: 120, align: 'center' as const },
    ...dynamic,
    { title: '库存', key: 'quantity', width: 96, align: 'center' as const },
    {
      title: '原价',
      key: 'originalPrice',
      width: 104,
      align: 'center' as const,
    },
    { title: '售价', key: 'price', width: 104, align: 'center' as const },
    {
      title: '操作',
      key: 'action',
      width: 72,
      fixed: 'right' as const,
      align: 'center' as const,
    },
  ];
});

function attrCell(row: ProductVariationRow, title: string) {
  return row.attrs[title] ?? '—';
}

function rowPreviewUrl(row: ProductVariationRow) {
  return getVariationRowPreviewUrl(row.imageUrls);
}

function revokeBlob(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
}

function deleteRow(row: ProductVariationRow) {
  for (const url of row.imageUrls) revokeBlob(url);
  excludedVariationSignatures.value = excludeVariationSignature(
    excludedVariationSignatures.value,
    row.attrs,
  );
  const i = variations.value.findIndex((r) => r.id === row.id);
  if (i !== -1) variations.value.splice(i, 1);
}

function openBulk(kind: typeof bulkKind.value) {
  if (selectedRows.value.length === 0) {
    message.warning('请先勾选变体行');
    return;
  }
  bulkKind.value = kind;
  bulkNum.value = undefined;
  bulkStr.value = '';
  bulkOpen.value = true;
}

function applyBulk(): Promise<void> {
  const rows = selectedRows.value;
  if (rows.length === 0) {
    bulkOpen.value = false;
    return Promise.resolve();
  }
  if (bulkKind.value === 'sku') {
    const v = bulkStr.value.trim();
    if (!v) {
      message.warning('请输入 SKU');
      return Promise.reject(new Error('validation'));
    }
    rows.forEach((r) => {
      r.skuCode = v;
    });
  } else {
    const n = bulkNum.value;
    if (n === undefined || Number.isNaN(n)) {
      message.warning('请输入有效数字');
      return Promise.reject(new Error('validation'));
    }
    if (bulkKind.value === 'quantity') {
      rows.forEach((r) => {
        r.quantity = n;
      });
    } else if (bulkKind.value === 'originalPrice') {
      rows.forEach((r) => {
        r.originalPrice = n;
      });
    } else {
      rows.forEach((r) => {
        r.price = n;
      });
    }
  }
  bulkOpen.value = false;
  return Promise.resolve();
}

const rowSelection = computed(() => ({
  selectedRowKeys: variations.value.filter((r) => r.selected).map((r) => r.id),
  onChange: (keys: (number | string)[]) => {
    const set = new Set(keys.map(String));
    for (const r of variations.value) {
      r.selected = set.has(r.id);
    }
  },
}));

function bulkDelete() {
  const rows = selectedRows.value;
  if (rows.length === 0) {
    message.warning('请先勾选变体行');
    return;
  }
  const ids = new Set(rows.map((r) => r.id));
  const n = rows.length;
  Modal.confirm({
    title: '确认删除所选变体？',
    content: `将删除已选中的 ${n} 条变体组合，此操作不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      let excluded = excludedVariationSignatures.value;
      for (const r of rows) {
        excluded = excludeVariationSignature(excluded, r.attrs);
      }
      excludedVariationSignatures.value = excluded;
      variations.value = variations.value.filter((r) => {
        if (!ids.has(r.id)) return true;
        for (const url of r.imageUrls) revokeBlob(url);
        return false;
      });
    },
  });
}
</script>

<template>
  <div class="product-variation-table">
    <div class="mb-2 flex flex-wrap items-center gap-2">
      <span class="text-sm font-medium text-slate-800">
        变体组合（{{ variations.length }}）
      </span>
      <Button size="small" @click="openBulk('price')">批量售价</Button>
      <Button size="small" @click="openBulk('originalPrice')">批量原价</Button>
      <Button size="small" @click="openBulk('quantity')">批量库存</Button>
      <Button size="small" @click="openBulk('sku')">批量 SKU</Button>
      <Button danger size="small" @click="bulkDelete">删除所选</Button>
    </div>

    <Table
      :columns="tableColumns"
      :data-source="variations"
      :pagination="false"
      row-key="id"
      size="small"
      :row-selection="rowSelection"
      :scroll="{ x: 640 + attrTitles.length * 120 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <Button
            danger
            size="small"
            type="link"
            @click="deleteRow(record as ProductVariationRow)"
          >
            删除
          </Button>
        </template>
        <template v-else-if="column.key === 'photos'">
          <div
            class="mx-auto flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50"
          >
            <img
              v-if="rowPreviewUrl(record as ProductVariationRow)"
              :src="rowPreviewUrl(record as ProductVariationRow)"
              alt=""
              class="h-full w-full object-cover"
            />
            <span v-else class="text-xs text-slate-400">—</span>
          </div>
        </template>
        <template v-else-if="column.key === 'sku'">
          <Input
            v-model:value="record.skuCode"
            size="small"
            allow-clear
            placeholder="SKU"
          />
        </template>
        <template v-else-if="String(column.key).startsWith('attr:')">
          <span class="text-xs text-slate-700">{{
            attrCell(record as ProductVariationRow, String(column.key).slice(5))
          }}</span>
        </template>
        <template v-else-if="column.key === 'quantity'">
          <InputNumber
            v-model:value="record.quantity"
            :min="0"
            :precision="0"
            size="small"
            class="w-full min-w-[72px]"
          />
        </template>
        <template v-else-if="column.key === 'originalPrice'">
          <InputNumber
            v-model:value="record.originalPrice"
            :min="0"
            :precision="2"
            size="small"
            class="w-full min-w-[80px]"
          />
        </template>
        <template v-else-if="column.key === 'price'">
          <InputNumber
            v-model:value="record.price"
            :min="0"
            :precision="2"
            size="small"
            class="w-full min-w-[80px]"
          />
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="bulkOpen"
      title="批量填充"
      ok-text="应用到所选行"
      @ok="applyBulk"
    >
      <div v-if="bulkKind === 'sku'" class="flex items-center gap-3 py-2">
        <span class="shrink-0 text-sm text-slate-600">SKU 文本</span>
        <Input
          v-model:value="bulkStr"
          class="min-w-0 flex-1"
          placeholder="输入 SKU"
        />
      </div>
      <div v-else class="flex items-center gap-3 py-2">
        <span class="shrink-0 text-sm text-slate-600">
          {{
            bulkKind === 'quantity'
              ? '库存'
              : bulkKind === 'originalPrice'
                ? '原价'
                : '售价'
          }}
        </span>
        <InputNumber
          v-model:value="bulkNum"
          class="min-w-0 flex-1"
          :min="0"
          :precision="bulkKind === 'quantity' ? 0 : 2"
        />
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.product-variation-table :deep(.ant-table-thead > tr > th),
.product-variation-table :deep(.ant-table-tbody > tr > td) {
  text-align: center;
}

.product-variation-table
  :deep(.ant-table-tbody > tr.ant-table-row-selected > td) {
  background: hsl(var(--background)) !important;
}

.product-variation-table
  :deep(.ant-table-tbody > tr.ant-table-row-selected:hover > td) {
  background: hsl(var(--accent-hover)) !important;
}
</style>
