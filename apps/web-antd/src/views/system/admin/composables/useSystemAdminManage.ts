import type { AdminAdminApi } from '#/api/core/admin-admin';
import type { AdminRbacApi } from '#/api/core/admin-rbac';

import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import { message, Modal } from 'ant-design-vue';

import {
  createAdminAdminApi,
  deleteAdminAdminApi,
  getAdminAdminApi,
  listAdminAdminsApi,
  updateAdminAdminApi,
} from '#/api/core/admin-admin';
import { listRbacRolesApi } from '#/api/core/admin-rbac';

import { isSuperAdminRole } from '../../rbac/constants';

export interface SystemAdminFilters {
  keyword: string;
}

export interface SystemAdminFormState {
  id: number;
  is_disabled: boolean;
  password: string;
  phone_number: string;
  role: string;
}

const defaultFilters = (): SystemAdminFilters => ({
  keyword: '',
});

function defaultFormState(): SystemAdminFormState {
  return {
    id: 0,
    phone_number: '',
    password: '',
    is_disabled: false,
    role: '',
  };
}

function detailToFormState(detail: AdminAdminApi.Detail): SystemAdminFormState {
  return {
    id: detail.id,
    phone_number: detail.phone_number ?? '',
    password: '',
    is_disabled: detail.is_disabled ?? false,
    role: detail.role ?? '',
  };
}

export function useSystemAdminManage() {
  const userStore = useUserStore();
  const currentAdminId = computed(() =>
    Number(userStore.userInfo?.userId ?? 0),
  );

  const filters = reactive<SystemAdminFilters>(defaultFilters());
  const loading = ref(false);
  const dataSource = ref<AdminAdminApi.ListItem[]>([]);
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const formModalOpen = ref(false);
  const formMode = ref<'add' | 'edit'>('add');
  const formSubmitting = ref(false);
  const formDetailLoading = ref(false);
  const formState = reactive<SystemAdminFormState>(defaultFormState());
  const originalFormState = ref<SystemAdminFormState>(defaultFormState());
  const roleOptions = ref<AdminRbacApi.RoleItem[]>([]);

  const disableRoleSelect = computed(
    () =>
      formMode.value === 'edit' &&
      isCurrentAdmin(formState.id) &&
      isSuperAdminRole(formState.role),
  );

  function isCurrentAdmin(adminId: number) {
    return adminId > 0 && adminId === currentAdminId.value;
  }

  async function fetchRoleOptions() {
    roleOptions.value = await listRbacRolesApi();
  }

  function getDefaultRoleCode() {
    const operator = roleOptions.value.find(
      (role) => role.code === 'operator',
    );
    if (operator) {
      return operator.code;
    }

    const nonSuperAdmin = roleOptions.value.find(
      (role) => !isSuperAdminRole(role.code),
    );
    return nonSuperAdmin?.code ?? roleOptions.value[0]?.code ?? '';
  }

  async function fetchList() {
    loading.value = true;
    try {
      const keyword = filters.keyword.trim();
      const data = await listAdminAdminsApi({
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

  async function openAdd() {
    formMode.value = 'add';
    await fetchRoleOptions();
    Object.assign(formState, defaultFormState());
    formState.role = getDefaultRoleCode();
    originalFormState.value = defaultFormState();
    formModalOpen.value = true;
  }

  async function openEdit(row: AdminAdminApi.ListItem) {
    formMode.value = 'edit';
    formModalOpen.value = true;
    formDetailLoading.value = true;
    try {
      await fetchRoleOptions();
      const detail = await getAdminAdminApi(row.id);
      const nextState = detailToFormState(detail);
      Object.assign(formState, nextState);
      originalFormState.value = { ...nextState };
    } catch {
      formModalOpen.value = false;
      throw new Error('fetch admin detail failed');
    } finally {
      formDetailLoading.value = false;
    }
  }

  async function submitForm() {
    formSubmitting.value = true;
    try {
      if (formMode.value === 'add') {
        await createAdminAdminApi({
          phone_number: formState.phone_number.trim(),
          password: formState.password,
          role: formState.role.trim(),
        });
        message.success('创建成功');
      } else {
        const payload: AdminAdminApi.UpdateParams = {};
        const phoneNumber = formState.phone_number.trim();
        const password = formState.password.trim();
        const role = formState.role.trim();

        if (phoneNumber !== originalFormState.value.phone_number) {
          payload.phone_number = phoneNumber;
        }
        if (password) {
          payload.password = password;
        }
        if (role !== originalFormState.value.role) {
          payload.role = role;
        }
        if (formState.is_disabled !== originalFormState.value.is_disabled) {
          payload.is_disabled = formState.is_disabled;
        }

        if (Object.keys(payload).length === 0) {
          message.info('没有修改');
          return;
        }

        await updateAdminAdminApi(formState.id, payload);
        message.success('更新成功');
      }

      formModalOpen.value = false;
      await fetchList();
    } finally {
      formSubmitting.value = false;
    }
  }

  function confirmDelete(row: AdminAdminApi.ListItem) {
    if (isCurrentAdmin(row.id)) {
      message.warning('不能删除当前登录账号');
      return;
    }

    Modal.confirm({
      title: '确认软删除该账号？',
      content: `确定软删除账号 ${row.phone_number}？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        await deleteAdminAdminApi(row.id);
        message.success('删除成功');
        if (dataSource.value.length <= 1 && pagination.current > 1) {
          pagination.current -= 1;
        }
        await fetchList();
      },
    });
  }

  onMounted(() => {
    void fetchList();
  });

  return {
    confirmDelete,
    currentAdminId,
    dataSource,
    disableRoleSelect,
    filters,
    formDetailLoading,
    formModalOpen,
    formMode,
    formState,
    formSubmitting,
    handleSearch,
    handleTableChange,
    isCurrentAdmin,
    loading,
    openAdd,
    openEdit,
    pagination,
    resetFilters,
    roleOptions,
    submitForm,
  };
}
