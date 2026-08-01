<script lang="ts" setup>
import type { Key } from 'ant-design-vue/es/_util/type';
import type { DataNode } from 'ant-design-vue/es/tree';

import type { AdminRbacApi } from '#/api/core/admin-rbac';

import { Input, Spin, Tag, Tree } from 'ant-design-vue';

import { formatMenuTypeLabel } from '../constants';

defineProps<{
  loading: boolean;
  treeDataNodes: DataNode[];
}>();

const treeKeyword = defineModel<string>('treeKeyword', { required: true });
const treeExpandedKeys = defineModel<Key[]>('treeExpandedKeys', {
  required: true,
});
const selectedKeys = defineModel<Key[]>('selectedKeys', { required: true });

function resolveMenuType(node: DataNode) {
  return (node as DataNode & { menuType?: AdminRbacApi.MenuTreeNode['menu_type'] })
    .menuType;
}
</script>

<template>
  <aside
    class="menu-tree-panel flex w-full shrink-0 flex-col gap-2 rounded-lg border border-border p-3 lg:w-72"
  >
    <Input
      v-model:value="treeKeyword"
      allow-clear
      placeholder="按名称或菜单 ID 筛选"
    />
    <Spin :spinning="loading">
      <Tree
        v-if="treeDataNodes.length > 0"
        v-model:expanded-keys="treeExpandedKeys"
        v-model:selected-keys="selectedKeys"
        class="min-h-48 flex-1 overflow-auto text-sm"
        :tree-data="treeDataNodes"
        block-node
        show-line
      >
        <template #title="node">
          <span class="inline-flex items-center gap-2">
            <span>{{ node.title }}</span>
            <Tag
              v-if="resolveMenuType(node)"
              class="!m-0"
              :color="resolveMenuType(node) === 'directory' ? 'blue' : 'green'"
            >
              {{ formatMenuTypeLabel(resolveMenuType(node)!) }}
            </Tag>
          </span>
        </template>
      </Tree>
      <div
        v-else-if="!loading"
        class="flex min-h-48 items-center justify-center text-sm text-muted-foreground"
      >
        暂无菜单数据
      </div>
    </Spin>
  </aside>
</template>
