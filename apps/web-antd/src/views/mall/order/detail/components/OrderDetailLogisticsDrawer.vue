<script lang="ts" setup>
import type { OrderApi } from '#/api/core/order';

import { computed } from 'vue';

import { Button, Drawer } from 'ant-design-vue';

import {
  formatDetailField,
  getLogisticsTrackingNo,
  getLogisticsWaybillNo,
} from '../../utils/orderDetail';
import OrderDetailLogisticsTrace from './OrderDetailLogisticsTrace.vue';

const props = defineProps<{
  logisticsInfo?: OrderApi.OrderLogisticsInfo;
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const drawerOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const basicInfoRows = computed(() => [
  {
    label: '物流公司',
    value: formatDetailField(props.logisticsInfo?.logistics),
  },
  // {
  //   label: '运单号',
  //   value: formatDetailField(props.logisticsInfo?.trackingNum),
  // },
  {
    label: '跟踪号',
    value: formatDetailField(getLogisticsTrackingNo(props.logisticsInfo)),
  },
  {
    label: '运输单号',
    value: formatDetailField(getLogisticsWaybillNo(props.logisticsInfo)),
  },
]);

function handleClose() {
  drawerOpen.value = false;
}
</script>

<template>
  <Drawer
    v-model:open="drawerOpen"
    :destroy-on-close="true"
    title="物流信息"
    width="520"
  >
    <div class="flex flex-col gap-6 pb-16">
      <section class="space-y-3">
        <h4 class="text-sm font-medium text-foreground">基本信息</h4>
        <dl class="space-y-3 rounded-md border border-border bg-muted/20 p-4">
          <div
            v-for="row in basicInfoRows"
            :key="row.label"
            class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 text-sm"
          >
            <dt class="text-muted-foreground">{{ row.label }}</dt>
            <dd class="break-all text-foreground">{{ row.value }}</dd>
          </div>
        </dl>
      </section>

      <section class="space-y-3">
        <h4 class="text-sm font-medium text-foreground">跟踪结果</h4>
        <OrderDetailLogisticsTrace :logistics-info="logisticsInfo" />
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button type="primary" @click="handleClose">我知道了</Button>
      </div>
    </template>
  </Drawer>
</template>
