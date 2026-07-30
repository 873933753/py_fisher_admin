<script lang="ts" setup>
import { computed, onMounted } from 'vue';

import { Card } from 'ant-design-vue';

import CategoryChildrenTable from './components/CategoryChildrenTable.vue';
import CategoryDetailPanel from './components/CategoryDetailPanel.vue';
import CategoryFormModal from './components/CategoryFormModal.vue';
import CategoryTreePanel from './components/CategoryTreePanel.vue';
import { useCategoryManage } from './composables/useCategoryManage';
import { formatCategoryLevelZh } from './constants';

defineOptions({ name: 'MallCategory' });

const {
  sourceTree,
  treeKeyword,
  treeExpandedKeys,
  selectedKeys,
  modalOpen,
  modalMode,
  modalAddTargetLevel,
  treeDataNodes,
  selectedNode,
  directChildrenList,
  showDirectChildrenTable,
  categoryCascaderOptions,
  allowedParentLevel,
  showParentFieldInModal,
  resolveParentCategoryPath,
  parentLocked,
  addModalFromTop,
  openAddTop,
  openAddChild,
  openEdit,
  submitCategoryModal,
  handleDelete,
  formIconFile,
  panelIconFile,
  columns,
  reorderDirectChildren,
  applyPanelToNode,
  loadCategoryTree,
  bootstrapInitialSelection,
  formState,
  panelState,
  formRules,
  panelFormRules,
} = useCategoryManage();

const addChildButtonLabel = computed(() => {
  const n = selectedNode.value;
  if (!n) return `新增${formatCategoryLevelZh(2)}级分类`;
  return `新增${formatCategoryLevelZh(n.level + 1)}级分类`;
});

/** 表格列出的是当前选中节点的直属子级，标题随子级层级变化（直属二级 / 直属三级） */
const directChildrenCardTitle = computed(() => {
  const n = selectedNode.value;
  if (!n) return '直属子分类';
  return `直属${formatCategoryLevelZh(n.level + 1)}级分类`;
});

onMounted(async () => {
  await loadCategoryTree();
  await bootstrapInitialSelection();
});
</script>

<template>
  <div class="category-manage min-h-full p-4">
    <Card class="border border-border" title="分类管理" :bordered="false">
      <div class="flex min-h-[calc(100vh-220px)] flex-col gap-4 lg:flex-row">
        <CategoryTreePanel
          v-model:tree-keyword="treeKeyword"
          v-model:tree-expanded-keys="treeExpandedKeys"
          v-model:selected-keys="selectedKeys"
          :tree-data-nodes="treeDataNodes"
          @add-top="openAddTop"
        />

        <div class="flex min-w-0 flex-1 flex-col gap-4">
          <CategoryDetailPanel
            v-model:panel-icon-file="panelIconFile"
            v-model:panel-state="panelState"
            :selected-node="selectedNode"
            :selected-key="selectedKeys[0]"
            :panel-form-rules="panelFormRules"
            @save="applyPanelToNode"
            @delete="handleDelete"
          />
          <CategoryChildrenTable
            v-if="showDirectChildrenTable"
            :add-child-label="addChildButtonLabel"
            :add-disabled="!selectedNode"
            :card-title="directChildrenCardTitle"
            :columns="columns"
            :data-source="directChildrenList"
            :parent-id="
              selectedKeys[0] !== undefined &&
              selectedKeys[0] !== null &&
              selectedKeys[0] !== ''
                ? String(selectedKeys[0])
                : undefined
            "
            @add-child="openAddChild"
            @delete="handleDelete"
            @edit="openEdit"
            @reorder="
              (oldIndex, newIndex) => {
                const pid = selectedKeys[0];
                if (pid === undefined || pid === null || pid === '') return;
                reorderDirectChildren(
                  sourceTree,
                  String(pid),
                  oldIndex,
                  newIndex,
                );
              }
            "
          />
        </div>
      </div>
    </Card>

    <CategoryFormModal
      v-model:form-state="formState"
      v-model:form-icon-file="formIconFile"
      v-model:open="modalOpen"
      :add-from-top="addModalFromTop"
      :add-target-level="modalAddTargetLevel"
      :allowed-parent-level="allowedParentLevel"
      :category-cascader-options="categoryCascaderOptions"
      :form-rules="formRules"
      :mode="modalMode"
      :parent-locked="parentLocked"
      :resolve-parent-category-path="resolveParentCategoryPath"
      :show-parent-field="showParentFieldInModal"
      :submit-category="submitCategoryModal"
    />
  </div>
</template>

<style scoped>
/* 仅描边外层容器：带 allow-clear 的 Input 内层 .ant-input 若同时写 focus 会出现双层线框 */
.category-manage :deep(.ant-input-affix-wrapper-focused),
.category-manage :deep(.ant-input-number-focused),
.category-manage :deep(.ant-input-number:focus-within),
.category-manage :deep(.ant-select-focused .ant-select-selector),
.category-manage :deep(.ant-cascader-focused .ant-select-selector) {
  border-color: hsl(245deg 82% 67%) !important;
  box-shadow: 0 0 0 2px hsl(245deg 82% 67% / 22%) !important;
}
</style>
