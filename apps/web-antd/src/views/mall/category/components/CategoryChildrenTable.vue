<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { Sortable } from '@vben/hooks';

import type { CategoryNode } from '../types/category';

import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { useSortable } from '@vben/hooks';

import { Button, Card, Space, Table } from 'ant-design-vue';

const props = defineProps<{
  addChildLabel: string;
  addDisabled: boolean;
  cardTitle: string;
  columns: TableColumnsType<CategoryNode>;
  dataSource: CategoryNode[];
  parentId: string | undefined;
}>();

const emit = defineEmits<{
  addChild: [];
  delete: [CategoryNode];
  edit: [CategoryNode];
  reorder: [oldIndex: number, newIndex: number];
}>();

const tableRootRef = ref<HTMLElement | null>(null);
const sortableInst = ref<null | Sortable>(null);

function destroySortable() {
  sortableInst.value?.destroy();
  sortableInst.value = null;
}

async function initSortable() {
  destroySortable();
  await nextTick();
  const root = tableRootRef.value;
  if (!root || props.dataSource.length === 0) return;

  const tbody =
    (root.querySelector('.ant-table-body table tbody') as HTMLElement | null) ??
    (root.querySelector('tbody.ant-table-tbody') as HTMLElement | null);
  if (!tbody) return;

  const { initializeSortable } = useSortable(tbody, {
    animation: 200,
    handle: '.category-children-drag-handle',
    draggable: 'tr.ant-table-row',
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
      emit('reorder', oldIndex, newIndex);
    },
  });
  sortableInst.value = await initializeSortable();
}

watch(
  () => [
    props.parentId,
    props.dataSource.map((r) => `${r.id}:${r.sort}`).join('|'),
  ],
  () => {
    void initSortable();
  },
  { flush: 'post', immediate: true },
);

onBeforeUnmount(() => {
  destroySortable();
});

function asRow(r: unknown): CategoryNode {
  return r as CategoryNode;
}
</script>

<template>
  <Card class="category-children-table-card" size="small" :title="cardTitle">
    <template #extra>
      <Button
        size="small"
        type="primary"
        :disabled="addDisabled"
        @click="emit('addChild')"
      >
        {{ addChildLabel }}
      </Button>
    </template>
    <div ref="tableRootRef">
      <Table
        :columns="columns"
        :data-source="dataSource"
        :pagination="false"
        :scroll="{ x: 1000, y: 'calc(100vh - 520px)' }"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Space wrap :size="0">
              <Button
                size="small"
                type="link"
                @click="emit('edit', asRow(record))"
              >
                编辑
              </Button>
              <Button
                danger
                size="small"
                type="link"
                @click="emit('delete', asRow(record))"
              >
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </div>
  </Card>
</template>

<style scoped>
.category-children-table-card :deep(.ant-table-thead > tr > th),
.category-children-table-card :deep(.ant-table-tbody > tr > td) {
  text-align: center !important;
}

.category-children-table-card :deep(.ant-table-cell) {
  text-align: center;
}

.category-children-table-card :deep(.ant-image) {
  margin-inline: auto;
}
</style>
