<script lang="ts" setup>
import { computed } from 'vue';

import { MallListPage } from '#/components/mall-list';

import RoleListPanel from './components/RoleListPanel.vue';
import RolePermissionPanel from './components/RolePermissionPanel.vue';
import { useSystemRbacManage } from './composables/useSystemRbacManage';

defineOptions({ name: 'SystemRbac' });

const {
  checkedCodes,
  confirmSave,
  permissionGroups,
  permissionsLoading,
  roles,
  rolesLoading,
  saving,
  selectRole,
  selectedRole,
  selectedRoleCode,
} = useSystemRbacManage();

const selectedRoleLabel = computed(() => selectedRole.value?.name ?? '');
</script>

<template>
  <MallListPage>
    <div class="grid min-h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <RoleListPanel
        :loading="rolesLoading"
        :roles="roles"
        :selected-role-code="selectedRoleCode"
        @select="selectRole"
      />
      <RolePermissionPanel
        v-model:checked-codes="checkedCodes"
        :loading="permissionsLoading"
        :permission-groups="permissionGroups"
        :role-label="selectedRoleLabel"
        :saving="saving"
        @save="confirmSave"
      />
    </div>
  </MallListPage>
</template>
