import type { AdminUserApi } from '#/api/core/admin-user';

import { onMounted, reactive, ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import {
  deleteAdminUserApi,
  getAdminUserApi,
  listAdminUsersApi,
  updateAdminUserApi,
} from '#/api/core/admin-user';

export interface MallUserFilters {
  keyword: string;
}

export interface AdminUserEditForm {
  avatar: string;
  beans: number;
  create_time: string;
  email: string;
  id: number;
  is_disabled: boolean;
  nickname: string;
  phone_number: string;
  receive_counter: number;
  send_counter: number;
  wx_name: string;
  wx_open_id: string;
}

const defaultFilters = (): MallUserFilters => ({
  keyword: '',
});

function defaultEditForm(): AdminUserEditForm {
  return {
    id: 0,
    nickname: '',
    avatar: '',
    beans: 0,
    phone_number: '',
    is_disabled: false,
    email: '',
    create_time: '',
    send_counter: 0,
    receive_counter: 0,
    wx_open_id: '',
    wx_name: '',
  };
}

function detailToEditForm(detail: AdminUserApi.Detail): AdminUserEditForm {
  return {
    id: detail.id,
    nickname: detail.nickname ?? '',
    avatar: detail.avatar ?? '',
    beans: detail.beans ?? 0,
    phone_number: detail.phone_number ?? '',
    is_disabled: detail.is_disabled ?? false,
    email: detail.email ?? '',
    create_time: detail.create_time ?? '',
    send_counter: detail.send_counter ?? 0,
    receive_counter: detail.receive_counter ?? 0,
    wx_open_id: detail.wx_open_id ?? '',
    wx_name: detail.wx_name ?? '',
  };
}

function trimField(value: string) {
  return value.trim();
}

export function useMallUserManage() {
  const filters = reactive<MallUserFilters>(defaultFilters());
  const loading = ref(false);
  const dataSource = ref<AdminUserApi.ListItem[]>([]);
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const editModalOpen = ref(false);
  const editSubmitting = ref(false);
  const editDetailLoading = ref(false);
  const editFormState = reactive<AdminUserEditForm>(defaultEditForm());

  async function fetchList() {
    loading.value = true;
    try {
      const keyword = filters.keyword.trim();
      const data = await listAdminUsersApi({
        page: pagination.current,
        size: pagination.pageSize,
        ...(keyword ? { keyword } : {}),
      });
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

  async function openEdit(row: AdminUserApi.ListItem) {
    editModalOpen.value = true;
    editDetailLoading.value = true;
    try {
      const detail = await getAdminUserApi(row.id);
      Object.assign(editFormState, detailToEditForm(detail));
    } catch {
      editModalOpen.value = false;
      throw new Error('fetch user detail failed');
    } finally {
      editDetailLoading.value = false;
    }
  }

  async function submitEdit() {
    editSubmitting.value = true;
    try {
      await updateAdminUserApi(editFormState.id, {
        nickname: trimField(editFormState.nickname),
        avatar: trimField(editFormState.avatar),
        beans: editFormState.beans,
        phone_number: trimField(editFormState.phone_number),
        is_disabled: editFormState.is_disabled,
      });
      message.success('保存成功');
      editModalOpen.value = false;
      await fetchList();
    } finally {
      editSubmitting.value = false;
    }
  }

  function confirmDelete(row: AdminUserApi.ListItem) {
    Modal.confirm({
      title: '确认软删除该用户？',
      content: '确定软删除该用户？用户将被禁用',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        await deleteAdminUserApi(row.id);
        message.success('删除成功');
        if (dataSource.value.length <= 1 && pagination.current > 1) {
          pagination.current -= 1;
        }
        await fetchList();
      },
    });
  }

  onMounted(() => {
    fetchList();
  });

  return {
    confirmDelete,
    dataSource,
    editDetailLoading,
    editFormState,
    editModalOpen,
    editSubmitting,
    fetchList,
    filters,
    handleSearch,
    handleTableChange,
    loading,
    openEdit,
    pagination,
    resetFilters,
    submitEdit,
  };
}
