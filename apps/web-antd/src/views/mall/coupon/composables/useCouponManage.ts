import type { CouponFormState } from '../types';

import type { CouponTemplateApi } from '#/api/core/couponTemplate';

import { computed, onMounted, ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import {
  deleteCouponTemplateApi,
  findListCouponTemplateApi,
  saveOrUpdCouponTemplateApi,
  setDefaultCouponTemplateApi,
} from '#/api/core/couponTemplate';

import { isDefaultCoupon } from '../constants';
import {
  couponFormToSaveBody,
  emptyCouponForm,
  recordToCouponForm,
} from '../utils/couponForm';

export function useCouponManage() {
  const loading = ref(false);
  const dataSource = ref<CouponTemplateApi.CouponTemplateRecord[]>([]);
  const settingDefaultId = ref<null | string>(null);

  const formModalOpen = ref(false);
  const formMode = ref<'add' | 'edit'>('add');
  const formState = ref<CouponFormState>(emptyCouponForm());
  const formSubmitting = ref(false);

  const defaultCouponId = computed(() => {
    const row = dataSource.value.find((item) =>
      isDefaultCoupon(item.isDefault),
    );
    return row?.id ?? '';
  });

  async function fetchList() {
    loading.value = true;
    try {
      const list = await findListCouponTemplateApi();
      dataSource.value = list ?? [];
    } finally {
      loading.value = false;
    }
  }

  function openAdd() {
    formMode.value = 'add';
    formState.value = emptyCouponForm();
    formModalOpen.value = true;
  }

  function openEdit(row: CouponTemplateApi.CouponTemplateRecord) {
    formMode.value = 'edit';
    formState.value = recordToCouponForm(row);
    formModalOpen.value = true;
  }

  async function submitForm() {
    formSubmitting.value = true;
    try {
      await saveOrUpdCouponTemplateApi(couponFormToSaveBody(formState.value));
      message.success(formMode.value === 'add' ? '新增成功' : '保存成功');
      formModalOpen.value = false;
      await fetchList();
    } finally {
      formSubmitting.value = false;
    }
  }

  function confirmDelete(row: CouponTemplateApi.CouponTemplateRecord) {
    const displayName = row.title || row.id;
    Modal.confirm({
      title: '确认删除该优惠券？',
      content: `确定要删除【${displayName}】吗？删除后无法恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        await deleteCouponTemplateApi(row.id);
        message.success('删除成功');
        await fetchList();
      },
    });
  }

  async function handleDefaultChange(id: string) {
    if (!id || id === defaultCouponId.value) {
      return;
    }
    settingDefaultId.value = id;
    try {
      await setDefaultCouponTemplateApi(id);
      message.success('已设为默认优惠券');
      await fetchList();
    } finally {
      settingDefaultId.value = null;
    }
  }

  onMounted(() => {
    void fetchList();
  });

  return {
    confirmDelete,
    dataSource,
    defaultCouponId,
    fetchList,
    formModalOpen,
    formMode,
    formState,
    formSubmitting,
    handleDefaultChange,
    loading,
    openAdd,
    openEdit,
    settingDefaultId,
    submitForm,
  };
}
