<script lang="ts" setup>
/**
 * ⑧ 偏好：发货时效、退货开关与天数、退货说明、发货地/可购地。
 */

import { computed } from 'vue';

import { Input, Radio, Select } from 'ant-design-vue';

import {
  useMallProductFormBiz,
  useMallProductFormOptions,
} from '../useMallProductFormContext';

const biz = useMallProductFormBiz();
const formOptions = useMallProductFormOptions();

const handlingOptions = computed(() =>
  formOptions.value.handlingTimeOptions.map((v) => ({
    label: `${v} 天`,
    value: v,
  })),
);

const shippingOptions = computed(() =>
  formOptions.value.shippingAddrsOptions.map((v) => ({ label: v, value: v })),
);

const allowBuyOptions = computed(
  () => formOptions.value.allowBuyCountryOptions,
);

const returnDaysOptions = computed(() =>
  formOptions.value.returnDaysOptions.map((d) => ({
    label: `${d} 天`,
    value: d,
  })),
);

const handlingTimeSelected = computed({
  get: () => biz.value.handlingTimeList[0],
  set: (v: string | undefined) => {
    biz.value.handlingTimeList = v ? [v] : [];
  },
});
</script>

<template>
  <div class="product-form-module-shell">
    <h3
      class="product-form-module-title product-form-module-title--section-gap"
    >
      偏好设置
    </h3>
    <div class="preference-stack">
      <div class="pref-inline-group">
        <div class="pref-row">
          <span class="pref-label">处理时间：</span>
          <Select
            v-model:value="handlingTimeSelected"
            allow-clear
            :options="handlingOptions"
            placeholder="请选择"
            class="pref-inline-control"
          />
        </div>
        <div class="pref-inline-item">
          <span class="pref-label">是否允许退回：</span>
          <Radio.Group v-model:value="biz.returnsAllowed">
            <Radio :value="true">是</Radio>
            <Radio :value="false">否</Radio>
          </Radio.Group>
        </div>
        <div v-if="biz.returnsAllowed" class="pref-inline-item">
          <span class="pref-label">可退货天数：</span>
          <Select
            v-model:value="biz.returnWithinDays"
            allow-clear
            class="pref-inline-control"
            :options="returnDaysOptions"
            placeholder="请选择"
          />
        </div>
      </div>
      <div class="pref-row pref-row-top">
        <span class="pref-label pref-label-valign">退货说明：</span>
        <Input.TextArea
          v-model:value="biz.returnPolicy"
          class="pref-control"
          :auto-size="{ minRows: 3, maxRows: 8 }"
        />
      </div>
      <div class="pref-row">
        <span class="pref-label">发货地区：</span>
        <Select
          v-model:value="biz.shippingAddrsList"
          allow-clear
          mode="multiple"
          :options="shippingOptions"
          placeholder="请选择"
          class="pref-control"
        />
      </div>
      <div class="pref-row">
        <span class="pref-label">允许购买地区：</span>
        <Select
          v-model:value="biz.allowPurchaseAddrsList"
          allow-clear
          mode="multiple"
          :options="allowBuyOptions"
          placeholder="请选择"
          class="pref-control"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.preference-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pref-row {
  display: grid;
  grid-template-columns: minmax(6rem, max-content) minmax(0, 1fr);
  column-gap: 16px;
  align-items: center;
}

.pref-inline-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  align-items: center;
}

.pref-inline-item {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  min-width: 0;
  margin-left: 30px;
}

.pref-inline-control {
  width: 7rem;
  min-width: 0;
}

.pref-row-top {
  align-items: flex-start;
}

.pref-label {
  flex-shrink: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: rgb(71 85 105);
}

.pref-label-valign {
  padding-top: 6px;
}

.pref-control {
  width: 100%;
  min-width: 0;
}
</style>
