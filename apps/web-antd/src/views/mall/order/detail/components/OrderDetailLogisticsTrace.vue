<script lang="ts" setup>
import type { OrderApi } from '#/api/core/order';

import { computed } from 'vue';

import { Timeline } from 'ant-design-vue';

import {
  formatDetailField,
  getLogisticsTraceList,
  getTraceTypeLabel,
} from '../../utils/orderDetail';

const props = defineProps<{
  logisticsInfo?: OrderApi.OrderLogisticsInfo;
}>();

const traceList = computed(() =>
  getLogisticsTraceList(props.logisticsInfo).map((trace) => ({
    ...trace,
    typeLabel: getTraceTypeLabel(trace.traceType),
  })),
);
</script>

<template>
  <Timeline v-if="traceList.length > 0">
    <Timeline.Item
      v-for="(trace, index) in traceList"
      :key="`${trace.traceTime}-${trace.traceDesc}-${index}`"
      :color="index === 0 ? 'blue' : 'gray'"
    >
      <div class="space-y-1">
        <div
          class="text-base font-medium"
          :class="index === 0 ? 'text-foreground' : 'text-muted-foreground'"
        >
          {{ formatDetailField(trace.traceTime) }}
        </div>

        <div
          v-if="trace.traceLocation?.trim()"
          class="text-sm"
          :class="
            index === 0
              ? 'font-medium text-foreground'
              : 'text-muted-foreground'
          "
        >
          {{ trace.traceLocation.trim() }}
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="text-sm"
            :class="
              index === 0
                ? 'font-medium text-foreground'
                : 'text-muted-foreground'
            "
          >
            {{ formatDetailField(trace.traceDesc) }}
          </span>
          <!-- <Tag v-if="trace.typeLabel" class="!m-0">
            {{ trace.typeLabel }}
          </Tag> -->
        </div>
      </div>
    </Timeline.Item>
  </Timeline>
  <p v-else class="text-sm text-muted-foreground">暂无物流轨迹</p>
</template>
