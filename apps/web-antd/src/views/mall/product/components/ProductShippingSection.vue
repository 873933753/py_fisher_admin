<script lang="ts" setup>
/**
 * 运费：默认包邮；选「否」时录入运费金额。
 */

import { InputNumber, Radio } from 'ant-design-vue';

import { useMallProductFormBiz } from '../useMallProductFormContext';

const biz = useMallProductFormBiz();
</script>

<template>
  <div class="product-form-module-shell">
    <h3
      class="product-form-module-title product-form-module-title--section-gap"
    >
      快递运费
    </h3>
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span class="shrink-0 text-sm text-slate-700">是否免费邮寄</span>
      <Radio.Group v-model:value="biz.shippingFree" class="shrink-0">
        <Radio :value="true">是 （包邮）</Radio>
        <Radio :value="false">否 （买家承担）</Radio>
      </Radio.Group>
      <div
        class="flex shrink-0 items-center gap-x-2"
        :class="biz.shippingFree ? 'invisible pointer-events-none' : ''"
        :aria-hidden="biz.shippingFree"
      >
        <span class="shrink-0 text-xs text-slate-500">快递价格</span>
        <InputNumber
          v-model:value="biz.shippingFee"
          :disabled="biz.shippingFree"
          :min="0"
          :precision="2"
          class="w-40 max-w-full"
          placeholder="运费"
        />
      </div>
    </div>
  </div>
</template>
