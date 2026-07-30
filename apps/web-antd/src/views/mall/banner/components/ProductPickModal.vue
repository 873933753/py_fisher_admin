<script lang="ts" setup>
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import type { Key } from 'ant-design-vue/es/_util/type';

import type { PickedProduct } from '../types';

import type { ProductFindPageApi } from '#/api/core/product';
import type { SysDictApi } from '#/api/core/sysDict';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Button, Input, Modal, Table } from 'ant-design-vue';

import { findPageProductApi } from '#/api/core/product';
import { findJerseyTypeTreeApi } from '#/api/core/sysDict';

import ProductListMainImgCell from '../../product/components/ProductListMainImgCell.vue';
import { resolveCategoryLabelFromDictIds } from '../utils/categoryLabel';

const props = defineProps<{
  selected: PickedProduct[];
}>();

const emit = defineEmits<{
  confirm: [products: PickedProduct[]];
}>();

const open = defineModel<boolean>('open', { required: true });

const keyword = ref('');
const loading = ref(false);
const dataSource = ref<ProductFindPageApi.ProductRecord[]>([]);
const jerseyTree = ref<SysDictApi.JerseyTypeTreeNode[]>([]);
const selectedRowKeys = ref<Key[]>([]);
const selectedMap = ref<Map<string, PickedProduct>>(new Map());

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const columns: TableColumnsType<ProductFindPageApi.ProductRecord> = [
  {
    title: '商品 ID',
    dataIndex: 'id',
    key: 'id',
    width: 200,
    ellipsis: true,
    align: 'center',
  },
  {
    title: '主图',
    dataIndex: 'mainImg',
    key: 'mainImg',
    width: 72,
    align: 'center',
  },
  {
    title: '商品名称',
    dataIndex: 'productName',
    key: 'productName',
    ellipsis: true,
    align: 'center',
  },
];

function recordToPicked(
  row: ProductFindPageApi.ProductRecord & { dictIds?: string },
): PickedProduct {
  return {
    id: row.id,
    productName: row.productName ?? '',
    mainImg: row.mainImg ?? '',
    categoryLabel: resolveCategoryLabelFromDictIds(
      row.dictIds,
      jerseyTree.value,
    ),
  };
}

function syncSelectedFromProps() {
  const map = new Map<string, PickedProduct>();
  for (const item of props.selected) {
    if (item.id) map.set(item.id, { ...item });
  }
  selectedMap.value = map;
  selectedRowKeys.value = [...map.keys()];
}

async function fetchList() {
  loading.value = true;
  try {
    const params: ProductFindPageApi.FindPageParams = {
      current: pagination.current,
      size: pagination.pageSize,
    };
    const name = keyword.value.trim();
    if (name) params.productName = name;

    const data = await findPageProductApi(params);
    dataSource.value = data.records ?? [];
    pagination.total = Number(data.total) || 0;
    pagination.current = Number(data.current) || pagination.current;
    pagination.pageSize = Number(data.size) || pagination.pageSize;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  void fetchList();
}

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  preserveSelectedRowKeys: true,
  onChange: (keys: Key[]) => {
    selectedRowKeys.value = keys;
    const next = new Map(selectedMap.value);
    for (const id of next.keys()) {
      if (!keys.includes(id)) next.delete(id);
    }
    for (const row of dataSource.value) {
      if (keys.includes(row.id)) {
        next.set(row.id, recordToPicked(row));
      }
    }
    selectedMap.value = next;
  },
}));

const tablePagination = computed<TablePaginationConfig>(() => ({
  current: pagination.current,
  pageSize: pagination.pageSize,
  total: pagination.total,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
  onChange: (page, pageSize) => {
    pagination.current = page;
    pagination.pageSize = pageSize;
    void fetchList();
  },
}));

function handleOk() {
  emit('confirm', [...selectedMap.value.values()]);
  open.value = false;
}

function handleCancel() {
  open.value = false;
}

watch(
  () => open.value,
  (visible) => {
    if (!visible) return;
    syncSelectedFromProps();
    pagination.current = 1;
    void fetchList();
  },
);

onMounted(async () => {
  try {
    jerseyTree.value = (await findJerseyTypeTreeApi()) ?? [];
  } catch {
    jerseyTree.value = [];
  }
});
</script>

<template>
  <Modal
    v-model:open="open"
    :destroy-on-close="true"
    title="选择商品"
    width="920px"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <div class="mb-3 flex justify-end gap-2">
      <Input
        v-model:value="keyword"
        allow-clear
        class="max-w-xs flex-1"
        placeholder="搜索商品名称"
        @press-enter="handleSearch"
      />
      <Button type="primary" @click="handleSearch">搜索</Button>
    </div>
    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="tablePagination"
      row-key="id"
      :row-selection="rowSelection"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'mainImg'">
          <ProductListMainImgCell :src="record.mainImg" />
        </template>
        <template v-else-if="column.key === 'category'">
          {{
            resolveCategoryLabelFromDictIds(
              (
                record as ProductFindPageApi.ProductRecord & {
                  dictIds?: string;
                }
              ).dictIds,
              jerseyTree,
            )
          }}
        </template>
      </template>
    </Table>
    <div class="mt-2 text-sm text-muted-foreground">
      已选 {{ selectedMap.size }} 个商品
    </div>
  </Modal>
</template>
