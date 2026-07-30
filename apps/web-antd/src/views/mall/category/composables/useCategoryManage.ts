import type { TableColumnsType } from 'ant-design-vue';
import type { Key } from 'ant-design-vue/es/_util/type';
import type { Rule } from 'ant-design-vue/es/form';

import type { CategoryNode, RawNode } from '../types/category';

import type { SysDictApi } from '#/api/core/sysDict';

import { computed, h, nextTick, reactive, ref, watch } from 'vue';

import { Image, message, Modal } from 'ant-design-vue';

import {
  delSysDictByIdApi,
  findJerseyTypeTreeApi,
  saveOrUpdSysDictApi,
} from '#/api/core/sysDict';

import {
  filterJerseyTreeExcludeIds,
  findCategoryPathById,
  mapJerseyTreeToCascaderOptions,
} from '../../product/utils/categoryOptions';
import { formatCategoryLevelZh, MAX_CATEGORY_LEVEL } from '../constants';
import {
  collectSubtreeIds,
  filterByKeyword,
  filterDeleted,
  findNode,
  firstSelectableId,
  mapCategoryToTreeData,
  nodeInForest,
  normalizeImported,
  reorderActiveChildren,
} from '../utils/category-tree';

export function useCategoryManage() {
  const sourceTree = ref<CategoryNode[]>([]);
  /** 接口原始分类树，供父级三级联动 Cascader 使用 */
  const jerseyTreeRaw = ref<SysDictApi.JerseyTypeTreeNode[]>([]);
  const treeKeyword = ref('');
  const treeExpandedKeys = ref<Key[]>([]);
  const selectedKeys = ref<Key[]>([]);
  const modalOpen = ref(false);
  const modalMode = ref<'add' | 'edit'>('add');
  const editingId = ref<null | string>(null);
  /** 从「新增一级分类」打开时为 true，用于弹窗内隐藏父级选择 */
  const addModalFromTop = ref(false);
  /** 从子表/树新增子级时固定的目标层级，避免改父级后标题与入口不一致 */
  const modalAddTargetLevelFixed = ref<null | number>(null);

  const formState = reactive({
    name: '',
    parentId: undefined as string | undefined,
    sort: 0,
    icon: '' as string,
    dictDesc: '',
    dictName: '',
  });

  const panelState = reactive({
    name: '',
    sort: 0,
    icon: '' as string,
  });

  const formIconFile = ref<File | null>(null);
  const panelIconFile = ref<File | null>(null);

  function formatDictDatetime(date = new Date()) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  function resolveParentIdForApi(parentId?: string) {
    return parentId?.trim() ? parentId.trim() : '0';
  }

  function clearFormIcon() {
    formState.icon = '';
    formIconFile.value = null;
  }

  const formRules: Record<string, Rule[]> = {
    name: [
      {
        required: true,
        message: '请输入分类名称',
        trigger: 'blur',
        type: 'string',
      },
    ],
    sort: [
      {
        required: true,
        type: 'number',
        message: '请输入排序值',
        trigger: 'change',
      },
    ],
  };

  const panelFormRules: Record<string, Rule[]> = {
    name: [
      {
        required: true,
        message: '请输入分类名称',
        trigger: 'blur',
        type: 'string',
      },
    ],
    sort: [
      {
        required: true,
        type: 'number',
        message: '请输入排序值',
        trigger: 'change',
      },
    ],
  };

  const leftTreeRoots = computed(() =>
    filterByKeyword(filterDeleted(sourceTree.value), treeKeyword.value),
  );

  const treeDataNodes = computed(() =>
    mapCategoryToTreeData(leftTreeRoots.value),
  );

  const selectedNode = computed(() => {
    const id = selectedKeys.value[0];
    if (id === undefined || id === null || id === '') return null;
    return findNode(sourceTree.value, String(id));
  });

  const directChildrenList = computed((): CategoryNode[] => {
    const parent = selectedNode.value;
    if (!parent?.children?.length) return [];
    return [...parent.children.filter((c) => !c.deletedAt)]
      .toSorted((a, b) => a.sort - b.sort || Number(a.id) - Number(b.id))
      .map((row) => {
        // Table 会把带 `children` 的记录当成树形数据并显示展开列；直属子表只需平铺当前层
        const { children: _ch, ...rest } = row;
        return rest as CategoryNode;
      });
  });

  /** 最大层级为末级，不展示直属子级表格 */
  const showDirectChildrenTable = computed(() => {
    const n = selectedNode.value;
    return n !== null && n.level < MAX_CATEGORY_LEVEL;
  });

  /** 父级下拉仅允许选择的层级（新增/编辑子级时 = 目标层级 - 1） */
  const allowedParentLevel = computed((): null | number => {
    if (modalMode.value === 'add' && !addModalFromTop.value) {
      const target = modalAddTargetLevel.value;
      return target !== null && target >= 2 ? target - 1 : null;
    }
    if (modalMode.value === 'edit' && editingId.value) {
      const n = findNode(sourceTree.value, editingId.value);
      if (!n || n.deletedAt || n.level <= 1) return null;
      return n.level - 1;
    }
    return null;
  });

  const categoryCascaderOptions = computed(() => {
    let nodes = jerseyTreeRaw.value;
    if (modalMode.value === 'edit' && editingId.value) {
      const root = findNode(sourceTree.value, editingId.value);
      const exclude = collectSubtreeIds(root);
      if (exclude.size > 0) {
        nodes = filterJerseyTreeExcludeIds(nodes, exclude);
      }
    }
    return mapJerseyTreeToCascaderOptions(nodes);
  });

  const showParentFieldInModal = computed(() => {
    if (modalMode.value === 'add' && addModalFromTop.value) return false;
    if (modalMode.value === 'edit' && editingId.value) {
      const n = findNode(sourceTree.value, editingId.value);
      if (n && !n.deletedAt && n.level <= 1) return false;
    }
    return true;
  });

  function resolveParentCategoryPath(parentId: string) {
    return findCategoryPathById(jerseyTreeRaw.value, parentId);
  }

  function openAdd() {
    modalMode.value = 'add';
    editingId.value = null;
    modalAddTargetLevelFixed.value = null;
    formState.name = '';
    formState.parentId = undefined;
    formState.sort = 0;
    formState.dictDesc = '';
    clearFormIcon();
    modalOpen.value = true;
  }

  function openAddTop() {
    addModalFromTop.value = true;
    openAdd();
  }

  function openAddChild() {
    const pid = selectedKeys.value[0];
    if (!pid) {
      message.warning('请先在左侧选择父级分类');
      return;
    }
    const parent = findNode(sourceTree.value, String(pid));
    if (!parent || parent.deletedAt) return;
    if (parent.level >= MAX_CATEGORY_LEVEL) {
      message.error('不能在第 3 级分类下继续新增');
      return;
    }
    modalMode.value = 'add';
    editingId.value = null;
    formState.name = '';
    formState.parentId = String(pid);
    formState.sort = 0;
    formState.dictDesc = '';
    clearFormIcon();
    addModalFromTop.value = false;
    modalAddTargetLevelFixed.value = parent.level + 1;
    modalOpen.value = true;
  }

  function openEdit(record: CategoryNode) {
    const node = findNode(sourceTree.value, record.id);
    if (!node) return;
    modalMode.value = 'edit';
    editingId.value = node.id;
    formState.name = node.name;
    formState.parentId = node.immediateParentId ?? undefined;
    formState.sort = node.sort;
    formState.icon = node.icon || '';
    formState.dictDesc = node.dictDesc ?? '';
    formState.dictName = node.dictDesc ?? '';
    formIconFile.value = null;
    addModalFromTop.value = false;
    modalAddTargetLevelFixed.value = null;
    modalOpen.value = true;
  }

  function assertParentLevel(
    parentId: string | undefined,
    requiredLevel: number,
  ): void {
    if (!parentId?.trim()) {
      message.error('请选择父级分类');
      throw new Error('submit');
    }
    const parent = findNode(sourceTree.value, parentId.trim());
    if (!parent || parent.deletedAt) {
      message.error('父级分类不存在');
      throw new Error('submit');
    }
    if (parent.level !== requiredLevel) {
      message.error(`父级须为${formatCategoryLevelZh(requiredLevel)}级分类`);
      throw new Error('submit');
    }
  }

  const parentLocked = computed(() => {
    if (modalMode.value !== 'edit' || !editingId.value) return false;
    const n = findNode(sourceTree.value, editingId.value);
    const activeChildren = n?.children?.filter((c) => !c.deletedAt) ?? [];
    return activeChildren.length > 0;
  });

  const modalAddTargetLevel = computed((): null | number => {
    if (!modalOpen.value || modalMode.value !== 'add') return null;
    if (addModalFromTop.value) return 1;
    if (modalAddTargetLevelFixed.value !== null) {
      return modalAddTargetLevelFixed.value;
    }
    const pid = formState.parentId;
    if (!pid) return 1;
    const p = findNode(sourceTree.value, pid);
    if (!p || p.deletedAt) return 1;
    return Math.min(p.level + 1, MAX_CATEGORY_LEVEL);
  });

  async function submitCategoryModal(): Promise<void> {
    const name = formState.name.trim();
    if (!name) {
      message.error('请输入分类名称');
      throw new Error('submit');
    }

    const sort = Number.isFinite(formState.sort)
      ? Math.trunc(formState.sort)
      : 0;
    const dictDesc = formState.dictDesc.trim();
    const now = formatDictDatetime();

    if (modalMode.value === 'add') {
      if (!addModalFromTop.value) {
        const target = modalAddTargetLevel.value;
        if (target !== null && target >= 2) {
          assertParentLevel(formState.parentId, target - 1);
        }
      }

      await saveOrUpdSysDictApi({
        ...(formIconFile.value ? { file: formIconFile.value } : {}),
        dictCode: name,
        dictName: name,
        sort: String(sort),
        parentId: resolveParentIdForApi(formState.parentId),
        dictDesc,
        createdAt: now,
        updatedAt: now,
      });

      message.success('新增成功');
      modalOpen.value = false;
      clearFormIcon();
      await loadCategoryTree();
      return;
    }

    const id = editingId.value;
    if (!id) throw new Error('submit');

    const editingNode = findNode(sourceTree.value, id);
    if (editingNode && editingNode.level > 1) {
      assertParentLevel(formState.parentId, editingNode.level - 1);
    }

    await saveOrUpdSysDictApi({
      ...(formIconFile.value ? { file: formIconFile.value } : {}),
      id,
      dictCode: name,
      dictName: name,
      sort: String(sort),
      parentId: resolveParentIdForApi(formState.parentId),
      dictDesc,
      createdAt: now,
      updatedAt: now,
    });

    message.success('保存成功');
    modalOpen.value = false;
    formIconFile.value = null;
    await loadCategoryTree();
  }

  function handleDelete(record: CategoryNode) {
    const node = findNode(sourceTree.value, record.id);
    if (!node || node.deletedAt) return;

    const activeChildren = node.children?.filter((c) => !c.deletedAt) ?? [];
    if (activeChildren.length > 0) {
      message.warning('该分类下存在子分类，无法删除');
      return;
    }

    const displayName = node.name || record.name;
    Modal.confirm({
      title: '确认删除该分类？',
      content: `确定要删除分类【${displayName}】吗？删除后无法恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        const deletedId = record.id;
        await delSysDictByIdApi(deletedId);
        message.success('删除成功');
        await loadCategoryTree();
        if (String(selectedKeys.value[0]) === deletedId) {
          const roots = filterByKeyword(
            filterDeleted(sourceTree.value),
            treeKeyword.value,
          );
          const next = firstSelectableId(roots);
          selectedKeys.value = next ? [next] : [];
        }
      },
    });
  }

  const columns = computed<TableColumnsType<CategoryNode>>(() => [
    // {
    //   key: 'drag',
    //   width: 48,
    //   align: 'center',
    //   customRender: () =>
    //     h(
    //       'span',
    //       {
    //         class:
    //           'category-children-drag-handle inline-flex cursor-grab text-slate-400 select-none active:cursor-grabbing',
    //       },
    //       h(IconifyIcon, { class: 'size-5', icon: 'mdi:drag-vertical' }),
    //     ),
    // },
    {
      title: '分类ID',
      dataIndex: 'id',
      width: 96,
      ellipsis: true,
      align: 'center',
    },
    {
      title: '图标',
      key: 'icon',
      width: 72,
      align: 'center',
      customRender: ({ record }) =>
        record.icon
          ? h(Image, {
              src: record.icon,
              width: 36,
              height: 36,
              style: { objectFit: 'cover' },
            })
          : h('span', { class: 'text-slate-400' }, '—'),
    },
    {
      title: '名称',
      dataIndex: 'name',
      ellipsis: true,
      minWidth: 140,
      align: 'center',
    },
    { title: '级别', dataIndex: 'level', width: 72, align: 'center' },
    { title: '排序值', dataIndex: 'sort', width: 88, align: 'center' },
    {
      title: '关联商品数',
      dataIndex: 'productCount',
      width: 112,
      align: 'center',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 168,
      ellipsis: true,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 132,
      align: 'center',
      fixed: 'right',
    },
  ]);

  function reorderDirectChildren(
    tree: CategoryNode[],
    parentId: string,
    oldIndex: number,
    newIndex: number,
  ) {
    reorderActiveChildren(tree, parentId, oldIndex, newIndex);
  }

  function syncPanelFromSelection() {
    const id = selectedKeys.value[0];
    if (id === undefined || id === null || id === '') return;
    const node = findNode(sourceTree.value, String(id));
    if (!node || node.deletedAt) return;
    panelState.name = node.name;
    panelState.sort = node.sort;
    panelState.icon = node.icon || '';
    panelIconFile.value = null;
  }

  watch(
    () => selectedKeys.value[0],
    () => {
      syncPanelFromSelection();
    },
  );

  async function applyPanelToNode() {
    const id = selectedKeys.value[0];
    if (id === undefined || id === null || id === '') return;
    const node = findNode(sourceTree.value, String(id));
    if (!node || node.deletedAt) return;
    const name = panelState.name.trim();
    if (!name) {
      message.error('请输入分类名称');
      return;
    }

    const sort = Number.isFinite(panelState.sort)
      ? Math.trunc(panelState.sort)
      : 0;
    const now = formatDictDatetime();

    await saveOrUpdSysDictApi({
      ...(panelIconFile.value ? { file: panelIconFile.value } : {}),
      id: String(id),
      dictCode: name,
      dictName: name,
      sort: String(sort),
      parentId: resolveParentIdForApi(node.immediateParentId ?? undefined),
      dictDesc: '',
      createdAt: now,
      updatedAt: now,
    });

    panelIconFile.value = null;
    message.success('保存成功');
    await loadCategoryTree();
  }

  watch(
    leftTreeRoots,
    (roots) => {
      if (roots.length === 0) {
        selectedKeys.value = [];
        return;
      }
      const sid = selectedKeys.value[0];
      if (
        sid === undefined ||
        sid === null ||
        sid === '' ||
        !nodeInForest(roots, String(sid))
      ) {
        const next = firstSelectableId(roots);
        selectedKeys.value = next ? [next] : [];
      }
    },
    { deep: true },
  );

  function initFromRaw(raw: RawNode[]) {
    sourceTree.value = normalizeImported(raw);
  }

  async function loadCategoryTree() {
    try {
      const list = await findJerseyTypeTreeApi();
      jerseyTreeRaw.value = list ?? [];
      initFromRaw((list ?? []) as RawNode[]);
    } catch {
      jerseyTreeRaw.value = [];
      sourceTree.value = [];
    }
  }

  async function bootstrapInitialSelection() {
    await nextTick();
    const roots = filterByKeyword(
      filterDeleted(sourceTree.value),
      treeKeyword.value,
    );
    const first = firstSelectableId(roots);
    if (first) {
      selectedKeys.value = [first];
      treeExpandedKeys.value = [];
    }
  }

  return {
    sourceTree,
    treeKeyword,
    treeExpandedKeys,
    selectedKeys,
    modalOpen,
    modalMode,
    modalAddTargetLevel,
    editingId,
    formState,
    panelState,
    formRules,
    panelFormRules,
    leftTreeRoots,
    treeDataNodes,
    selectedNode,
    directChildrenList,
    showDirectChildrenTable,
    categoryCascaderOptions,
    allowedParentLevel,
    showParentFieldInModal,
    resolveParentCategoryPath,
    parentLocked,
    addModalFromTop,
    openAdd,
    openAddTop,
    openAddChild,
    openEdit,
    submitCategoryModal,
    handleDelete,
    formIconFile,
    panelIconFile,
    columns,
    reorderDirectChildren,
    applyPanelToNode,
    initFromRaw,
    loadCategoryTree,
    bootstrapInitialSelection,
  };
}
