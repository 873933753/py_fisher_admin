import type { PaypalApi } from '#/api/core/paypal';

import { onMounted, reactive, ref } from 'vue';

import { message } from 'ant-design-vue';

import {
  findPaypalOrderDetailApi,
  findPaypalTransactionsApi,
} from '#/api/core/paypal';

import { DEFAULT_TXN_TYPE_FILTER } from '../constants';

export interface PaypalTransactionFilters {
  orderId: string;
  paypalOrderId: string;
  txnType: PaypalApi.TxnTypeValue | undefined;
}

const defaultFilters = (): PaypalTransactionFilters => ({
  orderId: '',
  paypalOrderId: '',
  txnType: DEFAULT_TXN_TYPE_FILTER,
});

export function usePaypalTransactionManage() {
  const filters = reactive<PaypalTransactionFilters>(defaultFilters());
  const loading = ref(false);
  const dataSource = ref<PaypalApi.TransactionRecord[]>([]);
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const detailModalOpen = ref(false);
  const detailLoading = ref(false);
  const detailData = ref<null | PaypalApi.OrderDetailData>(null);
  const detailPaypalOrderId = ref('');

  async function fetchList() {
    loading.value = true;
    try {
      const params: PaypalApi.FindTransactionsParams = {
        current: pagination.current,
        size: pagination.pageSize,
      };

      const orderIdText = filters.orderId.trim();
      if (orderIdText) {
        const orderId = Number(orderIdText);
        if (!Number.isFinite(orderId)) {
          message.warning('商城订单 ID 须为数字');
          return;
        }
        params.orderId = orderId;
      }

      const paypalOrderId = filters.paypalOrderId.trim();
      if (paypalOrderId) {
        params.paypalOrderId = paypalOrderId;
      }

      if (filters.txnType) {
        params.txnType = filters.txnType;
      }

      const data = await findPaypalTransactionsApi(params);
      dataSource.value = data.records ?? [];
      pagination.total = Number(data.total) || 0;
      pagination.current = Number(data.current) || pagination.current;
      pagination.pageSize = Number(data.size) || pagination.pageSize;
    } finally {
      loading.value = false;
    }
  }

  function handleSearch() {
    pagination.current = 1;
    fetchList();
  }

  function resetFilters() {
    Object.assign(filters, defaultFilters());
    handleSearch();
  }

  function handleTableChange(page: number, pageSize: number) {
    pagination.current = page;
    pagination.pageSize = pageSize;
    fetchList();
  }

  async function openDetail(record: PaypalApi.TransactionRecord) {
    const paypalOrderId = record.paypalOrderId?.trim();
    if (!paypalOrderId) {
      message.warning('PayPal 订单号不存在');
      return;
    }

    detailPaypalOrderId.value = paypalOrderId;
    detailModalOpen.value = true;
    detailData.value = null;
    detailLoading.value = true;

    try {
      detailData.value = await findPaypalOrderDetailApi(paypalOrderId);
    } finally {
      detailLoading.value = false;
    }
  }

  function closeDetail() {
    detailModalOpen.value = false;
    detailData.value = null;
    detailPaypalOrderId.value = '';
  }

  onMounted(() => {
    fetchList();
  });

  return {
    closeDetail,
    dataSource,
    detailData,
    detailLoading,
    detailModalOpen,
    detailPaypalOrderId,
    fetchList,
    filters,
    handleSearch,
    handleTableChange,
    loading,
    openDetail,
    pagination,
    resetFilters,
  };
}
