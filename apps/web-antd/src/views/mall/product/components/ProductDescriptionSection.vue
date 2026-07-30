<script lang="ts" setup>
/**
 * 描述：商品详情富文本，内容写入 biz.descriptionRich（HTML）。
 */

import { useMallProductFormBiz } from '../useMallProductFormContext';
import ProductRichDescriptionEditor from './ProductRichDescriptionEditor.vue';

const biz = useMallProductFormBiz();
</script>

<template>
  <div class="product-form-module-shell">
    <h3
      class="product-form-module-title product-form-module-title--section-gap"
    >
      商品描述
    </h3>
    <ProductRichDescriptionEditor v-model="biz.descriptionRich" />
  </div>
</template>
