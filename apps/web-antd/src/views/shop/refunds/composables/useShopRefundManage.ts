import type { AdminShopRefundApi } from '#/api/core/admin-shop-refunds';

import { onActivated, onMounted, reactive, ref } from 'vue';
import { useRouter, type HistoryState } from 'vue-router';

import { message, Modal } from 'ant-design-vue';

import {
  approveShopRefundApi,
  listShopRefundsApi,
  rejectShopRefundApi,
  syncShopRefundApi,
} from '#/api/core/admin-shop-refunds';
import {
  consumeListRestore,
  isMenuResetListNavigation,
  SHOP_REFUND_LIST_ROUTE_NAME,
} from '#/composables/useMallListRestore';
import { formatPriceYuan } from '#/views/shop/products/utils/price';

import {
  SHOP_REFUND_REJECT_REASON_MAX,
  SHOP_REFUND_REJECT_REASON_MIN,
} from '../constants';

export function useShopRefundManage() {
  const router = useRouter();

  const userId = ref('');
  const orderNo = ref('');
  const statusFilter = ref<'' | AdminShopRefundApi.RefundStatus>('');
  const loading = ref(false);
  const dataSource = ref<AdminShopRefundApi.RefundListItem[]>([]);
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const listInitialized = ref(false);

  const rejectOpen = ref(false);
  const rejectSubmitting = ref(false);
  const rejectReason = ref('');
  const rejectingRow = ref<AdminShopRefundApi.RefundListItem | null>(null);
  const syncingRefundNo = ref('');

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
      const params: AdminShopRefundApi.ListParams = {
        page: pagination.current,
        size: pagination.pageSize,
      };
      if (parsedUserId !== undefined) {
        params.user_id = parsedUserId;
      }
      const trimmedOrderNo = orderNo.value.trim();
      if (trimmedOrderNo) {
        params.order_no = trimmedOrderNo;
      }
      if (statusFilter.value) {
        params.status = statusFilter.value;
      }

      const data = await listShopRefundsApi(params);
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
    orderNo.value = '';
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

    const plan = consumeListRestore(SHOP_REFUND_LIST_ROUTE_NAME);
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

  function confirmApprove(row: AdminShopRefundApi.RefundListItem) {
    Modal.confirm({
      title: '确认同意退款？',
      content: `将按申请金额 ${formatPriceYuan(row.amount)} 向通道退款，无需填写金额。工单号：${row.refund_no}`,
      okText: '同意',
      cancelText: '取消',
      async onOk() {
        try {
          await approveShopRefundApi(row.refund_no);
          message.success('已同意退款');
        } catch {
          // 拦截器已提示；通道失败时工单可能已变为 30
        } finally {
          await fetchList();
        }
      },
    });
  }

  async function handleSync(row: AdminShopRefundApi.RefundListItem) {
    if (syncingRefundNo.value) {
      return;
    }

    syncingRefundNo.value = row.refund_no;
    try {
      await syncShopRefundApi(row.refund_no);
      message.success('同步退款状态成功');
    } catch {
      // 拦截器已提示
    } finally {
      syncingRefundNo.value = '';
      await fetchList();
    }
  }

  function openReject(row: AdminShopRefundApi.RefundListItem) {
    rejectingRow.value = row;
    rejectReason.value = '';
    rejectOpen.value = true;
  }

  function closeReject() {
    if (rejectSubmitting.value) {
      return;
    }
    rejectOpen.value = false;
    rejectReason.value = '';
    rejectingRow.value = null;
  }

  async function submitReject() {
    const row = rejectingRow.value;
    const reason = rejectReason.value.trim();
    if (!row) {
      return;
    }
    if (
      reason.length < SHOP_REFUND_REJECT_REASON_MIN ||
      reason.length > SHOP_REFUND_REJECT_REASON_MAX
    ) {
      message.warning(
        `拒绝原因须为 ${SHOP_REFUND_REJECT_REASON_MIN}～${SHOP_REFUND_REJECT_REASON_MAX} 字`,
      );
      return;
    }

    rejectSubmitting.value = true;
    try {
      await rejectShopRefundApi(row.refund_no, { reject_reason: reason });
      message.success('已拒绝退款');
      rejectOpen.value = false;
      rejectReason.value = '';
      rejectingRow.value = null;
      await fetchList();
    } finally {
      rejectSubmitting.value = false;
    }
  }

  onMounted(() => {
    handleListActivate();
  });

  onActivated(() => {
    handleListActivate();
  });

  return {
    closeReject,
    confirmApprove,
    dataSource,
    handleSearch,
    handleSync,
    handleTableChange,
    loading,
    openReject,
    orderNo,
    pagination,
    rejectOpen,
    rejectReason,
    rejectSubmitting,
    rejectingRow,
    resetFilters,
    statusFilter,
    submitReject,
    userId,
  };
}
