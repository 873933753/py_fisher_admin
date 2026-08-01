import type { AdminRbacApi } from '#/api/core/admin-rbac';

import { computed, onMounted, ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import {
  getRolePermissionsApi,
  listRbacPermissionsApi,
  listRbacRolesApi,
  updateRolePermissionsApi,
} from '#/api/core/admin-rbac';

import { formatRoleLabel } from '../constants';

export interface PermissionGroup {
  items: AdminRbacApi.PermissionItem[];
  name: string;
}

export function useSystemRbacManage() {
  const roles = ref<AdminRbacApi.RoleItem[]>([]);
  const permissions = ref<AdminRbacApi.PermissionItem[]>([]);
  const selectedRoleCode = ref('');
  const checkedCodes = ref<string[]>([]);
  const rolesLoading = ref(false);
  const permissionsLoading = ref(false);
  const saving = ref(false);

  const selectedRole = computed(() =>
    roles.value.find((role) => role.code === selectedRoleCode.value),
  );

  const permissionGroups = computed<PermissionGroup[]>(() => {
    const groupMap = new Map<string, AdminRbacApi.PermissionItem[]>();

    for (const permission of permissions.value) {
      const groupName = permission.group_name?.trim() || 'other';
      const items = groupMap.get(groupName) ?? [];
      items.push(permission);
      groupMap.set(groupName, items);
    }

    return [...groupMap.entries()]
      .map(([name, items]) => ({
        name,
        items: [...items].sort((left, right) =>
          left.code.localeCompare(right.code),
        ),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  });

  async function fetchRoles() {
    rolesLoading.value = true;
    try {
      roles.value = await listRbacRolesApi();
      if (!selectedRoleCode.value && roles.value.length > 0) {
        await selectRole(roles.value[0]!.code);
      }
    } finally {
      rolesLoading.value = false;
    }
  }

  async function selectRole(roleCode: string) {
    if (!roleCode || roleCode === selectedRoleCode.value) {
      return;
    }

    selectedRoleCode.value = roleCode;
    permissionsLoading.value = true;
    try {
      const [allPermissions, rolePermissions] = await Promise.all([
        listRbacPermissionsApi(),
        getRolePermissionsApi(roleCode),
      ]);
      permissions.value = allPermissions;
      checkedCodes.value = [...(rolePermissions.codes ?? [])];
    } catch {
      permissions.value = [];
      checkedCodes.value = [];
      throw new Error('fetch role permissions failed');
    } finally {
      permissionsLoading.value = false;
    }
  }

  async function savePermissions() {
    if (!selectedRoleCode.value) {
      return;
    }

    saving.value = true;
    try {
      const result = await updateRolePermissionsApi(selectedRoleCode.value, {
        codes: [...checkedCodes.value],
      });
      checkedCodes.value = [...(result.codes ?? [])];
      message.success('更新成功');
    } finally {
      saving.value = false;
    }
  }

  function confirmSave() {
    if (!selectedRoleCode.value) {
      return;
    }

    const roleLabel =
      selectedRole.value?.name ??
      formatRoleLabel(selectedRoleCode.value);

    Modal.confirm({
      title: '确认保存权限？',
      content: `将全量覆盖角色「${roleLabel}」的已有权限。`,
      okText: '保存',
      cancelText: '取消',
      async onOk() {
        await savePermissions();
      },
    });
  }

  onMounted(() => {
    void fetchRoles();
  });

  return {
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
  };
}
