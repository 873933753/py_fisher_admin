<script lang="ts" setup>
import RoleAccessConfigDrawer from './components/RoleAccessConfigDrawer.vue';
import RoleFormModal from './components/RoleFormModal.vue';
import RoleTablePanel from './components/RoleTablePanel.vue';
import { useSystemRbacManage } from './composables/useSystemRbacManage';

defineOptions({ name: 'SystemRbac' });

const {
  accessDrawerOpen,
  accessLoading,
  accessSaving,
  accessTreeData,
  activeRoleLabel,
  checkedKeys,
  closeAccessDrawer,
  confirmDeleteRole,
  confirmSaveAccess,
  expandedKeys,
  formModalOpen,
  formMode,
  formState,
  formSubmitting,
  isActiveRoleReadOnly,
  onAccessTreeCheck,
  onAccessTreeExpand,
  openAddRole,
  openAccessConfig,
  openEditRole,
  roles,
  rolesLoading,
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
      v-model:open="accessDrawerOpen"
      v-model:expanded-keys="expandedKeys"
      :checked-keys="checkedKeys"
      :loading="accessLoading"
      :read-only="isActiveRoleReadOnly"
      :role-label="activeRoleLabel"
      :saving="accessSaving"
      :tree-data="accessTreeData"
      @check="onAccessTreeCheck"
      @expand="onAccessTreeExpand"
      @close="closeAccessDrawer"
      @save="confirmSaveAccess"
    />
  </div>
</template>
