import type { Key } from 'ant-design-vue/es/_util/type';

import type { AdminRbacApi } from '#/api/core/admin-rbac';
import type { MenuFormState, PanelMode } from '../types';

import { computed, reactive, ref, watch } from 'vue';

import { message, Modal } from 'ant-design-vue';

import {
  createMenuApi,
  deleteMenuApi,
  getMenuApisApi,
  getMenuDetailApi,
  listMenuTreeApi,
  updateMenuApi,
  updateMenuApisApi,
} from '#/api/core/admin-rbac';

import {
  defaultMenuFormState,
  formStateToCreateParams,
  formStateToUpdateParams,
  menuDetailToFormState,
} from '../constants';
import type { MenuApiRow } from '../types';
import {
  createMenuApiRow,
  mapMenuApiRowsToPayload,
  mapMenuApiRulesToRows,
  validateMenuApiRows,
} from '../utils/menu-api';
import {
  collectRootExpandKeys,
  filterMenuByKeyword,
  mapMenuToTreeData,
} from '../utils/menu-tree';

export function useSystemMenuManage() {
  const sourceTree = ref<AdminRbacApi.MenuTreeNode[]>([]);
  const treeKeyword = ref('');
  const treeExpandedKeys = ref<Key[]>([]);
  const selectedKeys = ref<Key[]>([]);
  const treeLoading = ref(false);
  const detailLoading = ref(false);
  const submitting = ref(false);
  const panelMode = ref<PanelMode>('view');
  const menuDetail = ref<AdminRbacApi.MenuItem | null>(null);
  const formState = reactive<MenuFormState>(defaultMenuFormState());
  const originalDetail = ref<AdminRbacApi.MenuItem | null>(null);

  const apiDrawerOpen = ref(false);
  const apiLoading = ref(false);
  const apiSaving = ref(false);
  const apiRows = ref<MenuApiRow[]>([]);

  const filteredTreeRoots = computed(() =>
    filterMenuByKeyword(sourceTree.value, treeKeyword.value),
  );

  const treeDataNodes = computed(() =>
    mapMenuToTreeData(filteredTreeRoots.value),
  );

  const selectedMenuId = computed(() => {
    const key = selectedKeys.value[0];
    if (key === undefined || key === null || key === '') {
      return null;
    }
    return Number(key);
  });

  const canAddChild = computed(() => selectedMenuId.value !== null);
  const canEditOrDelete = computed(
    () => panelMode.value === 'view' && selectedMenuId.value !== null,
  );

  const canConfigApi = computed(
    () =>
      panelMode.value === 'view' &&
      menuDetail.value?.menu_type === 'menu' &&
      selectedMenuId.value !== null,
  );

  const configApiDisabledReason = computed(() => {
    if (panelMode.value !== 'view') {
      return '请先完成当前编辑';
    }
    if (selectedMenuId.value === null) {
      return '请先选择菜单';
    }
    if (menuDetail.value?.menu_type === 'directory') {
      return '仅页面类型菜单可配置接口';
    }
    return undefined;
  });

  const apiMenuLabel = computed(() => {
    if (!menuDetail.value) {
      return '';
    }
    return `${menuDetail.value.title}（ID: ${menuDetail.value.id}）`;
  });

  function closeApiDrawer() {
    apiDrawerOpen.value = false;
    apiRows.value = [];
  }

  async function loadMenuTree() {
    treeLoading.value = true;
    try {
      sourceTree.value = await listMenuTreeApi();
      if (treeExpandedKeys.value.length === 0) {
        treeExpandedKeys.value = collectRootExpandKeys(sourceTree.value);
      }
    } finally {
      treeLoading.value = false;
    }
  }

  async function loadMenuDetail(menuId: number) {
    detailLoading.value = true;
    try {
      menuDetail.value = await getMenuDetailApi(menuId);
    } finally {
      detailLoading.value = false;
    }
  }

  async function refreshCurrentDetail() {
    const menuId = selectedMenuId.value;
    if (menuId === null) {
      menuDetail.value = null;
      return;
    }
    await loadMenuDetail(menuId);
  }

  function resetFormState(next: Partial<MenuFormState> = {}) {
    Object.assign(formState, defaultMenuFormState(), next);
  }

  function enterViewMode() {
    panelMode.value = 'view';
    originalDetail.value = null;
    resetFormState();
  }

  async function bootstrapInitialSelection() {
    const roots = filteredTreeRoots.value;
    if (roots.length === 0) {
      selectedKeys.value = [];
      menuDetail.value = null;
      return;
    }
    selectedKeys.value = [roots[0]!.id];
    await loadMenuDetail(roots[0]!.id);
  }

  function openAddTop() {
    closeApiDrawer();
    panelMode.value = 'add';
    originalDetail.value = null;
    resetFormState({ parent_id: undefined });
  }

  function openAddChild() {
    const parentId = selectedMenuId.value;
    if (parentId === null) {
      return;
    }
    closeApiDrawer();
    panelMode.value = 'add';
    originalDetail.value = null;
    resetFormState({ parent_id: parentId });
  }

  function openEdit() {
    if (!menuDetail.value) {
      return;
    }
    closeApiDrawer();
    panelMode.value = 'edit';
    originalDetail.value = { ...menuDetail.value };
    Object.assign(formState, menuDetailToFormState(menuDetail.value));
  }

  async function openApiConfig() {
    const menuId = selectedMenuId.value;
    const detail = menuDetail.value;
    if (
      menuId === null ||
      !detail ||
      detail.menu_type !== 'menu' ||
      panelMode.value !== 'view'
    ) {
      return;
    }

    apiDrawerOpen.value = true;
    apiLoading.value = true;
    apiRows.value = [];

    try {
      const result = await getMenuApisApi(menuId);
      apiRows.value = mapMenuApiRulesToRows(result.apis ?? []);
    } catch {
      apiDrawerOpen.value = false;
      throw new Error('fetch menu apis failed');
    } finally {
      apiLoading.value = false;
    }
  }

  function addApiRow() {
    apiRows.value = [...apiRows.value, createMenuApiRow()];
  }

  function removeApiRow(index: number) {
    apiRows.value = apiRows.value.filter((_, rowIndex) => rowIndex !== index);
  }

  async function saveMenuApis() {
    const menuId = selectedMenuId.value;
    if (menuId === null) {
      return;
    }

    const validationError = validateMenuApiRows(apiRows.value);
    if (validationError) {
      message.warning(validationError);
      return;
    }

    apiSaving.value = true;
    try {
      await updateMenuApisApi(menuId, {
        apis: mapMenuApiRowsToPayload(apiRows.value),
      });
      message.success('更新成功');
      closeApiDrawer();
    } finally {
      apiSaving.value = false;
    }
  }

  async function cancelForm() {
    enterViewMode();
    await refreshCurrentDetail();
  }

  async function submitForm() {
    submitting.value = true;
    try {
      if (panelMode.value === 'add') {
        const created = await createMenuApi(formStateToCreateParams(formState));
        message.success('创建成功');
        enterViewMode();
        await loadMenuTree();
        selectedKeys.value = [created.id];
        if (created.parent_id !== null) {
          treeExpandedKeys.value = [
            ...new Set([...treeExpandedKeys.value, created.parent_id]),
          ];
        }
        await loadMenuDetail(created.id);
        return;
      }

      if (panelMode.value === 'edit' && originalDetail.value) {
        const payload = formStateToUpdateParams(formState, originalDetail.value);
        if (Object.keys(payload).length === 0) {
          message.info('没有修改');
          return;
        }
        const updated = await updateMenuApi(originalDetail.value.id, payload);
        message.success('更新成功');
        enterViewMode();
        await loadMenuTree();
        selectedKeys.value = [updated.id];
        await loadMenuDetail(updated.id);
      }
    } finally {
      submitting.value = false;
    }
  }

  function confirmDelete() {
    const menuId = selectedMenuId.value;
    const detail = menuDetail.value;
    if (menuId === null || !detail) {
      return;
    }

    Modal.confirm({
      title: '确认删除该菜单？',
      content: `确定软删除菜单「${detail.title}」？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        await deleteMenuApi(menuId);
        message.success('删除成功');
        enterViewMode();
        await loadMenuTree();
        const roots = filteredTreeRoots.value;
        if (roots.length === 0) {
          selectedKeys.value = [];
          menuDetail.value = null;
          return;
        }
        selectedKeys.value = [roots[0]!.id];
        await loadMenuDetail(roots[0]!.id);
      },
    });
  }

  watch(selectedKeys, async (keys, oldKeys) => {
    if (keys[0] === oldKeys?.[0]) {
      return;
    }
    closeApiDrawer();
    enterViewMode();
    const menuId = keys[0];
    if (menuId === undefined || menuId === null || menuId === '') {
      menuDetail.value = null;
      return;
    }
    await loadMenuDetail(Number(menuId));
  });

  return {
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
  };
}
