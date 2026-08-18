import type { AdminShopOrderApi } from '#/api/core/admin-shop-orders';

import { onActivated, reactive, ref } from 'vue';
import { useRouter, type HistoryState } from 'vue-router';

import { message } from 'ant-design-vue';

import { listShopOrdersApi } from '#/api/core/admin-shop-orders';
import {
  consumeListRestore,
  isMenuResetListNavigation,
  markListRestore,
  SHOP_ORDER_LIST_ROUTE_NAME,
} from '#/composables/useMallListRestore';

export function useShopOrderManage() {
  const router = useRouter();

  const userId = ref('');
  const statusFilter = ref<'' | AdminShopOrderApi.OrderStatus>('');
  const loading = ref(false);
  const dataSource = ref<AdminShopOrderApi.OrderListItem[]>([]);
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const listInitialized = ref(false);

  function parseUserIdFilter(): number | undefined {
    const raw = userId.value.trim();
    if (!raw) {
      return undefined;
    }

    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      message.warning('用户 ID 须为正整数');
      return null;
    }

    return parsed;
  }

  async function fetchList() {
    const parsedUserId = parseUserIdFilter();
    if (parsedUserId === null) {
      return;
    }

    loading.value = true;
    try {
      const params: AdminShopOrderApi.ListParams = {
        page: pagination.current,
        size: pagination.pageSize,
      };
      if (parsedUserId !== undefined) {
        params.user_id = parsedUserId;
      }
      if (statusFilter.value) {
        params.status = statusFilter.value;
      }

      const data = await listShopOrdersApi(params);
      dataSource.value = data.items ?? [];
      pagination.total = data.total ?? 0;
      pagination.current = data.page ?? pagination.current;
      pagination.pageSize = data.size ?? pagination.pageSize;
    } finally {
      loading.value = false;
    }
  }

  function applyDefaultFilters() {
    userId.value = '';
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

    const plan = consumeListRestore(SHOP_ORDER_LIST_ROUTE_NAME);
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

  function openDetail(row: AdminShopOrderApi.OrderListItem) {
    markListRestore(SHOP_ORDER_LIST_ROUTE_NAME, {
      mode: 'keep',
      refresh: false,
    });
    router.push({ name: 'ShopOrderDetail', params: { id: row.id } });
  }

  onActivated(() => {
    handleListActivate();
  });

  return {
    dataSource,
    handleSearch,
    handleTableChange,
    loading,
    openDetail,
    pagination,
    resetFilters,
    statusFilter,
    userId,
  };
}
