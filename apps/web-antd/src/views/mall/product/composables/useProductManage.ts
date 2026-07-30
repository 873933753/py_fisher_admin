import type { ProductFindPageApi } from '#/api/core/product';

import { onActivated, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { message, Modal } from 'ant-design-vue';

import { delProductApi, findPageProductApi } from '#/api/core/product';
import {
  consumeListRestore,
  isMenuResetListNavigation,
  MALL_PRODUCT_LIST_ROUTE_NAME,
  markListRestore,
} from '#/composables/useMallListRestore';
export function useProductManage() {
  const router = useRouter();

  const keyword = ref('');
  const loading = ref(false);
  const dataSource = ref<ProductFindPageApi.ProductRecord[]>([]);
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const listInitialized = ref(false);
  const contactBuyerOpen = ref(false);
  const contactBuyerTarget = ref<null | ProductFindPageApi.ProductRecord>(null);

  async function fetchList() {
    loading.value = true;
    try {
      const params: ProductFindPageApi.FindPageParams = {
        current: pagination.current,
        size: pagination.pageSize,
      };
      const name = keyword.value.trim();
      if (name) params.productName = name;

      const data = await findPageProductApi(params);
      dataSource.value = data.records ?? [];
      pagination.total = Number(data.total) || 0;
      pagination.current = Number(data.current) || pagination.current;
      pagination.pageSize = Number(data.size) || pagination.pageSize;
    } finally {
      loading.value = false;
    }
  }

  function applyDefaultFilters() {
    keyword.value = '';
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
      state: nextState,
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

    const plan = consumeListRestore(MALL_PRODUCT_LIST_ROUTE_NAME);
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
    fetchList();
  }

  function resetFilters() {
    keyword.value = '';
    handleSearch();
  }

  function handleTableChange(page: number, pageSize: number) {
    pagination.current = page;
    pagination.pageSize = pageSize;
    fetchList();
  }

  function openAdd() {
    markListRestore(MALL_PRODUCT_LIST_ROUTE_NAME, {
      mode: 'keep',
      refresh: false,
    });
    router.push({ name: 'MallProductCreate' });
  }

  function openEdit(row: ProductFindPageApi.ProductRecord) {
    markListRestore(MALL_PRODUCT_LIST_ROUTE_NAME, {
      mode: 'keep',
      refresh: false,
    });
    router.push({ name: 'MallProductEdit', params: { id: row.id } });
  }

  function openProductReviews(row: ProductFindPageApi.ProductRecord) {
    const productId = row.id?.trim();
    if (!productId) {
      message.warning('商品 ID 不存在');
      return;
    }

    markListRestore(MALL_PRODUCT_LIST_ROUTE_NAME, {
      mode: 'keep',
      refresh: false,
    });
    router.push({ name: 'MallProductReviews', params: { id: productId } });
  }

  function confirmDelete(row: ProductFindPageApi.ProductRecord) {
    const displayName = row.productName || row.id;
    Modal.confirm({
      title: '确认删除该商品？',
      content: `确定要删除商品【${displayName}】吗？删除后无法恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        await delProductApi(row.id);
        message.success('删除成功');
        if (dataSource.value.length <= 1 && pagination.current > 1) {
          pagination.current -= 1;
        }
        await fetchList();
      },
    });
  }

  function openContactBuyer(row: ProductFindPageApi.ProductRecord) {
    const productId = row.id?.trim();
    if (!productId) {
      message.warning('商品 ID 不存在');
      return;
    }
    contactBuyerTarget.value = row;
    contactBuyerOpen.value = true;
  }

  onActivated(() => {
    handleListActivate();
  });

  return {
    confirmDelete,
    contactBuyerOpen,
    contactBuyerTarget,
    dataSource,
    handleSearch,
    handleTableChange,
    keyword,
    loading,
    openAdd,
    openContactBuyer,
    openEdit,
    openProductReviews,
    pagination,
    resetFilters,
  };
}
