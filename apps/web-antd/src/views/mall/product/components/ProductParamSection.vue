<script lang="ts" setup>
/** 商品参数：键值表，独立组件便于维护列表演示与校验逻辑 */

import { useMallProductFormBiz } from '../useMallProductFormContext';
import ProductParamTable from './ProductParamTable.vue';

const biz = useMallProductFormBiz();
</script>

<template>
  <div class="product-form-module-shell">
    <h3
      class="product-form-module-title product-form-module-title--section-gap"
    >
      商品参数
    </h3>
    <ProductParamTable v-model="biz.productParam" />
  </div>
</template>
