<script lang="ts" setup>
import RoleMenuConfigDrawer from './components/RoleMenuConfigDrawer.vue';
import RolePermissionConfigDrawer from './components/RolePermissionConfigDrawer.vue';
import RoleTablePanel from './components/RoleTablePanel.vue';
import { useSystemRbacManage } from './composables/useSystemRbacManage';

defineOptions({ name: 'SystemRbac' });

const {
  activeRoleLabel,
  checkedCodes,
  closeMenuDrawer,
  closePermissionDrawer,
  confirmSaveMenus,
  confirmSavePermissions,
  isActiveRoleReadOnly,
  menuCheckedKeys,
  menuDrawerOpen,
  menuExpandedKeys,
  menuLoading,
  menuSaving,
  menuTreeData,
  onMenuTreeCheck,
  openMenuConfig,
  openPermissionConfig,
  permissionDrawerOpen,
  permissionGroups,
  permissionSaving,
  permissionsLoading,
  roles,
  rolesLoading,
} = useSystemRbacManage();
</script>

<template>
  <div>
    <RoleTablePanel
      :loading="rolesLoading"
      :roles="roles"
      @config-menus="openMenuConfig"
      @config-permissions="openPermissionConfig"
    />

    <RoleMenuConfigDrawer
      v-model:open="menuDrawerOpen"
      v-model:checked-keys="menuCheckedKeys"
      v-model:expanded-keys="menuExpandedKeys"
      :loading="menuLoading"
      :read-only="isActiveRoleReadOnly"
      :role-label="activeRoleLabel"
      :saving="menuSaving"
      :tree-data="menuTreeData"
      @check="onMenuTreeCheck"
      @close="closeMenuDrawer"
      @save="confirmSaveMenus"
    />

    <RolePermissionConfigDrawer
      v-model:open="permissionDrawerOpen"
      v-model:checked-codes="checkedCodes"
      :loading="permissionsLoading"
      :permission-groups="permissionGroups"
      :read-only="isActiveRoleReadOnly"
      :role-label="activeRoleLabel"
      :saving="permissionSaving"
      @close="closePermissionDrawer"
      @save="confirmSavePermissions"
    />
  </div>
</template>
