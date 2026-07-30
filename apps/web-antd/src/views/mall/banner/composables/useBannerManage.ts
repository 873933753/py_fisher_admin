import type { BannerFormState } from '../types';

import type { SysHomeFeedApi } from '#/api/core/sysHomeFeed';

import { onMounted, reactive, ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import {
  deleteSysHomeFeedApi,
  findPageSysHomeFeedApi,
  getHomepageHierarchyApi,
  saveOrUpdSysHomeFeedApi,
} from '#/api/core/sysHomeFeed';

import {
  bannerFormToSaveBody,
  emptyBannerForm,
  recordToBannerForm,
} from '../utils/bannerForm';

export function useBannerManage() {
  const titleKeyword = ref('');
  const loading = ref(false);
  const dataSource = ref<SysHomeFeedApi.HomeFeedRecord[]>([]);
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const feedTypeOptions = ref<{ label: string; value: string }[]>([]);
  const jumpTypeOptions = ref<{ label: string; value: string }[]>([]);

  const formModalOpen = ref(false);
  const formMode = ref<'add' | 'edit'>('add');
  const formState = ref<BannerFormState>(emptyBannerForm());
  const formSubmitting = ref(false);

  async function loadHierarchy() {
    try {
      const data = await getHomepageHierarchyApi();
      feedTypeOptions.value = Object.entries(
        data.homepageHierarchyMap ?? {},
      ).map(([value, label]) => ({ value, label: String(label) }));
      jumpTypeOptions.value = Object.entries(data.jumpMap ?? {}).map(
        ([value, label]) => ({ value, label: String(label) }),
      );
    } catch {
      feedTypeOptions.value = [];
      jumpTypeOptions.value = [];
    }
  }

  async function fetchList() {
    loading.value = true;
    try {
      const params: SysHomeFeedApi.FindPageParams = {
        current: pagination.current,
        size: pagination.pageSize,
      };
      const title = titleKeyword.value.trim();
      if (title) params.title = title;

      const data = await findPageSysHomeFeedApi(params);
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
    void fetchList();
  }

  function resetFilters() {
    titleKeyword.value = '';
    handleSearch();
  }

  function handleTableChange(page: number, pageSize: number) {
    pagination.current = page;
    pagination.pageSize = pageSize;
    void fetchList();
  }

  function openAdd() {
    formMode.value = 'add';
    formState.value = emptyBannerForm();
    formModalOpen.value = true;
  }

  function openEdit(row: SysHomeFeedApi.HomeFeedRecord) {
    formMode.value = 'edit';
    formState.value = recordToBannerForm(row);
    formModalOpen.value = true;
  }

  async function submitForm() {
    formSubmitting.value = true;
    try {
      const body = bannerFormToSaveBody(formState.value);
      await saveOrUpdSysHomeFeedApi(body);
      message.success(formMode.value === 'add' ? '新增成功' : '保存成功');
      formModalOpen.value = false;
      await fetchList();
    } finally {
      formSubmitting.value = false;
    }
  }

  function confirmDelete(row: SysHomeFeedApi.HomeFeedRecord) {
    const displayName = row.title || row.id;
    Modal.confirm({
      title: '确认删除该配置？',
      content: `确定要删除【${displayName}】吗？删除后无法恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        await deleteSysHomeFeedApi(row.id);
        message.success('删除成功');
        if (dataSource.value.length <= 1 && pagination.current > 1) {
          pagination.current -= 1;
        }
        await fetchList();
      },
    });
  }

  onMounted(() => {
    void loadHierarchy();
    void fetchList();
  });

  return {
    confirmDelete,
    dataSource,
    feedTypeOptions,
    formModalOpen,
    formMode,
    formState,
    formSubmitting,
    handleSearch,
    handleTableChange,
    jumpTypeOptions,
    loading,
    openAdd,
    openEdit,
    pagination,
    resetFilters,
    submitForm,
    titleKeyword,
  };
}
