<script lang="ts" setup>
defineOptions({ name: 'MallListPage' });
</script>

<template>
  <div class="mall-list-page min-h-full p-4">
    <slot></slot>
  </div>
</template>

<style scoped>
.mall-list-page :deep(.ant-input-affix-wrapper-focused),
.mall-list-page :deep(.ant-input-number-focused),
.mall-list-page :deep(.ant-input-number:focus-within),
.mall-list-page :deep(.ant-select-focused .ant-select-selector) {
  border-color: hsl(245deg 82% 67%) !important;
  box-shadow: 0 0 0 2px hsl(245deg 82% 67% / 22%) !important;
}
</style>
