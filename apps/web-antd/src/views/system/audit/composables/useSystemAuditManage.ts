import type { AdminAuditApi } from '#/api/core/admin-audit';

import type { AuditSuccessFilterValue } from '../constants';

import { onMounted, reactive, ref } from 'vue';

import {
  getAdminAuditLogApi,
  listAdminAuditLogsApi,
} from '#/api/core/admin-audit';

import { dateToEndUnix, dateToStartUnix } from '../constants';

export interface SystemAuditFilters {
  endDate: string;
  startDate: string;
  success: AuditSuccessFilterValue;
}

const defaultFilters = (): SystemAuditFilters => ({
  success: '',
  startDate: '',
  endDate: '',
});

export function useSystemAuditManage() {
  const filters = reactive<SystemAuditFilters>(defaultFilters());
  const loading = ref(false);
  const dataSource = ref<AdminAuditApi.ListItem[]>([]);
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const detailModalOpen = ref(false);
  const detailLoading = ref(false);
  const detailData = ref<AdminAuditApi.Detail | null>(null);

  async function fetchList() {
    loading.value = true;
    try {
      const params: AdminAuditApi.ListParams = {
        page: pagination.current,
        size: pagination.pageSize,
      };

      if (filters.success === 'true') {
        params.success = true;
      } else if (filters.success === 'false') {
        params.success = false;
      }

      if (filters.startDate) {
        params.start_time = dateToStartUnix(filters.startDate);
      }
      if (filters.endDate) {
        params.end_time = dateToEndUnix(filters.endDate);
      }

      const data = await listAdminAuditLogsApi(params);
      dataSource.value = data.items ?? [];
      pagination.total = data.total ?? 0;
      pagination.current = data.page ?? pagination.current;
      pagination.pageSize = data.size ?? pagination.pageSize;
    } finally {
      loading.value = false;
    }
  }

  function handleSearch() {
    pagination.current = 1;
    void fetchList();
  }

  function resetFilters() {
    Object.assign(filters, defaultFilters());
    handleSearch();
  }

  function handleTableChange(page: number, pageSize: number) {
    pagination.current = page;
    pagination.pageSize = pageSize;
    void fetchList();
  }

  async function openDetail(row: AdminAuditApi.ListItem) {
    detailModalOpen.value = true;
    detailData.value = null;
    detailLoading.value = true;
    try {
      detailData.value = await getAdminAuditLogApi(row.id);
    } catch {
      detailModalOpen.value = false;
      throw new Error('fetch audit detail failed');
    } finally {
      detailLoading.value = false;
    }
  }

  function closeDetail() {
    detailModalOpen.value = false;
    detailData.value = null;
  }

  onMounted(() => {
    void fetchList();
  });

  return {
    closeDetail,
    dataSource,
    detailData,
    detailLoading,
    detailModalOpen,
    filters,
    handleSearch,
    handleTableChange,
    loading,
    openDetail,
    pagination,
    resetFilters,
  };
}
