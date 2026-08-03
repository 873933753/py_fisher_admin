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
  accessToCheckedKeys,
  appendMenuApis,
  applyAccessTreeCheck,
  buildRoleAccessTreeContext,
  checkedKeysToAccessPayload,
  collectMenuIdsForCheckCascade,
  getMenusNeedingApiLoad,
  normalizeTreeCheckedKeys,
  parseAccessKey,
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

  const accessDrawerOpen = ref(false);
  const activeRole = ref<AdminRbacApi.RoleItem | null>(null);

  const treeContext = ref<RoleAccessTreeContext | null>(null);
  const checkedKeys = ref<Key[]>([]);
  const expandedKeys = ref<Key[]>([]);
  const accessLoading = ref(false);
  const accessSaving = ref(false);
  const menuApiLoadingIds = ref<Set<number>>(new Set());

  const activeRoleCode = computed(() => activeRole.value?.code ?? '');
  const activeRoleLabel = computed(
    () => activeRole.value?.name ?? formatRoleLabel(activeRoleCode.value),
  );
  const isActiveRoleReadOnly = computed(() =>
    isSuperAdminRole(activeRoleCode.value),
  );

  const accessTreeData = computed(() => treeContext.value?.treeData ?? []);

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

  function resetAccessDrawerState() {
    treeContext.value = null;
    checkedKeys.value = [];
    expandedKeys.value = [];
    menuApiLoadingIds.value = new Set();
  }

  async function loadMenuApisForIds(menuIds: number[]) {
    const ctx = treeContext.value;
    if (!ctx || menuIds.length === 0) {
      return;
    }

    const toLoad = getMenusNeedingApiLoad(ctx, menuIds);
    if (toLoad.length === 0) {
      return;
    }

    const loadingSet = new Set(menuApiLoadingIds.value);
    for (const menuId of toLoad) {
      loadingSet.add(menuId);
    }
    menuApiLoadingIds.value = loadingSet;

    try {
      const results = await Promise.all(
        toLoad.map((menuId) => getMenuApisApi(menuId)),
      );

      for (const result of results) {
        appendMenuApis(ctx, result.menu_id, result.apis ?? []);
      }
    } finally {
      const nextLoading = new Set(menuApiLoadingIds.value);
      for (const menuId of toLoad) {
        nextLoading.delete(menuId);
      }
      menuApiLoadingIds.value = nextLoading;
    }
  }

  async function openAccessConfig(role: AdminRbacApi.RoleItem) {
    activeRole.value = role;
    accessDrawerOpen.value = true;
    accessLoading.value = true;
    resetAccessDrawerState();

    try {
      const [menuTree, roleAccess] = await Promise.all([
        listMenuTreeApi(),
        getRoleAccessApi(role.code),
      ]);

      treeContext.value = buildRoleAccessTreeContext(
        menuTree,
        isSuperAdminRole(role.code),
      );
      checkedKeys.value = accessToCheckedKeys(
        roleAccess.menu_ids ?? [],
        roleAccess.menu_api_ids ?? [],
      );
    } catch {
      accessDrawerOpen.value = false;
      activeRole.value = null;
      throw new Error('fetch role access failed');
    } finally {
      accessLoading.value = false;
    }
  }

  function closeAccessDrawer() {
    accessDrawerOpen.value = false;
    activeRole.value = null;
    resetAccessDrawerState();
  }

  async function onAccessTreeExpand(
    _expandedKeys: Key[],
    info: { expanded: boolean; node: DataNode },
  ) {
    if (!info.expanded || !treeContext.value) {
      return;
    }

    const parsed = parseAccessKey(info.node.key);
    if (!parsed || parsed.type !== 'menu') {
      return;
    }

    await loadMenuApisForIds([parsed.id]);
  }

  async function onAccessTreeCheck(
    checked: Key[] | { checked: Key[]; halfChecked: Key[] },
  ) {
    if (!treeContext.value || isActiveRoleReadOnly.value) {
      return;
    }

    const newChecked = normalizeTreeCheckedKeys(checked);
    const oldSet = new Set(checkedKeys.value.map(String));
    const newSet = new Set(newChecked.map(String));

    let triggerKey: Key | null = null;
    let isChecking = false;

    for (const key of newSet) {
      if (!oldSet.has(String(key))) {
        triggerKey = key;
        isChecking = true;
        break;
      }
    }

    if (!triggerKey) {
      for (const key of checkedKeys.value) {
        if (!newSet.has(String(key))) {
          triggerKey = key;
          isChecking = false;
          break;
        }
      }
    }

    if (!triggerKey) {
      checkedKeys.value = newChecked;
      return;
    }

    const parsed = parseAccessKey(triggerKey);
    if (parsed?.type === 'menu') {
      const menuIds = collectMenuIdsForCheckCascade(
        treeContext.value,
        parsed.id,
      );
      await loadMenuApisForIds(menuIds);
    }

    checkedKeys.value = applyAccessTreeCheck(
      treeContext.value,
      checkedKeys.value,
      triggerKey,
      isChecking,
    );
  }

  async function saveAccess() {
    if (!activeRole.value || isActiveRoleReadOnly.value) {
      return;
    }

    accessSaving.value = true;
    try {
      const payload = checkedKeysToAccessPayload(checkedKeys.value);
      const result = await updateRoleAccessApi(activeRole.value.code, payload);
      checkedKeys.value = accessToCheckedKeys(
        result.menu_ids ?? [],
        result.menu_api_ids ?? [],
      );
      message.success('更新成功');
      closeAccessDrawer();
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
    fetchRoles,
    formModalOpen,
    formMode,
    formState,
    formSubmitting,
    isActiveRoleReadOnly,
    menuApiLoadingIds,
    onAccessTreeCheck,
    onAccessTreeExpand,
    openAddRole,
    openAccessConfig,
    openEditRole,
    roles,
    rolesLoading,
    submitRoleForm,
  };
}
