<script lang="ts" setup>
import { onMounted } from 'vue';

import { Card } from 'ant-design-vue';

import MenuApiConfigPanel from './components/MenuApiConfigPanel.vue';
import MenuDetailPanel from './components/MenuDetailPanel.vue';
import MenuToolbar from './components/MenuToolbar.vue';
import MenuTreePanel from './components/MenuTreePanel.vue';
import { useSystemMenuManage } from './composables/useSystemMenuManage';

defineOptions({ name: 'SystemMenu' });

const {
  addApiRow,
  apiLoading,
  apiRows,
  apiSaveDisabledReason,
  apiSaving,
  bootstrapInitialSelection,
  cancelForm,
  canAddChild,
  canEditOrDelete,
  canSaveApis,
  confirmDelete,
  detailLoading,
  formState,
  loadMenuTree,
  menuDetail,
  openAddChild,
  openAddTop,
  openEdit,
  panelMode,
  removeApiRow,
  saveMenuApis,
  selectedKeys,
  showApiPanel,
  submitForm,
  submitting,
  treeDataNodes,
  treeExpandedKeys,
  treeKeyword,
  treeLoading,
} = useSystemMenuManage();

onMounted(async () => {
  await loadMenuTree();
  await bootstrapInitialSelection();
});
</script>

<template>
  <div class="system-menu-page min-h-full p-4">
    <Card class="border border-border" :bordered="false">
      <div class="mb-4">
        <MenuToolbar
          :can-add-child="canAddChild"
          :can-edit-or-delete="canEditOrDelete"
          :submitting="submitting"
          @add-child="openAddChild"
          @add-top="openAddTop"
          @delete="confirmDelete"
          @edit="openEdit"
        />
      </div>
      <div class="flex min-h-[calc(100vh-260px)] flex-col gap-4 lg:flex-row">
        <MenuTreePanel
          v-model:tree-keyword="treeKeyword"
          v-model:tree-expanded-keys="treeExpandedKeys"
          v-model:selected-keys="selectedKeys"
          :loading="treeLoading"
          :tree-data-nodes="treeDataNodes"
        />
        <div class="flex min-w-0 flex-1 flex-col gap-4">
          <MenuDetailPanel
            v-model:form-state="formState"
            :detail="menuDetail"
            :detail-loading="detailLoading"
            :mode="panelMode"
            :submitting="submitting"
            @cancel="cancelForm"
            @submit="submitForm"
          />
          <MenuApiConfigPanel
            v-if="showApiPanel"
            v-model:rows="apiRows"
            :loading="apiLoading"
            :save-disabled="!canSaveApis"
            :save-disabled-reason="apiSaveDisabledReason"
            :saving="apiSaving"
            @add-row="addApiRow"
            @remove-row="removeApiRow"
            @save="saveMenuApis"
          />
        </div>
      </div>
    </Card>
  </div>
</template>
