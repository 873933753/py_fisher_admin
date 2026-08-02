import type { Key } from 'ant-design-vue/es/_util/type';

import type { AdminRbacApi } from '#/api/core/admin-rbac';

import { computed, onMounted, reactive, ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import {
  getRoleMenusApi,
  getRolePermissionsApi,
  listMenuTreeApi,
  listRbacPermissionsApi,
  listRbacRolesApi,
  updateRoleMenusApi,
  updateRolePermissionsApi,
} from '#/api/core/admin-rbac';

import { formatRoleLabel, isSuperAdminRole } from '../constants';
import {
  applyMenuTreeCheck,
  collectAllMenuExpandKeys,
  mapMenuToCheckableTreeData,
  normalizeCheckedMenuKeys,
  toCheckedMenuKeyState,
} from '../utils/role-menu-tree';

export interface PermissionGroup {
  items: AdminRbacApi.PermissionItem[];
  name: string;
}

export function useSystemRbacManage() {
  const roles = ref<AdminRbacApi.RoleItem[]>([]);
  const rolesLoading = ref(false);

  const menuDrawerOpen = ref(false);
  const permissionDrawerOpen = ref(false);
  const activeRole = ref<AdminRbacApi.RoleItem | null>(null);

  const menuTree = ref<AdminRbacApi.MenuTreeNode[]>([]);
  const menuCheckedKeys = reactive(toCheckedMenuKeyState([]));
  const menuExpandedKeys = ref<Key[]>([]);
  const menuLoading = ref(false);
  const menuSaving = ref(false);

  const permissions = ref<AdminRbacApi.PermissionItem[]>([]);
  const checkedCodes = ref<string[]>([]);
  const permissionsLoading = ref(false);
  const permissionSaving = ref(false);

  const activeRoleCode = computed(() => activeRole.value?.code ?? '');
  const activeRoleLabel = computed(
    () => activeRole.value?.name ?? formatRoleLabel(activeRoleCode.value),
  );
  const isActiveRoleReadOnly = computed(() =>
    isSuperAdminRole(activeRoleCode.value),
  );

  const menuTreeData = computed(() =>
    mapMenuToCheckableTreeData(menuTree.value, isActiveRoleReadOnly.value),
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
    } finally {
      rolesLoading.value = false;
    }
  }

  function resetMenuDrawerState() {
    menuTree.value = [];
    menuCheckedKeys.checked = [];
    menuCheckedKeys.halfChecked = [];
    menuExpandedKeys.value = [];
  }

  function resetPermissionDrawerState() {
    permissions.value = [];
    checkedCodes.value = [];
  }

  async function openMenuConfig(role: AdminRbacApi.RoleItem) {
    activeRole.value = role;
    menuDrawerOpen.value = true;
    menuLoading.value = true;
    resetMenuDrawerState();

    try {
      const [tree, roleMenus] = await Promise.all([
        listMenuTreeApi(),
        getRoleMenusApi(role.code),
      ]);
      menuTree.value = tree;
      menuExpandedKeys.value = collectAllMenuExpandKeys(tree);
      menuCheckedKeys.checked = [...(roleMenus.menu_ids ?? [])];
      menuCheckedKeys.halfChecked = [];
    } catch {
      menuDrawerOpen.value = false;
      activeRole.value = null;
      throw new Error('fetch role menus failed');
    } finally {
      menuLoading.value = false;
    }
  }

  async function openPermissionConfig(role: AdminRbacApi.RoleItem) {
    activeRole.value = role;
    permissionDrawerOpen.value = true;
    permissionsLoading.value = true;
    resetPermissionDrawerState();

    try {
      const [allPermissions, rolePermissions] = await Promise.all([
        listRbacPermissionsApi(),
        getRolePermissionsApi(role.code),
      ]);
      permissions.value = allPermissions;
      checkedCodes.value = [...(rolePermissions.codes ?? [])];
    } catch {
      permissionDrawerOpen.value = false;
      activeRole.value = null;
      throw new Error('fetch role permissions failed');
    } finally {
      permissionsLoading.value = false;
    }
  }

  function closeMenuDrawer() {
    menuDrawerOpen.value = false;
    activeRole.value = null;
    resetMenuDrawerState();
  }

  function closePermissionDrawer() {
    permissionDrawerOpen.value = false;
    activeRole.value = null;
    resetPermissionDrawerState();
  }

  function onMenuTreeCheck(
    checked: Key[] | { checked: Key[]; halfChecked: Key[] },
  ) {
    applyMenuTreeCheck(menuCheckedKeys, checked);
  }

  async function saveMenus() {
    if (!activeRole.value || isActiveRoleReadOnly.value) {
      return;
    }

    menuSaving.value = true;
    try {
      const result = await updateRoleMenusApi(activeRole.value.code, {
        menu_ids: normalizeCheckedMenuKeys(menuCheckedKeys),
      });
      menuCheckedKeys.checked = [...(result.menu_ids ?? [])];
      message.success('更新成功');
      closeMenuDrawer();
    } finally {
      menuSaving.value = false;
    }
  }

  function confirmSaveMenus() {
    if (!activeRole.value || isActiveRoleReadOnly.value) {
      return;
    }

    Modal.confirm({
      title: '确认保存菜单？',
      content: `将全量覆盖角色「${activeRoleLabel.value}」的已有菜单。`,
      okText: '保存',
      cancelText: '取消',
      async onOk() {
        await saveMenus();
      },
    });
  }

  async function savePermissions() {
    if (!activeRole.value || isActiveRoleReadOnly.value) {
      return;
    }

    permissionSaving.value = true;
    try {
      const result = await updateRolePermissionsApi(activeRole.value.code, {
        codes: [...checkedCodes.value],
      });
      checkedCodes.value = [...(result.codes ?? [])];
      message.success('更新成功');
      closePermissionDrawer();
    } finally {
      permissionSaving.value = false;
    }
  }

  function confirmSavePermissions() {
    if (!activeRole.value || isActiveRoleReadOnly.value) {
      return;
    }

    Modal.confirm({
      title: '确认保存权限？',
      content: `将全量覆盖角色「${activeRoleLabel.value}」的已有权限。`,
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
    activeRoleLabel,
    checkedCodes,
    closeMenuDrawer,
    closePermissionDrawer,
    confirmSaveMenus,
    confirmSavePermissions,
    fetchRoles,
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
  };
}
