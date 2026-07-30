import type { OrderApi } from '#/api/core/order';

import { onMounted, reactive, ref } from 'vue';

import dayjs from 'dayjs';

import { orderFlowPageApi } from '#/api/core/order';

export interface OrderFlowFilters {
  endDate: string;
  orderNo: string;
  productName: string;
  startDate: string;
}

function getDefaultDateRange(): Pick<
  OrderFlowFilters,
  'endDate' | 'startDate'
> {
  return {
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  };
}

const defaultFilters = (): OrderFlowFilters => ({
  ...getDefaultDateRange(),
  orderNo: '',
  productName: '',
});

const defaultSummary = (): OrderApi.OrderFlowSummary => ({
  totalIncome: 0,
  totalRefunded: 0,
  totalNet: 0,
});

export function useOrderFlowManage() {
  const filters = reactive<OrderFlowFilters>(defaultFilters());
  const loading = ref(false);
  const dataSource = ref<OrderApi.OrderFlowRecord[]>([]);
  const summary = ref<OrderApi.OrderFlowSummary>(defaultSummary());
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  async function fetchList() {
    loading.value = true;
    try {
      const params: OrderApi.OrderFlowPageParams = {
        current: pagination.current,
        size: pagination.pageSize,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };

      const orderNo = filters.orderNo.trim();
      if (orderNo) {
        params.orderNo = orderNo;
      }

      const productName = filters.productName.trim();
      if (productName) {
        params.productName = productName;
      }

      const data = await orderFlowPageApi(params);
      dataSource.value = data.records ?? [];
      pagination.total = Number(data.total) || 0;
      pagination.current = Number(data.current) || pagination.current;
      pagination.pageSize = Number(data.size) || pagination.pageSize;
      summary.value = data.summary ?? defaultSummary();
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

  onMounted(() => {
    fetchList();
  });

  return {
    dataSource,
    fetchList,
    filters,
    handleSearch,
    handleTableChange,
    loading,
    pagination,
    resetFilters,
    summary,
  };
}
