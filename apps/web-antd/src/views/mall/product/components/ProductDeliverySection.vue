<script lang="ts" setup>
/** 配送说明文案 */

import { Input } from 'ant-design-vue';

import { useMallProductFormBiz } from '../useMallProductFormContext';

const biz = useMallProductFormBiz();
</script>

<template>
  <div class="product-form-module-shell">
    <h3
      class="product-form-module-title product-form-module-title--section-gap"
    >
      配选说明
    </h3>
    <Input.TextArea
      v-model:value="biz.deliveryDesc"
      :auto-size="{ minRows: 4, maxRows: 14 }"
      placeholder="配送承诺、承运商说明等"
    />
  </div>
</template>
