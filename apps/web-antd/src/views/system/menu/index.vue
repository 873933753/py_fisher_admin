<script lang="ts" setup>
import { onMounted } from 'vue';

import { Card } from 'ant-design-vue';

import MenuApiConfigDrawer from './components/MenuApiConfigDrawer.vue';
import MenuDetailPanel from './components/MenuDetailPanel.vue';
import MenuToolbar from './components/MenuToolbar.vue';
import MenuTreePanel from './components/MenuTreePanel.vue';
import { useSystemMenuManage } from './composables/useSystemMenuManage';

defineOptions({ name: 'SystemMenu' });

const {
  addApiRow,
  apiDrawerOpen,
  apiLoading,
  apiMenuLabel,
  apiRows,
  apiSaving,
  bootstrapInitialSelection,
  cancelForm,
  canAddChild,
  canConfigApi,
  canEditOrDelete,
  closeApiDrawer,
  configApiDisabledReason,
  confirmDelete,
  detailLoading,
  formState,
  loadMenuTree,
  menuDetail,
  openAddChild,
  openAddTop,
  openApiConfig,
  openEdit,
  panelMode,
  removeApiRow,
  saveMenuApis,
  selectedKeys,
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
    <Card class="border border-border" title="菜单管理" :bordered="false">
      <div class="mb-4">
        <MenuToolbar
          :can-add-child="canAddChild"
          :can-config-api="canConfigApi"
          :can-edit-or-delete="canEditOrDelete"
          :config-api-disabled-reason="configApiDisabledReason"
          :submitting="submitting"
          @add-child="openAddChild"
          @add-top="openAddTop"
          @config-api="openApiConfig"
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
        <div class="min-w-0 flex-1">
          <MenuDetailPanel
            v-model:form-state="formState"
            :detail="menuDetail"
            :detail-loading="detailLoading"
            :mode="panelMode"
            :submitting="submitting"
            @cancel="cancelForm"
            @submit="submitForm"
          />
        </div>
      </div>
    </Card>

    <MenuApiConfigDrawer
      v-model:open="apiDrawerOpen"
      v-model:rows="apiRows"
      :loading="apiLoading"
      :menu-label="apiMenuLabel"
      :saving="apiSaving"
      @add-row="addApiRow"
      @close="closeApiDrawer"
      @remove-row="removeApiRow"
      @save="saveMenuApis"
    />
  </div>
</template>
