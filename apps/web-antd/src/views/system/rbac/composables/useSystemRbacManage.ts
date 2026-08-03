import type { Key } from 'ant-design-vue/es/_util/type';
import type { DataNode } from 'ant-design-vue/es/tree';

import type { AdminRbacApi } from '#/api/core/admin-rbac';

import { computed, onMounted, reactive, ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import {
  createRoleApi,
  deleteRoleApi,
  getMenuApisApi,
  getRoleAccessApi,
  listMenuTreeApi,
  listRbacRolesApi,
  updateRoleAccessApi,
  updateRoleApi,
} from '#/api/core/admin-rbac';

import { formatRoleLabel, isSuperAdminRole } from '../constants';
import {
  appendMenuApis,
  applyApiCheck,
  applyMenuCheck,
  buildAccessPayload,
  buildRoleAccessTreeContext,
  formatMenuKey,
  getDefaultExpandedMenuKeys,
  getMenusNeedingApiLoad,
  menuIdsToCheckedKeys,
  normalizeTreeCheckedKeys,
  parseMenuKey,
  type RoleAccessTreeContext,
} from '../utils/role-access-tree';

export interface SystemRoleFormState {
  code: string;
  name: string;
}

function defaultRoleFormState(): SystemRoleFormState {
  return {
    code: '',
    name: '',
  };
}

export function useSystemRbacManage() {
  const roles = ref<AdminRbacApi.RoleItem[]>([]);
  const rolesLoading = ref(false);

  const formModalOpen = ref(false);
  const formMode = ref<'add' | 'edit'>('add');
  const formSubmitting = ref(false);
  const formState = reactive<SystemRoleFormState>(defaultRoleFormState());
  const editingRoleCode = ref('');

  const accessModalOpen = ref(false);
  const activeRole = ref<AdminRbacApi.RoleItem | null>(null);

  const treeContext = ref<RoleAccessTreeContext | null>(null);
  const checkedMenuIds = ref<Set<number>>(new Set());
  const checkedApiIds = ref<Set<number>>(new Set());
  const expandedKeys = ref<Key[]>([]);
  const selectedMenuId = ref<null | number>(null);
  const accessLoading = ref(false);
  const accessSaving = ref(false);
  const selectedMenuApiLoading = ref(false);

  const activeRoleCode = computed(() => activeRole.value?.code ?? '');
  const activeRoleLabel = computed(
    () => activeRole.value?.name ?? formatRoleLabel(activeRoleCode.value),
  );
  const isActiveRoleReadOnly = computed(() =>
    isSuperAdminRole(activeRoleCode.value),
  );

  const accessTreeData = computed(() => treeContext.value?.treeData ?? []);
  const checkedMenuKeys = computed(() =>
    menuIdsToCheckedKeys(checkedMenuIds.value),
  );
  const selectedMenuKeys = computed<Key[]>(() =>
    selectedMenuId.value == null
      ? []
      : [formatMenuKey(selectedMenuId.value)],
  );
  const selectedMenuApis = computed(() => {
    if (selectedMenuId.value == null || !treeContext.value) {
      return [];
    }
    return treeContext.value.apisByMenu.get(selectedMenuId.value) ?? [];
  });

  async function fetchRoles() {
    rolesLoading.value = true;
    try {
      roles.value = await listRbacRolesApi();
    } finally {
      rolesLoading.value = false;
    }
  }

  function openAddRole() {
    formMode.value = 'add';
    editingRoleCode.value = '';
    Object.assign(formState, defaultRoleFormState());
    formModalOpen.value = true;
  }

  function openEditRole(role: AdminRbacApi.RoleItem) {
    if (isSuperAdminRole(role.code)) {
      return;
    }

    formMode.value = 'edit';
    editingRoleCode.value = role.code;
    formState.code = role.code;
    formState.name = role.name;
    formModalOpen.value = true;
  }

  async function submitRoleForm() {
    formSubmitting.value = true;
    try {
      if (formMode.value === 'add') {
        await createRoleApi({
          code: formState.code.trim().toLowerCase(),
          name: formState.name.trim(),
        });
        message.success('创建成功');
      } else {
        const name = formState.name.trim();
        await updateRoleApi(editingRoleCode.value, { name });
        message.success('更新成功');
      }

      formModalOpen.value = false;
      await fetchRoles();
    } finally {
      formSubmitting.value = false;
    }
  }

  function confirmDeleteRole(role: AdminRbacApi.RoleItem) {
    if (isSuperAdminRole(role.code)) {
      return;
    }

    Modal.confirm({
      title: '确认删除该角色？',
      content: `确定删除角色「${formatRoleLabel(role.name)}」（${role.code}）？删除后不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        await deleteRoleApi(role.code);
        message.success('删除成功');
        await fetchRoles();
      },
    });
  }

  function resetAccessModalState() {
    treeContext.value = null;
    checkedMenuIds.value = new Set();
    checkedApiIds.value = new Set();
    expandedKeys.value = [];
    selectedMenuId.value = null;
    selectedMenuApiLoading.value = false;
  }

  async function loadMenuApis(menuId: number) {
    const ctx = treeContext.value;
    if (!ctx) {
      return;
    }

    const toLoad = getMenusNeedingApiLoad(ctx, [menuId]);
    if (toLoad.length === 0) {
      return;
    }

    selectedMenuApiLoading.value = true;
    try {
      const result = await getMenuApisApi(menuId);
      appendMenuApis(ctx, result.menu_id, result.apis ?? []);
    } finally {
      selectedMenuApiLoading.value = false;
    }
  }

  async function ensureMenuApisLoaded(menuIds: number[]) {
    const ctx = treeContext.value;
    if (!ctx || menuIds.length === 0) {
      return;
    }

    const toLoad = getMenusNeedingApiLoad(ctx, menuIds);
    if (toLoad.length === 0) {
      return;
    }

    const results = await Promise.all(
      toLoad.map((menuId) => getMenuApisApi(menuId)),
    );

    for (const result of results) {
      appendMenuApis(ctx, result.menu_id, result.apis ?? []);
    }
  }

  async function openAccessConfig(role: AdminRbacApi.RoleItem) {
    activeRole.value = role;
    accessModalOpen.value = true;
    accessLoading.value = true;
    resetAccessModalState();

    try {
      const [menuTree, roleAccess] = await Promise.all([
        listMenuTreeApi(),
        getRoleAccessApi(role.code),
      ]);

      const ctx = buildRoleAccessTreeContext(
        menuTree,
        isSuperAdminRole(role.code),
      );
      treeContext.value = ctx;
      checkedMenuIds.value = new Set(roleAccess.menu_ids ?? []);
      checkedApiIds.value = new Set(roleAccess.menu_api_ids ?? []);
      expandedKeys.value = getDefaultExpandedMenuKeys(ctx);
    } catch {
      accessModalOpen.value = false;
      activeRole.value = null;
      throw new Error('fetch role access failed');
    } finally {
      accessLoading.value = false;
    }
  }

  function closeAccessModal() {
    accessModalOpen.value = false;
    activeRole.value = null;
    resetAccessModalState();
  }

  async function onMenuSelect(selectedKeys: Key[]) {
    const menuId = selectedKeys
      .map((key) => parseMenuKey(key))
      .find((id): id is number => id != null);

    if (menuId == null) {
      return;
    }

    selectedMenuId.value = menuId;
    await loadMenuApis(menuId);
  }

  async function onMenuCheck(
    checked: Key[] | { checked: Key[]; halfChecked: Key[] },
  ) {
    if (!treeContext.value || isActiveRoleReadOnly.value) {
      return;
    }

    const ctx = treeContext.value;
    const newCheckedKeys = normalizeTreeCheckedKeys(checked);
    const newMenuIdSet = new Set(
      newCheckedKeys
        .map((key) => parseMenuKey(key))
        .filter((id): id is number => id != null),
    );
    const oldMenuIdSet = checkedMenuIds.value;

    let triggerMenuId: null | number = null;
    let isChecking = false;

    for (const menuId of newMenuIdSet) {
      if (!oldMenuIdSet.has(menuId)) {
        triggerMenuId = menuId;
        isChecking = true;
        break;
      }
    }

    if (triggerMenuId == null) {
      for (const menuId of oldMenuIdSet) {
        if (!newMenuIdSet.has(menuId)) {
          triggerMenuId = menuId;
          isChecking = false;
          break;
        }
      }
    }

    if (triggerMenuId == null) {
      checkedMenuIds.value = newMenuIdSet;
      return;
    }

    if (!isChecking) {
      const descendants = ctx.menuDescendantsMap.get(triggerMenuId) ?? [];
      await ensureMenuApisLoaded([triggerMenuId, ...descendants]);
    }

    const nextMenuIds = new Set(oldMenuIdSet);
    const nextApiIds = new Set(checkedApiIds.value);
    applyMenuCheck(ctx, nextMenuIds, nextApiIds, triggerMenuId, isChecking);
    checkedMenuIds.value = nextMenuIds;
    checkedApiIds.value = nextApiIds;
  }

  function onApiCheck(apiId: number, checked: boolean) {
    if (!treeContext.value || isActiveRoleReadOnly.value) {
      return;
    }

    const nextMenuIds = new Set(checkedMenuIds.value);
    const nextApiIds = new Set(checkedApiIds.value);
    applyApiCheck(treeContext.value, nextMenuIds, nextApiIds, apiId, checked);
    checkedMenuIds.value = nextMenuIds;
    checkedApiIds.value = nextApiIds;
  }

  async function saveAccess() {
    if (!activeRole.value || isActiveRoleReadOnly.value) {
      return;
    }

    accessSaving.value = true;
    try {
      const payload = buildAccessPayload(
        checkedMenuIds.value,
        checkedApiIds.value,
      );
      const result = await updateRoleAccessApi(activeRole.value.code, payload);
      checkedMenuIds.value = new Set(result.menu_ids ?? []);
      checkedApiIds.value = new Set(result.menu_api_ids ?? []);
      message.success('更新成功');
      closeAccessModal();
    } finally {
      accessSaving.value = false;
    }
  }

  function confirmSaveAccess() {
    if (!activeRole.value || isActiveRoleReadOnly.value) {
      return;
    }

    Modal.confirm({
      title: '确认保存授权？',
      content: `将全量覆盖角色「${activeRoleLabel.value}」的菜单与接口授权。`,
      okText: '保存',
      cancelText: '取消',
      async onOk() {
        await saveAccess();
      },
    });
  }

  onMounted(() => {
    void fetchRoles();
  });

  return {
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
    fetchRoles,
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
  };
}
