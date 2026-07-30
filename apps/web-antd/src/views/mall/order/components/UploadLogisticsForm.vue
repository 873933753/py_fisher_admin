<script lang="ts" setup>
import type { LogisticsApi } from '#/api/core/logistics';

import { computed, ref, watch } from 'vue';

import { Input, Select } from 'ant-design-vue';

import { requiresWaybillNo } from '../constants';

export interface LogisticsFormValues {
  logistics?: string;
  trackingNo?: string;
  waybillNo?: string;
}

const props = defineProps<{
  initialValues?: LogisticsFormValues;
  logisticsOptions: string[];
  orderId: string;
}>();

const logistics = ref<string>();
const trackingNo = ref('');
const waybillNo = ref('');

const logisticsSelectOptions = computed(() =>
  props.logisticsOptions.map((name) => ({
    label: name,
    value: name,
  })),
);

function applyFormValues(values?: LogisticsFormValues) {
  logistics.value = values?.logistics?.trim() || undefined;
  trackingNo.value = values?.trackingNo?.trim() ?? '';
  waybillNo.value = values?.waybillNo?.trim() ?? '';
}

watch(
  () => props.initialValues,
  (values) => {
    applyFormValues(values);
  },
  { immediate: true },
);

export interface UploadLogisticsValidateResult {
  message?: string;
  ok: boolean;
  payload?: LogisticsApi.UploadTrackingNoParams;
}

function validate(orderId: string): UploadLogisticsValidateResult {
  const logisticsName = logistics.value?.trim() ?? '';
  const tracking = trackingNo.value.trim();
  const waybill = waybillNo.value.trim();

  if (!logisticsName) {
    return { ok: false, message: '请选择物流公司' };
  }
  if (!tracking) {
    return { ok: false, message: '请输入跟踪号' };
  }
  if (requiresWaybillNo(logisticsName) && !waybill) {
    return { ok: false, message: '当前物流公司需填写运输单号' };
  }

  return {
    ok: true,
    payload: {
      orderId,
      logistics: logisticsName,
      trackingNo: tracking,
      ...(waybill ? { waybillNo: waybill } : {}),
    },
  };
}

defineExpose({ validate });
</script>

<template>
  <div class="flex flex-col gap-3 pt-1">
    <p class="m-0 text-sm text-muted-foreground">订单 ID：{{ orderId }}</p>
    <div class="flex flex-col gap-1">
      <label class="text-sm text-muted-foreground">物流公司</label>
      <Select
        v-model:value="logistics"
        allow-clear
        class="w-full"
        :options="logisticsSelectOptions"
        placeholder="请选择物流公司"
      />
    </div>
    <div class="flex flex-col gap-1">
      <label class="text-sm text-muted-foreground">跟踪号 (trackingNo)</label>
      <Input v-model:value="trackingNo" placeholder="请输入跟踪号" />
    </div>
    <div class="flex flex-col gap-1">
      <label class="text-sm text-muted-foreground">运输单号 (waybillNo)</label>
      <Input
        v-model:value="waybillNo"
        placeholder="Australia Post 可不填，其余物流公司必填"
      />
    </div>
  </div>
</template>
