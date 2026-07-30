<script lang="ts" setup>
import { MallListPage } from '#/components/mall-list';

import BannerFormModal from './components/BannerFormModal.vue';
import BannerListPanel from './components/BannerListPanel.vue';
import { useBannerManage } from './composables/useBannerManage';

defineOptions({ name: 'MallBanner' });

const {
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
} = useBannerManage();
</script>

<template>
  <MallListPage>
    <BannerListPanel
      v-model:title-keyword="titleKeyword"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @add="openAdd"
      @delete="confirmDelete"
      @edit="openEdit"
      @reset="resetFilters"
      @search="handleSearch"
      @table-change="handleTableChange"
    />
    <BannerFormModal
      v-model:form-state="formState"
      v-model:open="formModalOpen"
      :feed-type-options="feedTypeOptions"
      :jump-type-options="jumpTypeOptions"
      :mode="formMode"
      :submit-form="submitForm"
      :submitting="formSubmitting"
    />
  </MallListPage>
</template>
