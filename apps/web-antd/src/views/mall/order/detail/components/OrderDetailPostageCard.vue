<script lang="ts" setup>
import type { OrderApi } from '#/api/core/order';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import {
  buildPostageFullAddress,
  copyTextToClipboard,
  formatDetailField,
  getLogisticsTrackingNo,
  getLogisticsWaybillNo,
  getPostageBuyer,
  hasLogisticsTrackingNo,
} from '../../utils/orderDetail';
import OrderDetailLogisticsDrawer from './OrderDetailLogisticsDrawer.vue';

const props = defineProps<{
  logisticsInfo?: OrderApi.OrderLogisticsInfo;
  postageInfo?: OrderApi.PostageInfo;
}>();

const logisticsDrawerOpen = ref(false);

const showLogisticsEntry = computed(() =>
  hasLogisticsTrackingNo(props.logisticsInfo),
);

async function handleCopyAddress() {
  const text = buildPostageFullAddress(props.postageInfo);
  if (!text) {
    message.warning('暂无地址可复制');
    return;
  }
  const ok = await copyTextToClipboard(text);
  if (ok) {
    message.success('地址已复制');
  } else {
    message.error('复制失败，请手动复制');
  }
}
</script>

<template>
  <section
    class="rounded-lg border border-border bg-background px-4 py-4 shadow-sm"
  >
    <div class="mb-4 flex items-center justify-between gap-3">
      <h3 class="text-base font-semibold text-foreground">物流信息</h3>
      <Button
        v-if="showLogisticsEntry"
        type="link"
        class="!h-auto shrink-0 !p-0"
        @click="logisticsDrawerOpen = true"
      >
        查看物流轨迹
      </Button>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 lg:items-start">
      <div class="min-w-0">
        <div class="mb-2 flex items-center gap-1">
          <span class="text-sm font-medium text-foreground">收货地址</span>
          <Button
            type="text"
            size="small"
            class="!inline-flex !h-7 !min-w-7 !items-center !justify-center !p-0 text-muted-foreground hover:!text-primary"
            title="复制地址"
            aria-label="复制地址"
            @click="handleCopyAddress"
          >
            <IconifyIcon class="size-4" icon="mdi:content-copy" />
          </Button>
        </div>

        <address
          class="whitespace-pre-line text-sm not-italic leading-relaxed text-foreground"
        >
          <template v-if="postageInfo">
            <div v-if="postageInfo.buyer">
              {{ formatDetailField(getPostageBuyer(postageInfo)) }}
            </div>
            <div v-if="postageInfo.streetAddress">
              {{ postageInfo.streetAddress }}
            </div>
            <div v-if="postageInfo.apartment">{{ postageInfo.apartment }}</div>
            <div v-if="postageInfo.city || postageInfo.stateProvince">
              <template v-if="postageInfo.city">
                {{ postageInfo.city }}
              </template>
              <template v-if="postageInfo.stateProvince">
                {{ postageInfo.city ? '，' : ''
                }}{{ postageInfo.stateProvince }}
              </template>
            </div>
            <div v-if="postageInfo.country">{{ postageInfo.country }}</div>
          </template>
          <span v-else class="text-muted-foreground">—</span>
        </address>

        <div class="mt-4 space-y-4">
          <div>
            <div class="text-sm text-muted-foreground">邮编</div>
            <div class="mt-0.5 text-sm text-foreground">
              {{ formatDetailField(postageInfo?.zipPostalCode) }}
            </div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">联系电话</div>
            <div class="mt-0.5 text-sm text-foreground">
              {{ formatDetailField(postageInfo?.recipientPhone) }}
            </div>
          </div>
        </div>
      </div>

      <div class="min-w-0 space-y-4">
        <div>
          <div class="text-sm text-muted-foreground">物流公司</div>
          <div class="mt-0.5 text-sm font-medium text-foreground">
            {{ formatDetailField(logisticsInfo?.logistics) }}
          </div>
        </div>
        <!-- <div>
          <div class="text-sm text-muted-foreground">运单号</div>
          <div class="mt-0.5 break-all text-sm font-medium text-foreground">
            {{ formatDetailField(logisticsInfo?.trackingNum) }}
          </div>
        </div> -->
        <div>
          <div class="text-sm text-muted-foreground">跟踪号</div>
          <div class="mt-0.5 break-all text-sm font-medium text-foreground">
            {{ formatDetailField(getLogisticsTrackingNo(logisticsInfo)) }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted-foreground">运输单号</div>
          <div class="mt-0.5 break-all text-sm font-medium text-foreground">
            {{ formatDetailField(getLogisticsWaybillNo(logisticsInfo)) }}
          </div>
        </div>
      </div>
    </div>

    <OrderDetailLogisticsDrawer
      v-model:open="logisticsDrawerOpen"
      :logistics-info="logisticsInfo"
    />
  </section>
</template>
