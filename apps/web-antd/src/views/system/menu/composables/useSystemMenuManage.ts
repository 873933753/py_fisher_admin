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

function isPageMenuType(menuType: AdminRbacApi.MenuItem['menu_type']) {
  return menuType === 'menu';
}

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

  const showApiPanel = computed(() => {
    if (panelMode.value === 'view') {
      return isPageMenuType(menuDetail.value?.menu_type ?? 'directory');
    }
    return isPageMenuType(formState.menu_type);
  });

  const canSaveApis = computed(() => panelMode.value !== 'add' && selectedMenuId.value !== null);

  const apiSaveDisabledReason = computed(() => {
    if (panelMode.value === 'add') {
      return '请先创建菜单';
    }
    return undefined;
  });

  function resetApiRows() {
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

  async function loadMenuApis(menuId: number) {
    apiLoading.value = true;
    try {
      const result = await getMenuApisApi(menuId);
      apiRows.value = mapMenuApiRulesToRows(result.apis ?? []);
    } finally {
      apiLoading.value = false;
    }
  }

  async function syncApiRowsForCurrentMenu() {
    resetApiRows();

    if (!showApiPanel.value) {
      return;
    }

    if (panelMode.value === 'add' || selectedMenuId.value === null) {
      return;
    }

    await loadMenuApis(selectedMenuId.value);
  }

  async function refreshCurrentDetail() {
    const menuId = selectedMenuId.value;
    if (menuId === null) {
      menuDetail.value = null;
      resetApiRows();
      return;
    }
    await loadMenuDetail(menuId);
    await syncApiRowsForCurrentMenu();
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
      resetApiRows();
      return;
    }
    selectedKeys.value = [roots[0]!.id];
    await loadMenuDetail(roots[0]!.id);
    await syncApiRowsForCurrentMenu();
  }

  function openAddTop() {
    resetApiRows();
    panelMode.value = 'add';
    originalDetail.value = null;
    resetFormState({ parent_id: undefined });
  }

  function openAddChild() {
    const parentId = selectedMenuId.value;
    if (parentId === null) {
      return;
    }
    resetApiRows();
    panelMode.value = 'add';
    originalDetail.value = null;
    resetFormState({ parent_id: parentId });
  }

  async function openEdit() {
    if (!menuDetail.value) {
      return;
    }
    panelMode.value = 'edit';
    originalDetail.value = { ...menuDetail.value };
    Object.assign(formState, menuDetailToFormState(menuDetail.value));
    await syncApiRowsForCurrentMenu();
  }

  function addApiRow() {
    apiRows.value = [...apiRows.value, createMenuApiRow()];
  }

  function removeApiRow(index: number) {
    apiRows.value = apiRows.value.filter((_, rowIndex) => rowIndex !== index);
  }

  async function saveMenuApis() {
    const menuId = selectedMenuId.value;
    if (menuId === null || !canSaveApis.value) {
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
      message.success('接口保存成功');
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
        await syncApiRowsForCurrentMenu();
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
          resetApiRows();
          return;
        }
        selectedKeys.value = [roots[0]!.id];
        await loadMenuDetail(roots[0]!.id);
        await syncApiRowsForCurrentMenu();
      },
    });
  }

  watch(selectedKeys, async (keys, oldKeys) => {
    if (keys[0] === oldKeys?.[0]) {
      return;
    }
    resetApiRows();
    enterViewMode();
    const menuId = keys[0];
    if (menuId === undefined || menuId === null || menuId === '') {
      menuDetail.value = null;
      return;
    }
    await loadMenuDetail(Number(menuId));
    await syncApiRowsForCurrentMenu();
  });

  watch(
    () => formState.menu_type,
    (menuType) => {
      if (panelMode.value === 'view') {
        return;
      }
      if (!isPageMenuType(menuType)) {
        resetApiRows();
      }
    },
  );

  return {
    addApiRow,
    apiLoading,
    apiRows,
    apiSaveDisabledReason,
    apiSaving,
    bootstrapInitialSelection,
    canSaveApis,
    cancelForm,
    canAddChild,
    canEditOrDelete,
    confirmDelete,
    detailLoading,
    formState,
    loadMenuTree,
    menuDetail,
    openAddChild,
    openAddTop,
    openEdit,
    panelMode,
    removeApiRow,
    saveMenuApis,
    selectedKeys,
    showApiPanel,
    submitForm,
    submitting,
    treeDataNodes,
    treeExpandedKeys,
    treeKeyword,
    treeLoading,
  };
}
