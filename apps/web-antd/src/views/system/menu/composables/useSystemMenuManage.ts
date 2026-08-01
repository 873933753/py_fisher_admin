import type { Key } from 'ant-design-vue/es/_util/type';

import type { AdminRbacApi } from '#/api/core/admin-rbac';
import type { MenuFormState, PanelMode } from '../types';

import { computed, reactive, ref, watch } from 'vue';

import { message, Modal } from 'ant-design-vue';

import {
  createMenuApi,
  deleteMenuApi,
  getMenuDetailApi,
  listMenuTreeApi,
  updateMenuApi,
} from '#/api/core/admin-rbac';

import {
  defaultMenuFormState,
  formStateToCreateParams,
  formStateToUpdateParams,
  menuDetailToFormState,
} from '../constants';
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
    panelMode.value = 'add';
    originalDetail.value = null;
    resetFormState({ parent_id: undefined });
  }

  function openAddChild() {
    const parentId = selectedMenuId.value;
    if (parentId === null) {
      return;
    }
    panelMode.value = 'add';
    originalDetail.value = null;
    resetFormState({ parent_id: parentId });
  }

  function openEdit() {
    if (!menuDetail.value) {
      return;
    }
    panelMode.value = 'edit';
    originalDetail.value = { ...menuDetail.value };
    Object.assign(formState, menuDetailToFormState(menuDetail.value));
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
    enterViewMode();
    const menuId = keys[0];
    if (menuId === undefined || menuId === null || menuId === '') {
      menuDetail.value = null;
      return;
    }
    await loadMenuDetail(Number(menuId));
  });

  return {
    bootstrapInitialSelection,
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
    selectedKeys,
    submitForm,
    submitting,
    treeDataNodes,
    treeExpandedKeys,
    treeKeyword,
    treeLoading,
  };
}
