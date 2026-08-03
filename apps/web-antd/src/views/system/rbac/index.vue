<script lang="ts" setup>
import RoleAccessConfigDrawer from './components/RoleAccessConfigDrawer.vue';
import RoleFormModal from './components/RoleFormModal.vue';
import RoleTablePanel from './components/RoleTablePanel.vue';
import { useSystemRbacManage } from './composables/useSystemRbacManage';

defineOptions({ name: 'SystemRbac' });

const {
  accessLoading,
  accessModalOpen,
  accessSaving,
  accessTreeData,
  activeRoleLabel,
  checkedApiIds,
  checkedMenuKeys,
  closeAccessModal,
  confirmDeleteRole,
  confirmSaveAccess,
  expandedKeys,
  formModalOpen,
  formMode,
  formState,
  formSubmitting,
  isActiveRoleReadOnly,
  onApiCheck,
  onMenuCheck,
  onMenuSelect,
  openAddRole,
  openAccessConfig,
  openEditRole,
  roles,
  rolesLoading,
  selectedMenuApiLoading,
  selectedMenuApis,
  selectedMenuKeys,
  submitRoleForm,
} = useSystemRbacManage();
</script>

<template>
  <div>
    <RoleTablePanel
      :loading="rolesLoading"
      :roles="roles"
      @add="openAddRole"
      @config-access="openAccessConfig"
      @delete="confirmDeleteRole"
      @edit="openEditRole"
    />

    <RoleFormModal
      v-model:form-state="formState"
      v-model:open="formModalOpen"
      :mode="formMode"
      :submit-form="submitRoleForm"
      :submitting="formSubmitting"
    />

    <RoleAccessConfigDrawer
      v-model:open="accessModalOpen"
      v-model:expanded-keys="expandedKeys"
      :checked-api-ids="checkedApiIds"
      :checked-menu-keys="checkedMenuKeys"
      :loading="accessLoading"
      :read-only="isActiveRoleReadOnly"
      :role-label="activeRoleLabel"
      :saving="accessSaving"
      :selected-menu-api-loading="selectedMenuApiLoading"
      :selected-menu-apis="selectedMenuApis"
      :selected-menu-keys="selectedMenuKeys"
      :tree-data="accessTreeData"
      @api-check="onApiCheck"
      @menu-check="onMenuCheck"
      @menu-select="onMenuSelect"
      @close="closeAccessModal"
      @save="confirmSaveAccess"
    />
  </div>
</template>
