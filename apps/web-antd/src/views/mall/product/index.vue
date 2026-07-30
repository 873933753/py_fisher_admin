<script lang="ts" setup>
import { MallListPage } from '#/components/mall-list';
import ContactBuyerDrawer from '#/views/mall/order/components/ContactBuyerDrawer.vue';

import ProductListPanel from './components/ProductListPanel.vue';
import { useProductManage } from './composables/useProductManage';

defineOptions({ name: 'MallProduct' });

const {
  confirmDelete,
  contactBuyerOpen,
  contactBuyerTarget,
  dataSource,
  handleSearch,
  handleTableChange,
  keyword,
  loading,
  openAdd,
  openContactBuyer,
  openEdit,
  openProductReviews,
  pagination,
  resetFilters,
} = useProductManage();
</script>

<template>
  <MallListPage>
    <ProductListPanel
      v-model:keyword="keyword"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      @add="openAdd"
      @contact-buyer="openContactBuyer"
      @delete="confirmDelete"
      @edit="openEdit"
      @view-reviews="openProductReviews"
      @reset="resetFilters"
      @search="handleSearch"
      @table-change="handleTableChange"
    />

    <ContactBuyerDrawer
      v-model:open="contactBuyerOpen"
      :product="contactBuyerTarget"
    />
  </MallListPage>
</template>
