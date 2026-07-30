<script lang="ts" setup>
/**
 * 商品层价库：始终展示，写入 product.orgPrice / salePrice / stock
 */
import { InputNumber } from 'ant-design-vue';

import { useMallProductFormBiz } from '../useMallProductFormContext';

const biz = useMallProductFormBiz();
</script>

<template>
  <div class="product-form-module-shell">
    <h3
      class="product-form-module-title product-form-module-title--section-gap"
    >
      价格与库存
    </h3>
    <div class="single-sku-inline-group">
      <div class="single-sku-inline-item">
        <span class="single-sku-label single-sku-label-required">售价：</span>
        <InputNumber
          v-model:value="biz.singleSku.salePrice"
          :min="0"
          :precision="2"
          class="single-sku-inline-control"
          placeholder="销售价"
        />
      </div>
      <div class="single-sku-inline-item">
        <span class="single-sku-label">原价：</span>
        <InputNumber
          v-model:value="biz.singleSku.orgPrice"
          :min="0"
          :precision="2"
          class="single-sku-inline-control"
          placeholder="划线价（可选）"
        />
      </div>
      <div class="single-sku-inline-item">
        <span class="single-sku-label single-sku-label-required">库存：</span>
        <InputNumber
          v-model:value="biz.singleSku.stock"
          :min="0"
          :precision="0"
          class="single-sku-inline-control"
          placeholder="库存数量"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.single-sku-inline-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  align-items: center;
}

.single-sku-inline-item {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.single-sku-label {
  flex-shrink: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: rgb(71 85 105);
}

.single-sku-label-required::before {
  margin-right: 4px;
  font-family: SimSun, sans-serif;
  color: #ff4d4f;
  content: '*';
}

.single-sku-inline-control {
  width: 8rem;
  min-width: 0;
}
</style>
