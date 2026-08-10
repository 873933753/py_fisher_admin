import type { AdminShopProductApi } from '#/api/core/admin-shop-products';

import { onActivated, reactive, ref } from 'vue';
import { useRouter, type HistoryState } from 'vue-router';

import { message, Modal } from 'ant-design-vue';

import {
  deleteShopProductApi,
  listShopProductsApi,
  updateShopProductApi,
} from '#/api/core/admin-shop-products';
import {
  consumeListRestore,
  isMenuResetListNavigation,
  markListRestore,
  SHOP_PRODUCT_LIST_ROUTE_NAME,
} from '#/composables/useMallListRestore';

import {
  SHOP_PRODUCT_STATUS_OFF,
  SHOP_PRODUCT_STATUS_ON,
} from '../constants';

export function useShopProductManage() {
  const router = useRouter();

  const keyword = ref('');
  const statusFilter = ref<'' | AdminShopProductApi.ProductStatus>('');
  const loading = ref(false);
  const dataSource = ref<AdminShopProductApi.Product[]>([]);
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const listInitialized = ref(false);

  async function fetchList() {
    loading.value = true;
    try {
      const params: AdminShopProductApi.ListParams = {
        page: pagination.current,
        size: pagination.pageSize,
      };
      const kw = keyword.value.trim();
      if (kw) params.keyword = kw;
      if (statusFilter.value !== '') {
        params.status = statusFilter.value;
      }

      const data = await listShopProductsApi(params);
      dataSource.value = data.items ?? [];
      pagination.total = data.total ?? 0;
      pagination.current = data.page ?? pagination.current;
      pagination.pageSize = data.size ?? pagination.pageSize;
    } finally {
      loading.value = false;
    }
  }

  function applyDefaultFilters() {
    keyword.value = '';
    statusFilter.value = '';
    pagination.current = 1;
  }

  function clearMenuResetNavigationState() {
    if (!isMenuResetListNavigation(history.state)) {
      return;
    }

    const nextState = { ...history.state } as Record<string, unknown>;
    delete nextState.resetListOnMenu;
    router.replace({
      ...router.currentRoute.value,
      state: nextState as HistoryState,
    });
  }

  function handleListActivate() {
    if (isMenuResetListNavigation(history.state)) {
      applyDefaultFilters();
      clearMenuResetNavigationState();
      void fetchList();
      listInitialized.value = true;
      return;
    }

    const plan = consumeListRestore(SHOP_PRODUCT_LIST_ROUTE_NAME);
    if (plan?.mode === 'reset') {
      applyDefaultFilters();
      void fetchList();
      listInitialized.value = true;
      return;
    }

    if (plan?.mode === 'keep') {
      if (plan.resetFilters) {
        applyDefaultFilters();
      }
      if (plan.refresh || !listInitialized.value) {
        void fetchList();
      }
      listInitialized.value = true;
      return;
    }

    if (!listInitialized.value) {
      void fetchList();
      listInitialized.value = true;
    }
  }

  function handleSearch() {
    pagination.current = 1;
    void fetchList();
  }

  function resetFilters() {
    applyDefaultFilters();
    void fetchList();
  }

  function handleTableChange(page: number, pageSize: number) {
    pagination.current = page;
    pagination.pageSize = pageSize;
    void fetchList();
  }

  function openAdd() {
    markListRestore(SHOP_PRODUCT_LIST_ROUTE_NAME, {
      mode: 'keep',
      refresh: false,
    });
    router.push({ name: 'ShopProductCreate' });
  }

  function openEdit(row: AdminShopProductApi.Product) {
    markListRestore(SHOP_PRODUCT_LIST_ROUTE_NAME, {
      mode: 'keep',
      refresh: false,
    });
    router.push({ name: 'ShopProductEdit', params: { id: row.id } });
  }

  function confirmDelete(row: AdminShopProductApi.Product) {
    Modal.confirm({
      title: '确认删除该商品？',
      content: `确定要删除商品【${row.name}】吗？删除后无法恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        await deleteShopProductApi(row.id);
        message.success('删除成功');
        if (dataSource.value.length <= 1 && pagination.current > 1) {
          pagination.current -= 1;
        }
        await fetchList();
      },
    });
  }

  function confirmToggleStatus(row: AdminShopProductApi.Product) {
    const nextStatus =
      row.status === SHOP_PRODUCT_STATUS_ON
        ? SHOP_PRODUCT_STATUS_OFF
        : SHOP_PRODUCT_STATUS_ON;
    const actionLabel = nextStatus === SHOP_PRODUCT_STATUS_ON ? '上架' : '下架';

    Modal.confirm({
      title: `确认${actionLabel}该商品？`,
      content: `确定要将商品【${row.name}】${actionLabel}吗？`,
      okText: actionLabel,
      cancelText: '取消',
      async onOk() {
        await updateShopProductApi(row.id, { status: nextStatus });
        message.success(`${actionLabel}成功`);
        await fetchList();
      },
    });
  }

  onActivated(() => {
    handleListActivate();
  });

  return {
    confirmDelete,
    confirmToggleStatus,
    dataSource,
    handleSearch,
    handleTableChange,
    keyword,
    loading,
    openAdd,
    openEdit,
    pagination,
    resetFilters,
    statusFilter,
  };
}
