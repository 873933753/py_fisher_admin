<script lang="ts" setup>
import type { Key } from 'ant-design-vue/es/_util/type'
import type { DataNode } from 'ant-design-vue/es/tree'

import { Button, Input, Tree } from 'ant-design-vue'

defineProps<{
  treeDataNodes: DataNode[]
}>()
const emit = defineEmits<{
  addTop: []
}>()
const treeKeyword = defineModel<string>('treeKeyword', { required: true })
const treeExpandedKeys = defineModel<Key[]>('treeExpandedKeys', { required: true })
const selectedKeys = defineModel<Key[]>('selectedKeys', { required: true })
</script>

<template>
  <aside
    class="category-tree-panel flex w-full shrink-0 flex-col gap-2 rounded-lg border border-border p-3 lg:w-72"
  >
    <Button block type="primary" @click="emit('addTop')">新增一级分类</Button>
    <Input
      v-model:value="treeKeyword"
      allow-clear
      placeholder="按名称或分类 ID 筛选树"
      @press-enter="() => {}"
    />
    <Tree
      class="min-h-48 flex-1 overflow-auto text-sm"
      v-model:expanded-keys="treeExpandedKeys"
      v-model:selected-keys="selectedKeys"
      :tree-data="treeDataNodes"
      block-node
      show-line
    />
  </aside>
</template>
<style scoped>
/* 最后一级分类：隐藏节点前的 switcher（展开/叶节点占位） */
.category-tree-panel :deep(.ant-tree-treenode.cat-tree-max-level > .ant-tree-switcher),
.category-tree-panel :deep(li.ant-tree-treenode.cat-tree-max-level > .ant-tree-switcher) {
  display: none;
}
</style>
