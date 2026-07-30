<script lang="ts" setup>
/**
 * 商品表单各区块（列表页与独立编辑页共用）。
 */
import type { CategoryCascaderOption } from '../utils/categoryOptions';

import ProductBasicForm from './ProductBasicForm.vue';
import ProductDeliverySection from './ProductDeliverySection.vue';
import ProductDescriptionSection from './ProductDescriptionSection.vue';
import ProductDiscountSection from './ProductDiscountSection.vue';
import ProductMediaUpload from './ProductMediaUpload.vue';
import ProductParamSection from './ProductParamSection.vue';
import ProductPreferenceSection from './ProductPreferenceSection.vue';
import ProductShippingSection from './ProductShippingSection.vue';
import ProductSingleSkuSection from './ProductSingleSkuSection.vue';
import ProductSkuSection from './ProductSkuSection.vue';

defineProps<{
  categoryCascaderOptions: CategoryCascaderOption[];
  resolveCategoryPath: (leafId: string) => string[] | undefined;
}>();
</script>

<template>
  <div class="product-form-inner mt-2">
    <div class="flex flex-col gap-4 pb-2">
      <ProductMediaUpload />
      <ProductBasicForm
        :category-cascader-options="categoryCascaderOptions"
        :resolve-category-path="resolveCategoryPath"
      />
      <ProductSingleSkuSection />
      <ProductSkuSection />
      <ProductParamSection />
      <ProductDescriptionSection />
      <ProductDiscountSection />
      <ProductShippingSection />
      <ProductPreferenceSection />
      <ProductDeliverySection />
    </div>
  </div>
</template>

<style src="./product-form-module.css"></style>
