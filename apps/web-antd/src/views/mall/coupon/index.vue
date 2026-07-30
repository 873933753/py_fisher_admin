<script lang="ts" setup>
import { MallListPage } from '#/components/mall-list';

import CouponFormModal from './components/CouponFormModal.vue';
import CouponListPanel from './components/CouponListPanel.vue';
import { useCouponManage } from './composables/useCouponManage';

defineOptions({ name: 'MallCoupon' });

const {
  confirmDelete,
  dataSource,
  defaultCouponId,
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
} = useCouponManage();
</script>

<template>
  <MallListPage>
    <CouponListPanel
      :data-source="dataSource"
      :default-coupon-id="defaultCouponId"
      :loading="loading"
      :setting-default-id="settingDefaultId"
      @add="openAdd"
      @default-change="handleDefaultChange"
      @delete="confirmDelete"
      @edit="openEdit"
    />
    <CouponFormModal
      v-model:form-state="formState"
      v-model:open="formModalOpen"
      :mode="formMode"
      :submit-form="submitForm"
      :submitting="formSubmitting"
    />
  </MallListPage>
</template>
